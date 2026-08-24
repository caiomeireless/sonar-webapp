// Server Actions do campo CPF/CNPJ editável na ficha do devedor — SÓ EQUIPE.
// (a) edição manual do documento; (b) busca Assertiva por NOME quando o
// devedor não tem documento (paga — regra [[sonar-consultas-pagas-sob-
// demanda]]: preço + confirmação na UI); (c) aplicar candidato escolhido.
"use server";

import { revalidatePath } from "next/cache";

import { perfilLogado } from "@/lib/perfis-server";
import { ehEquipe } from "@/lib/perfis";
import { createAdminClient } from "@/lib/supabase/admin";
import { buscarPorNome, soDigitos, type CandidatoNome } from "@/lib/assertiva";

export type EstadoBuscaNome = {
  ok: boolean;
  mensagem: string;
  candidatos: CandidatoNome[];
} | null;

export type ResultadoDocumento = { ok: true } | { erro: string };

async function exigirEquipe(): Promise<string | null> {
  const perfil = await perfilLogado();
  if (!ehEquipe(perfil)) return null;
  return perfil?.email ?? null;
}

// 11 dígitos -> CPF formatado (PF); 14 -> CNPJ formatado (PJ).
function formatarDocumento(
  bruto: string,
): { documento: string; tipo: "PF" | "PJ" } | null {
  const d = soDigitos(bruto);
  if (d.length === 11) {
    return {
      documento: d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4"),
      tipo: "PF",
    };
  }
  if (d.length === 14) {
    return {
      documento: d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"),
      tipo: "PJ",
    };
  }
  return null;
}

// Grava documento + tipo + etiqueta de origem (merge no jsonb existente —
// não apaga a origem dos outros campos; padrão do assertiva-aplicar).
async function gravarDocumento(
  devedorId: number,
  bruto: string,
  origem: "manual" | "assertiva",
): Promise<ResultadoDocumento> {
  if (!Number.isFinite(devedorId) || devedorId <= 0) {
    return { erro: "Devedor inválido." };
  }
  const doc = formatarDocumento(bruto);
  if (!doc) {
    return { erro: "Documento precisa ter 11 dígitos (CPF) ou 14 (CNPJ)." };
  }

  const sb = createAdminClient();
  const { data: devedor } = await sb
    .from("devedores")
    .select("id, origem_campos")
    .eq("id", devedorId)
    .maybeSingle();
  if (!devedor) return { erro: "Devedor não encontrado." };

  const origemAtual =
    (devedor.origem_campos as Record<string, string> | null | undefined) ?? {};
  const updates = {
    documento: doc.documento,
    tipo: doc.tipo,
    atualizado_em: new Date().toISOString(),
  };

  const { error } = await sb
    .from("devedores")
    .update({ ...updates, origem_campos: { ...origemAtual, documento: origem } })
    .eq("id", devedorId);
  if (error) {
    // Coluna origem_campos (mig 021) pode não existir — degrada sem etiqueta.
    const semOrigem = await sb.from("devedores").update(updates).eq("id", devedorId);
    if (semOrigem.error) {
      return { erro: `Falha ao salvar: ${semOrigem.error.message}` };
    }
  }

  revalidatePath(`/equipe/devedores/${devedorId}`);
  return { ok: true };
}

// (a) Edição manual do CPF/CNPJ na ficha.
export async function atualizarDocumentoDevedor(
  devedorId: number,
  documento: string,
): Promise<ResultadoDocumento> {
  const email = await exigirEquipe();
  if (!email) return { erro: "Edição exclusiva da equipe." };
  return gravarDocumento(devedorId, documento, "manual");
}

// (c) Aplica o documento de um candidato devolvido pela busca por nome.
export async function aplicarDocumentoCandidato(
  devedorId: number,
  documento: string,
): Promise<ResultadoDocumento> {
  const email = await exigirEquipe();
  if (!email) return { erro: "Ação exclusiva da equipe." };
  return gravarDocumento(devedorId, documento, "assertiva");
}

// Credor "dono" do custo — mesmo critério do assertiva-actions: o do
// primeiro caso ativo do devedor (ou o primeiro caso, se nenhum ativo).
async function credorDoDevedor(devedorId: number): Promise<number | null> {
  const sb = createAdminClient();
  const { data: casos } = await sb
    .from("casos")
    .select("credor_id, status")
    .eq("devedor_id", devedorId)
    .eq("eh_demo", false)
    .limit(20);
  if (!casos || casos.length === 0) return null;
  const ativo = casos.find((c) => c.status === "ativo");
  return ((ativo ?? casos[0]).credor_id as number) ?? null;
}

// (b) Busca Assertiva por NOME (paga, sem cache) — compatível com
// useActionState. Carrega o nome do devedor no banco (nunca confia no
// que veio do formulário) e devolve os candidatos com documento.
export async function buscarCpfPorNomeAction(
  _prev: EstadoBuscaNome,
  formData: FormData,
): Promise<EstadoBuscaNome> {
  const email = await exigirEquipe();
  if (!email) {
    return { ok: false, mensagem: "Consulta paga é exclusiva da equipe.", candidatos: [] };
  }

  const devedorId = Number(formData.get("devedorId"));
  if (!Number.isFinite(devedorId) || devedorId <= 0) {
    return { ok: false, mensagem: "Devedor inválido.", candidatos: [] };
  }

  const sb = createAdminClient();
  const { data: devedor } = await sb
    .from("devedores")
    .select("id, nome")
    .eq("id", devedorId)
    .maybeSingle();
  const nome = (devedor?.nome as string | undefined)?.trim() ?? "";
  if (!nome) {
    return {
      ok: false,
      mensagem: "Devedor sem nome cadastrado — não há o que buscar.",
      candidatos: [],
    };
  }

  const credorId = await credorDoDevedor(devedorId);
  const resultado = await buscarPorNome({
    nome,
    buscarPor: "ambas",
    email,
    devedorId,
    credorId,
  });

  return {
    ok: resultado.ok,
    mensagem: resultado.mensagem,
    candidatos: resultado.candidatos,
  };
}
