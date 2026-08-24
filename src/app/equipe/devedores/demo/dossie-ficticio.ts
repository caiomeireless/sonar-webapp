// Dossiê FICTÍCIO do João da Silva (DADOS 100% INVENTADOS).
// Alimenta o Gerador de Peça de demonstração
// (/equipe/devedores/demo/gerador-peca) e o preview da peça
// (/equipe/devedores/demo/peca/[template]) com o MESMO shape `Dossie`
// que o gerador real consome — assim a experiência é idêntica à das
// fichas reais sem tocar o banco nem expor dado sigiloso.
//
// Coerência: os números batem com a Ficha de Demonstração (demo/page.tsx):
// caso principal 1002345-67.2024.8.26.0602 (3ª Vara Cível de Sorocaba,
// credora Distribuidora Modelo Ltda., débito R$ 984.310,20) e os bens
// mais ricos da ficha (apartamento, terreno, Hilux, Civic, quotas, endereço).
import type { Bem, CasoResumo, Dossie } from "@/lib/casos";
import type { TipoBem } from "@/lib/mock-fixtures";

/** Id fictício — não existe no banco; nenhuma rota real aceita esse id. */
export const DEVEDOR_DEMO_ID = 0;

// ============================================================
// BENS SELECIONÁVEIS (entram nos checkboxes "Bens a incluir")
// ============================================================

const BENS_DEMO: Bem[] = [
  {
    id: 1,
    devedor_id: DEVEDOR_DEMO_ID,
    tipo: "imovel",
    // ARISP = Cat A: a peça cita "documento ora juntado (Doc. 01)".
    fonte: "ARISP",
    fonte_consultada_em: "2026-08-14T09:30:00-03:00",
    titulo: "Apartamento Jardim Vergueiro — 142 m²",
    detalhes: {
      tipo: "urbano",
      cidade: "Sorocaba",
      uf: "SP",
      area_m2: 142,
      matricula: "45.678 do 2º CRI de Sorocaba",
      logradouro: "Rua Comendador Camargo, 87, Jardim Vergueiro",
    },
    valor_estimado_brl: 890000,
    ativo: true,
  },
  {
    id: 2,
    devedor_id: DEVEDOR_DEMO_ID,
    tipo: "imovel",
    // Manual = Cat B: a peça pede ofício ao Cartório de Registro de Imóveis.
    fonte: "Manual",
    fonte_consultada_em: "2026-07-02T15:10:00-03:00",
    titulo: "Terreno Cond. Reserva Ipanema — 480 m²",
    detalhes: {
      tipo: "urbano",
      cidade: "Sorocaba",
      uf: "SP",
      area_m2: 480,
      matricula: "12.309 do 1º CRI de Sorocaba",
      logradouro: "Condomínio Reserva Ipanema, quadra F, lote 12",
    },
    valor_estimado_brl: 410000,
    ativo: true,
  },
  {
    id: 3,
    devedor_id: DEVEDOR_DEMO_ID,
    tipo: "veiculo",
    fonte: "Assertiva",
    fonte_consultada_em: "2026-08-10T11:00:00-03:00",
    titulo: "Toyota Hilux SRX 4x4 2022",
    detalhes: {
      marca: "Toyota",
      modelo: "Hilux SRX 4x4",
      ano_modelo: 2022,
      cor: "Prata",
      placa: "DEM-0A22",
      renavam: "00987654321",
      restricoes: [],
    },
    valor_estimado_brl: 248900,
    ativo: true,
  },
  {
    id: 4,
    devedor_id: DEVEDOR_DEMO_ID,
    tipo: "veiculo",
    fonte: "Assertiva",
    fonte_consultada_em: "2026-08-10T11:00:00-03:00",
    titulo: "Honda Civic Touring 2020",
    detalhes: {
      marca: "Honda",
      modelo: "Civic Touring",
      ano_modelo: 2020,
      cor: "Preto",
      placa: "DEM-0B20",
      renavam: "01234567890",
      restricoes: ["Alienação fiduciária baixada em 03/2025"],
    },
    valor_estimado_brl: 132400,
    ativo: true,
  },
  {
    id: 5,
    devedor_id: DEVEDOR_DEMO_ID,
    tipo: "empresa",
    fonte: "Assertiva",
    fonte_consultada_em: "2026-08-05T14:20:00-03:00",
    titulo: "Silva Comércio de Materiais Ltda. — 50% das quotas",
    detalhes: {
      razao_social: "Silva Comércio de Materiais Ltda.",
      cnpj: "12.345.678/0001-90",
      percent_participacao: 50,
      capital_social: 400000,
      qual: "Sócio-Administrador",
      situacao: "ATIVA",
    },
    valor_estimado_brl: 200000,
    ativo: true,
  },
  {
    id: 6,
    devedor_id: DEVEDOR_DEMO_ID,
    tipo: "processo_credito",
    fonte: "DataJud",
    fonte_consultada_em: "2026-08-23T08:00:00-03:00",
    titulo: "Crédito em ação de despejo — 2ª Vara Cível de Votorantim",
    detalhes: {
      numero_cnj: "1000111-22.2024.8.26.0672",
      tribunal: "TJSP",
      classe: "Ação de Despejo c/c Cobrança",
      polo: "ativo",
    },
    valor_estimado_brl: 86500,
    ativo: true,
  },
  {
    id: 7,
    devedor_id: DEVEDOR_DEMO_ID,
    tipo: "endereco",
    fonte: "Assertiva",
    fonte_consultada_em: "2026-05-22T10:00:00-03:00",
    titulo: "Rua das Palmeiras, 123 — Jardim Europa, Sorocaba/SP",
    detalhes: {
      logradouro: "Rua das Palmeiras, 123",
      bairro: "Jardim Europa",
      cidade: "Sorocaba",
      uf: "SP",
      confirmado: true,
      observacao: "Citação positiva em 22/05/2026 — AR anexado",
    },
    valor_estimado_brl: null,
    ativo: true,
  },
];

