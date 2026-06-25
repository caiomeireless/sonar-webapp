// Monitor de Custos — mock + agregadores puros para a tela gerencial
// de gasto com APIs pagas.
//
// Mock-only por enquanto: gera ~80-100 consultas fictícias distribuídas
// nos últimos 30 dias e devolve agregados prontos para a UI consumir.
// Quando a tabela `custos` do Supabase comecar a ser populada de verdade
// pelo dia-a-dia das consultas pagas, troca-se a fonte aqui sem mexer
// na tela.
//
// Determinismo: o mock usa um PRNG semeado para que cada render produza
// os mesmos números (importante pra demo — totais não dançam a cada
// reload).

// ============================================================
// TIPOS
// ============================================================

export type ConsultaCusto = {
  id: number;
  data: string; // ISO
  advogadoEmail: string;
  advogadoNome: string;
  credorId: number;
  credorNome: string;
  devedorNome: string;
  apiTipo: string;
  apiRotulo: string;
  custoBrl: number;
  contexto: "themis" | "pre-processual" | "dossie";
};

export type GastoPorEntidade = {
  id: string | number;
  nome: string;
  totalBrl: number;
  consultas: number;
};

export type GastoPorDia = { dia: string; totalBrl: number };

export type DashboardCustos = {
  totalMesBrl: number;
  limiteMesBrl: number;
  totalConsultas: number;
  totalAdvogados: number;
  totalClientes: number;
  apiMaisUsada: string;
  gastosPorDia: GastoPorDia[]; // últimos 30 dias
  porCliente: GastoPorEntidade[];
  porAdvogado: GastoPorEntidade[];
  porAPI: GastoPorEntidade[];
  consultas: ConsultaCusto[]; // últimas 50
};

// ============================================================
// CONFIG
// ============================================================

// Mesmo teto usado no KPIGastoAPIs do Painel — quando virar configuração
// por escritório, mover pra `preferencias`.
const LIMITE_MES_BRL = 5000;

const ADVOGADOS = [
  { email: "caio@bpadvogados.com.br", nome: "Caio Vicentino" },
  { email: "paulo@bpadvogados.com.br", nome: "Paulo André" },
  { email: "remo@bpadvogados.com.br", nome: "Remo Battaglia" },
  { email: "filipe@bpadvogados.com.br", nome: "Filipe Garcia" },
] as const;

const CLIENTES = [
  { id: 1, nome: "Comercial Vértice" },
  { id: 2, nome: "Construtora Oeste" },
  { id: 3, nome: "Pedro Almeida ME" },
] as const;

const APIS = [
  { tipo: "assertiva", rotulo: "Assertiva", custoBase: 2.5, variacao: 4.0 },
  { tipo: "bigdatacorp", rotulo: "BigDataCorp", custoBase: 4.0, variacao: 6.0 },
  { tipo: "arisp", rotulo: "ARISP", custoBase: 6.5, variacao: 8.5 },
  { tipo: "cenprot", rotulo: "Cenprot", custoBase: 1.5, variacao: 3.0 },
  { tipo: "edossie", rotulo: "eDossiê", custoBase: 3.5, variacao: 5.0 },
  { tipo: "junta_comercial", rotulo: "Junta Comercial", custoBase: 2.0, variacao: 4.5 },
  { tipo: "datajud", rotulo: "DataJud (gratuito)", custoBase: 0, variacao: 0 },
] as const;

const DEVEDORES = [
  "Auto Posto Bandeirantes Ltda",
  "Metalúrgica São Caetano S.A.",
  "Transportadora Veloz EIRELI",
  "Padaria Estrela d'Alva ME",
  "Confecções Aurora Ltda",
  "Construtora Horizonte S.A.",
  "Comércio de Peças Atlanta",
  "Restaurante Sabor & Arte",
  "Jorge Henrique Pacheco",
  "Mariana Silveira Costa",
  "Eduardo Nascimento Lopes",
  "Helena Bittencourt Ribeiro",
  "Indústria Têxtil Pôr-do-Sol",
  "Distribuidora Três Rios",
  "Mecânica Central Express",
  "Sapataria Pé Quente Ltda",
] as const;

const CONTEXTOS: ReadonlyArray<ConsultaCusto["contexto"]> = [
  "themis",
  "pre-processual",
  "dossie",
];

// ============================================================
// PRNG semeado (Mulberry32) — determinístico p/ a demo
// ============================================================

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escolher<T>(rng: () => number, arr: ReadonlyArray<T>): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

// ============================================================
// GERAÇÃO DO MOCK
// ============================================================

function diaISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function gerarConsultasMock(): ConsultaCusto[] {
  const rng = mulberry32(20260625); // semente fixa: data da implementação
  // entre 80 e 100 consultas
  const total = 80 + Math.floor(rng() * 21);

  const agora = Date.now();
  const out: ConsultaCusto[] = [];

  for (let i = 0; i < total; i++) {
    // distribuído ao longo dos últimos 30 dias (com hora aleatória)
    const offsetMs = Math.floor(rng() * 30 * 24 * 60 * 60 * 1000);
    const data = new Date(agora - offsetMs);

    const adv = escolher(rng, ADVOGADOS);
    const cli = escolher(rng, CLIENTES);
    const api = escolher(rng, APIS);
    const devedor = escolher(rng, DEVEDORES);
    const contexto = escolher(rng, CONTEXTOS);

    // Custo: base + variação aleatória, com bias mínimo de R$ 0,30 para
    // APIs pagas (datajud fica zerado).
    const custoBrl =
      api.custoBase === 0
        ? 0
        : Math.round((api.custoBase + rng() * api.variacao) * 100) / 100;

    out.push({
      id: i + 1,
      data: data.toISOString(),
      advogadoEmail: adv.email,
      advogadoNome: adv.nome,
      credorId: cli.id,
      credorNome: cli.nome,
      devedorNome: devedor,
      apiTipo: api.tipo,
      apiRotulo: api.rotulo,
      custoBrl,
      contexto,
    });
  }

  return out;
}

// ============================================================
// AGREGADORES PUROS
// ============================================================

function totalMes(consultas: ConsultaCusto[]): number {
  const inicio = new Date();
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);
  const corte = inicio.toISOString();
  return consultas
    .filter((c) => c.data >= corte)
    .reduce((s, c) => s + c.custoBrl, 0);
}

function agruparPorDia(consultas: ConsultaCusto[]): GastoPorDia[] {
  // janela fixa: últimos 30 dias (preenche dias sem consulta com zero)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const acc = new Map<string, number>();
  for (const c of consultas) {
    const dia = c.data.slice(0, 10);
    acc.set(dia, (acc.get(dia) ?? 0) + c.custoBrl);
  }

  const out: GastoPorDia[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    const dia = diaISO(d);
    out.push({ dia, totalBrl: acc.get(dia) ?? 0 });
  }
  return out;
}

function agruparPor<T extends { id: string | number; nome: string }>(
  consultas: ConsultaCusto[],
  chave: (c: ConsultaCusto) => T,
): GastoPorEntidade[] {
  const acc = new Map<
    string | number,
    { nome: string; totalBrl: number; consultas: number }
  >();
  for (const c of consultas) {
    const k = chave(c);
    const cur = acc.get(k.id) ?? { nome: k.nome, totalBrl: 0, consultas: 0 };
    cur.totalBrl += c.custoBrl;
    cur.consultas += 1;
    acc.set(k.id, cur);
  }
  const out: GastoPorEntidade[] = [];
  for (const [id, v] of acc.entries()) {
    out.push({ id, nome: v.nome, totalBrl: v.totalBrl, consultas: v.consultas });
  }
  out.sort((a, b) => b.totalBrl - a.totalBrl);
  return out;
}

function ultimas50(consultas: ConsultaCusto[]): ConsultaCusto[] {
  return [...consultas]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 50);
}

function apiMaisUsadaRotulo(porAPI: GastoPorEntidade[]): string {
  // Critério: maior número de consultas (não custo), já que DataJud
  // pode ser a mais consultada com custo zero. Em caso de empate,
  // o maior custo desempata.
  if (porAPI.length === 0) return "—";
  const ord = [...porAPI].sort((a, b) => {
    if (b.consultas !== a.consultas) return b.consultas - a.consultas;
    return b.totalBrl - a.totalBrl;
  });
  return ord[0]!.nome;
}

// ============================================================
// ENTRY POINT
// ============================================================

export async function obterDashboardCustos(opts?: {
  credorId?: number;
}): Promise<DashboardCustos> {
  const todas = gerarConsultasMock();
  const consultas =
    opts?.credorId !== undefined
      ? todas.filter((c) => c.credorId === opts.credorId)
      : todas;

  const porCliente = agruparPor(consultas, (c) => ({
    id: c.credorId,
    nome: c.credorNome,
  }));
  const porAdvogado = agruparPor(consultas, (c) => ({
    id: c.advogadoEmail,
    nome: c.advogadoNome,
  }));
  const porAPI = agruparPor(consultas, (c) => ({
    id: c.apiTipo,
    nome: c.apiRotulo,
  }));

  return {
    totalMesBrl: totalMes(consultas),
    limiteMesBrl: LIMITE_MES_BRL,
    totalConsultas: consultas.length,
    totalAdvogados: porAdvogado.length,
    totalClientes: porCliente.length,
    apiMaisUsada: apiMaisUsadaRotulo(porAPI),
    gastosPorDia: agruparPorDia(consultas),
    porCliente,
    porAdvogado,
    porAPI,
    consultas: ultimas50(consultas),
  };
}
