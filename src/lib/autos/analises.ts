// Persistência das análises de capa a capa. Server-only (admin client).
//
// A análise nasce solta: o advogado joga o PDF, o sistema lê e monta a ficha,
// e só DEPOIS da conferência humana ela é promovida à biblioteca (devedor,
// caso e medidas de verdade). Essa separação é deliberada — agora que o
// Themis saiu, este módulo virou a fonte de alimentação da base, e dado de
// IA não entra na base oficial sem alguém olhar.
import { createAdminClient } from "@/lib/supabase/admin";

import type {
  AnaliseAutos,
  CustoTokens,
  FichaAutos,
  MedidaConsolidada,
  ResultadoExtracao,
  ResultadoTriagem,
  StatusAnalise,
} from "./tipos";

const TABELA = "autos_analises";

/** Erro de "tabela não existe" do PostgREST: a migration 025 não rodou. */
function faltaMigration(erro: { code?: string } | null): boolean {
  return erro?.code === "42P01";
}

export async function criarAnalise(args: {
  arquivoNome: string;
  totalPaginas: number;
  criadoPor: string | null;
}): Promise<number> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from(TABELA)
    .insert({
      arquivo_nome: args.arquivoNome,
      total_paginas: args.totalPaginas,
      status: "extraindo" satisfies StatusAnalise,
      etapa_atual: "Lendo o arquivo",
      criado_por: args.criadoPor,
    })
    .select("id")
    .single();

  if (error) {
    if (faltaMigration(error)) {
      throw new Error(
        "A migration 025 ainda não foi aplicada no Supabase — a tabela autos_analises não existe.",
      );
    }
    throw new Error(`Não foi possível abrir a análise: ${error.message}`);
  }
  return data.id as number;
}

export interface PatchAnalise {
  status?: StatusAnalise;
  etapa_atual?: string;
  progresso_pct?: number;
  erro?: string | null;
  numero_processo?: string | null;
  paginas_uteis?: number;
  triagem?: ResultadoTriagem;
  extracoes?: ResultadoExtracao[];
  ficha?: FichaAutos;
  ficha_revisada?: FichaAutos;
  custo_tokens?: CustoTokens[];
  custo_brl?: number;
  devedor_id?: number | null;
  caso_id?: number | null;
}

export async function atualizarAnalise(
  id: number,
  patch: PatchAnalise,
): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb
    .from(TABELA)
    .update({ ...patch, atualizado_em: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    throw new Error(`Não foi possível atualizar a análise: ${error.message}`);
  }
}

export async function obterAnalise(id: number): Promise<AnaliseAutos | null> {
  const sb = createAdminClient();
  const { data, error } = await sb.from(TABELA).select("*").eq("id", id).single();
  if (error || !data) return null;
  return data as unknown as AnaliseAutos;
}

/** Linhas cruas, inclusive as colunas pesadas — só para quem vai consolidar. */
export async function obterAnaliseCompleta(id: number): Promise<{
  total_paginas: number;
  extracoes: ResultadoExtracao[] | null;
  devedor_id: number | null;
} | null> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from(TABELA)
    .select("total_paginas, extracoes, devedor_id")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as unknown as {
    total_paginas: number;
    extracoes: ResultadoExtracao[] | null;
    devedor_id: number | null;
  };
}

export async function listarAnalises(limite = 50): Promise<AnaliseAutos[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from(TABELA)
    .select(
      "id, devedor_id, caso_id, arquivo_nome, numero_processo, total_paginas, paginas_uteis, status, etapa_atual, progresso_pct, erro, custo_brl, criado_por, criado_em, ficha, ficha_revisada",
    )
    .order("criado_em", { ascending: false })
    .limit(limite);

  if (error) return [];
  return (data ?? []) as unknown as AnaliseAutos[];
}

// ============================================================
// PROMOÇÃO À BIBLIOTECA
// ============================================================

/**
 * Converte a espécie da análise para o `tipo` aceito pela tabela
 * medidas_tomadas. A migration 025 abriu o CHECK para todo o vocabulário,
 * mas uma espécie desconhecida (modelo inventou) não pode derrubar a
 * gravação inteira — ela cai em 'outro'.
 */
