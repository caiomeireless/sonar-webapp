"use server";

// Ações da Análise de Autos.
//
// A análise nasce solta e só vira dado oficial depois que o advogado
// confere. Essa fronteira é o coração do módulo: agora que o Themis saiu,
// é este fluxo que alimenta a base — e saída de modelo não entra na base
// sem alguém olhar.
import { revalidatePath } from "next/cache";

import { ehEquipe } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  atualizarAnalise,
  criarAnalise,
  obterAnalise,
  promoverAnalise,
} from "@/lib/autos/analises";
import { fichaVigente, type FichaAutos } from "@/lib/autos/tipos";

export interface EstadoAutos {
  ok: boolean;
  mensagem: string;
}

async function exigirEquipe(): Promise<string> {
  const perfil = await perfilLogado();
  if (!perfil || !ehEquipe(perfil)) {
    throw new Error("Somente a equipe do escritório pode analisar autos.");
  }
  return perfil.email;
}

/** Abre o registro da análise assim que o PDF é aberto no navegador. */
export async function abrirAnalise(
  arquivoNome: string,
  totalPaginas: number,
): Promise<{ id: number } | { erro: string }> {
  try {
    const email = await exigirEquipe();
    const id = await criarAnalise({
      arquivoNome: arquivoNome.slice(0, 300),
      totalPaginas,
      criadoPor: email,
    });
    return { id };
  } catch (e) {
    return { erro: e instanceof Error ? e.message : "Falha ao abrir a análise." };
  }
}

/** Marca a análise como quebrada, para não ficar eternamente "analisando". */
export async function registrarErroAnalise(
  id: number,
  mensagem: string,
): Promise<void> {
  try {
    await exigirEquipe();
    await atualizarAnalise(id, {
      status: "erro",
      erro: mensagem.slice(0, 1000),
      etapa_atual: "Interrompida",
    });
  } catch {
    // Se nem o registro do erro funcionar, não há o que fazer aqui.
  }
}

/** Salva as correções do advogado. A ficha revisada vence sobre a da IA. */
export async function salvarRevisao(
  id: number,
  ficha: FichaAutos,
): Promise<EstadoAutos> {
  try {
    await exigirEquipe();
    await atualizarAnalise(id, { ficha_revisada: ficha });
    revalidatePath("/equipe/autos");
    return { ok: true, mensagem: "Correções salvas." };
  } catch (e) {
    return {
      ok: false,
      mensagem: e instanceof Error ? e.message : "Falha ao salvar as correções.",
    };
  }
}

export interface CredorOpcao {
  id: number;
  nome: string;
}

export async function listarCredoresParaVinculo(): Promise<CredorOpcao[]> {
  try {
    await exigirEquipe();
    const sb = createAdminClient();
    const { data } = await sb
      .from("credores")
      .select("id, nome")
      .order("nome")
      .limit(1000);
    return (data ?? []) as CredorOpcao[];
  } catch {
    return [];
  }
}

/** Só dígitos — o documento vem dos autos em qualquer formatação. */
function soDigitos(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

/**
 * Promove a análise conferida à biblioteca: acha ou cria o devedor pelo
 * documento, acha ou cria o processo sob o credor escolhido, e grava as
 * medidas, o débito e a chance de êxito.
 */
export async function promoverParaBiblioteca(
  analiseId: number,
  credorId: number,
): Promise<EstadoAutos> {
  try {
    await exigirEquipe();
    const sb = createAdminClient();

    const analise = await obterAnalise(analiseId);
    if (!analise) return { ok: false, mensagem: "Análise não encontrada." };

    const ficha = fichaVigente(analise);
    if (!ficha) {
      return { ok: false, mensagem: "Esta análise ainda não tem ficha pronta." };
    }

    // 1) O devedor é a parte no polo passivo.
    const executado = ficha.partes.find((p) => p.polo === "executado");
    if (!executado) {
      return {
        ok: false,
        mensagem:
          "A análise não identificou o executado nos autos. Corrija a ficha antes de confirmar.",
      };
    }

    const documento = soDigitos(executado.documento);
    const tipo = documento.length === 14 ? "PJ" : "PF";

    // 2) Acha pelo documento; só cria se realmente não existir.
    let devedorId: number | null = null;
    if (documento) {
      const { data } = await sb
        .from("devedores")
        .select("id")
        .eq("documento", documento)
        .maybeSingle();
      if (data) devedorId = data.id as number;
    }

    if (!devedorId) {
      const { data, error } = await sb
        .from("devedores")
        .insert({
          nome: executado.nome.slice(0, 300),
          documento: documento || null,
          tipo,
          origem_campos: { nome: "autos", documento: "autos" },
        })
        .select("id")
        .single();
      if (error) {
        return { ok: false, mensagem: `Falha ao criar o devedor: ${error.message}` };
      }
      devedorId = data.id as number;
    }

    // 3) O processo. `casos` tem unique (credor_id, devedor_id).
    const numeroProcesso = ficha.identificacao.numeroCnj;
    let casoId: number | null = null;

    const { data: casoExistente } = await sb
      .from("casos")
      .select("id")
      .eq("credor_id", credorId)
      .eq("devedor_id", devedorId)
      .maybeSingle();

    if (casoExistente) {
      casoId = casoExistente.id as number;
      if (numeroProcesso) {
        await sb
          .from("casos")
          .update({ numero_processo: numeroProcesso })
          .eq("id", casoId)
          .is("numero_processo", null);
      }
    } else {
      const { data, error } = await sb
        .from("casos")
        .insert({
          credor_id: credorId,
          devedor_id: devedorId,
          numero_processo: numeroProcesso,
          valor_credito_brl: ficha.debito.valorAtualizadoBrl,
          status: "ativo",
        })
        .select("id")
        .single();
      if (error) {
        return { ok: false, mensagem: `Falha ao criar o processo: ${error.message}` };
      }
      casoId = data.id as number;
    }

    const { medidasGravadas } = await promoverAnalise({
      analiseId,
      casoId,
      devedorId,
      ficha,
    });

    revalidatePath("/equipe/autos");
    revalidatePath(`/equipe/devedores/${devedorId}`);

    return {
      ok: true,
      mensagem: `Gravado na biblioteca: ${medidasGravadas} ${medidasGravadas === 1 ? "medida" : "medidas"} no dossiê de ${executado.nome}.`,
    };
  } catch (e) {
    return {
      ok: false,
      mensagem: e instanceof Error ? e.message : "Falha ao confirmar a análise.",
    };
  }
}
