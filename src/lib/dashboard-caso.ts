// Dashboard do Caso — agregação DO LADO SERVIDOR pra alimentar a view.
// Server-only (usa createAdminClient). Reutiliza obterDossie pra bens+casos
// e consulta diretamente custos + medidas_tomadas pra métricas operacionais.
//
// Toda métrica devolvida já vem pronta pra UI consumir — a view NÃO faz
// agregação no client.

import { createAdminClient } from "@/lib/supabase/admin";
import {
  obterDossie,
  type Bem,
  type CasoResumo,
  type Dossie,
} from "@/lib/casos";
import type { TipoBem } from "@/lib/mock-fixtures";
import {
  ROTULO_TIPO as ROTULO_TIPO_CUSTO,
  type RegistroCusto,
} from "@/lib/custos";
import type { Medida, ResultadoMedida, TipoMedida } from "@/lib/medidas";

// ============================================================
// TIPOS de saída
// ============================================================

export interface DashboardKPIs {
  patrimonioLocalizadoBrl: number;
  qtdBens: number;
  casosAtivos: number;
  totalMedidasTomadas: number;
  taxaSucesso: number; // 0..100 — % de medidas com resultado=positivo
  custoAcumuladoBrl: number;
  valorRecuperadoBrl: number;
  scoreRecuperabilidade: number; // 0..100
}

export interface DashboardFunil {
  tentadas: number;
  positivas: number;
  penhorasEfetivadas: number;
}

export interface DashboardHeatmapItem {
  tipo: TipoMedida;
  resultado: ResultadoMedida;
  count: number;
}

export interface DashboardLinhaTempoItem {
  mes: string; // 'YYYY-MM'
  cobranca: number;
  recuperacao: number;
}

export interface DashboardBreakdownBem {
  tipo: TipoBem;
  valorBrl: number;
  qtd: number;
}

export interface DashboardTempoMedio {
  dias: number;
  baseline: number; // baseline arbitrário de mercado (heurística)
}

export interface DashboardCustoApi {
  api: string;
  custoBrl: number;
}

export interface DashboardProximaAcao {
  acao: string;
  motivo: string;
}

export interface DashboardCaso {
  kpis: DashboardKPIs;
  funil: DashboardFunil;
  heatmap: DashboardHeatmapItem[];
  linhaTempoFinanceira: DashboardLinhaTempoItem[];
  breakdownBensPorValor: DashboardBreakdownBem[];
  tempoMedioMedidaPenhora: DashboardTempoMedio;
  custosPorAPI: DashboardCustoApi[];
  proximaAcaoSugerida: DashboardProximaAcao;
}

// ============================================================
// TIPOS v2 — 10 métricas novas pro Dashboard do Caso v2
// ============================================================

export interface RiscoPrescricao {
  diasRestantes: number | null;
  dataDistribuicao: string | null;
  statusRisco: "critico" | "alto" | "medio" | "baixo" | "sem_dados";
}

export interface BemComRestricao {
  bemId: number;
  tipo: TipoBem;
  titulo: string;
  motivo: string;
  valorBrl: number;
}

export interface ConcentracaoPatrimonial {
  topBemPct: number;
  topBemTitulo: string;
  topBemTipo: TipoBem;
  indiceHerfindahl: number;
}

export interface DistribuicaoGeografica {
  cidade: string;
  uf: string;
  qtdBens: number;
  valorTotalBrl: number;
  bensIds: number[];
}

export interface VinculoPatrimonial {
  nome: string;
  documento: string;
  relacao: string;
  temPatrimonio: boolean;
}

export interface CronologiaItem {
  evento: string;
  data: string | null;
  completo: boolean;
  ordem: number;
}

export interface ComparativoEscritorio {
  qtdBens: { este: number; media: number };
  valorPatrimonio: { este: number; media: number };
  qtdMedidas: { este: number; media: number };
}

export interface CustoOportunidade {
  custoAcumuladoBrl: number;
  valorRecuperavelBrl: number;
  razao: number;
  status: "bom" | "medio" | "ruim";
}

export interface ProximoAtoProcessual {
  ato: string;
  prazoFatal: string;
  diasRestantes: number;
  urgencia: "alta" | "media" | "baixa";
}

export interface SazonalidadeAtividade {
  mes: number;
  ano: number;
  qtdMedidas: number;
  qtdPositivas: number;
}

export type DashboardCasoV2 = DashboardCaso & {
  riscoPrescricao: RiscoPrescricao;
  bensComRestricao: BemComRestricao[];
  concentracaoPatrimonial: ConcentracaoPatrimonial;
  distribuicaoGeografica: DistribuicaoGeografica[];
  vinculosPatrimoniais: VinculoPatrimonial[];
  cronologiaCaso: CronologiaItem[];
  comparativoEscritorio: ComparativoEscritorio;
  custoOportunidade: CustoOportunidade;
  proximosAtosProcessuais: ProximoAtoProcessual[];
  sazonalidadeAtividade: SazonalidadeAtividade[];
};

