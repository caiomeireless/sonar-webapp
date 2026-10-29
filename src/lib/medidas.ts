// Reader/types de medidas_tomadas — histórico processual por caso.
// Server-only (usa admin client). Renderizado como timeline no dossiê.
//
// Tabela criada na migration 004. Se a tabela não existir ainda (migration
// não rodou), as funções devolvem [] sem panic — a página continua viva.
import { createAdminClient } from "@/lib/supabase/admin";

// Vocabulário LEGADO (migration 004) — é o que o formulário manual oferece.
export type TipoMedidaLegado =
  | "sisbajud"
  | "infojud"
  | "renajud"
  | "arisp"
  | "oficio_cartorio"
  | "oficio_junta"
  | "peticao_penhora"
  | "penhora_efetivada"
  | "audiencia"
  | "recurso"
  | "cumprimento_sentenca"
  | "sniper"
  | "serasajud"
  | "outro";

// Típicas que faltavam (CPC 824 a 909). Vêm da Análise de Autos, migration 025.
export type TipoMedidaTipica =
  | "citacao"
  | "sisbajud_teimosinha"
  | "penhora_imovel"
  | "penhora_faturamento"
  | "penhora_quotas"
  | "penhora_credito"
  | "penhora_precatorio"
  | "penhora_estoque_semovente"
  | "penhora_rosto_autos"
  | "cnib"
  | "protesto"
  | "oficial_justica_penhora"
  | "avaliacao"
  | "adjudicacao"
  | "alienacao_judicial"
  | "arresto"
  | "busca_apreensao";

// Atípicas (CPC 139, IV — validadas pelo STF na ADI 5.941).
export type TipoMedidaAtipica =
  | "suspensao_cnh"
  | "apreensao_passaporte"
  | "bloqueio_cartoes"
  | "proibicao_licitar"
  | "quebra_sigilo_fiscal"
  | "quebra_sigilo_bancario"
  | "idpj"
  | "fraude_execucao"
  | "grupo_economico"
  | "astreintes"
  | "inclusao_cadastro_inadimplentes";

export type TipoMedida =
  | TipoMedidaLegado
  | TipoMedidaTipica
  | TipoMedidaAtipica;

export type ResultadoMedida =
  | "positivo"
  | "negativo"
  | "parcial"
  | "aguardando"
  | "nao_aplica"
  // Migration 025: os autos exigem estes dois, que não existiam.
  | "indeferida"
  | "abandonada";

export interface Medida {
  id: number;
  caso_id: number;
  data: string;
  tipo: TipoMedida;
  resultado: ResultadoMedida;
  titulo: string;
  detalhes: string | null;
  advogado_email: string | null;
  criado_em: string;
}

// Lista todas medidas dos casos vinculados a um devedor.
// Ordenado por data DESC (mais recente primeiro).
// Se a tabela não existir (migration 004 não rodou), devolve [].
export async function listarMedidasPorDevedor(
  devedorId: number,
): Promise<Medida[]> {
  const sb = createAdminClient();

  // 1) Pega os IDs dos casos deste devedor.
  const { data: casos, error: errCasos } = await sb
    .from("casos")
    .select("id")
    .eq("devedor_id", devedorId);
  if (errCasos || !casos || casos.length === 0) return [];

  const casoIds = casos.map((c) => c.id as number);

  // 2) Busca medidas. Se a tabela não existir (PostgREST 42P01),
  //    devolve array vazio em vez de quebrar a página.
  const { data, error } = await sb
    .from("medidas_tomadas")
    .select("*")
    .in("caso_id", casoIds)
    .order("data", { ascending: false });

  if (error) {
    // 42P01 = undefined_table; PGRST205 = schema cache não tem tabela.
    // Em ambos cenários o significado prático é "tabela não existe ainda".
    console.warn(
      `[medidas] tabela indisponível ou erro de leitura: ${error.message}`,
    );
    return [];
  }

  return (data ?? []) as unknown as Medida[];
}

