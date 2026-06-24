// Dashboard da Plataforma — agregação DO LADO SERVIDOR pra a tela
// /equipe (visão gerencial da equipe inteira, não de 1 caso).
//
// Server-only: usa createAdminClient. Reúne dados de credores, devedores,
// casos, bens_encontrados, medidas_tomadas e custos. NÃO faz checagem de
// papel — decisão do Caio: funcionário vê tudo, incluindo valores.
//
// REGRA: Toda métrica devolvida já vem pronta pra UI consumir. A view
// não deve fazer agregação no client.

import { createAdminClient } from "@/lib/supabase/admin";
import { ROTULO_TIPO, type RegistroCusto } from "@/lib/custos";
import { perfisPorEmail, nomeOuEmail } from "@/lib/perfis";
import type { TipoBem } from "@/lib/mock-fixtures";
import type { TipoMedida, ResultadoMedida } from "@/lib/medidas";

// ============================================================
// TIPOS de saída
// ============================================================

export interface KPIsGerais {
  patrimonioLocalizadoTotalBrl: number;
  penhorasEfetivadasMes: number;
  casosAtivosTotal: number;
  casosBreakdown: {
    ativos: number;
    pausados: number;
    encerrados: number;
    satisfeitos: number;
  };
  gastoApisMes: number;
  gastoApisLimite: number;
}

export interface EvolucaoMensalItem {
  mes: string; // 'YYYY-MM'
  patrimonioLocalizado: number;
  penhorasEfetivadas: number;
}

export interface MixBensItem {
  tipo: TipoBem;
  qtd: number;
  valorBrl: number;
}

export interface AtividadeEquipeItem {
  advogadoEmail: string;
  advogadoNome: string;
  medidasTomadas: number;
  breakdown: Partial<Record<TipoMedida, number>>;
}

export interface TopClienteItem {
  credorId: number;
  credorNome: string;
  valorPatrimonioLocalizado: number;
  qtdCasos: number;
}

export interface TopDevedorItem {
  devedorId: number;
  devedorNome: string;
  valorEstimadoBens: number;
  qtdCasos: number;
  qtdMedidas: number;
}

export interface CarteiraAdvogadoItem {
  advogadoEmail: string;
  advogadoNome: string;
  qtdCasos: number;
  valorPatrimonioGerido: number;
  gastoMes: number;
}

export interface CustoApiItem {
  tipo: string;
  custoBrl: number;
  descricaoRotulo: string;
}

export interface FeedMedidaItem {
  tipo: TipoMedida;
  resultado: ResultadoMedida;
  casoId: number;
  devedorNome: string;
  advogadoEmail: string | null;
  criadoEm: string;
}

export interface DashboardPlataforma {
  kpisGerais: KPIsGerais;
  evolucaoMensal: EvolucaoMensalItem[];
  mixBensPorTipo: MixBensItem[];
  atividadeEquipe7Dias: AtividadeEquipeItem[];
  top5ClientesPorPatrimonio: TopClienteItem[];
  top5DevedoresRastreio: TopDevedorItem[];
  carteiraPorAdvogado: CarteiraAdvogadoItem[];
  custosPorAPI: CustoApiItem[];
  feedMedidasRecentes: FeedMedidaItem[];
}

// ============================================================
// FILTROS (decisão Caio 2026-06-23): período, advogado, credor, status
// ============================================================

export type PeriodoChave = "tudo" | "7d" | "30d" | "90d" | "mes" | "ano";
export type StatusCaso = "ativo" | "pausado" | "encerrado" | "satisfeito";

export interface FiltrosPlataforma {
  periodo?: PeriodoChave;
  advogados?: string[];
  credores?: number[];
  statusCasos?: StatusCaso[];
}

export interface OpcoesFiltros {
  advogados: { email: string; nome: string }[];
  credores: { id: number; nome: string }[];
}

// ============================================================
// CONFIG
// ============================================================

// Teto mensal de gasto com APIs — heurística pra exibir progresso no card.
// Quando virar configuração por escritório, mover pra `preferencias`.
const GASTO_APIS_LIMITE_PADRAO = 5000;

// PostgREST trunca em 1000 linhas por padrão. Quando precisarmos varrer
// tabelas grandes (bens_encontrados, medidas_tomadas, custos), paginamos.
const PAGINA = 1000;

