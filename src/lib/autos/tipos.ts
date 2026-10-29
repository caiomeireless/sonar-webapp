// Tipos e esquemas de saída da Análise de Autos.
//
// Cada passada do pipeline devolve JSON validado pelo próprio modelo
// (output_config.format = json_schema). O esquema é o contrato: se o modelo
// não conseguir preencher um campo obrigatório, ele é forçado a devolver o
// campo vazio em vez de inventar um formato novo.
//
// Os esquemas são escritos à mão em JSON Schema (sem zod) porque é o que a
// API consome direto e porque o tsc não precisa inferir nada disso.

import type { EspecieMedida } from "./prompts";

// ============================================================
// PASSADA 0 — TRIAGEM (o que é peça e o que é anexo)
// ============================================================

/** Numa execução "capa a capa" integral, a maior parte do arquivo é anexo. */
export type ClassePagina =
  | "peca" // petição, decisão, despacho, sentença, certidão, resposta de sistema
  | "anexo" // contrato, procuração, comprovante, AR, guia, documento pessoal
  | "capa" // capa, índice, folha de rosto, termo de autuação
  | "ilegivel"; // digitalização ruim ou página em branco

export interface PaginaTriada {
  /** Página no PDF original, começando em 1. */
  p: number;
  c: ClassePagina;
  /** 0 = descartável, 1 = contexto, 2 = essencial para a análise patrimonial. */
  rel: 0 | 1 | 2;
}

export interface ResultadoTriagem {
  paginas: PaginaTriada[];
}

export const SCHEMA_TRIAGEM = {
  type: "object",
  additionalProperties: false,
  required: ["paginas"],
  properties: {
    paginas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["p", "c", "rel"],
        properties: {
          p: { type: "integer" },
          c: { type: "string", enum: ["peca", "anexo", "capa", "ilegivel"] },
          rel: { type: "integer", enum: [0, 1, 2] },
        },
      },
    },
  },
} as const;

// ============================================================
// PASSADA 1 — EXTRAÇÃO (fatos crus, ancorados na página)
// ============================================================

export type PoloParte = "exequente" | "executado" | "terceiro";
export type ClasseMedida = "tipica" | "atipica";
export type ResultadoExtraido =
  | "positivo"
  | "negativo"
  | "parcial"
  | "pendente"
  | "indeferida";

export interface IdentificacaoAutos {
  numeroCnj: string | null;
  tribunal: string | null;
  comarca: string | null;
  vara: string | null;
  classe: string | null;
  assunto: string | null;
  valorCausaBrl: number | null;
  dataDistribuicao: string | null;
}

export interface ParteExtraida {
  polo: PoloParte;
  nome: string;
  documento: string | null;
  advogados: string[];
  enderecos: string[];
  paginas: number[];
}

export interface MedidaExtraida {
  especie: EspecieMedida;
  classe: ClasseMedida;
  titulo: string;
  requeridaEm: string | null;
  deferidaEm: string | null;
  cumpridaEm: string | null;
  resultado: ResultadoExtraido;
  valorBloqueadoBrl: number | null;
  valorLiberadoBrl: number | null;
  bemAtingido: string | null;
  paginas: number[];
  trecho: string;
}

export type RubricaValor =
  | "principal"
  | "correcao"
  | "juros"
  | "multa_523"
  | "honorarios_execucao"
  | "honorarios_sucumbencia"
  | "custas"
  | "total"
  | "indefinida";

export interface ValorExtraido {
  data: string | null;
  rubrica: RubricaValor;
  valorBrl: number;
  origem: string;
  paginas: number[];
  trecho: string;
}

export interface PagamentoExtraido {
  data: string | null;
  valorBrl: number;
  forma: string;
  paginas: number[];
}

export interface BemExtraido {
  tipo: string;
  descricao: string;
  identificador: string | null;
  titular: string | null;
  valorAvaliadoBrl: number | null;
  situacao: string | null;
  paginas: number[];
}

export interface EventoExtraido {
  data: string | null;
  descricao: string;
  paginas: number[];
}

export interface ResultadoExtracao {
  identificacao: IdentificacaoAutos;
  partes: ParteExtraida[];
  medidas: MedidaExtraida[];
  valores: ValorExtraido[];
  pagamentos: PagamentoExtraido[];
  bens: BemExtraido[];
  eventos: EventoExtraido[];
  lacunas: string[];
}

const PAGINAS = { type: "array", items: { type: "integer" } } as const;
const TEXTO_OU_NULO = { type: ["string", "null"] } as const;
const NUMERO_OU_NULO = { type: ["number", "null"] } as const;

