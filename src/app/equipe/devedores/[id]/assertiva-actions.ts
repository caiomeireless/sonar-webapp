// Server Actions das pesquisas pagas Assertiva no dossiê — SÓ EQUIPE.
// Regra [[sonar-consultas-pagas-sob-demanda]]: a consulta paga acontece
// exclusivamente por clique de alguém da equipe, com preço + confirmação
// na UI. Cliente nunca chega aqui (checagem de papel na entrada).
"use server";

import { revalidatePath } from "next/cache";

import { perfilLogado } from "@/lib/perfis-server";
import { ehEquipe } from "@/lib/perfis";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buscarVeiculosDevedor,
  enriquecerDevedor,
} from "@/lib/assertiva-aplicar";
import {
  dispararCrawlTribunais,
  type TribunalCrawl,
} from "@/lib/crawl-tribunais";
import { registrarCusto } from "@/lib/custos";

export type EstadoAssertiva = {
  ok: boolean;
  mensagem: string;
} | null;

// Credor "dono" do custo: o do primeiro caso ativo do devedor (ou o
// primeiro caso, se nenhum ativo). Devedor multi-credor: o rateio fino
// fica pra depois — o monitor por devedor já dá a visão certa.
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

async function exigirEquipe(): Promise<string | null> {
  const perfil = await perfilLogado();
  if (!ehEquipe(perfil)) return null;
  return perfil?.email ?? null;
}

export async function enriquecerDevedorAction(
  _prev: EstadoAssertiva,
  formData: FormData,
): Promise<EstadoAssertiva> {
  const email = await exigirEquipe();
  if (!email) {
    return { ok: false, mensagem: "Consulta paga é exclusiva da equipe." };
  }

  const devedorId = Number(formData.get("devedorId"));
  if (!Number.isFinite(devedorId) || devedorId <= 0) {
    return { ok: false, mensagem: "Devedor inválido." };
  }

  const credorId = await credorDoDevedor(devedorId);
  const resultado = await enriquecerDevedor({ devedorId, email, credorId });
  if (!resultado.ok) return { ok: false, mensagem: resultado.mensagem };

  revalidatePath(`/equipe/devedores/${devedorId}`);

  const partes: string[] = [];
  if (resultado.camposPreenchidos.length > 0) {
    partes.push(`Preenchido: ${resultado.camposPreenchidos.join(", ")}.`);
  }
  if (resultado.bensNovos > 0) {
    partes.push(
      `${resultado.bensNovos} ${resultado.bensNovos === 1 ? "novo achado" : "novos achados"} (endereços/empresas).`,
    );
  }
  if (partes.length === 0) {
    partes.push("Nada novo — os dados do dossiê já estavam completos.");
  }
  partes.push(
    resultado.doCache
      ? "Sem custo (resultado do cache)."
      : `Custo: R$ ${resultado.custoBrl.toFixed(2).replace(".", ",")}.`,
  );

  return { ok: true, mensagem: partes.join(" ") };
}

// Raspagem dos tribunais — GRATUITA (Playwright no GH Actions, zero
// tokens de IA). Dispara os workflows selecionados; os andamentos chegam
// ao banco em ~15-30 min e aparecem na seção Andamentos Processuais.
export async function atualizarTribunaisAction(
  _prev: EstadoAssertiva,
  formData: FormData,
): Promise<EstadoAssertiva> {
  const email = await exigirEquipe();
  if (!email) {
    return { ok: false, mensagem: "Ação exclusiva da equipe." };
  }

  const devedorId = Number(formData.get("devedorId"));
  const tribunais = formData
    .getAll("tribunal")
    .map((t) => String(t))
    .filter((t): t is TribunalCrawl => t === "esaj" || t === "eproc");
  if (tribunais.length === 0) {
    return { ok: false, mensagem: "Selecione pelo menos um tribunal." };
  }

  const resultado = await dispararCrawlTribunais(tribunais);
  if (!resultado.ok) return { ok: false, mensagem: resultado.erro };

  // Rastreabilidade no monitor: consulta gratuita (R$ 0,00).
  await registrarCusto({
    email,
    tipo: "crawl-tribunais",
    descricao: `Raspagem sob demanda: ${resultado.disparados.join(" + ")}`,
    custo: 0,
    devedorId: Number.isFinite(devedorId) && devedorId > 0 ? devedorId : null,
  });

  return {
    ok: true,
    mensagem: `Robôs de ${resultado.disparados.join(" e ")} acionados. Os andamentos novos chegam em 15 a 30 minutos na seção Andamentos Processuais — sem custo.`,
  };
}

export async function buscarVeiculosAction(
  _prev: EstadoAssertiva,
  formData: FormData,
): Promise<EstadoAssertiva> {
  const email = await exigirEquipe();
  if (!email) {
    return { ok: false, mensagem: "Consulta paga é exclusiva da equipe." };
  }

  const devedorId = Number(formData.get("devedorId"));
  if (!Number.isFinite(devedorId) || devedorId <= 0) {
    return { ok: false, mensagem: "Devedor inválido." };
  }

  const credorId = await credorDoDevedor(devedorId);
  const resultado = await buscarVeiculosDevedor({ devedorId, email, credorId });
  if (!resultado.ok) return { ok: false, mensagem: resultado.mensagem };

  revalidatePath(`/equipe/devedores/${devedorId}`);

  const partes: string[] = [];
  partes.push(
    resultado.bensNovos > 0
      ? `${resultado.bensNovos} ${resultado.bensNovos === 1 ? "veículo novo adicionado" : "veículos novos adicionados"} ao dossiê.`
      : "Nenhum veículo novo — ou o devedor não tem frota, ou já estava tudo no dossiê.",
  );
  partes.push(
    resultado.doCache
      ? "Sem custo (resultado do cache)."
      : `Custo: R$ ${resultado.custoBrl.toFixed(2).replace(".", ",")}.`,
  );

  return { ok: true, mensagem: partes.join(" ") };
}