// ============================================================
// HELPERS de paginação + datas
// ============================================================

async function selecionarTudo<T>(
  build: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const acc: T[] = [];
  let from = 0;
  // hard cap defensivo — 50 páginas (50k linhas) já cobre tudo do Sonar
  // por anos. Se ultrapassar, é melhor explodir do que silenciar.
  for (let pagina = 0; pagina < 50; pagina++) {
    const to = from + PAGINA - 1;
    const { data, error } = await build(from, to);
    if (error || !data || data.length === 0) break;
    acc.push(...data);
    if (data.length < PAGINA) break;
    from += PAGINA;
  }
  return acc;
}

function ymKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function ultimos12Meses(): string[] {
  const out: string[] = [];
  const hoje = new Date();
  const cursor = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    out.push(ymKey(d));
  }
  return out;
}

function inicioDoMesISO(): string {
  const hoje = new Date();
  const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0);
  return d.toISOString();
}

function diasAtrasISO(dias: number): string {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

// ============================================================
// ROWS — formato cru lido do Supabase (só pra tipar sem `any`)
// ============================================================

interface CredorRow {
  id: number;
  nome: string;
}

interface DevedorRow {
  id: number;
  nome: string;
}

interface CasoRow {
  id: number;
  credor_id: number;
  devedor_id: number;
  status: "ativo" | "pausado" | "encerrado" | "satisfeito";
  responsavel_email: string | null;
}

interface BemRow {
  devedor_id: number;
  tipo: TipoBem;
  valor_estimado_brl: number | null;
  fonte_consultada_em: string | null;
}

interface MedidaRow {
  id: number;
  caso_id: number;
  data: string;
  tipo: TipoMedida;
  resultado: ResultadoMedida;
  advogado_email: string | null;
  criado_em: string;
  valor_recuperado_brl: number | null;
}

interface CustoRow {
  id: number;
  email: string;
  tipo: string;
  descricao: string;
  custo: number;
  criado_em: string;
  devedor_id: number | null;
}

// ============================================================
// LEITURAS (cada uma resiliente — se a tabela ainda não existir,
// devolve [] em vez de quebrar a página inteira)
// ============================================================

async function lerCredores(): Promise<CredorRow[]> {
  try {
    const sb = createAdminClient();
    return await selecionarTudo<CredorRow>(async (from, to) => {
      const res = await sb
        .from("credores")
        .select("id, nome")
        .range(from, to);
      return { data: res.data as CredorRow[] | null, error: res.error };
    });
  } catch {
    return [];
  }
}

async function lerDevedores(): Promise<DevedorRow[]> {
  try {
    const sb = createAdminClient();
    return await selecionarTudo<DevedorRow>(async (from, to) => {
      const res = await sb
        .from("devedores")
        .select("id, nome")
        .range(from, to);
      return { data: res.data as DevedorRow[] | null, error: res.error };
    });
  } catch {
    return [];
  }
}

async function lerCasos(): Promise<CasoRow[]> {
  try {
    const sb = createAdminClient();
    return await selecionarTudo<CasoRow>(async (from, to) => {
      const res = await sb
        .from("casos")
        .select("id, credor_id, devedor_id, status, responsavel_email")
        .range(from, to);
      return { data: res.data as CasoRow[] | null, error: res.error };
    });
  } catch {
    return [];
  }
}

async function lerBens(): Promise<BemRow[]> {
  try {
    const sb = createAdminClient();
    return await selecionarTudo<BemRow>(async (from, to) => {
      const res = await sb
        .from("bens_encontrados")
        .select("devedor_id, tipo, valor_estimado_brl, fonte_consultada_em")
        .eq("ativo", true)
        .range(from, to);
      return { data: res.data as BemRow[] | null, error: res.error };
    });
  } catch {
    return [];
  }
}

async function lerMedidas(): Promise<MedidaRow[]> {
  try {
    const sb = createAdminClient();
    return await selecionarTudo<MedidaRow>(async (from, to) => {
      const res = await sb
        .from("medidas_tomadas")
        .select(
          "id, caso_id, data, tipo, resultado, advogado_email, criado_em, valor_recuperado_brl",
        )
        .range(from, to);
      return { data: res.data as MedidaRow[] | null, error: res.error };
    });
  } catch {
    return [];
  }
}

async function lerCustos(): Promise<CustoRow[]> {
  try {
    const sb = createAdminClient();
    return await selecionarTudo<CustoRow>(async (from, to) => {
      const res = await sb
        .from("custos")
        .select("id, email, tipo, descricao, custo, criado_em, devedor_id")
        .range(from, to);
      return { data: res.data as CustoRow[] | null, error: res.error };
    });
  } catch {
    return [];
  }
}

// ============================================================
// AGREGAÇÕES
// ============================================================

function agregarKpisGerais(args: {
  bens: BemRow[];
  casos: CasoRow[];
  medidas: MedidaRow[];
  custos: CustoRow[];
}): KPIsGerais {
  const { bens, casos, medidas, custos } = args;

  const patrimonioLocalizadoTotalBrl = bens.reduce(
    (s, b) => s + (Number(b.valor_estimado_brl) || 0),
    0,
  );

  const inicioMes = inicioDoMesISO();

  const penhorasEfetivadasMes = medidas.filter((m) => {
    if (m.tipo !== "penhora_efetivada") return false;
    if (m.resultado !== "positivo") return false;
    const ts = m.data ?? m.criado_em;
    if (!ts) return false;
    return ts >= inicioMes.slice(0, 10); // m.data é `date` (YYYY-MM-DD)
  }).length;

  const breakdown = {
    ativos: 0,
    pausados: 0,
    encerrados: 0,
    satisfeitos: 0,
  };
  for (const c of casos) {
    if (c.status === "ativo") breakdown.ativos++;
    else if (c.status === "pausado") breakdown.pausados++;
    else if (c.status === "encerrado") breakdown.encerrados++;
    else if (c.status === "satisfeito") breakdown.satisfeitos++;
  }

  const gastoApisMes = custos
    .filter((c) => c.criado_em && c.criado_em >= inicioMes)
    .reduce((s, c) => s + (Number(c.custo) || 0), 0);

  return {
    patrimonioLocalizadoTotalBrl,
    penhorasEfetivadasMes,
    casosAtivosTotal: breakdown.ativos,
    casosBreakdown: breakdown,
    gastoApisMes,
    gastoApisLimite: GASTO_APIS_LIMITE_PADRAO,
  };
}

function agregarEvolucaoMensal(args: {
  bens: BemRow[];
  medidas: MedidaRow[];
}): EvolucaoMensalItem[] {
  const { bens, medidas } = args;
  const meses = ultimos12Meses();

  // Patrimônio localizado por mês = soma de valor_estimado_brl dos bens
  // cuja `fonte_consultada_em` cai no mês. Heurística boa o suficiente
  // pra gráfico de evolução (quando o bem foi "trazido" ao sistema).
  const patrPorMes = new Map<string, number>();
  for (const b of bens) {
    if (!b.fonte_consultada_em) continue;
    const d = new Date(b.fonte_consultada_em);
    if (Number.isNaN(d.getTime())) continue;
    const k = ymKey(d);
    const v = Number(b.valor_estimado_brl) || 0;
    patrPorMes.set(k, (patrPorMes.get(k) ?? 0) + v);
  }

  // Penhoras efetivadas por mês = count das medidas penhora_efetivada
  // com resultado=positivo agrupadas por mês da data da medida.
  const penPorMes = new Map<string, number>();
  for (const m of medidas) {
    if (m.tipo !== "penhora_efetivada") continue;
    if (m.resultado !== "positivo") continue;
    const ts = m.data || m.criado_em;
    if (!ts) continue;
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) continue;
    const k = ymKey(d);
    penPorMes.set(k, (penPorMes.get(k) ?? 0) + 1);
  }

  return meses.map((mes) => ({
    mes,
    patrimonioLocalizado: patrPorMes.get(mes) ?? 0,
    penhorasEfetivadas: penPorMes.get(mes) ?? 0,
  }));
}

