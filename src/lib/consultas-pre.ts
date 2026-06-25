// Mock de Consultas Pré-Processuais (demo Sonar).
// Estrutura paralela aos casos: aqui o cliente (credor) ainda não tem caso
// aberto contra o devedor — é uma análise prévia de solvência, encomendada
// ao escritório pra decidir se vale executar.
//
// No real isso virá de uma tabela `consultas_pre` no Supabase, alimentada
// por integrações (Assertiva, Boavista, DataJud, etc.). Por ora, array em
// memória — mesmo padrão do mock-fixtures usado por casos.ts.

export type ScoreSolvencia = "alta" | "media" | "baixa";
export type RecomendacaoExecucao = "recomendado" | "avaliar" | "nao_recomendado";

export type OutraExecucao = {
  id: number;
  numeroProcesso: string;
  vara: string;
  comarca: string;
  valorBrl: number;
  status: "em_andamento" | "suspensa" | "arquivada" | "satisfeita";
  dataDistribuicao: string;
};

export type Restricao = {
  tipo: "protesto" | "negativacao" | "cnpj_baixado" | "cnpj_inapto";
  orgao: string;
  valorBrl?: number;
  dataInclusao: string;
};

export type BemAparente = {
  tipo: "imovel" | "veiculo" | "empresa";
  descricao: string;
  valorEstimadoBrl?: number;
  localizacao?: string;
};

export type ConsultaPreProcessual = {
  id: number;
  credorId: number;
  credorNome: string;
  advogadoEmail: string;
  dataConsulta: string;
  custoBrl: number;
  devedor: {
    tipo: "PF" | "PJ";
    documento: string;
    nome: string;
    enderecoConsultado?: string;
    telefone?: string;
  };
  valorCausaBrl: number;
  // Resultado da análise:
  score: ScoreSolvencia;
  recomendacao: RecomendacaoExecucao;
  rendaEstimadaMensalBrl?: number;
  patrimonioEstimadoBrl: number;
  outrasExecucoes: OutraExecucao[];
  restricoes: Restricao[];
  bensAparentes: BemAparente[];
  observacoes: string;
};

// ============================================================
// DADOS MOCK
// ============================================================

