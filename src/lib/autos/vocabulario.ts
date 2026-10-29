// Vocabulários fechados da Análise de Autos.
//
// Tudo aqui é enum que entra no JSON Schema, não só no texto do prompt.
// Lição do primeiro teste real: pedir "use o vocabulário fechado" na
// instrução não basta — o modelo devolveu "Bloqueio via SISBAJUD" em vez de
// "sisbajud". Vocabulário controlado tem que ser imposto pelo esquema.

// ============================================================
// SISTEMA DOS AUTOS — muda o formato da referência
// ============================================================

/**
 * e-SAJ cita "fls. X"; eproc cita "ev. X, doc. Y"; migrado soma os dois.
 *
 * "indefinido" existe porque a API REJEITA enum anulável: um
 * `{ type: ["string","null"], enum: [...] }` volta como 400 "Enum value
 * 'esaj' does not match declared type". Todo enum destes vocabulários é
 * não-anulável e carrega o próprio valor de ausência.
 */
export const SISTEMAS_AUTOS = [
  "esaj",
  "eproc",
  "migrado",
  "indefinido",
] as const;
export type SistemaAutos = (typeof SISTEMAS_AUTOS)[number];

// ============================================================
// GRAU DE CONFIANÇA
// ============================================================

/** C = confirmado nos autos; I = inferido (a dedução fica explícita);
 *  NL = não localizado, e vira pendência. */
export const GRAUS_CONFIANCA = ["C", "I", "NL"] as const;
export type GrauConfianca = (typeof GRAUS_CONFIANCA)[number];

// ============================================================
// EFEITO PRESCRICIONAL DO ATO — o motor do art. 921
// ============================================================
// Esta classificação é o que transforma uma lista de acontecimentos em
// cálculo de prescrição intercorrente. Sem ela a linha do tempo é enfeite.

export const EFEITOS_PRESCRICIONAIS = [
  /** Citação, intimação do devedor ou constrição EFETIVAS (art. 921, §4º-A).
   *  Reinicia o prazo inteiro, sem direito a nova suspensão. */
  "interrompe",
  /** Ciência da PRIMEIRA tentativa infrutífera de localizar devedor ou bens
   *  (art. 921, §4º). É o marco inicial. */
  "inicia_prazo",
  /** Suspensão anual do art. 921, §1º (uma única vez), recuperação
   *  judicial, óbito. */
  "suspende",
  /** Diligência infrutífera POSTERIOR à primeira: não interrompe nada
   *  (REsp 2.166.788/RJ). */
  "neutro",
  /** Intimação que gera ônus para alguma das partes. */
  "abre_prazo",
  /** Decisão não recorrida ou prazo vencido sem manifestação. */
  "preclui",
] as const;
export type EfeitoPrescricional = (typeof EFEITOS_PRESCRICIONAIS)[number];

export const EFEITO_LABEL: Record<EfeitoPrescricional, string> = {
  interrompe: "Interrompe a prescrição",
  inicia_prazo: "Inicia o prazo",
  suspende: "Suspende",
  neutro: "Neutro",
  abre_prazo: "Abre prazo",
  preclui: "Preclui",
};

// ============================================================
// SEMÁFORO DO RISCO PRESCRICIONAL
// ============================================================

/** verde: mais de 24 meses até a consumação; amarelo: 12 a 24; vermelho:
 *  menos de 12 — e aí a peça imediata prioriza constrição efetiva. */
export const SEMAFOROS = ["verde", "amarelo", "vermelho"] as const;
export type SemaforoPrescricao = (typeof SEMAFOROS)[number];

// ============================================================
// PERFIL DO DEVEDOR — calibra onde procurar
// ============================================================

export const PERFIS_DEVEDOR = [
  "pf_assalariada",
  "profissional_liberal",
  "empresario_pf",
  "pj_operacional",
  "pj_fachada",
  "devedor_blindado",
  "indefinido",
] as const;
export type PerfilDevedor = (typeof PERFIS_DEVEDOR)[number];

export const PERFIL_DEVEDOR_META: Record<
  PerfilDevedor,
  { label: string; sinais: string; prioridade: string }