function agregarMixBens(bens: BemRow[]): MixBensItem[] {
  const acc = new Map<TipoBem, { qtd: number; valor: number }>();
  for (const b of bens) {
    const cur = acc.get(b.tipo) ?? { qtd: 0, valor: 0 };
    cur.qtd += 1;
    cur.valor += Number(b.valor_estimado_brl) || 0;
    acc.set(b.tipo, cur);
  }
  const out: MixBensItem[] = [];
  for (const [tipo, v] of acc.entries()) {
    out.push({ tipo, qtd: v.qtd, valorBrl: v.valor });
  }
  // Maior valor primeiro — leitura natural pra gráfico de mix.
  out.sort((a, b) => b.valorBrl - a.valorBrl);
  return out;
}

function agregarAtividadeEquipe(
  medidas: MedidaRow[],
  mapaPerfis: Record<string, string>,
): AtividadeEquipeItem[] {
  const corte = diasAtrasISO(7);
  const recentes = medidas.filter((m) => (m.criado_em || m.data) >= corte);

  // email -> { total, breakdown }
  const acc = new Map<
    string,
    { total: number; breakdown: Partial<Record<TipoMedida, number>> }
  >();
  for (const m of recentes) {
    const email = (m.advogado_email ?? "").toLowerCase().trim();
    if (!email) continue;
    const cur = acc.get(email) ?? { total: 0, breakdown: {} };
    cur.total += 1;
    cur.breakdown[m.tipo] = (cur.breakdown[m.tipo] ?? 0) + 1;
    acc.set(email, cur);
  }

  const out: AtividadeEquipeItem[] = [];
  for (const [email, v] of acc.entries()) {
    out.push({
      advogadoEmail: email,
      advogadoNome: nomeOuEmail(email, mapaPerfis),
      medidasTomadas: v.total,
      breakdown: v.breakdown,
    });
  }
  out.sort((a, b) => b.medidasTomadas - a.medidasTomadas);
  return out;
}

