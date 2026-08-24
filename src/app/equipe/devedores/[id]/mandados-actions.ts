"use server";

// Server Actions do módulo Mandado de Avaliação e Penhora — endereços
// confirmados do devedor. SÓ EQUIPE.
//
// ARQUITETURA DO UPLOAD (mesma do módulo Imóveis): o arquivo NÃO viaja
// pela server action — a Vercel corta corpo de request em ~4.5 MB (413),
// o que tornaria a promessa de "até 20 MB" mentira em produção.
// Fluxo em 2 passos:
//   1) criarUploadMandadoUrl: valida MIME + emite URL assinada de upload
//      no bucket privado `imoveis-pesquisas` (COMPARTILHADO com o módulo
//      de Imóveis); o NAVEGADOR sobe direto (PUT).
//   2) registrarMandadoEndereco: recebe só os PATHS + campos, confere que
//      as certidões existem no bucket (e que ninguém reusa path de outro
//      registro — de mandado OU de pesquisa de imóvel, já que o bucket é
//      o mesmo) e grava o mandado.
// O limite de 20 MB / PDF-JPG-PNG é garantido pelo PRÓPRIO bucket (mig
// 024) — camada que nenhum caminho de código dribla.
import { revalidatePath } from "next/cache";

import { ehEquipe } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { IMOVEIS_PESQUISAS_BUCKET } from "@/lib/imoveis-pesquisas";
import type { ResultadoMandado } from "@/lib/enderecos-mandados";

const TABELA = "enderecos_mandados";
const TABELA_IMOVEIS = "imoveis_pesquisas";
const MAX_ANEXOS = 4;

const RESULTADOS_VALIDOS: ResultadoMandado[] = [
  "aguardando",
  "cumprido_positivo",
  "cumprido_negativo",
];

const MIME_PERMITIDOS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

// Sufixo "mandado" amarra o path a ESTE módulo — o módulo de Imóveis só
// aceita "print"/"matricula", então um path nunca vale nos dois.
const RE_PATH_ANEXO =
  /^dev-(\d+)\/\d{10,}-[a-z0-9]{4,12}-mandado\.(pdf|jpg|png)$/;

const ERRO_MIGRACAO =
  "Migração 024 ainda não aplicada — rode no Supabase do Sonar.";

type Erro = { erro: string };

async function equipeLogada() {
  const perfil = await perfilLogado();
  if (!perfil || !ehEquipe(perfil)) return null;
  return perfil;
}