// ============================================================
// HELPERS internos
// ============================================================

const DIAS_MS = 1000 * 60 * 60 * 24;

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

function calcularCasosAtivos(casos: CasoResumo[]): number {
  return casos.filter((c) => c.status === "ativo").length;
}

function calcularCobrancaTotal(casos: CasoResumo[]): number {
  return casos.reduce((s, c) => s + (Number(c.valor_credito_brl) || 0), 0);
}

function calcularBreakdownBens(bens: Bem[]): DashboardBreakdownBem[] {
  const acc = new Map<TipoBem, { valor: number; qtd: number }>();
  for (const b of bens) {
    const cur = acc.get(b.tipo) ?? { valor: 0, qtd: 0 };
    cur.valor += Number(b.valor_estimado_brl) || 0;
    cur.qtd += 1;
    acc.set(b.tipo, cur);
  }
  const out: DashboardBreakdownBem[] = [];
  for (const [tipo, v] of acc.entries()) {
    out.push({ tipo, valorBrl: v.valor, qtd: v.qtd });
  }
  // Maior valor primeiro — o donut mostra fatia maior no topo.
  out.sort((a, b) => b.valorBrl - a.valorBrl);
  return out;
}

function calcularHeatmap(medidas: Medida[]): DashboardHeatmapItem[] {
  const chave = (t: TipoMedida, r: ResultadoMedida) => `${t}|${r}`;
  const acc = new Map<string, number>();
  for (const m of medidas) {
    const k = chave(m.tipo, m.resultado);
    acc.set(k, (acc.get(k) ?? 0) + 1);
  }
  const out: DashboardHeatmapItem[] = [];
  for (const [k, count] of acc.entries()) {
    const [tipo, resultado] = k.split("|") as [TipoMedida, ResultadoMedida];
    out.push({ tipo, resultado, count });
  }
  // Determinismo de saída: ordena por tipo, depois resultado.
  out.sort((a, b) => a.tipo.localeCompare(b.tipo) || a.resultado.localeCompare(b.resultado));
  return out;
}

function calcularLinhaTempo(
  casos: CasoResumo[],
  medidas: Medida[],
): DashboardLinhaTempoItem[] {
  const meses = ultimos12Meses();
  // Cobrança = valor_credito_brl distribuído como valor "em aberto" no mês
  // do caso (heurística DEMO: como não temos data de abertura por caso na
  // CasoResumo, divide igualmente nos 12 meses). Substituir quando a data
  // de abertura entrar no schema.
  const totalCobranca = calcularCobrancaTotal(casos);
  const cobrancaMensal = meses.length > 0 ? totalCobranca / meses.length : 0;

  // Recuperação = soma de valor_recuperado_brl agrupado por YYYY-MM da data
  // da medida.
  const recPorMes = new Map<string, number>();
  for (const m of medidas) {
    const v = Number((m as Medida & { valor_recuperado_brl?: number | null })
      .valor_recuperado_brl) || 0;
    if (v === 0) continue;
    const d = new Date(m.data);
    if (Number.isNaN(d.getTime())) continue;
    const k = ymKey(d);
    recPorMes.set(k, (recPorMes.get(k) ?? 0) + v);
  }

  return meses.map((mes) => ({
    mes,
    cobranca: cobrancaMensal,
    recuperacao: recPorMes.get(mes) ?? 0,
  }));
}

function calcularTempoMedio(medidas: Medida[]): DashboardTempoMedio {
  // Tempo médio entre 'peticao_penhora' e 'penhora_efetivada' do mesmo caso.
  // Para cada caso, pareia a petição mais antiga ainda não-pareada com a
  // próxima penhora_efetivada subsequente.
  const baseline = 120; // dias — heurística de mercado (varia muito por vara)
  const porCaso = new Map<number, Medida[]>();
  for (const m of medidas) {
    const arr = porCaso.get(m.caso_id) ?? [];
    arr.push(m);
    porCaso.set(m.caso_id, arr);
  }
  const deltas: number[] = [];
  for (const arr of porCaso.values()) {
    const ordered = [...arr].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
    );
    const peticoes = ordered.filter((m) => m.tipo === "peticao_penhora");
    const penhoras = ordered.filter((m) => m.tipo === "penhora_efetivada");
    const usadas = new Set<number>();
    for (const p of peticoes) {
      const pt = new Date(p.data).getTime();
      if (Number.isNaN(pt)) continue;
      const match = penhoras.find(
        (x) => !usadas.has(x.id) && new Date(x.data).getTime() >= pt,
      );
      if (!match) continue;
      usadas.add(match.id);
      const dt = new Date(match.data).getTime();
      if (Number.isNaN(dt)) continue;
      deltas.push(Math.max(0, Math.round((dt - pt) / DIAS_MS)));
    }
  }
  const dias =
    deltas.length === 0
      ? 0
      : Math.round(deltas.reduce((s, x) => s + x, 0) / deltas.length);
  return { dias, baseline };
}

