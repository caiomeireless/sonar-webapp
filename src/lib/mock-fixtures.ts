// Dados ficticios usados pelo demo do Sonar (apresentacao 2026-06-26).
// REGRA: este e o UNICO arquivo com mock. Pra trocar por dados reais,
// substitui o conteudo (ou a fonte de cada bem) e nada mais muda.
//
// O credor demo tem email_contato = `cliente.demo@battaglia.com.br`.
// Esse e tambem o email do usuario `papel='cliente'` que loga no portal.
// As Server Actions de cliente cruzam credores.email_contato com o email
// logado pra mostrar os casos dele.

export const DEMO_CLIENTE_EMAIL = "cliente.demo@battaglia.com.br";

export type FonteBusca =
  | "DataJud"
  | "Themis"
  | "BigDataCorp"
  | "Assertiva"
  | "minhareceita"
  | "SICAR"
  | "ARISP"
  | "Escavador"
  | "Manual";

export type TipoBem =
  | "veiculo"
  | "imovel"
  | "empresa"
  | "processo_credito"
  | "endereco"
  | "vinculo";

// ============================================================
// CREDOR
// ============================================================
export const CREDOR_DEMO = {
  id: 1,
  tipo: "PJ" as const,
  documento: "00.111.222/0001-33",
  nome: "Comercial Vértice LTDA",
  email_contato: DEMO_CLIENTE_EMAIL,
  telefone: "+55 11 3000-0000",
  observacoes: "Cliente desde 2021. Carteira: cobrança de duplicatas + execução.",
};

export const CREDOR_2 = {
  id: 2,
  tipo: "PJ" as const,
  documento: "11.222.333/0001-44",
  nome: "Construtora Oeste LTDA",
  email_contato: "juridico@construtoraoeste.com.br",
  telefone: "+55 11 3500-1234",
  observacoes: "Cliente desde 2020. Cobranca de fornecedores inadimplentes.",
};

export const CREDOR_3 = {
  id: 3,
  tipo: "PF" as const,
  documento: "456.789.123-00",
  nome: "Pedro Almeida Comercio ME",
  email_contato: "pedroalmeida@example.com",
  telefone: "+55 11 99999-1234",
  observacoes: "Cliente desde 2023. ME — cobranca de notas.",
};

export const CREDORES_DEMO = [CREDOR_DEMO, CREDOR_2, CREDOR_3];

// ============================================================
// DEVEDORES — 3 perfis variados pra a apresentacao contar
// 3 historias diferentes (rico, PJ com frota, caso dificil).
// ============================================================
export const DEVEDOR_1 = {
  id: 1,
  tipo: "PF" as const,
  documento: "111.222.333-44",
  nome: "Carlos Eduardo Mendes Albuquerque",
  data_nascimento: "1972-03-15",
  nome_mae: "Helena Mendes Albuquerque",
};

export const DEVEDOR_2 = {
  id: 2,
  tipo: "PJ" as const,
  documento: "22.333.444/0001-55",
  nome: "Construtora Horizonte Norte LTDA",
  data_nascimento: null,
  nome_mae: null,
};

export const DEVEDOR_3 = {
  id: 3,
  tipo: "PF" as const,
  documento: "333.444.555-66",
  nome: "Maria Aparecida Santos",
  data_nascimento: "1985-11-08",
  nome_mae: "Aparecida Conceição dos Santos",
};

export const DEVEDORES_DEMO = [DEVEDOR_1, DEVEDOR_2, DEVEDOR_3];

// ============================================================
// CASOS — um por devedor, todos do credor demo
// ============================================================
// Tipo do juizo mock — espelha o que viria do Themis API no Sem 2.
export type JuizoMock = {
  vara: number;
  classeVara: string;
  comarca: string;
  uf: string;
  generoJuiz: "M" | "F";
  classeAcao: string;
};

