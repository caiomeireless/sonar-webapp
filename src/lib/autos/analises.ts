// Persistência das análises de capa a capa. Server-only (admin client).
//
// A análise nasce solta: o advogado joga o PDF, o sistema lê e monta a ficha,
// e só DEPOIS da conferência humana ela é promovida à biblioteca (devedor,
// caso e medidas de verdade). Essa separação é deliberada — agora que o
// Themis saiu, este módulo virou a fonte de alimentação da base, e dado de
// IA não entra na base oficial sem alguém olhar.
//
// Desde o primeiro capa a capa real: CADA LOTE é gravado assim que sai. A
// versão anterior só gravava no fim da consolidação, e quando ela estourou
// o tempo de função (504) perdeu-se uma extração inteira. Agora a falha de
// uma etapa nunca apaga a etapa anterior, e a análise pode ser retomada.
import { createAdminClient } from "@/lib/supabase/admin";

import { custoEmReais, somarCustos } from "./claude";
import type {
  AnaliseAutos,
  CustoTokens,
  FichaAutos,
  MedidaConsolidada,
  ResultadoExtracao,
  StatusAnalise,
} from "./tipos";

const TABELA = "autos_analises";

/** Um lote extraído, com a posição dele na fila — é o que permite retomar. */
export interface LoteExtraido {
  indice: number;
  extracao: ResultadoExtracao;
}

/**
 * O que fica da triagem no jsonb `triagem`: o suficiente para, se o mesmo
 * arquivo for arrastado de novo, pular a triagem e os lotes já lidos. A
 * partição em lotes é determinística a partir de `relevantes`.
 */
export interface TriagemSalva {
  hash: string;
  relevantes: number[];
  totalLotes: number;
  semTexto: number[];
}

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
  arquivo_hash?: string;
  triagem?: TriagemSalva;
  extracoes?: LoteExtraido[];
  /** Parcial de propósito: depois da etapa de fatos, a ficha ainda não tem o juízo. */
  ficha?: Partial<FichaAutos>;
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

/** Fecha a triagem e abre a fase de lotes. Zera as extrações: é um começo. */
export async function salvarTriagem(
  id: number,
  triagem: TriagemSalva,
): Promise<void> {
  await atualizarAnalise(id, {
    status: "analisando",
    etapa_atual: `0 de ${triagem.totalLotes} lotes lidos`,
    progresso_pct: 35,
    erro: null,
    arquivo_hash: triagem.hash,
    triagem,
    paginas_uteis: triagem.relevantes.length,
    extracoes: [],
  });
}

/**
 * Grava a extração de UM lote assim que ela sai, somando o custo. Os lotes
 * chegam em sequência (o navegador orquestra um por vez), então o
 * lê-altera-grava aqui não disputa com ninguém.
 */
export async function anexarExtracao(args: {
  id: number;
  indice: number;
  totalLotes: number;
  extracao: ResultadoExtracao;
  custo: CustoTokens;
}): Promise<{ lotesLidos: number }> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from(TABELA)
    .select("extracoes, custo_tokens")
    .eq("id", args.id)
    .single();
  if (error || !data) {
    throw new Error("Análise não encontrada ao gravar o lote.");
  }

  const lotes = ((data.extracoes as LoteExtraido[] | null) ?? []).filter(
    (l) => l.indice !== args.indice,
  );
  lotes.push({ indice: args.indice, extracao: args.extracao });
  lotes.sort((a, b) => a.indice - b.indice);

  const custos = somarCustos([
    ...((data.custo_tokens as CustoTokens[] | null) ?? []),
    args.custo,
  ]);
  const custoBrl = custos.reduce((s, c) => s + custoEmReais(c), 0);
  const total = Math.max(1, args.totalLotes);
  const completo = lotes.length >= total;

  await atualizarAnalise(args.id, {
    status: "analisando",
    erro: null,
    extracoes: lotes,
    custo_tokens: custos,
    custo_brl: Number(custoBrl.toFixed(4)),
    etapa_atual: completo
      ? "Leitura concluída; aguardando consolidação"
      : `${lotes.length} de ${total} lotes lidos`,
    progresso_pct: 35 + Math.round((lotes.length / total) * 50),
  });

  return { lotesLidos: lotes.length };
}

export interface AnaliseRetomavel {
  id: number;
  status: StatusAnalise;
  triagem: TriagemSalva;
  lotesLidos: number[];
}

/**
 * O mesmo arquivo, arrastado de novo, encontra a análise que ficou pelo
 * caminho — quebrada, interrompida ou parada na consolidação.
 */
export async function localizarRetomavel(
  hash: string,
): Promise<AnaliseRetomavel | null> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from(TABELA)
    .select("id, status, triagem, extracoes")
    .eq("arquivo_hash", hash)
    .in("status", ["analisando", "consolidando", "erro"])
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data || !data.triagem) return null;

  const lotes = (data.extracoes as LoteExtraido[] | null) ?? [];
  return {
    id: data.id as number,
    status: data.status as StatusAnalise,
    triagem: data.triagem as TriagemSalva,
    lotesLidos: lotes.map((l) => l.indice),
  };
}

export interface AnaliseParaConsolidar {
  id: number;
  total_paginas: number;
  triagem: TriagemSalva | null;
  extracoes: LoteExtraido[];
  ficha: Partial<FichaAutos> | null;
  custo_tokens: CustoTokens[];
}

/** O que as rotas de consolidação leem do banco — nada grande trafega no corpo. */
export async function obterParaConsolidar(
  id: number,
): Promise<AnaliseParaConsolidar | null> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from(TABELA)
    .select("id, total_paginas, triagem, extracoes, ficha, custo_tokens")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return {
    id: data.id as number,
    total_paginas: data.total_paginas as number,
    triagem: (data.triagem as TriagemSalva | null) ?? null,
    extracoes: (data.extracoes as LoteExtraido[] | null) ?? [],
    ficha: (data.ficha as Partial<FichaAutos> | null) ?? null,
    custo_tokens: (data.custo_tokens as CustoTokens[] | null) ?? [],
  };
}

/** Lista leve: sem os jsonb pesados (ficha, extrações). */
export async function listarAnalises(limite = 50): Promise<AnaliseAutos[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from(TABELA)
    .select(
      "id, devedor_id, caso_id, arquivo_nome, numero_processo, total_paginas, paginas_uteis, status, etapa_atual, progresso_pct, erro, custo_brl, criado_por, criado_em",
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