> = {
  pf_assalariada: {
    label: "Pessoa física assalariada",
    sinais: "holerite, empregador citado, bloqueio em conta-salário",
    prioridade:
      "SISBAJUD na data do salário; ofício ao empregador; Tema 1230",
  },
  profissional_liberal: {
    label: "Profissional liberal",
    sinais: "honorários, PJ profissional, repasses de operadoras ou convênios",
    prioridade: "recebíveis (art. 855); Tema 1230; INFOJUD",
  },
  empresario_pf: {
    label: "Empresário pessoa física",
    sinais: "contrato social, pró-labore, quotas",
    prioridade:
      "quotas (art. 861); imóveis; SNIPER; atípicas se o padrão de vida for incompatível",
  },
  pj_operacional: {
    label: "Pessoa jurídica operacional",
    sinais: "notas fiscais, maquininhas, contratos públicos",
    prioridade:
      "SISBAJUD reiterado; recebíveis; faturamento (art. 866); protesto",
  },
  pj_fachada: {
    label: "Pessoa jurídica de fachada",
    sinais: "endereço inexistente, sócios interpostos",
    prioridade: "SNIPER; IDPJ com prova de abuso; fraude à execução",
  },
  devedor_blindado: {
    label: "Devedor blindado",
    sinais:
      "holding, transferências a parentes, criptoativos, viagens",
    prioridade: "CNIB; IDPJ inversa; fraude; CriptoJud; atípicas",
  },
  indefinido: {
    label: "Perfil indefinido",
    sinais: "os autos não permitem enquadrar",
    prioridade: "pesquisas típicas amplas antes de calibrar",
  },
};

// ============================================================
// CATÁLOGO DE MEDIDAS M1 a M22
// ============================================================
// Os códigos vêm do Master Prompt BP. Virar enum aqui é o que permite ao
// sistema ligar "o que falta" à peça correspondente sem adivinhação.

export const CODIGOS_MEDIDA = [
  "M1",   // tutela cautelar de arresto
  "M2",   // averbação premonitória (art. 828)
  "M3",   // hipoteca judiciária (art. 495)
  "M4",   // inicial da execução / requerimento de cumprimento
  "M5",   // arresto executivo, inclusive eletrônico (art. 830)
  "M6",   // bloqueio SISBAJUD
  "M6.1", // após bloqueio positivo
  "M6.2", // réplica à impenhorabilidade
  "M6.3", // após bloqueio negativo ou irrisório
  "M7",   // RENAJUD e penhora de veículo
  "M8",   // penhora de imóvel por termo e averbação
  "M9",   // créditos, recebíveis e penhora no rosto dos autos
  "M10",  // ofícios a terceiros (art. 772, III)
  "M11",  // pesquisas ampliadas
  "M12",  // intimação para indicar bens (art. 774, V)
  "M13",  // penhora de verba remuneratória (Tema 1230)
  "M14",  // quotas, faturamento, frutos e rendimentos
  "M15",  // desconsideração da personalidade jurídica
  "M16",  // fraude à execução
  "M17",  // medidas atípicas e CNIB
  "M18",  // criptoativos
  "M19",  // protesto e SERASAJUD
  "M20",  // avaliação, expropriação, levantamento e extinção
  "M21",  // resposta às defesas do executado
  "M22",  // suspensão, arquivamento e desarquivamento
] as const;
export type CodigoMedida = (typeof CODIGOS_MEDIDA)[number];