export const CASOS_DEMO = [
  {
    id: 1,
    credor_id: 1,
    devedor_id: 1,
    numero_processo: "0011223-44.2023.8.26.0100",
    valor_credito_brl: 180_000,
    status: "ativo" as const,
    responsavel_email: "caio@bpadvogados.com.br",
    observacoes: "Execucao por inadimplemento contratual. Devedor com bens conhecidos.",
    juizo: {
      vara: 4,
      classeVara: "Civel",
      comarca: "Sao Paulo",
      uf: "SP",
      generoJuiz: "M",
      classeAcao: "CUMPRIMENTO DE SENTENCA",
    } as JuizoMock,
  },
  {
    id: 2,
    credor_id: 1,
    devedor_id: 2,
    numero_processo: "0033445-66.2023.8.26.0100",
    valor_credito_brl: 850_000,
    status: "ativo" as const,
    responsavel_email: "caio@bpadvogados.com.br",
    observacoes: "PJ com frota e galpao em SP — penhora ja deferida.",
    juizo: {
      vara: 12,
      classeVara: "Civel",
      comarca: "Sao Paulo",
      uf: "SP",
      generoJuiz: "F",
      classeAcao: "CUMPRIMENTO DE SENTENCA",
    } as JuizoMock,
  },
  {
    id: 3,
    credor_id: 1,
    devedor_id: 3,
    numero_processo: "0055667-88.2024.8.26.0100",
    valor_credito_brl: 32_000,
    status: "ativo" as const,
    responsavel_email: "caio@bpadvogados.com.br",
    observacoes: "Caso dificil: devedora sem bens visiveis. Acompanhar evolucao patrimonial.",
    juizo: {
      vara: 3,
      classeVara: "Civel",
      comarca: "Sorocaba",
      uf: "SP",
      generoJuiz: "M",
      classeAcao: "CUMPRIMENTO DE SENTENCA",
    } as JuizoMock,
  },
  // Caso 4: Credor 2 (Construtora Oeste) tambem persegue Carlos Eduardo (devedor 1) — CROSS!
  {
    id: 4,
    credor_id: 2,
    devedor_id: 1, // Carlos Eduardo
    numero_processo: "0099887-12.2024.8.26.0100",
    valor_credito_brl: 240_000,
    status: "ativo" as const,
    responsavel_email: "caio@bpadvogados.com.br",
    observacoes: "Inadimplencia em fornecimento de material — penhora ja deferida.",
    juizo: {
      vara: 7,
      classeVara: "Civel",
      comarca: "Sao Paulo",
      uf: "SP",
      generoJuiz: "F",
      classeAcao: "CUMPRIMENTO DE SENTENCA",
    } as JuizoMock,
  },
  // Caso 5: Credor 3 (Pedro Almeida) tambem persegue Carlos Eduardo (devedor 1) — CROSS!
  {
    id: 5,
    credor_id: 3,
    devedor_id: 1, // Carlos Eduardo (3 credores no total contra ele)
    numero_processo: "0087654-23.2023.8.26.0100",
    valor_credito_brl: 85_000,
    status: "ativo" as const,
    responsavel_email: "caio@bpadvogados.com.br",
    observacoes: "Notas promissorias inadimplentes.",
    juizo: {
      vara: 9,
      classeVara: "Civel",
      comarca: "Sao Paulo",
      uf: "SP",
      generoJuiz: "M",
      classeAcao: "EXECUCAO DE TITULO EXTRAJUDICIAL",
    } as JuizoMock,
  },
];

// ============================================================
// BENS ENCONTRADOS — fixtures detalhadas
// detalhes (jsonb) varia por tipo, ver migration 003.
// ============================================================

