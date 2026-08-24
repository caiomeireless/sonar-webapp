// Dados 100% FICTÍCIOS do dashboard da ficha de demonstração (João da Silva).
// Nada aqui vem do banco: este objeto alimenta o dashboard analítico REAL
// (DashboardCasoGrid) na ficha de DEMO do devedor fictício, com números
// coerentes entre si — persona: João da Silva, Sorocaba/SP, 12 bens,
// patrimônio localizado R$ 2.415.380, score 87, causa de R$ 380.000,
// funil 6 tentadas → 4 positivas → 2 penhoras efetivadas.
//
// Datas fixas (2023-2026) de propósito — nunca Date.now(), pra demo ser
// estável e reproduzível em qualquer visita.

import type { DadosDashboardCaso } from "@/app/equipe/devedores/[id]/dashboard/_components/DashboardCasoGrid";

// Inventário fictício de referência (12 bens, soma R$ 2.415.380):
//   9001 Apartamento Ed. Jardins de Sorocaba (SP) ........ R$   680.000  imovel
//   9002 Casa em Votorantim/SP — Jd. Archila ............. R$   450.000  imovel
//   9003 JS Transportes e Logística Ltda (40% quotas) .... R$   385.000  empresa
//   9004 Terreno em Curitiba/PR — Bairro Uberaba ......... R$   185.000  imovel
//   9005 Toyota Hilux SRX 2022 ........................... R$   232.000  veiculo
//   9006 Honda Civic EXL 2020 ............................ R$   128.500  veiculo
//   9007 Fiat Toro Volcano 2021 .......................... R$    98.880  veiculo
//   9008 Sala comercial em Goiânia/GO — St. Bueno ........ R$   135.000  imovel
//   9009 Crédito em processo (autor em ação de cobrança) . R$   121.000  processo_credito
//   9010 Endereço residencial — Sorocaba/SP ............... R$        0  endereco
//   9011 Endereço comercial — Goiânia/GO .................. R$        0  endereco
//   9012 Vínculo: cônjuge Maria Aparecida da Silva ........ R$        0  vinculo