const ESPECIES_ACEITAS = new Set([
  "sisbajud", "infojud", "renajud", "arisp", "oficio_cartorio", "oficio_junta",
  "peticao_penhora", "penhora_efetivada", "audiencia", "recurso",
  "cumprimento_sentenca", "sniper", "serasajud", "outro",
  "citacao", "sisbajud_teimosinha", "penhora_imovel", "penhora_faturamento",
  "penhora_quotas", "penhora_credito", "penhora_precatorio",
  "penhora_estoque_semovente", "penhora_rosto_autos", "cnib", "protesto",
  "oficial_justica_penhora", "avaliacao", "adjudicacao", "alienacao_judicial",
  "arresto", "busca_apreensao",
  "suspensao_cnh", "apreensao_passaporte", "bloqueio_cartoes",
  "proibicao_licitar", "quebra_sigilo_fiscal", "quebra_sigilo_bancario",
  "idpj", "fraude_execucao", "grupo_economico", "astreintes",
  "inclusao_cadastro_inadimplentes",
]);

/** O estado do caminho vira o `resultado` da medida. */
const ESTADO_PARA_RESULTADO: Record<MedidaConsolidada["estado"], string> = {
  positiva: "positivo",
  negativa: "negativo",
  parcial: "parcial",
  pendente: "aguardando",
  indeferida: "indeferida",
  abandonada: "abandonada",
};

/** Primeira data conhecida da medida — `data` é NOT NULL na tabela. */
function dataDaMedida(m: MedidaConsolidada): string {
  return (
    m.cumpridaEm ??
    m.deferidaEm ??
    m.requeridaEm ??
    new Date().toISOString().slice(0, 10)
  );
}

/**
 * Promove a ficha conferida pelo advogado: grava as medidas no caso e
 * atualiza o débito, a satisfação, a etapa e a chance de êxito.
 *
 * Idempotente por `(analise_id, ordem)` — confirmar duas vezes não duplica.
 */
export async function promoverAnalise(args: {
  analiseId: number;
  casoId: number;
  devedorId: number;
  ficha: FichaAutos;
}): Promise<{ medidasGravadas: number }> {
  const { analiseId, casoId, devedorId, ficha } = args;
  const sb = createAdminClient();

  // 1) Medidas. Em lotes de 500 para não esbarrar no teto do PostgREST.
  const linhas = ficha.medidasRealizadas.map((m) => ({
    caso_id: casoId,
    data: dataDaMedida(m),
    tipo: ESPECIES_ACEITAS.has(m.especie) ? m.especie : "outro",
    resultado: ESTADO_PARA_RESULTADO[m.estado] ?? "nao_aplica",
    titulo: m.titulo.slice(0, 500),
    detalhes: m.observacao,
    classe: m.classe,
    requerida_em: m.requeridaEm,
    deferida_em: m.deferidaEm,
    cumprida_em: m.cumpridaEm,
    valor_bloqueado_brl: m.valorBloqueadoBrl,
    valor_liberado_brl: m.valorLiberadoBrl,
    paginas: m.paginas,
    origem: "autos",
    ordem: m.ordem,
    analise_id: analiseId,
    // advogado_email fica NULO de propósito: o nome que aparece nos autos
    // raramente é um perfil cadastrado, e a coluna tem FK para perfis.
  }));

  let gravadas = 0;
  for (let i = 0; i < linhas.length; i += 500) {
    const fatia = linhas.slice(i, i + 500);
    const { error } = await sb
      .from("medidas_tomadas")
      .upsert(fatia, { onConflict: "analise_id,ordem", ignoreDuplicates: false });
    if (error) {
      throw new Error(`Falha ao gravar as medidas: ${error.message}`);
    }
    gravadas += fatia.length;
  }

  // 2) Caso: débito, satisfação, etapa e chance de êxito.
  const { error: erroCaso } = await sb
    .from("casos")
    .update({
      debito_atualizado_brl: ficha.debito.saldoBrl ?? ficha.debito.valorAtualizadoBrl,
      debito_data_base: ficha.debito.dataBase,
      debito_fonte: ficha.debito.fonte,
      debito_composicao: ficha.debito.composicao,
      valor_satisfeito_brl: ficha.satisfacao.valorSatisfeitoBrl,
      valor_constrito_brl: ficha.satisfacao.valorConstritoBrl,
      etapa_execucao: ficha.etapa,
      chance_exito: ficha.chanceExito.score,
      chance_exito_fatores: ficha.chanceExito.fatores,
      autos_analisado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", casoId);
  if (erroCaso) {
    throw new Error(`Falha ao atualizar o processo: ${erroCaso.message}`);
  }

  // 3) Fecha a análise.
  await atualizarAnalise(analiseId, {
    status: "confirmada",
    etapa_atual: "Confirmada e gravada na biblioteca",
    progresso_pct: 100,
    caso_id: casoId,
    devedor_id: devedorId,
  });

  return { medidasGravadas: gravadas };
}