// === DEVEDOR 1: Carlos Eduardo Mendes Albuquerque (PF rico) ===
const BENS_DEVEDOR_1 = [
  {
    devedor_id: 1,
    tipo: "veiculo" as const,
    fonte: "BigDataCorp" as FonteBusca,
    fonte_consultada_em: "2026-06-12T14:32:00Z",
    titulo: "Honda Civic EXL 2019",
    valor_estimado_brl: 10_000,
    detalhes: {
      placa: "ABC1D23",
      marca: "Honda",
      modelo: "Civic EXL",
      ano_modelo: 2019,
      cor: "Prata",
      renavam: "01234567890",
      restricoes: [],
    },
  },
  {
    devedor_id: 1,
    tipo: "imovel" as const,
    fonte: "SICAR" as FonteBusca,
    fonte_consultada_em: "2026-06-13T09:15:00Z",
    titulo: "Fazenda Boa Vista — 8 hectares",
    valor_estimado_brl: 15_000,
    detalhes: {
      tipo: "rural",
      cidade: "Itaberaí",
      uf: "GO",
      area_hectares: 8,
      matricula: "12.345 — CRI Itaberaí",
      car: "GO-5210107-A1B2C3D4",
      observacao: "Lavoura: soja. Sem averbacao de penhora.",
    },
  },
  {
    devedor_id: 1,
    tipo: "empresa" as const,
    fonte: "minhareceita" as FonteBusca,
    fonte_consultada_em: "2026-06-12T14:33:00Z",
    titulo: "Albuquerque Consultoria LTDA — sócio 30%",
    valor_estimado_brl: 6_500,
    detalhes: {
      cnpj: "33.444.555/0001-66",
      razao_social: "Albuquerque Consultoria LTDA",
      percent_participacao: 30,
      capital_social: 100_000,
      situacao: "ATIVA",
      qual: "Sócio-Administrador",
    },
  },
  {
    devedor_id: 1,
    tipo: "processo_credito" as const,
    fonte: "DataJud" as FonteBusca,
    fonte_consultada_em: "2026-06-12T14:35:00Z",
    titulo: "Exequente em ação de cobrança — R$ 45.000",
    valor_estimado_brl: 5_500,
    detalhes: {
      numero_cnj: "0123456-12.2024.8.26.0100",
      tribunal: "TJSP",
      classe: "Cumprimento de sentença",
      polo: "ativo",
      observacao: "Credito ja transitado em julgado — penhora no rosto dos autos.",
    },
  },
  {
    devedor_id: 1,
    tipo: "endereco" as const,
    fonte: "Assertiva" as FonteBusca,
    fonte_consultada_em: "2026-06-12T14:32:30Z",
    titulo: "Av. Paulista, 2000 — apto 1801",
    detalhes: {
      logradouro: "Av. Paulista, 2000",
      complemento: "apto 1801",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      uf: "SP",
      cep: "01310-200",
      data_confirmacao: "2026-05-22",
      tipo: "Residencial",
    },
  },
  {
    devedor_id: 1,
    tipo: "endereco" as const,
    fonte: "BigDataCorp" as FonteBusca,
    fonte_consultada_em: "2026-06-12T14:32:45Z",
    titulo: "Av. Goiás, 3000 — Itaberaí/GO",
    detalhes: {
      logradouro: "Av. Goiás, 3000",
      bairro: "Centro",
      cidade: "Itaberaí",
      uf: "GO",
      cep: "76630-000",
      data_confirmacao: "2025-11-10",
      tipo: "Comercial / Fazenda",
    },
  },
  {
    devedor_id: 1,
    tipo: "vinculo" as const,
    fonte: "BigDataCorp" as FonteBusca,
    fonte_consultada_em: "2026-06-12T14:34:00Z",
    titulo: "Marina Souza Albuquerque (cônjuge)",
    detalhes: {
      tipo_vinculo: "conjuge",
      nome: "Marina Souza Albuquerque",
      documento: "555.666.777-88",
      observacao: "Casados sob comunhão parcial de bens desde 2008.",
    },
  },
];