function calcularCustosPorAPI(custos: RegistroCusto[]): DashboardCustoApi[] {
  const acc = new Map<string, number>();
  for (const c of custos) {
    const tipo = c.tipo || "outro";
    acc.set(tipo, (acc.get(tipo) ?? 0) + (Number(c.custo) || 0));
  }
  const out: DashboardCustoApi[] = [];
  for (const [tipo, custoBrl] of acc.entries()) {
    out.push({ api: ROTULO_TIPO_CUSTO[tipo] ?? tipo, custoBrl });
  }
  out.sort((a, b) => b.custoBrl - a.custoBrl);
  return out.slice(0, 5);
}

function calcularScore(
  qtdBens: number,
  casosAtivos: number,
  valorRecuperado: number,
  cobrancaTotal: number,
): number {
  const razao = cobrancaTotal > 0 ? valorRecuperado / cobrancaTotal : 0;
  const bruto = qtdBens * 5 + casosAtivos * 3 + razao * 50;
  return Math.max(0, Math.min(100, Math.round(bruto)));
}

function calcularProximaAcao(args: {
  medidas: Medida[];
  bens: Bem[];
  score: number;
}): DashboardProximaAcao {
  const { medidas, bens, score } = args;

  // 1) Sem atividade há 90 dias?
  const agora = Date.now();
  const ultima = medidas.reduce<number>((max, m) => {
    const t = new Date(m.data).getTime();
    if (Number.isNaN(t)) return max;
    return t > max ? t : max;
  }, 0);
  const semAtividade = ultima === 0 || (agora - ultima) / DIAS_MS > 90;
  if (semAtividade) {
    return {
      acao: "Rodar SISBAJUD",
      motivo: "Sem atividade há 90 dias",
    };
  }

  // 2) Imóvel sem matrícula validada?
  const imovelSemMatricula = bens.some((b) => {
    if (b.tipo !== "imovel") return false;
    const det = (b.detalhes ?? {}) as Record<string, unknown>;
    const matricula =
      (det.matricula as string | undefined) ??
      (det.matricula_validada as string | undefined);
    return !matricula;
  });
  if (imovelSemMatricula) {
    return {
      acao: "Solicitar matrícula no ARISP",
      motivo: "Imóvel localizado sem matrícula validada",
    };
  }

  // 3) Participação societária sem CNPJ?
  const empresaSemCnpj = bens.some((b) => {
    if (b.tipo !== "empresa") return false;
    const det = (b.detalhes ?? {}) as Record<string, unknown>;
    const cnpj = (det.cnpj as string | undefined) ?? "";
    return !cnpj.trim();
  });
  if (empresaSemCnpj) {
    return {
      acao: "Cruzar com Receita Federal",
      motivo: "Participação societária sem CNPJ",
    };
  }

  // 4) Score baixo?
  if (score < 30) {
    return {
      acao: "Avaliar prosseguimento do caso",
      motivo: `Score de recuperabilidade baixo (${score}/100)`,
    };
  }

  // 5) Default
  return {
    acao: "Sem próxima ação clara — revisar dossiê completo",
    motivo: "Sinais operacionais dentro do esperado",
  };
}

// ============================================================
// QUERIES auxiliares
// ============================================================

async function buscarMedidasPorDevedor(
  devedorId: number,
): Promise<Medida[]> {
  const sb = createAdminClient();
  const { data: casos, error: errCasos } = await sb
    .from("casos")
    .select("id")
    .eq("devedor_id", devedorId);
  if (errCasos || !casos || casos.length === 0) return [];
  const casoIds = casos.map((c) => c.id as number);

  const { data, error } = await sb
    .from("medidas_tomadas")
    .select(
      "id, caso_id, data, tipo, resultado, titulo, detalhes, advogado_email, criado_em, valor_recuperado_brl",
    )
    .in("caso_id", casoIds)
    .order("data", { ascending: false });
  if (error || !data) return [];
  return data as unknown as Medida[];
}