// ---------------------------------------------------------------------------
// Passo 1 — URL assinada pro navegador subir a certidão direto no bucket.
// ---------------------------------------------------------------------------
export async function criarUploadMandadoUrl(
  devedorId: number,
  contentType: string,
): Promise<{ path: string; signedUrl: string } | Erro> {
  const perfil = await equipeLogada();
  if (!perfil) return { erro: "Sessão expirada — entre de novo." };

  if (!Number.isFinite(devedorId) || devedorId <= 0) {
    return { erro: "Devedor inválido." };
  }
  const ext = MIME_PERMITIDOS[contentType];
  if (!ext) return { erro: "Use um arquivo PDF, JPG ou PNG." };

  try {
    const sb = createAdminClient();
    // Sonda a tabela ANTES de deixar arquivo subir — sem a migração 024 o
    // registro falharia depois e sobraria arquivo órfão no bucket.
    const { error: probe } = await sb
      .from(TABELA)
      .select("id", { count: "exact", head: true });
    if (probe) return { erro: ERRO_MIGRACAO };

    const path = `dev-${devedorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-mandado.${ext}`;
    const { data, error } = await sb.storage
      .from(IMOVEIS_PESQUISAS_BUCKET)
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
// Passo 2 — registra o mandado apontando pras certidões já subidas.
// ---------------------------------------------------------------------------

type AnexoEntrada = {
  path: string;
  nome: string;
  tipo: "certidao";
  content_type: string;
};

function lerAnexos(raw: string, devedorId: number): AnexoEntrada[] | Erro {
  let brutos: unknown;
  try {
    brutos = JSON.parse(raw || "[]");
  } catch {
    return { erro: "Lista de anexos inválida." };
  }
  if (!Array.isArray(brutos)) return { erro: "Lista de anexos inválida." };
  if (brutos.length > MAX_ANEXOS) {
    return { erro: `No máximo ${MAX_ANEXOS} arquivos por mandado.` };
  }

  const anexos: AnexoEntrada[] = [];
  for (const bruto of brutos) {
    if (typeof bruto !== "object" || bruto === null) {
      return { erro: "Anexo inválido." };
    }
    const a = bruto as Record<string, unknown>;
    const path = typeof a.path === "string" ? a.path.trim() : "";
    const contentType = typeof a.contentType === "string" ? a.contentType : "";

    const m = RE_PATH_ANEXO.exec(path);
    if (!m) return { erro: "Caminho de anexo inválido." };
    // O path precisa pertencer a ESTE devedor.
    if (Number(m[1]) !== devedorId) {
      return { erro: "Caminho de anexo inválido." };
    }
    // MIME declarado tem que existir na lista e bater com a extensão do path.
    if (MIME_PERMITIDOS[contentType] !== m[2]) {
      return { erro: "Tipo de arquivo inválido." };
    }
    const nome =
      (typeof a.nome === "string" ? a.nome.trim().slice(0, 160) : "") ||
      path.split("/").pop()!;
    anexos.push({ path, nome, tipo: "certidao", content_type: contentType });
  }
  return anexos;
}

export async function registrarMandadoEndereco(
  formData: FormData,
): Promise<{ ok: true } | Erro> {
  const perfil = await equipeLogada();
  if (!perfil) return { erro: "Sessão expirada — entre de novo." };

  const devedorId = Number(formData.get("devedorId"));
  if (!Number.isFinite(devedorId) || devedorId <= 0) {
    return { erro: "Devedor inválido." };
  }

  const resultadoBruto = String(formData.get("resultado") ?? "");
  const resultado = RESULTADOS_VALIDOS.find((r) => r === resultadoBruto);
  if (!resultado) return { erro: "Escolha o resultado do mandado." };

  const observacao =
    String(formData.get("observacao") ?? "").trim().slice(0, 500) || null;

  // Registro SEM anexo é aceito (ex.: mandado expedido, aguardando
  // cumprimento) — o resultado é sempre obrigatório.
  const anexosLidos = lerAnexos(String(formData.get("anexos") ?? "[]"), devedorId);
  if ("erro" in anexosLidos) return anexosLidos;
  const anexos = anexosLidos;

  const sb = createAdminClient();

  // Limpeza de órfãos (mesmo padrão do módulo Imóveis): qualquer retorno
  // de erro DEPOIS do upload precisa remover o que já subiu — senão o
  // bucket acumula lixo de 20MB a cada tentativa frustrada.
  const limparAnexos = async (paths: string[]) => {
    if (paths.length === 0) return;
    await sb.storage
      .from(IMOVEIS_PESQUISAS_BUCKET)
      .remove(paths)
      .then(
        () => undefined,
        () => undefined,
      );
  };
  const todosPaths = anexos.map((a) => a.path);

  // O devedor existe mesmo? (evita FK estourar com mensagem feia)
  const { data: devedor, error: errDevedor } = await sb
    .from("devedores")
    .select("id")
    .eq("id", devedorId)
    .maybeSingle();
  if (errDevedor) {
    await limparAnexos(todosPaths);
    return { erro: `Falha ao conferir o devedor: ${errDevedor.message}` };
  }
  if (!devedor) {
    await limparAnexos(todosPaths);
    return { erro: "Devedor não encontrado." };
  }

  for (const a of anexos) {
    // Existe de verdade no bucket? (o navegador pode ter falhado no PUT)
    const nomeArquivo = a.path.split("/").pop()!;
    const { data: achados, error: listErr } = await sb.storage
      .from(IMOVEIS_PESQUISAS_BUCKET)
      .list(`dev-${devedorId}`, { limit: 1, search: nomeArquivo });
    if (listErr || !achados || achados.length === 0) {
      // Os DEMAIS podem ter subido — limpa (remover path ausente é no-op).
      await limparAnexos(todosPaths.filter((p) => p !== a.path));
      return {
        erro: `O arquivo "${a.nome}" não chegou ao servidor — tente anexar de novo.`,
      };
    }
    // Anti-replay: path não pode pertencer a outro mandado NEM a uma
    // pesquisa de imóveis — o bucket é compartilhado entre os módulos.
    const { data: donos, error: donosErr } = await sb
      .from(TABELA)
      .select("id")
      .contains("anexos", JSON.stringify([{ path: a.path }]))
      .limit(1);
    if (donosErr) {
      // Sem a migração 024 não há registro dono de nada — limpa tudo.
      await limparAnexos(todosPaths);
      return { erro: ERRO_MIGRACAO };
    }
    if (donos && donos.length > 0) {
      // NUNCA remover o path que pertence ao outro registro — só os novos.
      await limparAnexos(todosPaths.filter((p) => p !== a.path));
      return { erro: "Este anexo já pertence a outro mandado." };
    }
    const { data: donosImoveis, error: donosImoveisErr } = await sb
      .from(TABELA_IMOVEIS)
      .select("id")
      .contains("anexos", JSON.stringify([{ path: a.path }]))
      .limit(1);
    if (donosImoveisErr) {
      await limparAnexos(todosPaths);
      return { erro: ERRO_MIGRACAO };
    }
    if (donosImoveis && donosImoveis.length > 0) {
      await limparAnexos(todosPaths.filter((p) => p !== a.path));
      return { erro: "Este anexo já pertence a uma pesquisa de imóveis." };
    }
  }

  const { error: insErr } = await sb.from(TABELA).insert({
    devedor_id: devedorId,
    resultado,
    observacao,
    criado_por: perfil.email.toLowerCase(),
    anexos,
  });
  if (insErr) {
    // Não deixa arquivo órfão: remove o que subiu antes de reportar.
    await limparAnexos(todosPaths);
    if (insErr.code === "42P01") return { erro: ERRO_MIGRACAO };
    return { erro: `Falha ao registrar: ${insErr.message}` };
  }

  revalidatePath(`/equipe/devedores/${devedorId}`);
  return { ok: true };
}