export const SCHEMA_EXTRACAO = {
  type: "object",
  additionalProperties: false,
  required: [
    "identificacao",
    "partes",
    "medidas",
    "valores",
    "pagamentos",
    "bens",
    "eventos",
    "lacunas",
  ],
  properties: {
    identificacao: {
      type: "object",
      additionalProperties: false,
      required: [
        "numeroCnj",
        "tribunal",
        "comarca",
        "vara",
        "classe",
        "assunto",
        "valorCausaBrl",
        "dataDistribuicao",
      ],
      properties: {
        numeroCnj: TEXTO_OU_NULO,
        tribunal: TEXTO_OU_NULO,
        comarca: TEXTO_OU_NULO,
        vara: TEXTO_OU_NULO,
        classe: TEXTO_OU_NULO,
        assunto: TEXTO_OU_NULO,
        valorCausaBrl: NUMERO_OU_NULO,
        dataDistribuicao: TEXTO_OU_NULO,
      },
    },
    partes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["polo", "nome", "documento", "advogados", "enderecos", "paginas"],
        properties: {
          polo: { type: "string", enum: ["exequente", "executado", "terceiro"] },
          nome: { type: "string" },
          documento: TEXTO_OU_NULO,
          advogados: { type: "array", items: { type: "string" } },
          enderecos: { type: "array", items: { type: "string" } },
          paginas: PAGINAS,
        },
      },
    },
    medidas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "especie",
          "classe",
          "titulo",
          "requeridaEm",
          "deferidaEm",
          "cumpridaEm",
          "resultado",
          "valorBloqueadoBrl",
          "valorLiberadoBrl",
          "bemAtingido",
          "paginas",
          "trecho",
        ],
        properties: {
          especie: { type: "string" },
          classe: { type: "string", enum: ["tipica", "atipica"] },
          titulo: { type: "string" },
          requeridaEm: TEXTO_OU_NULO,
          deferidaEm: TEXTO_OU_NULO,
          cumpridaEm: TEXTO_OU_NULO,
          resultado: {
            type: "string",
            enum: ["positivo", "negativo", "parcial", "pendente", "indeferida"],
          },
          valorBloqueadoBrl: NUMERO_OU_NULO,
          valorLiberadoBrl: NUMERO_OU_NULO,
          bemAtingido: TEXTO_OU_NULO,
          paginas: PAGINAS,
          trecho: { type: "string" },
        },
      },
    },
    valores: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["data", "rubrica", "valorBrl", "origem", "paginas", "trecho"],
        properties: {
          data: TEXTO_OU_NULO,
          rubrica: {
            type: "string",
            enum: [
              "principal",
              "correcao",
              "juros",
              "multa_523",
              "honorarios_execucao",
              "honorarios_sucumbencia",
              "custas",
              "total",
              "indefinida",
            ],
          },
          valorBrl: { type: "number" },
          origem: { type: "string" },
          paginas: PAGINAS,
          trecho: { type: "string" },
        },
      },
    },
    pagamentos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["data", "valorBrl", "forma", "paginas"],
        properties: {
          data: TEXTO_OU_NULO,
          valorBrl: { type: "number" },
          forma: { type: "string" },
          paginas: PAGINAS,
        },
      },
    },
    bens: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "tipo",
          "descricao",
          "identificador",
          "titular",
          "valorAvaliadoBrl",
          "situacao",
          "paginas",
        ],
        properties: {
          tipo: { type: "string" },
          descricao: { type: "string" },
          identificador: TEXTO_OU_NULO,
          titular: TEXTO_OU_NULO,
          valorAvaliadoBrl: NUMERO_OU_NULO,
          situacao: TEXTO_OU_NULO,
          paginas: PAGINAS,
        },
      },
    },
    eventos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["data", "descricao", "paginas"],
        properties: {
          data: TEXTO_OU_NULO,
          descricao: { type: "string" },
          paginas: PAGINAS,
        },
      },
    },
    lacunas: { type: "array", items: { type: "string" } },
  },
} as const;

// ============================================================
// PASSADA 2 — CONSOLIDAÇÃO (a ficha)
// ============================================================

export type EstadoCaminho =
  | "positiva"
  | "negativa"
  | "parcial"
  | "pendente"
  | "indeferida"
  | "abandonada";

export type EtapaExecucao =
  | "citacao_pendente"
  | "citado_sem_pagamento"
  | "constricao_em_curso"
  | "expropriacao"
  | "suspenso_921"
  | "arquivado"
  | "extinto";

