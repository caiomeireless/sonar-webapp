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

// Cada API executada dentro de uma consulta pré-processual.
// Usado pra mostrar no detalhe da consulta quais fontes foram cruzadas,
// quanto custou cada uma e se a resposta veio com dados ou vazia.
// Quando a Sem 2 entregar `executarConsultaPaga` real, esta entidade
// vira a tabela `consultas_pre_apis` (FK pra consultas_pre + apis_sonar).
export type ConsultaApi = {
  api: string; // id do catálogo sonar-apis.ts (ex.: "assertiva.enderecos")
  rotulo: string; // nome amigável (ex.: "Assertiva — Pessoas")
  custoBrl: number;
  status: "ok" | "falhou" | "sem_dados";
  dataConsulta: string; // ISO
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
  // APIs cruzadas pra montar esta consulta. Score alto = menos APIs (devedor
  // já se revelou cedo); score baixo = mais APIs (precisamos cavar fundo).
  // Opcional pra não quebrar fixtures antigas.
  buscasRealizadas?: ConsultaApi[];
};

// ============================================================
// DADOS DE DEMONSTRAÇÃO (ditado 25/08): os mocks antigos foram
// APAGADOS — ficam só 3 consultas FICTÍCIAS pra apresentar a aba
// sem expor dado sigiloso: João da Silva (baixa insolvência —
// solvente, recomendado), Empresa ABC (alta insolvência — não
// recomendado) e Jefferson da Silva (intermediário — avaliar).
// ============================================================