export const MEDIDA_META: Record<CodigoMedida, string> = {
  M1: "Tutela cautelar de arresto",
  M2: "Averbação premonitória (art. 828)",
  M3: "Hipoteca judiciária (art. 495)",
  M4: "Inicial da execução ou requerimento de cumprimento",
  M5: "Arresto executivo, inclusive eletrônico (art. 830)",
  M6: "Bloqueio no SISBAJUD",
  "M6.1": "Conversão e levantamento após bloqueio positivo",
  "M6.2": "Réplica à alegação de impenhorabilidade",
  "M6.3": "Escalada após bloqueio negativo ou irrisório",
  M7: "RENAJUD e penhora de veículo",
  M8: "Penhora de imóvel por termo e averbação",
  M9: "Créditos, recebíveis e penhora no rosto dos autos",
  M10: "Ofícios a terceiros (art. 772, III)",
  M11: "Pesquisas ampliadas (INFOJUD, SNIPER, CCS, ONR)",
  M12: "Intimação para indicar bens (art. 774, V)",
  M13: "Penhora de verba remuneratória (Tema 1230)",
  M14: "Quotas, faturamento, frutos e rendimentos",
  M15: "Desconsideração da personalidade jurídica",
  M16: "Fraude à execução",
  M17: "Medidas atípicas e CNIB",
  M18: "Criptoativos (CriptoJud)",
  M19: "Protesto e SERASAJUD",
  M20: "Avaliação, expropriação, levantamento e extinção",
  M21: "Resposta às defesas do executado",
  M22: "Suspensão, arquivamento e desarquivamento",
};

// ============================================================
// MATRIZ DAS 20 VULNERABILIDADES
// ============================================================
// Checklist de nulidade e de risco. Os itens 1, 2, 9, 14 e 15 pedem dupla
// leitura independente dos autos (Self-Consistency).

export const VULNERABILIDADES = [
  { id: 1, texto: "Cumprimento requerido após 1 ano do trânsito exige intimação por carta (art. 513, §4º)", dupla: true },
  { id: 2, texto: "Citado por edital sem advogado tem curador especial (art. 72, II)", dupla: true },
  { id: 3, texto: "Penhora de imóvel exige intimação do cônjuge (art. 842)", dupla: false },
  { id: 4, texto: "Credor hipotecário ou fiduciário, condôminos e titulares de direitos reais intimados antes da alienação (arts. 799, I e II, 804 e 889)", dupla: false },
  { id: 5, texto: "A avaliação é atual e idônea (arts. 870 a 873)", dupla: false },
  { id: 6, texto: "O imóvel não é bem de família, ou está em exceção legal (Lei 8.009/1990, art. 3º)", dupla: false },
  { id: 7, texto: "Bem alienado fiduciariamente: penhora só dos direitos do fiduciante (art. 835, XII)", dupla: false },
  { id: 8, texto: "Recuperação judicial ou falência do devedor (Lei 11.101/2005)", dupla: false },
  { id: 9, texto: "Óbito: suspensão, habilitação e responsabilidade do espólio (arts. 313, I, 687 e 796)", dupla: true },
  { id: 10, texto: "Defesa com efeito suspensivo vigente (arts. 919, §1º, e 525, §6º)", dupla: false },
  { id: 11, texto: "Penhoras anteriores sobre o mesmo bem (arts. 908 e 909)", dupla: false },
  { id: 12, texto: "Impenhorabilidade arguida no prazo de 5 dias (art. 854, §3º; Tema 1235)", dupla: false },
  { id: 13, texto: "Constrição proporcional ao débito (art. 874)", dupla: false },
  { id: 14, texto: "Prescrição intercorrente sob controle (art. 921; extinção pelo art. 924, V)", dupla: true },
  { id: 15, texto: "Título líquido, certo e exigível, e citação válida (arts. 783 e 803)", dupla: true },
  { id: 16, texto: "Procuração com poderes para receber e dar quitação (art. 105)", dupla: false },
  { id: 17, texto: "Multa do art. 523 precedida de intimação válida (arts. 513, §2º, e 523)", dupla: false },
  { id: 18, texto: "Parcelamento do art. 916 descumprido (§5º)", dupla: false },
  { id: 19, texto: "Pagamentos parciais imputados corretamente (CC, art. 354)", dupla: false },
  { id: 20, texto: "Medida atípica com contraditório prévio e prazo certo (Tema 1137)", dupla: false },
] as const;

/** Texto pronto para entrar no prompt de consolidação. */
export const LISTA_VULNERABILIDADES = VULNERABILIDADES.map(
  (v) => `${v.id}. ${v.texto}${v.dupla ? " [DUPLA LEITURA]" : ""}`,
).join("\n");