const CONSULTAS_MOCK: ConsultaPreProcessual[] = [
  // --------------------------------------------------------
  // 1. Carlos Eduardo — devedor "queimado", não recomendar
  // --------------------------------------------------------
  {
    id: 1,
    credorId: 101,
    credorNome: "Comercial Vértice",
    advogadoEmail: "dra.juliana@battagliaepedrosa.com.br",
    dataConsulta: "2026-06-12T10:24:00-03:00",
    custoBrl: 32.4,
    devedor: {
      tipo: "PF",
      documento: "111.222.333-44",
      nome: "Carlos Eduardo Mendes Albuquerque",
      enderecoConsultado: "Rua das Acácias, 482 — Bairro Centro, Goiânia/GO",
      telefone: "(62) 99812-4477",
    },
    valorCausaBrl: 85_000,
    score: "baixa",
    recomendacao: "nao_recomendado",
    rendaEstimadaMensalBrl: 1_850,
    patrimonioEstimadoBrl: 0,
    outrasExecucoes: [
      {
        id: 1,
        numeroProcesso: "0812345-67.2024.8.09.0051",
        vara: "3ª Vara Cível",
        comarca: "Goiânia/GO",
        valorBrl: 42_300,
        status: "em_andamento",
        dataDistribuicao: "2024-03-18",
      },
      {
        id: 2,
        numeroProcesso: "0807712-44.2024.8.09.0051",
        vara: "5ª Vara Cível",
        comarca: "Goiânia/GO",
        valorBrl: 18_900,
        status: "em_andamento",
        dataDistribuicao: "2024-08-02",
      },
      {
        id: 3,
        numeroProcesso: "0801104-22.2025.8.09.0051",
        vara: "1ª Vara Cível",
        comarca: "Goiânia/GO",
        valorBrl: 67_500,
        status: "suspensa",
        dataDistribuicao: "2025-02-11",
      },
      {
        id: 4,
        numeroProcesso: "5004412-90.2025.8.09.0006",
        vara: "Juizado Especial Cível",
        comarca: "Aparecida de Goiânia/GO",
        valorBrl: 9_400,
        status: "em_andamento",
        dataDistribuicao: "2025-09-04",
      },
    ],
    restricoes: [
      {
        tipo: "negativacao",
        orgao: "Serasa",
        valorBrl: 12_400,
        dataInclusao: "2024-05-20",
      },
      {
        tipo: "negativacao",
        orgao: "SPC Brasil",
        valorBrl: 8_750,
        dataInclusao: "2024-09-11",
      },
      {
        tipo: "negativacao",
        orgao: "Boa Vista SCPC",
        valorBrl: 21_300,
        dataInclusao: "2025-01-08",
      },
      {
        tipo: "negativacao",
        orgao: "Serasa",
        valorBrl: 5_600,
        dataInclusao: "2025-04-19",
      },
      {
        tipo: "negativacao",
        orgao: "SPC Brasil",
        valorBrl: 14_200,
        dataInclusao: "2025-11-02",
      },
    ],
    bensAparentes: [],
    observacoes:
      "Devedor com perfil de inadimplência crônica: 4 execuções em curso (2 ativas, 1 suspensa, 1 em juizado especial) e 5 negativações ativas somando mais de R$ 62 mil. Não foram localizados imóveis, veículos ou participação societária em seu nome. Renda estimada compatível com 1 salário mínimo e meio. A execução, ainda que procedente, tende a esbarrar na ausência de patrimônio penhorável, com risco real de prescrição intercorrente. Recomenda-se priorizar tentativa de acordo extrajudicial com desconto agressivo ou descartar a cobrança.",
  },

  // --------------------------------------------------------
  // 2. Construtora Horizonte Norte — perfil ideal pra executar
  // --------------------------------------------------------
  {
    id: 2,
    credorId: 101,
    credorNome: "Comercial Vértice",
    advogadoEmail: "dr.ricardo@battagliaepedrosa.com.br",
    dataConsulta: "2026-06-15T14:08:00-03:00",
    custoBrl: 45.9,
    devedor: {
      tipo: "PJ",
      documento: "22.333.444/0001-55",
      nome: "Construtora Horizonte Norte LTDA",
      enderecoConsultado: "Av. Industrial, 1.840 — Distrito Industrial, Anápolis/GO",
      telefone: "(62) 3311-7700",
    },
    valorCausaBrl: 850_000,
    score: "alta",
    recomendacao: "recomendado",
    patrimonioEstimadoBrl: 6_400_000,
    outrasExecucoes: [
      {
        id: 1,
        numeroProcesso: "0812090-15.2022.8.09.0011",
        vara: "2ª Vara Cível",
        comarca: "Anápolis/GO",
        valorBrl: 124_000,
        status: "satisfeita",
        dataDistribuicao: "2022-07-09",
      },
    ],
    restricoes: [],
    bensAparentes: [
      {
        tipo: "imovel",
        descricao: "Galpão industrial 2.400 m² — matrícula 48.112",
        valorEstimadoBrl: 3_200_000,
        localizacao: "Distrito Industrial, Anápolis/GO",
      },
      {
        tipo: "imovel",
        descricao: "Terreno 1.800 m² — matrícula 12.904",
        valorEstimadoBrl: 1_450_000,
        localizacao: "Av. Brasil Norte, Anápolis/GO",
      },
      {
        tipo: "imovel",
        descricao: "Sala comercial — Edifício Cerrado Center, sala 1.207",
        valorEstimadoBrl: 680_000,
        localizacao: "Setor Bueno, Goiânia/GO",
      },
      {
        tipo: "veiculo",
        descricao: "Caminhão Mercedes-Benz Actros 2651 — placa RGP-4H82",
        valorEstimadoBrl: 720_000,
        localizacao: "Anápolis/GO",
      },
      {
        tipo: "veiculo",
        descricao: "Toyota Hilux SRX 4x4 — placa NQR-2J91",
        valorEstimadoBrl: 350_000,
        localizacao: "Anápolis/GO",
      },
    ],
    observacoes:
      "Construtora ativa há mais de 12 anos, sem restrições atuais em Serasa, SPC ou Boa Vista. A única execução pretérita foi integralmente satisfeita em 2023. Patrimônio imobilizado robusto (três imóveis com matrícula livre de gravames) e frota operacional de alto valor. Faturamento estimado superior a R$ 18 milhões/ano. Caso de execução de baixo risco, com elevada probabilidade de satisfação rápida via penhora online ou penhora dos imóveis. Recomenda-se ajuizamento imediato com pedido de arresto preventivo.",
  },

  // --------------------------------------------------------
  // 3. Maria Aparecida — perfil mediano, avaliar
  // --------------------------------------------------------
  {
    id: 3,
    credorId: 101,
    credorNome: "Comercial Vértice",
    advogadoEmail: "dra.juliana@battagliaepedrosa.com.br",
    dataConsulta: "2026-06-17T09:42:00-03:00",
    custoBrl: 28.7,
    devedor: {
      tipo: "PF",
      documento: "333.444.555-66",
      nome: "Maria Aparecida Santos",
      enderecoConsultado: "Rua C-115, Quadra 28, Lote 14 — Setor Sudoeste, Goiânia/GO",
      telefone: "(62) 98144-2210",
    },
    valorCausaBrl: 32_000,
    score: "media",
    recomendacao: "avaliar",
    rendaEstimadaMensalBrl: 6_800,
    patrimonioEstimadoBrl: 285_000,
    outrasExecucoes: [
      {
        id: 1,
        numeroProcesso: "0810022-71.2025.8.09.0051",
        vara: "4ª Vara Cível",
        comarca: "Goiânia/GO",
        valorBrl: 14_700,
        status: "em_andamento",
        dataDistribuicao: "2025-03-22",
      },
      {
        id: 2,
        numeroProcesso: "5002219-08.2025.8.09.0051",
        vara: "Juizado Especial Cível",
        comarca: "Goiânia/GO",
        valorBrl: 6_200,
        status: "em_andamento",
        dataDistribuicao: "2025-10-14",
      },
    ],
    restricoes: [
      {
        tipo: "negativacao",
        orgao: "Serasa",
        valorBrl: 9_800,
        dataInclusao: "2025-08-30",
      },
    ],
    bensAparentes: [
      {
        tipo: "imovel",
        descricao: "Apartamento 62 m² — matrícula 89.441 (financiado, saldo CEF ~ R$ 95k)",
        valorEstimadoBrl: 285_000,
        localizacao: "Setor Sudoeste, Goiânia/GO",
      },
    ],
    observacoes:
      "Servidora pública estadual com vínculo estável e renda compatível, mas com sinais recentes de aperto: duas execuções em andamento e negativação em aberto no Serasa. Possui um imóvel financiado pela Caixa, com saldo devedor estimado em R$ 95 mil — penhora possível, mas sujeita ao limite de impenhorabilidade do bem de família (a depender de outras propriedades). Recomenda-se ajuizamento condicionado a tentativa prévia de acordo, dado o porte da causa (R$ 32 mil) frente ao risco de disputa sobre impenhorabilidade.",
  },

  // --------------------------------------------------------
  // 4. João Carlos Ferreira — quadro crítico
  // --------------------------------------------------------
  {
    id: 4,
    credorId: 102,
    credorNome: "Construtora Oeste",
    advogadoEmail: "dr.marcelo@battagliaepedrosa.com.br",
    dataConsulta: "2026-06-18T16:55:00-03:00",
    custoBrl: 30.1,
    devedor: {
      tipo: "PF",
      documento: "555.666.777-88",
      nome: "João Carlos Ferreira",
      enderecoConsultado: "Rua 18, Quadra 9, Lote 22 — Setor Norte Ferroviário, Goiânia/GO",
      telefone: "(62) 99277-6611",
    },
    valorCausaBrl: 18_000,
    score: "baixa",
    recomendacao: "nao_recomendado",
    rendaEstimadaMensalBrl: 2_100,
    patrimonioEstimadoBrl: 0,
    outrasExecucoes: [
      {
        id: 1,
        numeroProcesso: "0805511-19.2023.8.09.0051",
        vara: "1ª Vara Cível",
        comarca: "Goiânia/GO",
        valorBrl: 22_400,
        status: "em_andamento",
        dataDistribuicao: "2023-04-11",
      },
      {
        id: 2,
        numeroProcesso: "0809088-72.2023.8.09.0051",
        vara: "6ª Vara Cível",
        comarca: "Goiânia/GO",
        valorBrl: 11_200,
        status: "suspensa",
        dataDistribuicao: "2023-09-30",
      },
      {
        id: 3,
        numeroProcesso: "0803221-44.2024.8.09.0051",
        vara: "2ª Vara Cível",
        comarca: "Goiânia/GO",
        valorBrl: 35_700,
        status: "em_andamento",
        dataDistribuicao: "2024-02-08",
      },
      {
        id: 4,
        numeroProcesso: "5006611-22.2024.8.09.0051",
        vara: "Juizado Especial Cível",
        comarca: "Goiânia/GO",
        valorBrl: 7_900,
        status: "arquivada",
        dataDistribuicao: "2024-05-19",
      },
      {
        id: 5,
        numeroProcesso: "0811008-90.2024.8.09.0051",
        vara: "4ª Vara Cível",
        comarca: "Goiânia/GO",
        valorBrl: 18_300,
        status: "em_andamento",
        dataDistribuicao: "2024-10-02",
      },
      {
        id: 6,
        numeroProcesso: "0801772-15.2025.8.09.0051",
        vara: "3ª Vara Cível",
        comarca: "Goiânia/GO",
        valorBrl: 9_650,
        status: "em_andamento",
        dataDistribuicao: "2025-03-14",
      },
      {
        id: 7,
        numeroProcesso: "5008812-77.2025.8.09.0051",
        vara: "Juizado Especial Cível",
        comarca: "Goiânia/GO",
        valorBrl: 4_800,
        status: "em_andamento",
        dataDistribuicao: "2025-12-01",
      },
    ],
    restricoes: [
      { tipo: "protesto", orgao: "1º Tabelionato de Protesto de Goiânia", valorBrl: 8_400, dataInclusao: "2023-06-12" },
      { tipo: "protesto", orgao: "2º Tabelionato de Protesto de Goiânia", valorBrl: 5_200, dataInclusao: "2023-11-04" },
      { tipo: "protesto", orgao: "1º Tabelionato de Protesto de Goiânia", valorBrl: 11_800, dataInclusao: "2024-02-25" },
      { tipo: "protesto", orgao: "3º Tabelionato de Protesto de Goiânia", valorBrl: 6_700, dataInclusao: "2024-07-18" },
      { tipo: "protesto", orgao: "2º Tabelionato de Protesto de Goiânia", valorBrl: 9_300, dataInclusao: "2024-12-09" },
      { tipo: "protesto", orgao: "1º Tabelionato de Protesto de Aparecida de Goiânia", valorBrl: 4_500, dataInclusao: "2025-04-22" },
      { tipo: "protesto", orgao: "1º Tabelionato de Protesto de Goiânia", valorBrl: 7_100, dataInclusao: "2025-08-15" },
      { tipo: "protesto", orgao: "2º Tabelionato de Protesto de Goiânia", valorBrl: 3_900, dataInclusao: "2026-01-30" },
    ],
    bensAparentes: [],
    observacoes:
      "Cenário extremo de insolvência: 7 execuções (5 ativas, 1 suspensa, 1 arquivada) e 8 protestos cartorários acumulados em três anos, totalizando passivo conhecido superior a R$ 170 mil. Nenhum imóvel, veículo ou participação societária localizado. Renda informal estimada em torno de 2 salários mínimos. A relação custo/benefício da execução é claramente desfavorável: o valor da causa (R$ 18 mil) é menor do que o custo médio processual somado ao risco de prescrição. Recomenda-se desconsiderar a execução judicial e direcionar o crédito para baixa contábil ou cessão a terceiros.",
  },

  // --------------------------------------------------------
  // 5. Indústria Bela Vista — devedor "premium"
  // --------------------------------------------------------
  {
    id: 5,
    credorId: 102,
    credorNome: "Construtora Oeste",
    advogadoEmail: "dr.marcelo@battagliaepedrosa.com.br",
    dataConsulta: "2026-06-20T11:17:00-03:00",
    custoBrl: 58.3,
    devedor: {
      tipo: "PJ",
      documento: "33.444.555/0001-66",
      nome: "Indústria Bela Vista LTDA",
      enderecoConsultado: "Rod. BR-153, km 12 — Distrito Agroindustrial, Anápolis/GO",
      telefone: "(62) 3322-4500",
    },
    valorCausaBrl: 1_200_000,
    score: "alta",
    recomendacao: "recomendado",
    patrimonioEstimadoBrl: 18_700_000,
    outrasExecucoes: [],
    restricoes: [],
    bensAparentes: [
      {
        tipo: "imovel",
        descricao: "Complexo industrial 14.000 m² — matrícula 21.554 (sede)",
        valorEstimadoBrl: 11_500_000,
        localizacao: "Distrito Agroindustrial, Anápolis/GO",
      },
      {
        tipo: "imovel",
        descricao: "Centro de distribuição 6.200 m² — matrícula 73.118",
        valorEstimadoBrl: 4_800_000,
        localizacao: "Senador Canedo/GO",
      },
      {
        tipo: "veiculo",
        descricao: "Frota: 8 caminhões Volvo FH 540 e 4 utilitários (relação completa anexa)",
        valorEstimadoBrl: 2_400_000,
        localizacao: "Anápolis/GO",
      },
      {
        tipo: "empresa",
        descricao: "Participação 100% na Bela Vista Logística LTDA (CNPJ 33.444.555/0002-47)",
        valorEstimadoBrl: undefined,
        localizacao: "Senador Canedo/GO",
      },
    ],
    observacoes:
      "Indústria alimentícia de grande porte, em plena operação, sem qualquer registro de execução, protesto ou negativação. Faturamento anual estimado em R$ 142 milhões (12 meses de SPED Fiscal). Patrimônio imobilizado consolidado, com matrículas livres e movimentação bancária compatível com o porte. Risco de inadimplência da execução tende a zero — o passivo de R$ 1,2 milhão representa fração desprezível do giro mensal. Recomenda-se ajuizamento imediato; é altamente provável que o pagamento ocorra ainda na fase de citação, sem necessidade de constrição de bens.",
  },

  // --------------------------------------------------------
  // 6. Roberto Souza Lima — medio, avaliar
  // --------------------------------------------------------
  {
    id: 6,
    credorId: 103,
    credorNome: "Pedro Almeida Comércio ME",
    advogadoEmail: "dra.juliana@battagliaepedrosa.com.br",
    dataConsulta: "2026-06-21T13:30:00-03:00",
    custoBrl: 25.4,
    devedor: {
      tipo: "PF",
      documento: "777.888.999-00",
      nome: "Roberto Souza Lima",
      enderecoConsultado: "Rua T-30, Quadra 88, Casa 14 — Setor Bueno, Goiânia/GO",
      telefone: "(62) 99488-7733",
    },
    valorCausaBrl: 12_000,
    score: "media",
    recomendacao: "avaliar",
    rendaEstimadaMensalBrl: 5_200,
    patrimonioEstimadoBrl: 78_000,
    outrasExecucoes: [
      {
        id: 1,
        numeroProcesso: "0807744-31.2025.8.09.0051",
        vara: "5ª Vara Cível",
        comarca: "Goiânia/GO",
        valorBrl: 8_900,
        status: "em_andamento",
        dataDistribuicao: "2025-06-04",
      },
    ],
    restricoes: [
      {
        tipo: "negativacao",
        orgao: "Serasa",
        valorBrl: 4_700,
        dataInclusao: "2025-09-12",
      },
      {
        tipo: "negativacao",
        orgao: "SPC Brasil",
        valorBrl: 3_200,
        dataInclusao: "2026-02-28",
      },
    ],
    bensAparentes: [
      {
        tipo: "veiculo",
        descricao: "Honda Civic EXL 2.0 ano 2021 — placa OQS-5K48",
        valorEstimadoBrl: 78_000,
        localizacao: "Goiânia/GO",
      },
    ],
    observacoes:
      "Autônomo do setor de representação comercial, com renda razoavelmente estável mas perfil de endividamento em ascensão (uma execução recente e duas negativações nos últimos 9 meses). Possui um veículo em nome próprio sem gravame de alienação, suficiente para cobrir o valor da causa em caso de penhora. Não há imóveis registrados. Recomenda-se tentativa prévia de acordo extrajudicial (em geral aceita por devedores deste perfil para evitar restrição do único bem útil); persistindo a recusa, ajuizamento com pedido direto de penhora do veículo via Renajud.",
  },
];

// ============================================================
// LEITURAS
// ============================================================

export async function listarConsultasPre(): Promise<ConsultaPreProcessual[]> {
  // Cópia rasa pra evitar mutação acidental por consumidores.
  return CONSULTAS_MOCK.map((c) => ({ ...c }));
}

export async function obterConsultaPre(
  id: number,
): Promise<ConsultaPreProcessual | null> {
  const found = CONSULTAS_MOCK.find((c) => c.id === id);
  return found ? { ...found } : null;
}

export async function listarConsultasDoCliente(
  credorId: number,
): Promise<ConsultaPreProcessual[]> {
  return CONSULTAS_MOCK.filter((c) => c.credorId === credorId).map((c) => ({
    ...c,
  }));
}