const CONSULTAS_MOCK: ConsultaPreProcessual[] = [
  // --------------------------------------------------------
  // 1. João da Silva — BAIXA insolvência (solvente, executar)
  // --------------------------------------------------------
  {
    id: 1,
    credorId: 900,
    credorNome: "Cliente Exemplo S/A",
    advogadoEmail: "demonstracao@battagliaepedrosa.com.br",
    dataConsulta: "2026-08-20T10:15:00-03:00",
    custoBrl: 45.75,
    devedor: {
      tipo: "PF",
      documento: "123.456.789-00",
      nome: "João da Silva",
      enderecoConsultado: "Rua das Palmeiras, 123 — Jardim Europa, Sorocaba/SP",
      telefone: "(15) 99876-5432",
    },
    valorCausaBrl: 380_000,
    score: "alta",
    recomendacao: "recomendado",
    rendaEstimadaMensalBrl: 38_000,
    patrimonioEstimadoBrl: 2_415_380,
    outrasExecucoes: [],
    restricoes: [],
    bensAparentes: [
      {
        tipo: "imovel",
        descricao: "Apartamento 142 m² — matrícula 45.678 do 2º CRI de Sorocaba",
        valorEstimadoBrl: 890_000,
        localizacao: "Jardim Vergueiro, Sorocaba/SP",
      },
      {
        tipo: "imovel",
        descricao: "Terreno 480 m² — Cond. Reserva Ipanema, matrícula 12.309",
        valorEstimadoBrl: 410_000,
        localizacao: "Sorocaba/SP",
      },
      {
        tipo: "veiculo",
        descricao: "Toyota Hilux SRX 4x4 2022 — placa DEM-0A22",
        valorEstimadoBrl: 248_900,
        localizacao: "Sorocaba/SP",
      },
      {
        tipo: "empresa",
        descricao: "50% das quotas da Silva Comércio de Materiais Ltda.",
        valorEstimadoBrl: 200_000,
        localizacao: "Sorocaba/SP",
      },
    ],
    observacoes:
      "DEMONSTRAÇÃO — dados fictícios. Perfil de BAIXA insolvência: nenhuma execução em curso, nenhuma restrição em Serasa/SPC, patrimônio aparente superior a R$ 2,4 milhões (dois imóveis com matrícula livre, frota própria e participação societária ativa). A causa de R$ 380 mil representa fração pequena do patrimônio localizável. Execução de baixo risco com alta probabilidade de satisfação rápida via penhora on-line ou dos imóveis. Recomenda-se ajuizamento imediato.",
    buscasRealizadas: [
      { api: "assertiva.enderecos", rotulo: "Assertiva — endereços/telefones", custoBrl: 0.3, status: "ok", dataConsulta: "2026-08-20T10:15:00-03:00" },
      { api: "assertiva.veiculos", rotulo: "Assertiva — veículos", custoBrl: 14.8, status: "ok", dataConsulta: "2026-08-20T10:15:09-03:00" },
      { api: "datajud.processos", rotulo: "DataJud — processos CNJ", custoBrl: 0, status: "ok", dataConsulta: "2026-08-20T10:15:16-03:00" },
      { api: "onr.matricula", rotulo: "ONR — matrícula urbana BR", custoBrl: 30.0, status: "ok", dataConsulta: "2026-08-20T10:15:48-03:00" },
    ],
  },

  // --------------------------------------------------------
  // 2. Empresa ABC — ALTA insolvência (não recomendar)
  // --------------------------------------------------------
  {
    id: 2,
    credorId: 900,
    credorNome: "Cliente Exemplo S/A",
    advogadoEmail: "demonstracao@battagliaepedrosa.com.br",
    dataConsulta: "2026-08-21T15:40:00-03:00",
    custoBrl: 50.35,
    devedor: {
      tipo: "PJ",
      documento: "00.111.222/0001-33",
      nome: "Empresa ABC Comércio Ltda.",
      enderecoConsultado: "Av. Central, 4.500 — sala 12, Sorocaba/SP",
      telefone: "(15) 3222-0000",
    },
    valorCausaBrl: 220_000,
    score: "baixa",
    recomendacao: "nao_recomendado",
    patrimonioEstimadoBrl: 0,
    outrasExecucoes: [
      { id: 1, numeroProcesso: "1001111-11.2023.8.26.0602", vara: "2ª Vara Cível", comarca: "Sorocaba/SP", valorBrl: 184_000, status: "em_andamento", dataDistribuicao: "2023-05-10" },
      { id: 2, numeroProcesso: "1002222-22.2024.8.26.0602", vara: "4ª Vara Cível", comarca: "Sorocaba/SP", valorBrl: 96_400, status: "em_andamento", dataDistribuicao: "2024-02-27" },
      { id: 3, numeroProcesso: "1003333-33.2024.8.26.0100", vara: "22ª Vara Cível Central", comarca: "São Paulo/SP", valorBrl: 310_700, status: "suspensa", dataDistribuicao: "2024-09-15" },
      { id: 4, numeroProcesso: "1004444-44.2025.8.26.0602", vara: "1ª Vara Cível", comarca: "Sorocaba/SP", valorBrl: 58_200, status: "em_andamento", dataDistribuicao: "2025-06-03" },
    ],
    restricoes: [
      { tipo: "protesto", orgao: "1º Tabelionato de Protesto de Sorocaba", valorBrl: 42_300, dataInclusao: "2024-04-18" },
      { tipo: "protesto", orgao: "2º Tabelionato de Protesto de Sorocaba", valorBrl: 27_800, dataInclusao: "2024-11-30" },
      { tipo: "negativacao", orgao: "Serasa", valorBrl: 88_500, dataInclusao: "2025-01-22" },
      { tipo: "negativacao", orgao: "Boa Vista SCPC", valorBrl: 34_100, dataInclusao: "2025-07-08" },
      { tipo: "cnpj_inapto", orgao: "Receita Federal", dataInclusao: "2026-03-02" },
    ],
    bensAparentes: [],
    observacoes:
      "DEMONSTRAÇÃO — dados fictícios. Perfil de ALTA insolvência: 4 execuções em curso somando mais de R$ 640 mil, protestos e negativações acumulados e CNPJ declarado INAPTO pela Receita em 2026. Sede comercial desocupada (sala alugada, contrato rescindido). Nenhum imóvel, veículo ou saldo bancário aparente; sócios com patrimônio pessoal já constrito em outras execuções. Relação custo/benefício claramente desfavorável — recomenda-se não executar e avaliar desconsideração da personalidade jurídica apenas se surgirem indícios de confusão patrimonial.",
    buscasRealizadas: [
      { api: "minhareceita.cnpj", rotulo: "minhareceita — CNPJ + QSA", custoBrl: 0, status: "ok", dataConsulta: "2026-08-21T15:40:00-03:00" },
      { api: "datajud.processos", rotulo: "DataJud — processos CNJ", custoBrl: 0, status: "ok", dataConsulta: "2026-08-21T15:40:11-03:00" },
      { api: "cenprot.protestos", rotulo: "Cenprot — protestos consolidados", custoBrl: 15.0, status: "ok", dataConsulta: "2026-08-21T15:40:29-03:00" },
      { api: "assertiva.veiculos", rotulo: "Assertiva — veículos", custoBrl: 14.8, status: "sem_dados", dataConsulta: "2026-08-21T15:40:44-03:00" },
      { api: "junta.certidao", rotulo: "Junta Comercial — certidão + atos PJ", custoBrl: 20.55, status: "ok", dataConsulta: "2026-08-21T15:41:20-03:00" },
    ],
  },

  // --------------------------------------------------------
  // 3. Jefferson da Silva — intermediário (avaliar)
  // --------------------------------------------------------
  {
    id: 3,
    credorId: 900,
    credorNome: "Cliente Exemplo S/A",
    advogadoEmail: "demonstracao@battagliaepedrosa.com.br",
    dataConsulta: "2026-08-22T09:05:00-03:00",
    custoBrl: 30.55,
    devedor: {
      tipo: "PF",
      documento: "987.654.321-00",
      nome: "Jefferson da Silva",
      enderecoConsultado: "Rua dos Cravos, 88 — Vila Helena, Sorocaba/SP",
      telefone: "(15) 99123-4567",
    },
    valorCausaBrl: 64_000,
    score: "media",
    recomendacao: "avaliar",
    rendaEstimadaMensalBrl: 9_400,
    patrimonioEstimadoBrl: 96_000,
    outrasExecucoes: [
      { id: 1, numeroProcesso: "1005555-55.2025.8.26.0602", vara: "3ª Vara Cível", comarca: "Sorocaba/SP", valorBrl: 21_300, status: "em_andamento", dataDistribuicao: "2025-04-09" },
    ],
    restricoes: [
      { tipo: "negativacao", orgao: "Serasa", valorBrl: 7_900, dataInclusao: "2025-12-12" },
    ],
    bensAparentes: [
      {
        tipo: "veiculo",
        descricao: "Fiat Toro Volcano 2021 — placa DEM-0C21 (sem gravame)",
        valorEstimadoBrl: 96_000,
        localizacao: "Sorocaba/SP",
      },
    ],
    observacoes:
      "DEMONSTRAÇÃO — dados fictícios. Perfil intermediário: renda estável de autônomo, uma execução recente e uma negativação em aberto. Único bem penhorável é um veículo sem alienação, suficiente para cobrir a causa de R$ 64 mil com folga apertada. Não há imóveis em nome próprio (residência em nome do cônjuge — investigar regime de bens). Recomenda-se tentativa prévia de acordo; frustrada, ajuizar com pedido direto de restrição via Renajud.",
    buscasRealizadas: [
      { api: "assertiva.enderecos", rotulo: "Assertiva — endereços/telefones", custoBrl: 0.3, status: "ok", dataConsulta: "2026-08-22T09:05:00-03:00" },
      { api: "assertiva.veiculos", rotulo: "Assertiva — veículos", custoBrl: 14.8, status: "ok", dataConsulta: "2026-08-22T09:05:07-03:00" },
      { api: "datajud.processos", rotulo: "DataJud — processos CNJ", custoBrl: 0, status: "ok", dataConsulta: "2026-08-22T09:05:15-03:00" },
      { api: "cenprot.protestos", rotulo: "Cenprot — protestos consolidados", custoBrl: 15.0, status: "ok", dataConsulta: "2026-08-22T09:05:33-03:00" },
    ],
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