// ============================================================
// Metadados de UI — tipos e resultados com label + cor.
// Centralizado aqui pra TimelineMedidas e AdicionarMedidaForm
// consumirem o mesmo dicionário.
// ============================================================
export const TIPO_META: Record<TipoMedida, { label: string; cor: string }> = {
  sisbajud: { label: "SISBAJUD", cor: "#5a9bff" },
  infojud: { label: "INFOJUD", cor: "#7a86ff" },
  renajud: { label: "RENAJUD", cor: "#ff8a3d" },
  arisp: { label: "ARISP", cor: "#d4b46a" },
  oficio_cartorio: { label: "Ofício cartório", cor: "#c9a24a" },
  oficio_junta: { label: "Ofício junta", cor: "#c9a24a" },
  peticao_penhora: { label: "Petição penhora", cor: "#c9a24a" },
  penhora_efetivada: { label: "Penhora efetivada", cor: "#3cff8a" },
  audiencia: { label: "Audiência", cor: "#b08cff" },
  recurso: { label: "Recurso", cor: "#ff6b9d" },
  cumprimento_sentenca: { label: "Cumprim. sentença", cor: "#9ed8ff" },
  sniper: { label: "SNIPER", cor: "#ff5050" },
  serasajud: { label: "SERASAJUD", cor: "#5ad4d4" },
  outro: { label: "Outro", cor: "#a9a9a9" },

  // ---- típicas vindas da Análise de Autos (migration 025) ----
  citacao: { label: "Citação", cor: "#9ed8ff" },
  sisbajud_teimosinha: { label: "SISBAJUD teimosinha", cor: "#5a9bff" },
  penhora_imovel: { label: "Penhora de imóvel", cor: "#38bdf8" },
  penhora_faturamento: { label: "Penhora de faturamento", cor: "#2dd4bf" },
  penhora_quotas: { label: "Penhora de quotas", cor: "#2dd4bf" },
  penhora_credito: { label: "Penhora de crédito", cor: "#2dd4bf" },
  penhora_precatorio: { label: "Penhora de precatório", cor: "#2dd4bf" },
  penhora_estoque_semovente: { label: "Penhora de estoque", cor: "#2dd4bf" },
  penhora_rosto_autos: { label: "Penhora no rosto dos autos", cor: "#2dd4bf" },
  cnib: { label: "CNIB", cor: "#d4b46a" },
  protesto: { label: "Protesto", cor: "#c9a24a" },
  oficial_justica_penhora: { label: "Oficial de justiça", cor: "#c9a24a" },
  avaliacao: { label: "Avaliação", cor: "#d4b46a" },
  adjudicacao: { label: "Adjudicação", cor: "#3cff8a" },
  alienacao_judicial: { label: "Alienação judicial", cor: "#3cff8a" },
  arresto: { label: "Arresto", cor: "#ff8a3d" },
  busca_apreensao: { label: "Busca e apreensão", cor: "#ff8a3d" },

  // ---- atípicas (CPC 139, IV) — roxo, para destacar o regime especial ----
  suspensao_cnh: { label: "Suspensão de CNH", cor: "#c084fc" },
  apreensao_passaporte: { label: "Apreensão de passaporte", cor: "#c084fc" },
  bloqueio_cartoes: { label: "Bloqueio de cartões", cor: "#c084fc" },
  proibicao_licitar: { label: "Proibição de licitar", cor: "#c084fc" },
  quebra_sigilo_fiscal: { label: "Quebra de sigilo fiscal", cor: "#c084fc" },
  quebra_sigilo_bancario: { label: "Quebra de sigilo bancário", cor: "#c084fc" },
  idpj: { label: "Desconsideração (IDPJ)", cor: "#c084fc" },
  fraude_execucao: { label: "Fraude à execução", cor: "#c084fc" },
  grupo_economico: { label: "Grupo econômico", cor: "#c084fc" },
  astreintes: { label: "Astreintes", cor: "#c084fc" },
  inclusao_cadastro_inadimplentes: {
    label: "Cadastro de inadimplentes",
    cor: "#c084fc",
  },
};

export const RESULTADO_META: Record<
  ResultadoMedida,
  { label: string; cor: string }
> = {
  positivo: { label: "Positivo", cor: "#3cff8a" },
  negativo: { label: "Negativo", cor: "#ff5b5b" },
  parcial: { label: "Parcial", cor: "#f4c542" },
  aguardando: { label: "Aguardando", cor: "#a9a9a9" },
  nao_aplica: { label: "N/A", cor: "#777" },
  indeferida: { label: "Indeferida", cor: "#fb7185" },
  abandonada: { label: "Sem decisão", cor: "#8e866f" },
};

// Ordem dos selects no form — humana, agrupada por etapa processual.
export const TIPOS_ORDEM: TipoMedida[] = [
  "sisbajud",
  "infojud",
  "renajud",
  "arisp",
  "serasajud",
  "sniper",
  "oficio_cartorio",
  "oficio_junta",
  "peticao_penhora",
  "penhora_efetivada",
  "audiencia",
  "recurso",
  "cumprimento_sentenca",
  "outro",
];

export const RESULTADOS_ORDEM: ResultadoMedida[] = [
  "positivo",
  "negativo",
  "parcial",
  "aguardando",
  "nao_aplica",
];