// === DEVEDOR 2: Construtora Horizonte Norte LTDA (PJ com frota) ===
const BENS_DEVEDOR_2 = [
  {
    devedor_id: 2,
    tipo: "veiculo" as const,
    fonte: "BigDataCorp" as FonteBusca,
    fonte_consultada_em: "2026-06-13T11:02:00Z",
    titulo: "VW Saveiro Robust 2021",
    valor_estimado_brl: 9_500,
    detalhes: {
      placa: "DEF2E34",
      marca: "Volkswagen",
      modelo: "Saveiro Robust CS 1.6",
      ano_modelo: 2021,
      cor: "Branco",
      restricoes: ["Alienação fiduciária — Banco Bradesco"],
    },
  },
  {
    devedor_id: 2,
    tipo: "veiculo" as const,
    fonte: "BigDataCorp" as FonteBusca,
    fonte_consultada_em: "2026-06-13T11:02:00Z",
    titulo: "Fiat Strada Freedom 2020",
    valor_estimado_brl: 8_500,
    detalhes: {
      placa: "GHI3F45",
      marca: "Fiat",
      modelo: "Strada Freedom 1.4",
      ano_modelo: 2020,
      cor: "Vermelho",
      restricoes: [],
    },
  },
  {
    devedor_id: 2,
    tipo: "veiculo" as const,
    fonte: "BigDataCorp" as FonteBusca,
    fonte_consultada_em: "2026-06-13T11:02:00Z",
    titulo: "Ford Transit Furgão 2022",
    valor_estimado_brl: 13_000,
    detalhes: {
      placa: "JKL4G56",
      marca: "Ford",
      modelo: "Transit 350L",
      ano_modelo: 2022,
      cor: "Branco",
      restricoes: [],
    },
  },
  {
    devedor_id: 2,
    tipo: "veiculo" as const,
    fonte: "BigDataCorp" as FonteBusca,
    fonte_consultada_em: "2026-06-13T11:02:00Z",
    titulo: "Mercedes-Benz Sprinter 2023",
    valor_estimado_brl: 20_000,
    detalhes: {
      placa: "MNO5H67",
      marca: "Mercedes-Benz",
      modelo: "Sprinter 416 CDI",
      ano_modelo: 2023,
      cor: "Branco",
      restricoes: [],
    },
  },
  {
    devedor_id: 2,
    tipo: "imovel" as const,
    fonte: "ARISP" as FonteBusca,
    fonte_consultada_em: "2026-06-13T10:30:00Z",
    titulo: "Sede + galpão industrial — São Paulo/SP",
    valor_estimado_brl: 18_000,
    detalhes: {
      tipo: "urbano",
      cidade: "São Paulo",
      uf: "SP",
      area_m2: 4_200,
      matricula: "98.765 — 12ª CRI SP",
      logradouro: "Rua Industrial, 555 — Lapa",
      observacao: "Pé-direito alto. Sem alienação fiduciária registrada.",
    },
  },
  {
    devedor_id: 2,
    tipo: "imovel" as const,
    fonte: "ARISP" as FonteBusca,
    fonte_consultada_em: "2026-06-13T10:30:00Z",
    titulo: "Filial — Belo Horizonte/MG",
    valor_estimado_brl: 6_000,
    detalhes: {
      tipo: "urbano",
      cidade: "Belo Horizonte",
      uf: "MG",
      area_m2: 380,
      matricula: "45.678 — CRI 5º Subdistrito BH",
      logradouro: "Av. Norte, 1200 — Pampulha",
    },
  },
  {
    devedor_id: 2,
    tipo: "processo_credito" as const,
    fonte: "DataJud" as FonteBusca,
    fonte_consultada_em: "2026-06-13T11:05:00Z",
    titulo: "Exequente em execução de título extrajudicial — R$ 320.000",
    valor_estimado_brl: 5_000,
    detalhes: {
      numero_cnj: "0987654-21.2023.8.26.0100",
      tribunal: "TJSP",
      classe: "Execução de título extrajudicial",
      polo: "ativo",
      observacao: "Devedor (do nosso devedor) com penhora ja realizada — credito liquido.",
    },
  },
  {
    devedor_id: 2,
    tipo: "processo_credito" as const,
    fonte: "DataJud" as FonteBusca,
    fonte_consultada_em: "2026-06-13T11:05:00Z",
    titulo: "Exequente em ação monitória — R$ 180.000",
    valor_estimado_brl: 3_500,
    detalhes: {
      numero_cnj: "0876543-32.2024.8.26.0200",
      tribunal: "TJSP",
      classe: "Ação monitória",
      polo: "ativo",
    },
  },
  {
    devedor_id: 2,
    tipo: "endereco" as const,
    fonte: "minhareceita" as FonteBusca,
    fonte_consultada_em: "2026-06-13T10:28:00Z",
    titulo: "Av. Norte, 1200 — Belo Horizonte/MG (filial)",
    detalhes: {
      logradouro: "Av. Norte, 1200",
      bairro: "Pampulha",
      cidade: "Belo Horizonte",
      uf: "MG",
      cep: "31270-000",
      data_confirmacao: "2026-04-15",
      tipo: "Comercial — Filial registrada na Receita",
    },
  },
];

// === DEVEDOR 3: Maria Aparecida Santos (caso dificil — quase sem bens) ===
const BENS_DEVEDOR_3 = [
  {
    devedor_id: 3,
    tipo: "endereco" as const,
    fonte: "Assertiva" as FonteBusca,
    fonte_consultada_em: "2026-06-14T08:45:00Z",
    titulo: "Rua Aurélio Vasconcelos, 123 — apto 45 (locação)",
    detalhes: {
      logradouro: "Rua Aurélio Vasconcelos, 123",
      complemento: "apto 45",
      bairro: "Centro",
      cidade: "Osasco",
      uf: "SP",
      cep: "06010-100",
      data_confirmacao: "2026-03-08",
      tipo: "Residencial — locação",
    },
  },
  {
    devedor_id: 3,
    tipo: "vinculo" as const,
    fonte: "BigDataCorp" as FonteBusca,
    fonte_consultada_em: "2026-06-14T08:46:00Z",
    titulo: "Pedro Santos (filho menor, 8 anos)",
    detalhes: {
      tipo_vinculo: "filho",
      nome: "Pedro Santos",
      data_nascimento: "2017-09-21",
      observacao: "Menor de idade — bens em nome do menor seriam de relacao a investigar.",
    },
  },
];