function agregarTopClientes(args: {
  credores: CredorRow[];
  casos: CasoRow[];
  bens: BemRow[];
}): TopClienteItem[] {
  const { credores, casos, bens } = args;

  // mapa devedor_id -> valor total dos bens deste devedor
  const valorPorDevedor = new Map<number, number>();
  for (const b of bens) {
    const v = Number(b.valor_estimado_brl) || 0;
    valorPorDevedor.set(b.devedor_id, (valorPorDevedor.get(b.devedor_id) ?? 0) + v);
  }

  // mapa credor_id -> { valor, qtdCasos }
  const porCredor = new Map<number, { valor: number; qtdCasos: number }>();
  for (const c of casos) {
    const cur = porCredor.get(c.credor_id) ?? { valor: 0, qtdCasos: 0 };
    cur.qtdCasos += 1;
    cur.valor += valorPorDevedor.get(c.devedor_id) ?? 0;
    porCredor.set(c.credor_id, cur);
  }

  const nomePorCredor = new Map<number, string>();
  for (const c of credores) nomePorCredor.set(c.id, c.nome);

  const out: TopClienteItem[] = [];
  for (const [credorId, v] of porCredor.entries()) {
    out.push({
      credorId,
      credorNome: nomePorCredor.get(credorId) ?? `Credor #${credorId}`,
      valorPatrimonioLocalizado: v.valor,
      qtdCasos: v.qtdCasos,
    });
  }
  out.sort(
    (a, b) => b.valorPatrimonioLocalizado - a.valorPatrimonioLocalizado,
  );
  return out.slice(0, 5);
}