export interface MedidaConsolidada {
  ordem: number;
  especie: EspecieMedida;
  classe: ClasseMedida;
  titulo: string;
  requeridaEm: string | null;
  deferidaEm: string | null;
  cumpridaEm: string | null;
  estado: EstadoCaminho;
  valorBloqueadoBrl: number | null;
  valorLiberadoBrl: number | null;
  bemAtingido: string | null;
  paginas: number[];
  observacao: string | null;
}

export interface MedidaFaltante {
  prioridade: number;
  especie: EspecieMedida;
  classe: ClasseMedida;
  titulo: string;
  porQueCabe: string;
  fundamentoLegal: string;
  prontaParaPedir: boolean;
  dependeDe: string | null;
}

export interface RubricaDebito {
  rubrica: RubricaValor;
  valorBrl: number;
  fonte: string;
}

export interface DebitoConsolidado {
  valorAtualizadoBrl: number | null;
  dataBase: string | null;
  fonte: string | null;
  composicao: RubricaDebito[];
  amortizacoesBrl: number;
  saldoBrl: number | null;
  fechaConta: boolean;
  oQueFalta: string | null;
}

export interface SatisfacaoConsolidada {
  valorConstritoBrl: number;
  valorSatisfeitoBrl: number;
  valorPenhoradoNaoConvertidoBrl: number;
  percentualSobreSaldo: number | null;
}

export interface FatorExito {
  fator: string;
  peso: number;
  favoravel: boolean;
  explicacao: string;
}

export interface ChanceExito {
  score: number;
  faixa: "alta" | "media" | "baixa";
  fatores: FatorExito[];
}

export interface ProximaMovimentacao {
  titulo: string;
  tipoPeca: string;
  urgencia: "alta" | "media" | "baixa";
  fundamentos: string[];
  pedidos: string[];
  explicacao: string;
}

export interface AlertaAutos {
  gravidade: "critico" | "atencao" | "informativo";
  titulo: string;
  descricao: string;
}

export interface FichaAutos {
  identificacao: IdentificacaoAutos;
  partes: ParteExtraida[];
  medidasRealizadas: MedidaConsolidada[];
  medidasFaltantes: MedidaFaltante[];
  debito: DebitoConsolidado;
  satisfacao: SatisfacaoConsolidada;
  bens: BemExtraido[];
  etapa: EtapaExecucao;
  etapaJustificativa: string;
  chanceExito: ChanceExito;
  proximaMovimentacao: ProximaMovimentacao;
  alertas: AlertaAutos[];
  lacunas: string[];
}

