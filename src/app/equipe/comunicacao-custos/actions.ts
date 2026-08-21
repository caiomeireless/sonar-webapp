"use server";

// Server actions da Comunicação de Custos.
//
// ARQUITETURA DO UPLOAD (revisão 21/08): o arquivo NÃO viaja pela server
// action — a Vercel corta corpo de request em ~4.5 MB (413), o que tornaria
// a promessa de "até 20 MB" mentira em produção. Fluxo em 2 passos, mesmo
// padrão do Banco de Assinados do BP:
//   1) criarUploadCustoUrl: valida MIME + emite URL assinada de upload no
//      bucket do BP; o NAVEGADOR sobe o arquivo direto (PUT).
//   2) enviarComunicacaoCusto: recebe só os PATHS + campos, confere que os
//      arquivos existem no bucket (e que ninguém reusa path de outro
//      registro), e grava a ficha.
// O limite de 20 MB / PDF-JPG-PNG é garantido pelo PRÓPRIO bucket (mig 063
// do BP) — camada que nenhum caminho de código dribla.
import { ehEquipe } from "@/lib/perfis";
import { perfilLogadoReal } from "@/lib/perfis-server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BP_CUSTOS_BUCKET,
  BP_CUSTOS_TABELA,
  bpConfigurado,
  createBpAdminClient,
} from "@/lib/bp-financeiro";
import {
  ORIGENS_CUSTO,
  type AnexoCusto,
  type OrigemCusto,
} from "@/lib/custos-tipos";

const MIME_PERMITIDOS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const RE_PATH_ANEXO = /^sonar\/\d{10,}-[a-z0-9]{4,12}-(recibo|resultado)\.(pdf|jpg|png)$/;

type Erro = { erro: string };

async function equipeLogada() {
  const perfil = await perfilLogadoReal();
  if (!perfil || !ehEquipe(perfil)) return null;
  return perfil;
}

// ---------------------------------------------------------------------------
// Passo 1 — URL assinada pro navegador subir direto no bucket do BP.
// ---------------------------------------------------------------------------
export async function criarUploadCustoUrl(
  contentType: string,
  rotulo: "recibo" | "resultado",
): Promise<{ path: string; signedUrl: string } | Erro> {
  const perfil = await equipeLogada();
  if (!perfil) return { erro: "Sessão expirada — entre de novo." };
  if (!bpConfigurado()) {
    return { erro: "Integração com o BP INTERNAL ainda não configurada." };
  }
  const ext = MIME_PERMITIDOS[contentType];
  if (!ext) return { erro: "Use um arquivo PDF, JPG ou PNG." };

  try {
    const bp = createBpAdminClient();
    // Sonda a tabela ANTES de deixar arquivo subir — sem a migração 063 o
    // registro falharia depois e sobraria arquivo órfão no bucket.
    const { error: probe } = await bp
      .from(BP_CUSTOS_TABELA)
      .select("id", { count: "exact", head: true });
    if (probe) {
      return {
        erro: "A Central Financeira do BP ainda não recebeu a migração 063 — avise o Caio.",
      };
    }
    const path = `sonar/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${rotulo}.${ext}`;
    const { data, error } = await bp.storage
      .from(BP_CUSTOS_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) {
      return {
        erro: `Falha ao preparar o upload: ${error?.message ?? "desconhecido"}`,
      };
    }
    return { path: data.path, signedUrl: data.signedUrl };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Erro inesperado." };
  }
}

// ---------------------------------------------------------------------------
// Passo 2 — registra a ficha apontando pros arquivos já subidos.
// ---------------------------------------------------------------------------