async function buscarCustosPorDevedor(
  devedorId: number,
): Promise<RegistroCusto[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("custos")
    .select("id, email, tipo, descricao, custo, criado_em")
    .eq("devedor_id", devedorId)
    .order("criado_em", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as number,
    email: (r.email as string) ?? "",
    tipo: (r.tipo as string) ?? "",
    descricao: (r.descricao as string) ?? "",
    custo: Number(r.custo) || 0,
    criadoEm: (r.criado_em as string) ?? "",
  }));
}

// ============================================================
// ENTRY POINT
// ============================================================

export async function obterDadosDashboardCaso(
  devedorId: number,
): Promise<DashboardCaso | null> {
  const dossie: Dossie | null = await obterDossie(devedorId);
  if (!dossie) return null;

  const [medidas, custos] = await Promise.all([
    buscarMedidasPorDevedor(devedorId),
    buscarCustosPorDevedor(devedorId),
  ]);

  // -------- KPIs --------
  const patrimonioLocalizadoBrl = dossie.valor_estimado_total_brl;
  const qtdBens = dossie.total_bens;
  const casosAtivos = calcularCasosAtivos(dossie.casos);
  const totalMedidasTomadas = medidas.length;
  const medidasPositivas = medidas.filter(
    (m) => m.resultado === "positivo",
  ).length;
  const taxaSucesso =
    totalMedidasTomadas === 0
      ? 0
      : Math.round((medidasPositivas / totalMedidasTomadas) * 100);
  const custoAcumuladoBrl = custos.reduce(
    (s, c) => s + (Number(c.custo) || 0),
    0,
  );
  const valorRecuperadoBrl = medidas.reduce((s, m) => {
    const v = Number(
      (m as Medida & { valor_recuperado_brl?: number | null })
        .valor_recuperado_brl,
    );
    return s + (Number.isFinite(v) ? v : 0);
  }, 0);
  const cobrancaTotal = calcularCobrancaTotal(dossie.casos);
  const scoreRecuperabilidade = calcularScore(
    qtdBens,
    casosAtivos,
    valorRecuperadoBrl,
    cobrancaTotal,
  );

  const kpis: DashboardKPIs = {
    patrimonioLocalizadoBrl,
    qtdBens,
    casosAtivos,
    totalMedidasTomadas,
    taxaSucesso,
    custoAcumuladoBrl,
    valorRecuperadoBrl,
    scoreRecuperabilidade,
  };

  // -------- Funil --------
  const tentadas = totalMedidasTomadas;
  const positivas = medidasPositivas;
  const penhorasEfetivadas = medidas.filter(
    (m) => m.tipo === "penhora_efetivada" && m.resultado === "positivo",
  ).length;
  const funil: DashboardFunil = { tentadas, positivas, penhorasEfetivadas };

  // -------- Heatmap + Linha do tempo + Breakdown + Tempo medio + Custos --------
  const heatmap = calcularHeatmap(medidas);
  const linhaTempoFinanceira = calcularLinhaTempo(dossie.casos, medidas);
  const breakdownBensPorValor = calcularBreakdownBens(dossie.bens);
  const tempoMedioMedidaPenhora = calcularTempoMedio(medidas);
  const custosPorAPI = calcularCustosPorAPI(custos);

  // -------- Proxima acao sugerida --------
  const proximaAcaoSugerida = calcularProximaAcao({
    medidas,
    bens: dossie.bens,
    score: scoreRecuperabilidade,
  });

  return {
    kpis,
    funil,
    heatmap,
    linhaTempoFinanceira,
    breakdownBensPorValor,
    tempoMedioMedidaPenhora,
    custosPorAPI,
    proximaAcaoSugerida,
  };
}

// ============================================================
// V2 — HELPERS das 10 métricas novas
// ============================================================

// (a) Prescrição intercorrente — CPC 921: 5 anos sem manifestação.
// Cálculo da janela: data_distribuicao + 5 anos = data fatal.
// Faltam X dias até a fatal. Buckets de risco:
//   <= 90d  -> crítico
//   <= 180d -> alto
//   <= 365d -> médio
//   > 365d  -> baixo
// Sem data_distribuicao -> sem_dados.
function calcularRiscoPrescricao(
  dataDistribuicao: string | null,
): RiscoPrescricao {
  if (!dataDistribuicao) {
    return {
      diasRestantes: null,
      dataDistribuicao: null,
      statusRisco: "sem_dados",
    };
  }
  const dist = new Date(dataDistribuicao);
  if (Number.isNaN(dist.getTime())) {
    return {
      diasRestantes: null,
      dataDistribuicao: null,
      statusRisco: "sem_dados",
    };
  }
  const fatal = new Date(
    dist.getFullYear() + 5,
    dist.getMonth(),
    dist.getDate(),
  );
  const hoje = new Date();
  const diasRestantes = Math.round(
    (fatal.getTime() - hoje.getTime()) / DIAS_MS,
  );

  let statusRisco: RiscoPrescricao["statusRisco"];
  if (diasRestantes <= 90) statusRisco = "critico";
  else if (diasRestantes <= 180) statusRisco = "alto";
  else if (diasRestantes <= 365) statusRisco = "medio";
  else statusRisco = "baixo";

  return { diasRestantes, dataDistribuicao, statusRisco };
}