// ============================================================
// CASOS (o gerador usa o PRIMEIRO como caso principal da peça)
// ============================================================

const CASOS_DEMO: CasoResumo[] = [
  {
    id: 9001,
    numero_processo: "1002345-67.2024.8.26.0602",
    pasta_themis: "0042B - 137",
    valor_credito_brl: 984310.2,
    status: "ativo",
    observacoes: null,
    responsavel_email: null,
    credor: {
      id: 9101,
      nome: "Distribuidora Modelo Ltda.",
      documento: "98.765.432/0001-10",
      tipo: "PJ",
    },
    juizo: {
      vara: 3,
      classeVara: "Cível",
      comarca: "Sorocaba",
      uf: "SP",
      generoJuiz: "M",
      classeAcao: "CUMPRIMENTO DE SENTENÇA",
    },
  },
  {
    id: 9002,
    numero_processo: "0007890-12.2023.8.26.0100",
    pasta_themis: "0042B - 141",
    valor_credito_brl: 623480,
    status: "ativo",
    observacoes: null,
    responsavel_email: null,
    credor: {
      id: 9102,
      nome: "Banco Exemplo S/A",
      documento: "11.222.333/0001-44",
      tipo: "PJ",
    },
    juizo: {
      vara: 12,
      classeVara: "Cível",
      comarca: "São Paulo",
      uf: "SP",
      generoJuiz: "F",
      classeAcao: "EXECUÇÃO DE TÍTULO EXTRAJUDICIAL",
    },
  },
  {
    id: 9003,
    numero_processo: "1009876-54.2025.8.26.0602",
    pasta_themis: "0042B - 158",
    valor_credito_brl: 239730.24,
    status: "ativo",
    observacoes: null,
    responsavel_email: null,
    credor: {
      id: 9103,
      nome: "Condomínio Solar das Águas",
      documento: "22.333.444/0001-55",
      tipo: "PJ",
    },
    juizo: {
      vara: 1,
      classeVara: "Cível",
      comarca: "Sorocaba",
      uf: "SP",
      generoJuiz: "M",
      classeAcao: "EXECUÇÃO",
    },
  },
];

// ============================================================
// DOSSIÊ COMPLETO
// ============================================================

function agruparPorTipo(bens: Bem[]): Record<TipoBem, Bem[]> {
  const mapa: Record<TipoBem, Bem[]> = {
    veiculo: [],
    imovel: [],
    empresa: [],
    processo_credito: [],
    endereco: [],
    vinculo: [],
  };
  for (const bem of bens) mapa[bem.tipo].push(bem);
  return mapa;
}

export const DOSSIE_DEMO: Dossie = {
  devedor: {
    id: DEVEDOR_DEMO_ID,
    tipo: "PF",
    documento: "123.456.789-00",
    nome: "João da Silva",
    data_nascimento: "1978-07-14",
    nome_mae: "Maria Aparecida da Silva",
    rg: "12.345.678-9 SSP/SP",
    email: "joaodasilva.demo@exemplo.com.br",
    telefone: "(15) 99876-5432",
    redes_sociais: "@joaodasilva.demo",
    origem_campos: {
      rg: "assertiva",
      data_nascimento: "assertiva",
      nome_mae: "themis",
      email: "assertiva",
      telefone: "assertiva",
    },
    ultima_consulta_em: "2026-08-14T09:30:00-03:00",
    criado_em: "2024-03-12T10:00:00-03:00",
  },
  casos: CASOS_DEMO,
  bens: BENS_DEMO,
  total_bens: BENS_DEMO.length,
  valor_estimado_total_brl: BENS_DEMO.reduce(
    (soma, bem) => soma + (bem.valor_estimado_brl ?? 0),
    0,
  ),
  por_tipo: agruparPorTipo(BENS_DEMO),
};
