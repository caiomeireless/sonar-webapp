// Tipos e esquemas de saída da Análise de Autos.
//
// Cada passada do pipeline devolve JSON validado pelo próprio modelo
// (output_config.format = json_schema). O esquema é o contrato: se o modelo
// não conseguir preencher um campo obrigatório, ele é forçado a devolver o
// campo vazio em vez de inventar um formato novo.
//
// Os esquemas são escritos à mão em JSON Schema (sem zod) porque é o que a
// API consome direto e porque o tsc não precisa inferir nada disso.

import {
  ESPECIES_ATIPICAS,
  ESPECIES_TIPICAS,
  type EspecieMedida,
} from "./prompts";
import {
  CODIGOS_MEDIDA,
  EFEITOS_PRESCRICIONAIS,
  PERFIS_DEVEDOR,
  SEMAFOROS,
  SISTEMAS_AUTOS,
  type CodigoMedida,
  type EfeitoPrescricional,
  type PerfilDevedor,
  type SemaforoPrescricao,
  type SistemaAutos,
} from "./vocabulario";

/**
 * O vocabulário fechado, no esquema e não só no texto do prompt.
 *
 * Pedir "use o vocabulário fechado" na instrução NÃO basta: num teste real o
 * modelo devolveu "Bloqueio via SISBAJUD" em vez de "sisbajud". Espécie em
 * texto livre quebra a deduplicação, a classificação típica/atípica e faz
 * tudo cair em 'outro' na hora de gravar. Aqui o enum obriga.
 */
const ENUM_ESPECIE = {
  type: "string",
  enum: [...ESPECIES_TIPICAS, ...ESPECIES_ATIPICAS],
} as const;

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
  /** Define o formato da referência: fls. X (e-SAJ) x ev. X, doc. Y (eproc). */
  sistema: SistemaAutos | null;
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
  /** O motor do art. 921: sem isto a linha do tempo é enfeite. */
  efeitoPrescricional: EfeitoPrescricional;
  referencia: string | null;
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
        "sistema",
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
        sistema: { type: ["string", "null"], enum: [...SISTEMAS_AUTOS, null] },
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
          especie: ENUM_ESPECIE,
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
        required: [
          "data",
          "descricao",
          "efeitoPrescricional",
          "referencia",
          "paginas",
        ],
        properties: {
          data: TEXTO_OU_NULO,
          descricao: { type: "string" },
          efeitoPrescricional: {
            type: "string",
            enum: [...EFEITOS_PRESCRICIONAIS],
          },
          referencia: TEXTO_OU_NULO,
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
  /** Código do catálogo M1 a M22 — liga "o que falta" à peça que resolve. */
  codigo: CodigoMedida;
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
  codigo: CodigoMedida;
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

/** Demonstração da prescrição intercorrente (art. 921), passo a passo. */
export interface PrescricaoIntercorrente {
  /** Prazo da pretensão, em anos (Súmula 150/STF; CC, art. 206-A). */
  prazoAnos: number | null;
  prazoFundamento: string | null;
  /** Ciência da PRIMEIRA tentativa infrutífera (art. 921, §4º). */
  marcoInicial: string | null;
  marcoInicialReferencia: string | null;
  suspensaoInicio: string | null;
  suspensaoFim: string | null;
  /** Cada uma reinicia o prazo inteiro (art. 921, §4º-A). */
  interrupcoes: { data: string; ato: string; referencia: string | null }[];
  dataEstimadaConsumacao: string | null;
  mesesRestantes: number | null;
  semaforo: SemaforoPrescricao;
  /** O cálculo foi conferido pelos dois caminhos; houve divergência? */
  divergenciaEntreCaminhos: string | null;
  demonstracao: string;
}

export interface VulnerabilidadeApontada {
  item: number;
  situacao: string;
  consequencia: string;
  correcao: string;
}

export interface TesteAuditoria {
  numero: number;
  pergunta: string;
  atendido: boolean;
  motivo: string;
}

export interface FichaAutos {
  identificacao: IdentificacaoAutos;
  partes: ParteExtraida[];
  /** Enquadramento que calibra onde procurar bens. */
  perfilDevedor: PerfilDevedor;
  perfilDevedorSinais: string;
  /** O que as decisões revelam sobre o juízo — decide o modo da peça. */
  perfilJuizo: string;
  modoPeca: "escalonada" | "sequencial";
  modoPecaRazao: string;
  prescricao: PrescricaoIntercorrente;
  vulnerabilidades: VulnerabilidadeApontada[];
  auditoria: TesteAuditoria[];
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
    "perfilDevedor",
    "perfilDevedorSinais",
    "perfilJuizo",
    "modoPeca",
    "modoPecaRazao",
    "prescricao",
    "vulnerabilidades",
    "auditoria",
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

    perfilDevedor: { type: "string", enum: [...PERFIS_DEVEDOR] },
    perfilDevedorSinais: { type: "string" },
    perfilJuizo: { type: "string" },
    modoPeca: { type: "string", enum: ["escalonada", "sequencial"] },
    modoPecaRazao: { type: "string" },

    prescricao: {
      type: "object",
      additionalProperties: false,
      required: [
        "prazoAnos",
        "prazoFundamento",
        "marcoInicial",
        "marcoInicialReferencia",
        "suspensaoInicio",
        "suspensaoFim",
        "interrupcoes",
        "dataEstimadaConsumacao",
        "mesesRestantes",
        "semaforo",
        "divergenciaEntreCaminhos",
        "demonstracao",
      ],
      properties: {
        prazoAnos: NUMERO_OU_NULO,
        prazoFundamento: TEXTO_OU_NULO,
        marcoInicial: TEXTO_OU_NULO,
        marcoInicialReferencia: TEXTO_OU_NULO,
        suspensaoInicio: TEXTO_OU_NULO,
        suspensaoFim: TEXTO_OU_NULO,
        interrupcoes: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["data", "ato", "referencia"],
            properties: {
              data: { type: "string" },
              ato: { type: "string" },
              referencia: TEXTO_OU_NULO,
            },
          },
        },
        dataEstimadaConsumacao: TEXTO_OU_NULO,
        mesesRestantes: NUMERO_OU_NULO,
        semaforo: { type: "string", enum: [...SEMAFOROS] },
        divergenciaEntreCaminhos: TEXTO_OU_NULO,
        demonstracao: { type: "string" },
      },
    },

    vulnerabilidades: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "situacao", "consequencia", "correcao"],
        properties: {
          item: { type: "integer" },
          situacao: { type: "string" },
          consequencia: { type: "string" },
          correcao: { type: "string" },
        },
      },
    },

    auditoria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["numero", "pergunta", "atendido", "motivo"],
        properties: {
          numero: { type: "integer" },
          pergunta: { type: "string" },
          atendido: { type: "boolean" },
          motivo: { type: "string" },
        },
      },
    },
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
          especie: ENUM_ESPECIE,
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
          "codigo",
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
          codigo: { type: "string", enum: [...CODIGOS_MEDIDA] },
          especie: ENUM_ESPECIE,
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
        "codigo",
        "tipoPeca",
        "urgencia",
        "fundamentos",
        "pedidos",
        "explicacao",
      ],
      properties: {
        titulo: { type: "string" },
        codigo: { type: "string", enum: [...CODIGOS_MEDIDA] },
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