// (b) Bens com restrição suspeita (impenhorabilidade provável).
function calcularBensComRestricao(bens: Bem[]): BemComRestricao[] {
  const out: BemComRestricao[] = [];
  for (const b of bens) {
    const det = (b as Bem & {
      restricao_suspeita?: boolean | null;
      restricao_motivo?: string | null;
    });
    if (!det.restricao_suspeita) continue;
    out.push({
      bemId: b.id,
      tipo: b.tipo,
      titulo: b.titulo,
      motivo: det.restricao_motivo ?? "restricao_nao_especificada",
      valorBrl: Number(b.valor_estimado_brl) || 0,
    });
  }
  // Maior valor primeiro — caso o usuário decida priorizar exclusão.
  out.sort((a, b) => b.valorBrl - a.valorBrl);
  return out;
}

// (c) Concentração patrimonial — Herfindahl + maior bem.
function calcularConcentracaoPatrimonial(
  bens: Bem[],
): ConcentracaoPatrimonial {
  if (bens.length === 0) {
    return {
      topBemPct: 0,
      topBemTitulo: "",
      topBemTipo: "veiculo",
      indiceHerfindahl: 0,
    };
  }
  let total = 0;
  for (const b of bens) total += Number(b.valor_estimado_brl) || 0;

  if (total === 0) {
    return {
      topBemPct: 0,
      topBemTitulo: bens[0].titulo,
      topBemTipo: bens[0].tipo,
      indiceHerfindahl: 0,
    };
  }

  let top = bens[0];
  let topVal = Number(bens[0].valor_estimado_brl) || 0;
  let herfindahl = 0;
  for (const b of bens) {
    const v = Number(b.valor_estimado_brl) || 0;
    const share = v / total;
    herfindahl += share * share;
    if (v > topVal) {
      top = b;
      topVal = v;
    }
  }

  return {
    topBemPct: Math.round((topVal / total) * 1000) / 10, // 1 casa decimal
    topBemTitulo: top.titulo,
    topBemTipo: top.tipo,
    indiceHerfindahl: Math.round(herfindahl * 1000) / 1000,
  };
}

// (d) Distribuição geográfica.
// Bens com cidade/uf no banco -> agrupa direto.
// Bens SEM cidade/uf -> gera mock estável via hash do bemId.
const CIDADES_MOCK_SP: { cidade: string; uf: string }[] = [
  { cidade: "São Paulo", uf: "SP" },
  { cidade: "São Paulo", uf: "SP" },
  { cidade: "São Paulo", uf: "SP" },
  { cidade: "Sorocaba", uf: "SP" },
  { cidade: "Campinas", uf: "SP" },
  { cidade: "Santos", uf: "SP" },
  { cidade: "Ribeirão Preto", uf: "SP" },
  { cidade: "São José dos Campos", uf: "SP" },
];

const CIDADES_MOCK_FORA: { cidade: string; uf: string }[] = [
  { cidade: "Rio de Janeiro", uf: "RJ" },
  { cidade: "Belo Horizonte", uf: "MG" },
  { cidade: "Curitiba", uf: "PR" },
  { cidade: "Goiânia", uf: "GO" },
];

function rotularBemMock(bemId: number): { cidade: string; uf: string } {
  // Hash determinista: 80% cai em SP (lista SP tem repetição de São Paulo),
  // 20% sai pra outras UFs.
  const h = Math.abs(bemId * 2654435761) >>> 0; // Knuth multiplicative hash
  if (h % 5 === 0) {
    return CIDADES_MOCK_FORA[h % CIDADES_MOCK_FORA.length];
  }
  return CIDADES_MOCK_SP[h % CIDADES_MOCK_SP.length];
}