// "89,90" | "89.90" | "R$ 89,90" -> 89.9
function parseValorBrl(raw: string): number | null {
  const limpo = raw
    .replace(/[R$\s]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(limpo);
  if (!Number.isFinite(n) || n <= 0 || n > 100000) return null;
  return Math.round(n * 100) / 100;
}

type AnexoEntrada = {
  path: string;
  nome: string;
  mime: string;
  tamanho: number;
  rotulo: "Recibo" | "Resultado";
};

function lerAnexo(
  formData: FormData,
  prefixo: "recibo" | "resultado",
): AnexoEntrada | Erro | null {
  const path = String(formData.get(`${prefixo}_path`) ?? "").trim();
  if (!path) return null;
  if (!RE_PATH_ANEXO.test(path) || !path.includes(`-${prefixo}.`)) {
    return { erro: `Caminho de anexo inválido (${prefixo}).` };
  }
  const mime = String(formData.get(`${prefixo}_mime`) ?? "");
  if (!MIME_PERMITIDOS[mime]) return { erro: `Tipo de arquivo inválido (${prefixo}).` };
  const tamanho = Number.parseInt(String(formData.get(`${prefixo}_tamanho`) ?? "0"), 10);
  const nome =
    String(formData.get(`${prefixo}_nome`) ?? "").slice(0, 160) ||
    path.split("/").pop()!;
  return {
    path,
    nome,
    mime,
    tamanho: Number.isFinite(tamanho) && tamanho > 0 ? tamanho : 0,
    rotulo: prefixo === "recibo" ? "Recibo" : "Resultado",
  };
}

export async function enviarComunicacaoCusto(
  formData: FormData,
): Promise<{ ok: true } | Erro> {
  const perfil = await equipeLogada();
  if (!perfil) return { erro: "Sessão expirada — entre de novo." };
  if (!bpConfigurado()) {
    return { erro: "Integração com o BP INTERNAL ainda não configurada." };
  }

  // ---------------- Campos ----------------
  const origemRaw = String(formData.get("origem") ?? "");
  const origemMeta = ORIGENS_CUSTO.find((o) => o.chave === origemRaw);
  if (!origemMeta) return { erro: "Escolha o sistema onde o custo aconteceu." };
  const origem = origemMeta.chave as OrigemCusto;

  const tipoSelecionado = String(formData.get("tipo") ?? "").trim();
  const tipoOutro = String(formData.get("tipo_outro") ?? "").trim();
  const tipo =
    origem === "outro"
      ? tipoOutro
      : origemMeta.tipos.includes(tipoSelecionado)
        ? tipoSelecionado
        : "";
  if (!tipo || tipo.length > 120) return { erro: "Informe o tipo da pesquisa." };

  const valor = parseValorBrl(String(formData.get("valor") ?? ""));
  if (valor === null) return { erro: "Valor inválido — informe algo como 89,90." };

  const dataGasto = String(formData.get("data_gasto") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataGasto)) {
    return { erro: "Informe a data do gasto." };
  }
  const dataMs = new Date(`${dataGasto}T12:00:00Z`).getTime();
  if (!Number.isFinite(dataMs) || dataMs > Date.now() + 24 * 60 * 60 * 1000) {
    return { erro: "A data do gasto não pode estar no futuro." };
  }

  const credorIdRaw = String(formData.get("credor_id") ?? "");
  const clienteOutro = String(formData.get("cliente_outro") ?? "").trim();
  let clienteNome = "";
  let clienteDocumento: string | null = null;
  if (credorIdRaw && credorIdRaw !== "outro") {
    const credorId = Number.parseInt(credorIdRaw, 10);
    if (!Number.isFinite(credorId)) return { erro: "Cliente inválido." };
    const sonar = createAdminClient();
    const { data: credor } = await sonar
      .from("credores")
      .select("nome, documento")
      .eq("id", credorId)
      .maybeSingle();
    if (!credor) return { erro: "Cliente não encontrado na base do Sonar." };
    clienteNome = credor.nome as string;
    clienteDocumento = (credor.documento as string | null) ?? null;
  } else {
    if (!clienteOutro || clienteOutro.length > 160) {
      return { erro: "Informe o nome do cliente a quem repassar o custo." };
    }
    clienteNome = clienteOutro;
  }

  const processoRef = String(formData.get("processo_ref") ?? "").trim() || null;
  if (processoRef && processoRef.length > 120) {
    return { erro: "Referência de processo longa demais." };
  }
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  if (descricao && descricao.length > 2000) {
    return { erro: "Descrição longa demais." };
  }

  // ---------------- Anexos (já subidos pelo navegador) ----------------
  const reciboLido = lerAnexo(formData, "recibo");
  if (!reciboLido) return { erro: "Anexe o recibo do pagamento (obrigatório)." };
  if ("erro" in reciboLido) return reciboLido;
  const resultadoLido = lerAnexo(formData, "resultado");
  if (resultadoLido && "erro" in resultadoLido) return resultadoLido;

  const anexosEntrada: AnexoEntrada[] = [reciboLido];
  if (resultadoLido) anexosEntrada.push(resultadoLido);

  const bp = createBpAdminClient();

  for (const a of anexosEntrada) {
    // Existe de verdade no bucket? (o navegador pode ter falhado no PUT)
    const nomeArquivo = a.path.split("/").pop()!;
    const { data: achados, error: listErr } = await bp.storage
      .from(BP_CUSTOS_BUCKET)
      .list("sonar", { limit: 1, search: nomeArquivo });
    if (listErr || !achados || achados.length === 0) {
      return {
        erro: `O arquivo do ${a.rotulo.toLowerCase()} não chegou ao servidor — tente anexar de novo.`,
      };
    }
    // Anti-replay: path não pode pertencer a outro registro.
    const { data: donos } = await bp
      .from(BP_CUSTOS_TABELA)
      .select("id")
      .contains("anexos", JSON.stringify([{ path: a.path }]))
      .limit(1);
    if (donos && donos.length > 0) {
      return { erro: "Este anexo já pertence a outra comunicação." };
    }
  }

  const anexos: AnexoCusto[] = anexosEntrada.map((a) => ({
    path: a.path,
    nome: a.nome,
    rotulo: a.rotulo,
    mime: a.mime,
    tamanho: a.tamanho,
  }));

  const { error: insErr } = await bp.from(BP_CUSTOS_TABELA).insert({
    plataforma: "sonar",
    origem,
    tipo,
    valor_brl: valor,
    data_gasto: dataGasto,
    cliente_nome: clienteNome,
    cliente_documento: clienteDocumento,
    processo_ref: processoRef,
    descricao,
    advogado_nome: perfil.nome || perfil.email,
    advogado_email: perfil.email.toLowerCase(),
    anexos,
  });
  if (insErr) {
    // Não deixa arquivo órfão: remove o que subiu antes de reportar.
    await bp.storage
      .from(BP_CUSTOS_BUCKET)
      .remove(anexosEntrada.map((a) => a.path))
      .then(
        () => undefined,
        () => undefined,
      );
    return { erro: `Falha ao registrar: ${insErr.message}` };
  }

  return { ok: true };
}
