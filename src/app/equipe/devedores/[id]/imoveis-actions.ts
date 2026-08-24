"use server";

// Server Actions do módulo Imóveis — pesquisa manual RI Digital. SÓ EQUIPE.
//
// ARQUITETURA DO UPLOAD (mesma da Comunicação de Custos): o arquivo NÃO
// viaja pela server action — a Vercel corta corpo de request em ~4.5 MB
// (413), o que tornaria a promessa de "até 20 MB" mentira em produção.
// Fluxo em 2 passos:
//   1) criarUploadImovelUrl: valida MIME + emite URL assinada de upload no
//      bucket privado `imoveis-pesquisas`; o NAVEGADOR sobe direto (PUT).
//   2) registrarPesquisaImovel: recebe só os PATHS + campos, confere que
//      os arquivos existem no bucket (e que ninguém reusa path de outro
//      registro) e grava a pesquisa.
// O limite de 20 MB / PDF-JPG-PNG é garantido pelo PRÓPRIO bucket (mig
// 024) — camada que nenhum caminho de código dribla.
import { revalidatePath } from "next/cache";

import { ehEquipe } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  IMOVEIS_PESQUISAS_BUCKET,
  type TipoAnexoImovel,
} from "@/lib/imoveis-pesquisas";

const TABELA = "imoveis_pesquisas";
const MAX_ANEXOS = 6;

const MIME_PERMITIDOS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

const RE_PATH_ANEXO =
  /^dev-(\d+)\/\d{10,}-[a-z0-9]{4,12}-(print|matricula)\.(pdf|jpg|png)$/;

const ERRO_MIGRACAO = "Migração 024 ainda não aplicada — rode no Supabase do Sonar.";

type Erro = { erro: string };

async function equipeLogada() {
  const perfil = await perfilLogado();
  if (!perfil || !ehEquipe(perfil)) return null;
  return perfil;
}

// ---------------------------------------------------------------------------
// Passo 1 — URL assinada pro navegador subir o anexo direto no bucket.
// ---------------------------------------------------------------------------
export async function criarUploadImovelUrl(
  devedorId: number,
  contentType: string,
  tipo: TipoAnexoImovel,
): Promise<{ path: string; signedUrl: string } | Erro> {
  const perfil = await equipeLogada();
  if (!perfil) return { erro: "Sessão expirada — entre de novo." };

  if (!Number.isFinite(devedorId) || devedorId <= 0) {
    return { erro: "Devedor inválido." };
  }
  if (tipo !== "print" && tipo !== "matricula") {
    return { erro: "Tipo de anexo inválido." };
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

    const path = `dev-${devedorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${tipo}.${ext}`;
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
// Passo 2 — registra a pesquisa apontando pros anexos já subidos.
// ---------------------------------------------------------------------------

type AnexoEntrada = {
  path: string;
  nome: string;
  tipo: TipoAnexoImovel;
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
    return { erro: `No máximo ${MAX_ANEXOS} arquivos por pesquisa.` };
  }

  const anexos: AnexoEntrada[] = [];
  for (const bruto of brutos) {
    if (typeof bruto !== "object" || bruto === null) {
      return { erro: "Anexo inválido." };
    }
    const a = bruto as Record<string, unknown>;
    const path = typeof a.path === "string" ? a.path.trim() : "";
    const tipo = a.tipo === "matricula" ? "matricula" : a.tipo === "print" ? "print" : null;
    const contentType = typeof a.contentType === "string" ? a.contentType : "";

    const m = RE_PATH_ANEXO.exec(path);
    if (!m || !tipo) return { erro: "Caminho de anexo inválido." };
    // O path precisa pertencer a ESTE devedor e bater com o tipo declarado.
    if (Number(m[1]) !== devedorId || m[2] !== tipo) {
      return { erro: "Caminho de anexo inválido." };
    }
    // MIME declarado tem que existir na lista e bater com a extensão do path.
    if (MIME_PERMITIDOS[contentType] !== m[3]) {
      return { erro: "Tipo de arquivo inválido." };
    }
    const nome =
      (typeof a.nome === "string" ? a.nome.trim().slice(0, 160) : "") ||
      path.split("/").pop()!;
    anexos.push({ path, nome, tipo, content_type: contentType });
  }
  return anexos;
}

export async function registrarPesquisaImovel(
  formData: FormData,
): Promise<{ ok: true } | Erro> {
  const perfil = await equipeLogada();
  if (!perfil) return { erro: "Sessão expirada — entre de novo." };

  const devedorId = Number(formData.get("devedorId"));
  if (!Number.isFinite(devedorId) || devedorId <= 0) {
    return { erro: "Devedor inválido." };
  }

  const observacao =
    String(formData.get("observacao") ?? "").trim().slice(0, 500) || null;

  const anexosLidos = lerAnexos(String(formData.get("anexos") ?? "[]"), devedorId);
  if ("erro" in anexosLidos) return anexosLidos;
  const anexos = anexosLidos;

  if (anexos.length === 0 && !observacao) {
    return { erro: "Anexe o print da pesquisa ou escreva uma observação." };
  }

  const sb = createAdminClient();

  // O devedor existe mesmo? (evita FK estourar com mensagem feia)
  const { data: devedor, error: errDevedor } = await sb
    .from("devedores")
    .select("id")
    .eq("id", devedorId)
    .maybeSingle();
  if (errDevedor) return { erro: `Falha ao conferir o devedor: ${errDevedor.message}` };
  if (!devedor) return { erro: "Devedor não encontrado." };

  for (const a of anexos) {
    // Existe de verdade no bucket? (o navegador pode ter falhado no PUT)
    const nomeArquivo = a.path.split("/").pop()!;
    const { data: achados, error: listErr } = await sb.storage
      .from(IMOVEIS_PESQUISAS_BUCKET)
      .list(`dev-${devedorId}`, { limit: 1, search: nomeArquivo });
    if (listErr || !achados || achados.length === 0) {
      return {
        erro: `O arquivo "${a.nome}" não chegou ao servidor — tente anexar de novo.`,
      };
    }
    // Anti-replay: path não pode pertencer a outra pesquisa.
    const { data: donos, error: donosErr } = await sb
      .from(TABELA)
      .select("id")
      .contains("anexos", JSON.stringify([{ path: a.path }]))
      .limit(1);
    if (donosErr) return { erro: ERRO_MIGRACAO };
    if (donos && donos.length > 0) {
      return { erro: "Este anexo já pertence a outra pesquisa." };
    }
  }

  const { error: insErr } = await sb.from(TABELA).insert({
    devedor_id: devedorId,
    observacao,
    criado_por: perfil.email.toLowerCase(),
    anexos,
  });
  if (insErr) {
    // Não deixa arquivo órfão: remove o que subiu antes de reportar.
    if (anexos.length > 0) {
      await sb.storage
        .from(IMOVEIS_PESQUISAS_BUCKET)
        .remove(anexos.map((a) => a.path))
        .then(
          () => undefined,
          () => undefined,
        );
    }
    if (insErr.code === "42P01") return { erro: ERRO_MIGRACAO };
    return { erro: `Falha ao registrar: ${insErr.message}` };
  }

  revalidatePath(`/equipe/devedores/${devedorId}`);
  return { ok: true };
}