function agregarTopDevedores(args: {
  devedores: DevedorRow[];
  casos: CasoRow[];
  bens: BemRow[];
  medidas: MedidaRow[];
}): TopDevedorItem[] {
  const { devedores, casos, bens, medidas } = args;

  const valorPorDevedor = new Map<number, number>();
  for (const b of bens) {
    const v = Number(b.valor_estimado_brl) || 0;
    valorPorDevedor.set(b.devedor_id, (valorPorDevedor.get(b.devedor_id) ?? 0) + v);
  }

  const casosPorDevedor = new Map<number, number>();
  // tambem montamos: caso_id -> devedor_id pra atribuir medidas ao devedor
  const devedorDoCaso = new Map<number, number>();
  for (const c of casos) {
    casosPorDevedor.set(c.devedor_id, (casosPorDevedor.get(c.devedor_id) ?? 0) + 1);
    devedorDoCaso.set(c.id, c.devedor_id);
  }

  const medidasPorDevedor = new Map<number, number>();
  for (const m of medidas) {
    const did = devedorDoCaso.get(m.caso_id);
    if (did === undefined) continue;
    medidasPorDevedor.set(did, (medidasPorDevedor.get(did) ?? 0) + 1);
  }

  const nomePorDevedor = new Map<number, string>();
  for (const d of devedores) nomePorDevedor.set(d.id, d.nome);

  const out: TopDevedorItem[] = [];
  // candidatos = devedores com pelo menos 1 bem (faz sentido falar em
  // "patrimônio em rastreio")
  for (const [devedorId, valor] of valorPorDevedor.entries()) {
    out.push({
      devedorId,
      devedorNome: nomePorDevedor.get(devedorId) ?? `Devedor #${devedorId}`,
      valorEstimadoBens: valor,
      qtdCasos: casosPorDevedor.get(devedorId) ?? 0,
      qtdMedidas: medidasPorDevedor.get(devedorId) ?? 0,
    });
  }
  out.sort((a, b) => b.valorEstimadoBens - a.valorEstimadoBens);
  return out.slice(0, 5);
}

function agregarCarteiraPorAdvogado(args: {
  casos: CasoRow[];
  bens: BemRow[];
  custos: CustoRow[];
  mapaPerfis: Record<string, string>;
}): CarteiraAdvogadoItem[] {
  const { casos, bens, custos, mapaPerfis } = args;

  const valorPorDevedor = new Map<number, number>();
  for (const b of bens) {
    const v = Number(b.valor_estimado_brl) || 0;
    valorPorDevedor.set(b.devedor_id, (valorPorDevedor.get(b.devedor_id) ?? 0) + v);
  }

  const acc = new Map<
    string,
    { qtdCasos: number; valor: number; gastoMes: number }
  >();

  for (const c of casos) {
    const email = (c.responsavel_email ?? "").toLowerCase().trim();
    if (!email) continue;
    const cur = acc.get(email) ?? { qtdCasos: 0, valor: 0, gastoMes: 0 };
    cur.qtdCasos += 1;
    cur.valor += valorPorDevedor.get(c.devedor_id) ?? 0;
    acc.set(email, cur);
  }

  // Gasto do mês por email (campo `email` em custos = quem disparou a consulta).
  const inicioMes = inicioDoMesISO();
  for (const cu of custos) {
    if (!cu.criado_em || cu.criado_em < inicioMes) continue;
    const email = (cu.email ?? "").toLowerCase().trim();
    if (!email) continue;
    const cur = acc.get(email) ?? { qtdCasos: 0, valor: 0, gastoMes: 0 };
    cur.gastoMes += Number(cu.custo) || 0;
    acc.set(email, cur);
  }

  const out: CarteiraAdvogadoItem[] = [];
  for (const [email, v] of acc.entries()) {
    out.push({
      advogadoEmail: email,
      advogadoNome: nomeOuEmail(email, mapaPerfis),
      qtdCasos: v.qtdCasos,
      valorPatrimonioGerido: v.valor,
      gastoMes: v.gastoMes,
    });
  }
  out.sort((a, b) => b.valorPatrimonioGerido - a.valorPatrimonioGerido);
  return out;
}

// Mock ficticio pro card "Custos por API" do Painel — ate' a tabela
// real de custos comecar a ser populada pelo dia-a-dia das consultas
// pagas, esses valores ilustram o comportamento esperado.
const MOCK_CUSTOS_POR_API: CustoApiItem[] = [
  { tipo: "assertiva", custoBrl: 1287.4, descricaoRotulo: "Assertiva (Pessoas/Score)" },
  { tipo: "bigdatacorp", custoBrl: 942.8, descricaoRotulo: "BigDataCorp" },
  { tipo: "arisp", custoBrl: 615.0, descricaoRotulo: "ARISP (Matrículas SP)" },
  { tipo: "cenprot", custoBrl: 308.5, descricaoRotulo: "Cenprot (Protestos)" },
  { tipo: "edossie", custoBrl: 214.0, descricaoRotulo: "eDossiê (Carga Tributária)" },
  { tipo: "junta_comercial", custoBrl: 178.3, descricaoRotulo: "Junta Comercial" },
  { tipo: "datajud", custoBrl: 0, descricaoRotulo: "DataJud CNJ (gratuita)" },
];