export const SCHEMA_CONSOLIDACAO = {
  type: "object",
  additionalProperties: false,
  required: [
    "identificacao",
    "partes",
    "medidasRealizadas",
    "medidasFaltantes",
    "debito",
    "satisfacao",
    "bens",
    "etapa",
    "etapaJustificativa",
    "chanceExito",
    "proximaMovimentacao",
    "alertas",
    "lacunas",
  ],
  properties: {
    identificacao: SCHEMA_EXTRACAO.properties.identificacao,
    partes: SCHEMA_EXTRACAO.properties.partes,
    bens: SCHEMA_EXTRACAO.properties.bens,
    medidasRealizadas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "ordem",
          "especie",
          "classe",
          "titulo",
          "requeridaEm",
          "deferidaEm",
          "cumpridaEm",
          "estado",
          "valorBloqueadoBrl",
          "valorLiberadoBrl",
          "bemAtingido",
          "paginas",
          "observacao",
        ],
        properties: {
          ordem: { type: "integer" },
          especie: { type: "string" },
          classe: { type: "string", enum: ["tipica", "atipica"] },
          titulo: { type: "string" },
          requeridaEm: TEXTO_OU_NULO,
          deferidaEm: TEXTO_OU_NULO,
          cumpridaEm: TEXTO_OU_NULO,
          estado: {
            type: "string",
            enum: [
              "positiva",
              "negativa",
              "parcial",
              "pendente",
              "indeferida",
              "abandonada",
            ],
          },
          valorBloqueadoBrl: NUMERO_OU_NULO,
          valorLiberadoBrl: NUMERO_OU_NULO,
          bemAtingido: TEXTO_OU_NULO,
          paginas: PAGINAS,
          observacao: TEXTO_OU_NULO,
        },
      },
    },
    medidasFaltantes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "prioridade",
          "especie",
          "classe",
          "titulo",
          "porQueCabe",
          "fundamentoLegal",
          "prontaParaPedir",
          "dependeDe",
        ],
        properties: {
          prioridade: { type: "integer" },
          especie: { type: "string" },
          classe: { type: "string", enum: ["tipica", "atipica"] },
          titulo: { type: "string" },
          porQueCabe: { type: "string" },
          fundamentoLegal: { type: "string" },
          prontaParaPedir: { type: "boolean" },
          dependeDe: TEXTO_OU_NULO,
        },
      },
    },
    debito: {
      type: "object",
      additionalProperties: false,
      required: [
        "valorAtualizadoBrl",
        "dataBase",
        "fonte",
        "composicao",
        "amortizacoesBrl",
        "saldoBrl",
        "fechaConta",
        "oQueFalta",
      ],
      properties: {
        valorAtualizadoBrl: NUMERO_OU_NULO,
        dataBase: TEXTO_OU_NULO,
        fonte: TEXTO_OU_NULO,
        composicao: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["rubrica", "valorBrl", "fonte"],
            properties: {
              rubrica: SCHEMA_EXTRACAO.properties.valores.items.properties.rubrica,
              valorBrl: { type: "number" },
              fonte: { type: "string" },
            },
          },
        },
        amortizacoesBrl: { type: "number" },
        saldoBrl: NUMERO_OU_NULO,
        fechaConta: { type: "boolean" },
        oQueFalta: TEXTO_OU_NULO,
      },
    },
    satisfacao: {
      type: "object",
      additionalProperties: false,
      required: [
        "valorConstritoBrl",
        "valorSatisfeitoBrl",
        "valorPenhoradoNaoConvertidoBrl",
        "percentualSobreSaldo",
      ],
      properties: {
        valorConstritoBrl: { type: "number" },
        valorSatisfeitoBrl: { type: "number" },
        valorPenhoradoNaoConvertidoBrl: { type: "number" },
        percentualSobreSaldo: NUMERO_OU_NULO,
      },
    },
    etapa: {
      type: "string",
      enum: [
        "citacao_pendente",
        "citado_sem_pagamento",
        "constricao_em_curso",
        "expropriacao",
        "suspenso_921",
        "arquivado",
        "extinto",
      ],
    },
    etapaJustificativa: { type: "string" },
    chanceExito: {
      type: "object",
      additionalProperties: false,
      required: ["score", "faixa", "fatores"],
      properties: {
        score: { type: "integer" },
        faixa: { type: "string", enum: ["alta", "media", "baixa"] },
        fatores: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["fator", "peso", "favoravel", "explicacao"],
            properties: {
              fator: { type: "string" },
              peso: { type: "number" },
              favoravel: { type: "boolean" },
              explicacao: { type: "string" },
            },
          },
        },
      },
    },
    proximaMovimentacao: {
      type: "object",
      additionalProperties: false,
      required: [
        "titulo",
        "tipoPeca",
        "urgencia",
        "fundamentos",
        "pedidos",
        "explicacao",
      ],
      properties: {
        titulo: { type: "string" },
        tipoPeca: { type: "string" },
        urgencia: { type: "string", enum: ["alta", "media", "baixa"] },
        fundamentos: { type: "array", items: { type: "string" } },
        pedidos: { type: "array", items: { type: "string" } },
        explicacao: { type: "string" },
      },
    },
    alertas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["gravidade", "titulo", "descricao"],
        properties: {
          gravidade: {
            type: "string",
            enum: ["critico", "atencao", "informativo"],
          },
          titulo: { type: "string" },
          descricao: { type: "string" },
        },
      },
    },
    lacunas: { type: "array", items: { type: "string" } },
  },
} as const;

// ============================================================
// ESTADO DO JOB (espelha a tabela autos_analises da migration 025)
// ============================================================

export type StatusAnalise =
  | "extraindo"
  | "triando"
  | "analisando"
  | "consolidando"
  | "revisao"
  | "confirmada"
  | "erro"
  | "cancelada";

export interface CustoTokens {
  modelo: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export interface AnaliseAutos {
  id: number;
  devedor_id: number | null;
  caso_id: number | null;
  arquivo_nome: string;
  numero_processo: string | null;
  total_paginas: number;
  paginas_uteis: number | null;
  status: StatusAnalise;
  etapa_atual: string | null;
  progresso_pct: number;
  erro: string | null;
  ficha: FichaAutos | null;
  ficha_revisada: FichaAutos | null;
  custo_brl: number | null;
  criado_por: string | null;
  criado_em: string;
}

/** A ficha que vale é a revisada pelo advogado, se existir. */
export function fichaVigente(a: {
  ficha: FichaAutos | null;
  ficha_revisada: FichaAutos | null;
}): FichaAutos | null {
  return a.ficha_revisada ?? a.ficha;
}