// Exposta pra reuso fora do dashboard-do-caso (ex.: Painel da Equipe e do
// Cliente reaproveitam a mesma agregação por UF/cidade). A assinatura pega
// só os campos lidos — assim o Painel da Plataforma (que carrega só um
// subset das colunas de bens_encontrados) consegue chamar sem cast.
export type BemParaLocalizacao = Pick<Bem, "id" | "valor_estimado_brl"> & {
  cidade?: string | null;
  uf?: string | null;
};
export function calcularDistribuicaoGeografica(
  bens: BemParaLocalizacao[],
): DistribuicaoGeografica[] {
  type Bucket = { cidade: string; uf: string; valor: number; ids: number[] };
  const acc = new Map<string, Bucket>();
  for (const b of bens) {
    let cidade = (b.cidade ?? "").trim();
    let uf = (b.uf ?? "").trim();
    if (!cidade || !uf) {
      const mock = rotularBemMock(b.id);
      cidade = mock.cidade;
      uf = mock.uf;
    }
    const key = `${uf}|${cidade}`;
    const cur = acc.get(key) ?? { cidade, uf, valor: 0, ids: [] };
    cur.valor += Number(b.valor_estimado_brl) || 0;
    cur.ids.push(b.id);
    acc.set(key, cur);
  }
  const out: DistribuicaoGeografica[] = [];
  for (const v of acc.values()) {
    out.push({
      cidade: v.cidade,
      uf: v.uf,
      qtdBens: v.ids.length,
      valorTotalBrl: v.valor,
      bensIds: v.ids,
    });
  }
  out.sort((a, b) => b.valorTotalBrl - a.valorTotalBrl);
  return out;
}

// (e) Vínculos patrimoniais — lê bens tipo 'vinculo'.
function calcularVinculosPatrimoniais(bens: Bem[]): VinculoPatrimonial[] {
  const out: VinculoPatrimonial[] = [];
  for (const b of bens) {
    if (b.tipo !== "vinculo") continue;
    const det = (b.detalhes ?? {}) as Record<string, unknown>;
    const nome =
      (det.nome as string | undefined) ??
      (det.nome_pessoa as string | undefined) ??
      b.titulo;
    const documento =
      (det.documento as string | undefined) ??
      (det.cpf as string | undefined) ??
      (det.cnpj as string | undefined) ??
      "";
    const relacao =
      (det.tipo as string | undefined) ??
      (det.relacao as string | undefined) ??
      "vinculo";
    out.push({
      nome,
      documento,
      relacao,
      temPatrimonio: false, // placeholder pra futuro cruzamento
    });
  }
  return out;
}

// (f) Cronologia processual — 6 marcos canônicos.
type MarcosProcessuais = {
  citacao?: string | null;
  sentenca?: string | null;
  transito_julgado?: string | null;
  inicio_cumprimento?: string | null;
};

function calcularCronologiaCaso(
  dataDistribuicao: string | null,
  marcos: MarcosProcessuais,
  medidas: Medida[],
): CronologiaItem[] {
  // 1ª medida tomada = min(data) das medidas.
  let primeiraMedida: string | null = null;
  for (const m of medidas) {
    if (!m.data) continue;
    const t = new Date(m.data).getTime();
    if (Number.isNaN(t)) continue;
    if (primeiraMedida === null || m.data < primeiraMedida) {
      primeiraMedida = m.data;
    }
  }

  const itens: { evento: string; data: string | null }[] = [
    { evento: "Distribuição", data: dataDistribuicao },
    { evento: "Citação", data: marcos.citacao ?? null },
    { evento: "Sentença", data: marcos.sentenca ?? null },
    { evento: "Trânsito julgado", data: marcos.transito_julgado ?? null },
    { evento: "Início do cumprimento", data: marcos.inicio_cumprimento ?? null },
    { evento: "1ª medida tomada", data: primeiraMedida },
  ];

  return itens.map((it, i) => ({
    evento: it.evento,
    data: it.data,
    completo: !!it.data,
    ordem: i + 1,
  }));
}