// ============================================================
// BASE JURÍDICA AUTORIZADA
// ============================================================
// Regra inviolável do Master Prompt BP: só se cita precedente que esteja
// AQUI, ou que esteja citado em decisão dos próprios autos (com a folha
// dessa decisão). É proibido citar de memória ou inventar número, relator,
// data, ementa ou tese.
//
// ATENÇÃO: lista a completar com o bloco BASE AUTORIZADA do Master Prompt.
// Enquanto estiver curta, o modelo fica restrito a estes itens e à lei.

export const BASE_AUTORIZADA: { ref: string; tese: string }[] = [
  {
    ref: "Tema 1137/STJ",
    tese: "Medidas executivas atípicas (CPC 139, IV) exigem ponderação, subsidiariedade com esgotamento das típicas, fundamentação específica com nexo entre a medida e o pagamento, e contraditório prévio com prazo certo.",
  },
  {
    ref: "Tema 1230/STJ",
    tese: "Verba remuneratória é penhorável para dívida não alimentar quando preservado o mínimo existencial; o ônus de demonstrar o comprometimento da subsistência é do executado.",
  },
  {
    ref: "Tema 1235/STJ",
    tese: "A impenhorabilidade deve ser arguida no prazo do art. 854, §3º, sob pena de preclusão.",
  },
  {
    ref: "STJ, 1ª Seção, Tema Repetitivo 1325 (REsp 2.147.428/RS, REsp 2.147.843/SC e REsp 2.193.695/RS), j. 07/05/2026",
    tese:
      'I. A reiteração automática de ordens de bloqueio via SisbaJud, teimosinha, é medida legítima, voltada à efetividade da execução e compatível com o ordenamento processual, cabendo ao executado demonstrar causas impeditivas do gravame ou a existência de meio executivo igualmente eficaz e menos gravoso. II. Após a triangularização da relação processual, o indeferimento da reiteração automática de ordens de bloqueio via SisbaJud exige fundamentação concreta, não se admitindo negativa baseada em argumentos genéricos ou abstratos. ' +
      "[ATENÇÃO: tese firmada em execução fiscal. Invoque-a como PERSUASIVA, por identidade de razões — mesma ferramenta e mesmo art. 854 do CPC —, nunca como vinculante na execução civil.]",
  },
  {
    ref: "Tema 1210/STJ",
    tese: "A desconsideração da personalidade jurídica em relação civil ou empresarial exige prova de desvio de finalidade ou de confusão patrimonial (CC, art. 50).",
  },
  {
    ref: "Súmula 375/STJ",
    tese: "O reconhecimento da fraude à execução depende do registro da penhora do bem alienado ou da prova de má-fé do terceiro adquirente.",
  },
  {
    ref: "Súmula 393/STJ",
    tese: "A exceção de pré-executividade é admissível quanto a matérias conhecíveis de ofício que não demandem dilação probatória.",
  },
  {
    ref: "Súmula 150/STF",
    tese: "Prescreve a execução no mesmo prazo de prescrição da ação.",
  },
  {
    ref: "Súmula 560/STJ",
    tese: "Parâmetro de exaurimento das diligências para fins de medidas excepcionais.",
  },
  {
    ref: "REsp 2.166.788/RJ",
    tese: "Diligências infrutíferas posteriores não interrompem a prescrição intercorrente; pedido genérico de pesquisas tampouco.",
  },
  {
    ref: "REsp 2.090.768/PR e IAC 1/STJ",
    tese: "Regime de transição para marcos anteriores a 27/08/2021 na contagem da prescrição intercorrente.",
  },
  {
    ref: "EREsp 1.121.719/SP",
    tese: "A previdência privada é penhorável, salvo prova de que a verba tem natureza alimentar.",
  },
  {
    ref: "REsp 1.963.178/SP; REsp 1.969.105/MG; REsp 2.141.068/PR",
    tese: "Admissibilidade de medidas atípicas e da inclusão na CNIB, observados os requisitos do Tema 1137.",
  },
];

/** Bloco pronto para o prompt. */
export const TEXTO_BASE_AUTORIZADA = BASE_AUTORIZADA.map(
  (b) => `- ${b.ref}: ${b.tese}`,
).join("\n");