export const BENS_DEMO = [
  ...BENS_DEVEDOR_1,
  ...BENS_DEVEDOR_2,
  ...BENS_DEVEDOR_3,
];

// ============================================================
// MEDIDAS TOMADAS — historico processual por caso
// Renderizado como timeline horizontal no dossie do devedor.
// 10 medidas espalhadas pelos 5 casos pra contar uma historia rica
// na apresentacao.
// ============================================================
export const MEDIDAS_DEMO = [
  // Caso 1 (Vertice x Carlos): historico longo
  { id: 1, caso_id: 1, data: '2025-08-15', tipo: 'sniper',          resultado: 'negativo', titulo: 'BigDataCorp ficha cadastral inicial', detalhes: 'Ficha consultada — perfil sem ativos visiveis.', advogado_email: 'caio@bpadvogados.com.br' },
  { id: 2, caso_id: 1, data: '2025-11-22', tipo: 'outro',           resultado: 'parcial',  titulo: 'eDossiê — carga tributaria', detalhes: 'Relatorio fiscal completo obtido via eDossie.', advogado_email: 'caio@bpadvogados.com.br' },
  { id: 3, caso_id: 1, data: '2026-02-10', tipo: 'sniper',          resultado: 'positivo', titulo: 'BigDataCorp localizacao veiculos', detalhes: 'Honda Civic 2019 localizado no nome do devedor.', advogado_email: 'caio@bpadvogados.com.br' },
  { id: 4, caso_id: 1, data: '2026-04-03', tipo: 'arisp',     resultado: 'aguardando', titulo: 'ARISP — pedido matriculas SP', detalhes: 'Aguardando retorno do cartorio.', advogado_email: 'caio@bpadvogados.com.br' },
  { id: 5, caso_id: 1, data: '2026-05-20', tipo: 'peticao_penhora', resultado: 'aguardando', titulo: 'Peticao de penhora de cotas Albuquerque Consultoria', detalhes: 'Aguardando decisao do juizo.', advogado_email: 'caio@bpadvogados.com.br' },
  // Caso 2 (Vertice x Construtora): empresa
  { id: 6, caso_id: 2, data: '2025-12-08', tipo: 'sniper',          resultado: 'parcial', titulo: 'BigDataCorp ficha CNPJ Horizonte', detalhes: 'QSA + faturamento estimado obtidos.', advogado_email: 'caio@bpadvogados.com.br' },
  { id: 7, caso_id: 2, data: '2026-03-15', tipo: 'peticao_penhora', resultado: 'positivo', titulo: 'Penhora galpao industrial SP', detalhes: 'Termo de penhora expedido. Averbado na matricula 98.765.', advogado_email: 'caio@bpadvogados.com.br' },
  // Caso 3 (Vertice x Maria): caso dificil
  { id: 8, caso_id: 3, data: '2025-10-01', tipo: 'sniper',          resultado: 'negativo', titulo: 'BigDataCorp ficha inicial Maria', detalhes: 'Sem ativos visiveis no perfil consultado.', advogado_email: 'caio@bpadvogados.com.br' },
  { id: 9, caso_id: 3, data: '2026-01-15', tipo: 'sniper',   resultado: 'parcial',  titulo: 'SNIPER — vinculos familiares', detalhes: 'Familiares identificados — investigar transferencias.', advogado_email: 'caio@bpadvogados.com.br' },
  // Caso 4 (Construtora Oeste x Carlos): cross-detection
  { id: 10, caso_id: 4, data: '2025-09-12', tipo: 'oficio_cartorio', resultado: 'negativo', titulo: 'Cenprot Carlos (Oeste)', detalhes: 'Sem protestos ativos.', advogado_email: 'caio@bpadvogados.com.br' },
  // ============================================================
  // ATIVIDADE RECENTE — ultimos 7 dias, distribuida entre 4 advogados
  // pra alimentar o card "Atividade da Equipe — 7 dias" do Painel.
  // Datas geradas a partir de "hoje" (ISO atual). Mantemos "data" e
  // "criado_em" iguais; o agregador usa o que tiver mais recente.
  // ============================================================
  { id: 11, caso_id: 1, data: hojeMenos(0), criado_em: hojeMenos(0), tipo: 'oficio_cartorio', resultado: 'parcial',    titulo: 'Cenprot reforco Carlos',     detalhes: '2 protestos cartorarios novos identificados.',    advogado_email: 'paulo@bpadvogados.com.br' },
  { id: 12, caso_id: 1, data: hojeMenos(1), criado_em: hojeMenos(1), tipo: 'outro',           resultado: 'positivo',   titulo: 'BigDataCorp veiculos — Toyota Hilux', detalhes: 'Veiculo localizado no nome do devedor.',  advogado_email: 'paulo@bpadvogados.com.br' },
  { id: 13, caso_id: 2, data: hojeMenos(1), criado_em: hojeMenos(1), tipo: 'arisp',           resultado: 'positivo',   titulo: 'ARISP — matricula SP',      detalhes: 'Imovel em Pinheiros localizado.',                  advogado_email: 'remo@bpadvogados.com.br' },
  { id: 14, caso_id: 2, data: hojeMenos(2), criado_em: hojeMenos(2), tipo: 'peticao_penhora', resultado: 'aguardando', titulo: 'Penhora imovel Pinheiros',  detalhes: 'Aguardando decisao.',                              advogado_email: 'remo@bpadvogados.com.br' },
  { id: 15, caso_id: 3, data: hojeMenos(2), criado_em: hojeMenos(2), tipo: 'outro',           resultado: 'parcial',    titulo: 'eDossiê tributario Maria',  detalhes: 'Carga tributaria completa via eDossie.',           advogado_email: 'igor@bpadvogados.com.br' },
  { id: 16, caso_id: 3, data: hojeMenos(3), criado_em: hojeMenos(3), tipo: 'sniper',          resultado: 'parcial',    titulo: 'SNIPER vinculos Maria',     detalhes: '2 familiares identificados.',                      advogado_email: 'hugo@bpadvogados.com.br' },
  { id: 17, caso_id: 1, data: hojeMenos(3), criado_em: hojeMenos(3), tipo: 'arisp',           resultado: 'aguardando', titulo: 'ARISP — pedido Cardoso',    detalhes: 'Solicitacao protocolada.',                         advogado_email: 'caio@bpadvogados.com.br' },
  { id: 18, caso_id: 4, data: hojeMenos(4), criado_em: hojeMenos(4), tipo: 'oficio_cartorio', resultado: 'negativo',   titulo: 'Cenprot Construtora',       detalhes: 'Sem protestos ativos no CNPJ.',                    advogado_email: 'paulo@bpadvogados.com.br' },
  { id: 19, caso_id: 2, data: hojeMenos(4), criado_em: hojeMenos(4), tipo: 'outro',           resultado: 'positivo',   titulo: 'Consulta BigDataCorp',      detalhes: 'Ficha cadastral completa obtida.',                 advogado_email: 'remo@bpadvogados.com.br' },
  { id: 20, caso_id: 1, data: hojeMenos(5), criado_em: hojeMenos(5), tipo: 'peticao_penhora', resultado: 'positivo',   titulo: 'Penhora cotas Albuquerque', detalhes: 'Deferida pelo juizo, termo expedido.',             advogado_email: 'caio@bpadvogados.com.br' },
  { id: 21, caso_id: 3, data: hojeMenos(5), criado_em: hojeMenos(5), tipo: 'outro',           resultado: 'negativo',   titulo: 'BigDataCorp veiculos Maria',detalhes: 'Sem veiculos no nome dela.',                       advogado_email: 'fabiane@bpadvogados.com.br' },
  { id: 22, caso_id: 4, data: hojeMenos(6), criado_em: hojeMenos(6), tipo: 'arisp',           resultado: 'parcial',    titulo: 'ARISP Construtora',         detalhes: '1 imovel encontrado.',                             advogado_email: 'remo@bpadvogados.com.br' },
  { id: 23, caso_id: 2, data: hojeMenos(6), criado_em: hojeMenos(6), tipo: 'sniper',          resultado: 'aguardando', titulo: 'SNIPER Horizonte',          detalhes: 'Buscando vinculos com a Albuquerque Consultoria.', advogado_email: 'paulo@bpadvogados.com.br' },
  { id: 24, caso_id: 3, data: hojeMenos(1), criado_em: hojeMenos(1), tipo: 'serasajud',       resultado: 'parcial',    titulo: 'SERASAJUD Maria',           detalhes: '2 protestos cartorarios localizados.',             advogado_email: 'katia@bpadvogados.com.br' },
];