// (g) Comparativo com a média do escritório.
async function calcularComparativoEscritorio(
  devedorId: number,
  esteQtdBens: number,
  esteValor: number,
  esteQtdMedidas: number,
): Promise<ComparativoEscritorio> {
  const sb = createAdminClient();

  // Devedores "ativos" no escritório = aqueles que têm pelo menos 1 caso
  // ativo. Lista os devedor_ids dos casos ativos (excluindo este).
  const { data: casosAtivos } = await sb
    .from("casos")
    .select("devedor_id")
    .eq("status", "ativo");

  const outrosIds = new Set<number>();
  for (const c of casosAtivos ?? []) {
    const id = c.devedor_id as number;
    if (id && id !== devedorId) outrosIds.add(id);
  }

  if (outrosIds.size === 0) {
    return {
      qtdBens: { este: esteQtdBens, media: 0 },
      valorPatrimonio: { este: esteValor, media: 0 },
      qtdMedidas: { este: esteQtdMedidas, media: 0 },
    };
  }

  const ids = Array.from(outrosIds);

  // Bens ativos dos outros devedores -> qtd + valor por devedor.
  const { data: bens } = await sb
    .from("bens_encontrados")
    .select("devedor_id, valor_estimado_brl")
    .in("devedor_id", ids)
    .eq("ativo", true);

  const bensPorDevedor = new Map<number, { qtd: number; valor: number }>();
  for (const b of bens ?? []) {
    const did = b.devedor_id as number;
    const cur = bensPorDevedor.get(did) ?? { qtd: 0, valor: 0 };
    cur.qtd += 1;
    cur.valor += Number(b.valor_estimado_brl) || 0;
    bensPorDevedor.set(did, cur);
  }

  // Medidas dos outros devedores: medidas pertencem a casos, casos a
  // devedores. Pega casos -> caso_id por devedor.
  const { data: casosTodos } = await sb
    .from("casos")
    .select("id, devedor_id")
    .in("devedor_id", ids);

  const casoToDevedor = new Map<number, number>();
  for (const c of casosTodos ?? []) {
    casoToDevedor.set(c.id as number, c.devedor_id as number);
  }
  const casoIds = Array.from(casoToDevedor.keys());

  const medidasPorDevedor = new Map<number, number>();
  if (casoIds.length > 0) {
    const { data: medidas } = await sb
      .from("medidas_tomadas")
      .select("caso_id")
      .in("caso_id", casoIds);
    for (const m of medidas ?? []) {
      const did = casoToDevedor.get(m.caso_id as number);
      if (!did) continue;
      medidasPorDevedor.set(did, (medidasPorDevedor.get(did) ?? 0) + 1);
    }
  }

  // Médias sobre TODOS os outros devedores ativos (mesmo que tenha 0 bens).
  const n = outrosIds.size;
  let somaQtd = 0;
  let somaValor = 0;
  let somaMedidas = 0;
  for (const did of outrosIds) {
    const b = bensPorDevedor.get(did);
    if (b) {
      somaQtd += b.qtd;
      somaValor += b.valor;
    }
    somaMedidas += medidasPorDevedor.get(did) ?? 0;
  }

  return {
    qtdBens: {
      este: esteQtdBens,
      media: Math.round((somaQtd / n) * 10) / 10,
    },
    valorPatrimonio: {
      este: esteValor,
      media: Math.round(somaValor / n),
    },
    qtdMedidas: {
      este: esteQtdMedidas,
      media: Math.round((somaMedidas / n) * 10) / 10,
    },
  };
}

// (h) Custo de oportunidade — quanto se gastou vs. quanto dá pra recuperar.
function calcularCustoOportunidade(
  custoAcumuladoBrl: number,
  patrimonioLocalizadoBrl: number,
): CustoOportunidade {
  const valorRecuperavelBrl = patrimonioLocalizadoBrl;
  const razao =
    valorRecuperavelBrl > 0 ? custoAcumuladoBrl / valorRecuperavelBrl : 0;

  let status: CustoOportunidade["status"];
  if (razao < 0.05) status = "bom";
  else if (razao <= 0.15) status = "medio";
  else status = "ruim";

  return {
    custoAcumuladoBrl,
    valorRecuperavelBrl,
    razao: Math.round(razao * 10000) / 10000,
    status,
  };
}

// (i) Próximos atos processuais — MOCK até Themis entregar prazos reais.
// Gera 2-3 atos fictícios estáveis por devedorId. Quando Themis API entregar
// prazos fatais, substituir este helper por uma leitura da API mantendo a
// interface ProximoAtoProcessual.
function calcularProximosAtosProcessuais(
  devedorId: number,
): ProximoAtoProcessual[] {
  // MOCK: pool de atos fictícios. Hash do devedorId rotaciona quais entram
  // pra cada caso ter um set diferente mas estável entre reloads.
  const pool: { ato: string; offsetDias: number }[] = [
    { ato: "Manifestação sobre penhora", offsetDias: 15 },
    { ato: "Audiência de conciliação", offsetDias: 45 },
    { ato: "Embargos à execução", offsetDias: 10 },
    { ato: "Impugnação ao cumprimento de sentença", offsetDias: 30 },
    { ato: "Resposta a cálculo do contador", offsetDias: 20 },
    { ato: "Recurso de agravo", offsetDias: 8 },
  ];

  const h = Math.abs(devedorId * 2654435761) >>> 0;
  const qtd = 2 + (h % 2); // 2 ou 3 atos
  const escolhidos: { ato: string; offsetDias: number }[] = [];
  for (let i = 0; i < qtd; i++) {
    escolhidos.push(pool[(h + i) % pool.length]);
  }

  const hoje = new Date();
  return escolhidos.map((e) => {
    const fatal = new Date(hoje.getTime() + e.offsetDias * DIAS_MS);
    const diasRestantes = e.offsetDias;
    let urgencia: ProximoAtoProcessual["urgencia"];
    if (diasRestantes <= 10) urgencia = "alta";
    else if (diasRestantes <= 30) urgencia = "media";
    else urgencia = "baixa";
    return {
      ato: e.ato,
      prazoFatal: fatal.toISOString().slice(0, 10),
      diasRestantes,
      urgencia,
    };
  });
}