function agregarCustosPorApi(custos: CustoRow[]): CustoApiItem[] {
  const acc = new Map<string, number>();
  for (const c of custos) {
    const tipo = c.tipo || "outro";
    acc.set(tipo, (acc.get(tipo) ?? 0) + (Number(c.custo) || 0));
  }
  const out: CustoApiItem[] = [];
  for (const [tipo, custoBrl] of acc.entries()) {
    out.push({
      tipo,
      custoBrl,
      descricaoRotulo: ROTULO_TIPO[tipo] ?? tipo,
    });
  }
  // Fallback: ainda nao ha custos reais registrados — mostra mock
  // ficticio pra dar materia ao card no Painel (demo).
  if (out.length === 0) return MOCK_CUSTOS_POR_API;
  out.sort((a, b) => b.custoBrl - a.custoBrl);
  return out;
}

function agregarFeedMedidas(args: {
  medidas: MedidaRow[];
  casos: CasoRow[];
  devedores: DevedorRow[];
}): FeedMedidaItem[] {
  const { medidas, casos, devedores } = args;

  const corte = diasAtrasISO(1);
  const devedorDoCaso = new Map<number, number>();
  for (const c of casos) devedorDoCaso.set(c.id, c.devedor_id);
  const nomePorDevedor = new Map<number, string>();
  for (const d of devedores) nomePorDevedor.set(d.id, d.nome);

  const recentes = medidas
    .filter((m) => (m.criado_em || m.data) >= corte)
    .sort((a, b) => {
      const ta = a.criado_em || a.data;
      const tb = b.criado_em || b.data;
      return tb.localeCompare(ta);
    })
    .slice(0, 10);

  return recentes.map((m) => {
    const did = devedorDoCaso.get(m.caso_id);
    const devedorNome =
      did !== undefined ? (nomePorDevedor.get(did) ?? `Devedor #${did}`) : "—";
    return {
      tipo: m.tipo,
      resultado: m.resultado,
      casoId: m.caso_id,
      devedorNome,
      advogadoEmail: m.advogado_email,
      criadoEm: m.criado_em || m.data,
    };
  });
}

// ============================================================
// APLICAÇÃO DE FILTROS — filtra os arrays crus em CASCATA antes de agregar.
// Casos são o pivot: credor / advogado / status filtram casos primeiro.
// Daí bens e custos filtram via devedor_id dos casos sobreviventes;
// medidas filtram via caso_id.
// Período filtra medidas e custos por data; bens não tem semântica de
// período (é snapshot do que já foi localizado).
// ============================================================

function inicioDoPeriodoISO(p: PeriodoChave): string | null {
  const hoje = new Date();
  switch (p) {
    case "tudo":
      return null;
    case "7d":
      return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case "30d":
      return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case "90d":
      return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    case "mes":
      return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
    case "ano":
      return new Date(hoje.getFullYear(), 0, 1).toISOString();
  }
}

interface DadosCrus {
  credores: CredorRow[];
  devedores: DevedorRow[];
  casos: CasoRow[];
  bens: BemRow[];
  medidas: MedidaRow[];
  custos: CustoRow[];
}