export const DADOS_DASH_DEMO: DadosDashboardCaso = {
  // ---------------- KPIs ----------------
  kpis: {
    patrimonioLocalizadoBrl: 2_415_380,
    qtdBens: 12,
    casosAtivos: 1,
    totalMedidasTomadas: 6,
    taxaSucesso: 67, // 4 de 6 medidas com resultado positivo
    custoAcumuladoBrl: 304.64,
    valorRecuperadoBrl: 96_500,
    scoreRecuperabilidade: 87,
  },

  // ---------------- Funil de Constrição ----------------
  funil: {
    tentadas: 6,
    positivas: 4,
    penhorasEfetivadas: 2,
  },

  // ---------------- Heatmap Medida × Resultado ----------------
  // Espelha as 6 medidas fictícias do caso (out/2025 a jun/2026).
  heatmap: [
    { tipo: "infojud", resultado: "negativo", count: 1 },
    { tipo: "penhora_efetivada", resultado: "positivo", count: 2 },
    { tipo: "renajud", resultado: "positivo", count: 1 },
    { tipo: "serasajud", resultado: "aguardando", count: 1 },
    { tipo: "sisbajud", resultado: "positivo", count: 1 },
  ],

  // ---------------- Linha do Tempo Financeira ----------------
  // Cobrança = R$ 380.000 diluídos nos 12 meses (R$ 31.666,67/mês).
  // Recuperação = penhora do bloqueio SISBAJUD (fev/26) + alienação
  // parcial de veículo (jun/26) — soma R$ 96.500.
  linhaTempoFinanceira: [
    { mes: "2025-09", cobranca: 31_666.67, recuperacao: 0 },
    { mes: "2025-10", cobranca: 31_666.67, recuperacao: 0 },
    { mes: "2025-11", cobranca: 31_666.67, recuperacao: 0 },
    { mes: "2025-12", cobranca: 31_666.67, recuperacao: 0 },
    { mes: "2026-01", cobranca: 31_666.67, recuperacao: 0 },
    { mes: "2026-02", cobranca: 31_666.67, recuperacao: 61_500 },
    { mes: "2026-03", cobranca: 31_666.67, recuperacao: 0 },
    { mes: "2026-04", cobranca: 31_666.67, recuperacao: 0 },
    { mes: "2026-05", cobranca: 31_666.67, recuperacao: 0 },
    { mes: "2026-06", cobranca: 31_666.67, recuperacao: 35_000 },
    { mes: "2026-07", cobranca: 31_666.67, recuperacao: 0 },
    { mes: "2026-08", cobranca: 31_666.67, recuperacao: 0 },
  ],

  // ---------------- Donut: Bens por Valor ----------------
  // Soma R$ 2.415.380 — maior valor primeiro (padrão do donut).
  breakdownBensPorValor: [
    { tipo: "imovel", valorBrl: 1_450_000, qtd: 4 },
    { tipo: "veiculo", valorBrl: 459_380, qtd: 3 },
    { tipo: "empresa", valorBrl: 385_000, qtd: 1 },
    { tipo: "processo_credito", valorBrl: 121_000, qtd: 1 },
    { tipo: "endereco", valorBrl: 0, qtd: 2 },
    { tipo: "vinculo", valorBrl: 0, qtd: 1 },
  ],

  // ---------------- Tempo Médio Petição → Penhora ----------------
  tempoMedioMedidaPenhora: {
    dias: 74,
    baseline: 120, // heurística de mercado
  },

  // ---------------- Custos por API ----------------
  // Soma exata do custoAcumuladoBrl dos KPIs (R$ 304,64).
  custosPorAPI: [
    { api: "ARISP Matrículas", custoBrl: 218.0 },
    { api: "Assertiva Veículos", custoBrl: 44.4 },
    { api: "Escavador", custoBrl: 39.8 },
    { api: "Assertiva Localize", custoBrl: 2.44 },
  ],

  // ---------------- Próxima Ação Sugerida ----------------
  proximaAcaoSugerida: {
    acao: "Solicitar matrícula atualizada no ARISP",
    motivo: "Terreno localizado em Curitiba/PR sem matrícula validada",
  },

  // ---------------- Risco de Prescrição Intercorrente ----------------
  // Cumprimento iniciado em 12/03/2024 → janela CPC 921 até 12/03/2029.
  riscoPrescricao: {
    diasRestantes: 932,
    dataDistribuicao: "2024-03-12",
    statusRisco: "baixo",
  },

  // ---------------- Bens com Restrição Suspeita ----------------
  bensComRestricao: [
    {
      bemId: 9002,
      tipo: "imovel",
      titulo: "Casa em Votorantim/SP — Jd. Archila",
      motivo: "Possível bem de família (Lei 8.009/90) — residência do devedor",
      valorBrl: 450_000,
    },
    {
      bemId: 9006,
      tipo: "veiculo",
      titulo: "Honda Civic EXL 2020",
      motivo: "Alienação fiduciária ativa em favor de instituição financeira",
      valorBrl: 128_500,
    },
  ],

  // ---------------- Concentração Patrimonial ----------------
  // Top bem = apartamento de Sorocaba: 680.000 / 2.415.380 = 28,2%.
  concentracaoPatrimonial: {
    topBemPct: 28.2,
    topBemTitulo: "Apartamento Ed. Jardins de Sorocaba (SP)",
    topBemTipo: "imovel",
    indiceHerfindahl: 0.165,
  },

  // ---------------- Distribuição Geográfica (Mapa do Brasil) ----------------
  // SP concentra a maior fatia (Sorocaba + Votorantim = R$ 1.996.500);
  // PR (Curitiba) e GO (Goiânia) completam. Ordenado por valor desc.
  distribuicaoGeografica: [
    {
      cidade: "Sorocaba",
      uf: "SP",
      qtdBens: 7,
      valorTotalBrl: 1_546_500,
      bensIds: [9001, 9003, 9005, 9006, 9009, 9010, 9012],
      porTipo: [
        { tipo: "imovel", qtd: 1, valorBrl: 680_000 },
        { tipo: "empresa", qtd: 1, valorBrl: 385_000 },
        { tipo: "veiculo", qtd: 2, valorBrl: 360_500 },
        { tipo: "processo_credito", qtd: 1, valorBrl: 121_000 },
        { tipo: "endereco", qtd: 1, valorBrl: 0 },
        { tipo: "vinculo", qtd: 1, valorBrl: 0 },
      ],
    },
    {
      cidade: "Votorantim",
      uf: "SP",
      qtdBens: 1,
      valorTotalBrl: 450_000,
      bensIds: [9002],
      porTipo: [{ tipo: "imovel", qtd: 1, valorBrl: 450_000 }],
    },
    {
      cidade: "Curitiba",
      uf: "PR",
      qtdBens: 2,
      valorTotalBrl: 283_880,
      bensIds: [9004, 9007],
      porTipo: [
        { tipo: "imovel", qtd: 1, valorBrl: 185_000 },
        { tipo: "veiculo", qtd: 1, valorBrl: 98_880 },
      ],
    },
    {
      cidade: "Goiânia",
      uf: "GO",
      qtdBens: 2,
      valorTotalBrl: 135_000,
      bensIds: [9008, 9011],
      porTipo: [
        { tipo: "imovel", qtd: 1, valorBrl: 135_000 },
        { tipo: "endereco", qtd: 1, valorBrl: 0 },
      ],
    },
  ],

  // ---------------- Vínculos Patrimoniais ----------------
  // Documentos MASCARADOS de propósito — tudo fictício.
  vinculosPatrimoniais: [
    {
      nome: "Maria Aparecida da Silva",
      documento: "412.***.***-20",
      relacao: "cônjuge (comunhão parcial de bens)",
      temPatrimonio: true,
    },
    {
      nome: "JS Transportes e Logística Ltda",
      documento: "12.345.678/0001-90",
      relacao: "sócio-administrador (40% das quotas)",
      temPatrimonio: true,
    },
    {
      nome: "Pedro Henrique da Silva",
      documento: "398.***.***-77",
      relacao: "filho — sócio minoritário na JS Transportes (10%)",
      temPatrimonio: false,
    },
  ],

  // ---------------- Cronologia do Caso ----------------
  // Trilha de CUMPRIMENTO DE SENTENÇA: título já formado; fases CPC
  // 523/525 + eventual agravo + satisfação.
  cronologiaCaso: [
    {
      evento: "Título formado (sentença)",
      data: "2023-09-28",
      completo: true,
      ordem: 1,
    },
    {
      evento: "Início do cumprimento",
      data: "2024-03-12",
      completo: true,
      ordem: 2,
    },
    {
      evento: "Intimação p/ pagar (art. 523)",
      data: "2024-04-02",
      completo: true,
      ordem: 3,
    },
    {
      evento: "Penhora / bloqueio",
      data: "2026-01-19",
      completo: true,
      ordem: 4,
    },
    {
      evento: "Impugnação (art. 525)",
      data: "2026-03-05",
      completo: true,
      ordem: 5,
    },
    {
      evento: "Fase recursal (agravo)",
      data: null,
      completo: false,
      ordem: 6,
    },
    {
      evento: "Satisfação do crédito",
      data: null,
      completo: false,
      ordem: 7,
    },
  ],

  // ---------------- Comparativo com o Escritório ----------------
  comparativoEscritorio: {
    qtdBens: { este: 12, media: 4.6 },
    valorPatrimonio: { este: 2_415_380, media: 812_400 },
    qtdMedidas: { este: 6, media: 3.2 },
  },

  // ---------------- Custo de Oportunidade ----------------
  // R$ 304,64 gastos pra destravar R$ 2.415.380 → razão ~0,0001 (bom).
  custoOportunidade: {
    custoAcumuladoBrl: 304.64,
    valorRecuperavelBrl: 2_415_380,
    razao: 0.0001,
    status: "bom",
  },

  // ---------------- Próximos Atos Processuais ----------------
  // Prazos FICTÍCIOS da demonstração (referência: agosto/2026).
  proximosAtosProcessuais: [
    {
      ato: "Manifestação sobre a impugnação (art. 525)",
      prazoFatal: "2026-09-04",
      diasRestantes: 12,
      urgencia: "alta",
    },
    {
      ato: "Indicação de bens à penhora complementar",
      prazoFatal: "2026-09-25",
      diasRestantes: 33,
      urgencia: "media",
    },
    {
      ato: "Leilão judicial — 1ª praça (Toyota Hilux)",
      prazoFatal: "2026-11-10",
      diasRestantes: 79,
      urgencia: "baixa",
    },
  ],

  // ---------------- Sazonalidade da Atividade (12 meses) ----------------
  // Espelha as 6 medidas: out/25 InfoJud (neg), nov/25 Renajud (pos),
  // jan/26 SISBAJUD (pos), fev/26 penhora (pos), mai/26 SerasaJud
  // (aguardando), jun/26 penhora (pos).
  sazonalidadeAtividade: [
    { mes: 9, ano: 2025, qtdMedidas: 0, qtdPositivas: 0 },
    { mes: 10, ano: 2025, qtdMedidas: 1, qtdPositivas: 0 },
    { mes: 11, ano: 2025, qtdMedidas: 1, qtdPositivas: 1 },
    { mes: 12, ano: 2025, qtdMedidas: 0, qtdPositivas: 0 },
    { mes: 1, ano: 2026, qtdMedidas: 1, qtdPositivas: 1 },
    { mes: 2, ano: 2026, qtdMedidas: 1, qtdPositivas: 1 },
    { mes: 3, ano: 2026, qtdMedidas: 0, qtdPositivas: 0 },
    { mes: 4, ano: 2026, qtdMedidas: 0, qtdPositivas: 0 },
    { mes: 5, ano: 2026, qtdMedidas: 1, qtdPositivas: 0 },
    { mes: 6, ano: 2026, qtdMedidas: 1, qtdPositivas: 1 },
    { mes: 7, ano: 2026, qtdMedidas: 0, qtdPositivas: 0 },
    { mes: 8, ano: 2026, qtdMedidas: 0, qtdPositivas: 0 },
  ],
};