// (j) Sazonalidade — atividade processual nos últimos 12 meses.
function calcularSazonalidadeAtividade(
  medidas: Medida[],
): SazonalidadeAtividade[] {
  type Bucket = { mes: number; ano: number; qtd: number; pos: number };
  const buckets = new Map<string, Bucket>();
  const hoje = new Date();
  const cursor = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  for (let i = 11; i >= 0; i--) {
    const d = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    const key = ymKey(d);
    buckets.set(key, {
      mes: d.getMonth() + 1,
      ano: d.getFullYear(),
      qtd: 0,
      pos: 0,
    });
  }

  for (const m of medidas) {
    if (!m.data) continue;
    const d = new Date(m.data);
    if (Number.isNaN(d.getTime())) continue;
    const key = ymKey(d);
    const b = buckets.get(key);
    if (!b) continue; // fora da janela de 12 meses
    b.qtd += 1;
    if (m.resultado === "positivo") b.pos += 1;
  }

  const out: SazonalidadeAtividade[] = [];
  for (const b of buckets.values()) {
    out.push({
      mes: b.mes,
      ano: b.ano,
      qtdMedidas: b.qtd,
      qtdPositivas: b.pos,
    });
  }
  // Ordena cronologicamente (mais antigo -> mais recente).
  out.sort((a, b) => a.ano - b.ano || a.mes - b.mes);
  return out;
}

// ============================================================
// V2 — ENTRY POINT
// ============================================================

export async function obterDadosDashboardCasoV2(
  devedorId: number,
): Promise<DashboardCasoV2 | null> {
  const v1 = await obterDadosDashboardCaso(devedorId);
  if (!v1) return null;

  // Pra montar as métricas v2 precisamos do dossiê cru + colunas novas
  // (data_distribuicao, marcos_processuais, restricao_*, cidade, uf).
  // O dossiê já lê bens com SELECT *, então restricao_suspeita,
  // restricao_motivo, cidade e uf vêm junto. Pra casos.data_distribuicao
  // e marcos_processuais precisamos de uma query extra (o select de
  // obterDossie não traz essas colunas).
  const sb = createAdminClient();
  const dossie = await obterDossie(devedorId);
  if (!dossie) return null;

  const [medidas, casosExtra] = await Promise.all([
    buscarMedidasPorDevedor(devedorId),
    sb
      .from("casos")
      .select("id, data_distribuicao, marcos_processuais")
      .eq("devedor_id", devedorId),
  ]);

  // Pra prescrição e cronologia, considera o caso mais antigo distribuído
  // (data_distribuicao mínima). Se nenhum caso tiver, devolve null.
  let dataDistribuicao: string | null = null;
  let marcos: MarcosProcessuais = {};
  for (const c of casosExtra.data ?? []) {
    const dd = (c.data_distribuicao as string | null) ?? null;
    if (dd && (dataDistribuicao === null || dd < dataDistribuicao)) {
      dataDistribuicao = dd;
      marcos = (c.marcos_processuais as MarcosProcessuais | null) ?? {};
    }
  }

  const riscoPrescricao = calcularRiscoPrescricao(dataDistribuicao);
  const bensComRestricao = calcularBensComRestricao(dossie.bens);
  const concentracaoPatrimonial = calcularConcentracaoPatrimonial(dossie.bens);
  const distribuicaoGeografica = calcularDistribuicaoGeografica(dossie.bens);
  const vinculosPatrimoniais = calcularVinculosPatrimoniais(dossie.bens);
  const cronologiaCaso = calcularCronologiaCaso(
    dataDistribuicao,
    marcos,
    medidas,
  );
  const comparativoEscritorio = await calcularComparativoEscritorio(
    devedorId,
    v1.kpis.qtdBens,
    v1.kpis.patrimonioLocalizadoBrl,
    v1.kpis.totalMedidasTomadas,
  );
  const custoOportunidade = calcularCustoOportunidade(
    v1.kpis.custoAcumuladoBrl,
    v1.kpis.patrimonioLocalizadoBrl,
  );
  const proximosAtosProcessuais = calcularProximosAtosProcessuais(devedorId);
  const sazonalidadeAtividade = calcularSazonalidadeAtividade(medidas);

  return {
    ...v1,
    riscoPrescricao,
    bensComRestricao,
    concentracaoPatrimonial,
    distribuicaoGeografica,
    vinculosPatrimoniais,
    cronologiaCaso,
    comparativoEscritorio,
    custoOportunidade,
    proximosAtosProcessuais,
    sazonalidadeAtividade,
  };
}