function aplicarFiltros(raw: DadosCrus, f: FiltrosPlataforma | undefined): DadosCrus {
  if (!f || (!f.periodo && !f.advogados?.length && !f.credores?.length && !f.statusCasos?.length)) {
    return raw;
  }

  // 1. Filtra casos por status / credor / advogado
  let casos = raw.casos;
  if (f.statusCasos?.length) {
    const set = new Set(f.statusCasos);
    casos = casos.filter((c) => set.has(c.status));
  }
  if (f.credores?.length) {
    const set = new Set(f.credores);
    casos = casos.filter((c) => set.has(c.credor_id));
  }
  if (f.advogados?.length) {
    const set = new Set(f.advogados);
    casos = casos.filter((c) => c.responsavel_email && set.has(c.responsavel_email));
  }

  const casoIds = new Set(casos.map((c) => c.id));
  const devedorIds = new Set(casos.map((c) => c.devedor_id));

  // 2. Cascateia em bens / medidas / custos
  let bens = raw.bens.filter((b) => devedorIds.has(b.devedor_id));
  let medidas = raw.medidas.filter((m) => casoIds.has(m.caso_id));
  let custos = raw.custos.filter((cu) => cu.devedor_id === null || devedorIds.has(cu.devedor_id));

  // 3. Período: filtra medidas (data) e custos (criado_em)
  if (f.periodo) {
    const corte = inicioDoPeriodoISO(f.periodo);
    if (corte) {
      const corteDia = corte.slice(0, 10);
      medidas = medidas.filter((m) => (m.data || m.criado_em).slice(0, 10) >= corteDia);
      custos = custos.filter((cu) => cu.criado_em >= corte);
      bens = bens.filter((b) => !b.fonte_consultada_em || b.fonte_consultada_em >= corte);
    }
  }

  return { credores: raw.credores, devedores: raw.devedores, casos, bens, medidas, custos };
}

// ============================================================
// OPÇÕES PARA UI DOS FILTROS (lista quem aparece nos dropdowns)
// ============================================================

export async function listarOpcoesFiltros(): Promise<OpcoesFiltros> {
  const [credores, casos, mapaPerfis] = await Promise.all([
    lerCredores(),
    lerCasos(),
    perfisPorEmail(),
  ]);
  const emailsAdvogado = new Set<string>();
  for (const c of casos) {
    if (c.responsavel_email) emailsAdvogado.add(c.responsavel_email);
  }
  const advogados = Array.from(emailsAdvogado).map((email) => ({
    email,
    nome: nomeOuEmail(email, mapaPerfis),
  }));
  advogados.sort((a, b) => a.nome.localeCompare(b.nome));
  const credoresOrdenados = [...credores].sort((a, b) => a.nome.localeCompare(b.nome));
  return { advogados, credores: credoresOrdenados };
}

// ============================================================
// ENTRY POINT
// ============================================================

export async function obterDadosDashboardPlataforma(
  filtros?: FiltrosPlataforma,
): Promise<DashboardPlataforma> {
  const [credores, devedores, casos, bens, medidas, custos, mapaPerfis] =
    await Promise.all([
      lerCredores(),
      lerDevedores(),
      lerCasos(),
      lerBens(),
      lerMedidas(),
      lerCustos(),
      perfisPorEmail(),
    ]);

  const filtrado = aplicarFiltros(
    { credores, devedores, casos, bens, medidas, custos },
    filtros,
  );

  const kpisGerais = agregarKpisGerais({
    bens: filtrado.bens,
    casos: filtrado.casos,
    medidas: filtrado.medidas,
    custos: filtrado.custos,
  });
  const evolucaoMensal = agregarEvolucaoMensal({
    bens: filtrado.bens,
    medidas: filtrado.medidas,
  });
  const mixBensPorTipo = agregarMixBens(filtrado.bens);
  const atividadeEquipe7Dias = agregarAtividadeEquipe(
    filtrado.medidas,
    mapaPerfis,
  );
  const top5ClientesPorPatrimonio = agregarTopClientes({
    credores: filtrado.credores,
    casos: filtrado.casos,
    bens: filtrado.bens,
  });
  const top5DevedoresRastreio = agregarTopDevedores({
    devedores: filtrado.devedores,
    casos: filtrado.casos,
    bens: filtrado.bens,
    medidas: filtrado.medidas,
  });
  const carteiraPorAdvogado = agregarCarteiraPorAdvogado({
    casos: filtrado.casos,
    bens: filtrado.bens,
    custos: filtrado.custos,
    mapaPerfis,
  });
  const custosPorAPI = agregarCustosPorApi(filtrado.custos);
  const feedMedidasRecentes = agregarFeedMedidas({
    medidas: filtrado.medidas,
    casos: filtrado.casos,
    devedores: filtrado.devedores,
  });

  return {
    kpisGerais,
    evolucaoMensal,
    mixBensPorTipo,
    atividadeEquipe7Dias,
    top5ClientesPorPatrimonio,
    top5DevedoresRastreio,
    carteiraPorAdvogado,
    custosPorAPI,
    feedMedidasRecentes,
  };
}