// Helper pra datas relativas (ISO yyyy-mm-dd com base em hoje).
function hojeMenos(dias: number): string {
  const d = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

// ============================================================
// PERFIL DO CLIENTE DEMO
// ============================================================
export const PERFIL_CLIENTE_DEMO = {
  email: DEMO_CLIENTE_EMAIL,
  nome: "Cliente Demonstração",
  papel: "cliente" as const,
  acessos: [] as string[], // cliente nao precisa de chaves de acesso de escrita
};

// ============================================================
// PERFIS DE EQUIPE DEMO — Paulo, Remo + Igor/Hugo/Fabiane/Katia
// sao "outros advogados" que aparecem nas medidas mock pra
// carteira do escritorio ficar distribuida (nao tudo no Caio).
// O seed faz UPSERT por email; ja existir nao sobrescreve.
// Magic link funciona normal — perfil so precisa existir como FK.
// ============================================================
export const PERFIS_EQUIPE_DEMO = [
  {
    email: "paulo@bpadvogados.com.br",
    nome: "Paulo André",
    papel: "socio" as const,
    acessos: [] as string[],
  },
  {
    email: "remo@bpadvogados.com.br",
    nome: "Remo Battaglia",
    papel: "socio" as const,
    acessos: [] as string[],
  },
  {
    email: "igor@bpadvogados.com.br",
    nome: "Igor",
    papel: "funcionario" as const,
    acessos: [] as string[],
  },
  {
    email: "hugo@bpadvogados.com.br",
    nome: "Hugo",
    papel: "funcionario" as const,
    acessos: [] as string[],
  },
  {
    email: "fabiane@bpadvogados.com.br",
    nome: "Fabiane",
    papel: "funcionario" as const,
    acessos: [] as string[],
  },
  {
    email: "katia@bpadvogados.com.br",
    nome: "Katia",
    papel: "funcionario" as const,
    acessos: [] as string[],
  },
];

// ============================================================
// PREFERENCIAS DE CLIENTE — limite mensal de gasto em pesquisas pagas
// ============================================================
// Camada extra do CLIENTE controlar o teto de gasto. Quando a equipe
// roda uma consulta paga (Assertiva, BigDataCorp, ARISP...) o sistema
// respeita o limite — se `bloquear_ao_exceder` for true, recusa; se
// false, alerta mas permite. Credor sem entrada aqui = sem limite.
export const PREFERENCIAS_DEMO = [
  // Comercial Vertice — limite GRANULAR (global + por modo + por API):
  //   - Global: R$ 500/mes
  //   - Combo Lead: R$ 200/mes (localizacao/priorizacao)
  //   - Combo Doc: R$ 300/mes (matriculas, certidoes)
  //   - eDossie: 0 = BLOQUEADO (caro demais — R$ 500/consulta)
  //   - ARISP matricula: R$ 100/mes (limite especifico mais restritivo)
  {
    credor_id: 1,
    limite_mensal_brl: 500.00,
    limite_combo_lead_brl: 200.00,
    limite_combo_doc_brl: 300.00,
    limites_por_api: {
      'arisp.matricula': 100.00,
      'edossie.completo': 0, // 0 = bloqueia (caro demais)
    },
    bloquear_ao_exceder: true,
    observacoes: 'Limites ajustados em jan/2026 apos analise de gasto Q4/2025.',
  },
  // Construtora Oeste — limite global simples, so alerta
  {
    credor_id: 2,
    limite_mensal_brl: 300.00,
    limite_combo_lead_brl: 0,
    limite_combo_doc_brl: 0,
    limites_por_api: {},
    bloquear_ao_exceder: false,
    observacoes: null,
  },
  // Pedro Almeida ME — sem limite definido (usa default)
  // (nao adicionar entrada — DB ausente = sem limite)
];
