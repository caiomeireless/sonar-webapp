// Dashboard do Caso — agregacao DO LADO SERVIDOR pra alimentar a view.
// Server-only (usa createAdminClient). Reutiliza obterDossie pra bens+casos
// e consulta diretamente custos + medidas_tomadas pra metricas operacionais.
//
// Toda metrica devolvida ja vem pronta pra UI consumir — a view NAO faz
// agregacao no client.

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
// TIPOS de saida
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
  baseline: number; // baseline arbitrario de mercado (heuristica)
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
  // Determinismo de saida: ordena por tipo, depois resultado.
  out.sort((a, b) => a.tipo.localeCompare(b.tipo) || a.resultado.localeCompare(b.resultado));
  return out;
}

function calcularLinhaTempo(
  casos: CasoResumo[],
  medidas: Medida[],
): DashboardLinhaTempoItem[] {
  const meses = ultimos12Meses();
  // Cobranca = valor_credito_brl distribuido como valor "em aberto" no mes
  // do caso (heuristica DEMO: como nao temos data de abertura por caso na
  // CasoResumo, divide igualmente nos 12 meses). Substituir quando a data
  // de abertura entrar no schema.
  const totalCobranca = calcularCobrancaTotal(casos);
  const cobrancaMensal = meses.length > 0 ? totalCobranca / meses.length : 0;

  // Recuperacao = soma de valor_recuperado_brl agrupado por YYYY-MM da data
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
  // Tempo medio entre 'peticao_penhora' e 'penhora_efetivada' do mesmo caso.
  // Para cada caso, pareia a peticao mais antiga ainda nao-pareada com a
  // proxima penhora_efetivada subsequente.
  const baseline = 120; // dias — heuristica de mercado (varia muito por vara)
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

  // 1) Sem atividade ha 90 dias?
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
      motivo: "Sem atividade ha 90 dias",
    };
  }

  // 2) Imovel sem matricula validada?
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
      acao: "Solicitar matricula no ARISP",
      motivo: "Imovel localizado sem matricula validada",
    };
  }

  // 3) Participacao societaria sem CNPJ?
  const empresaSemCnpj = bens.some((b) => {
    if (b.tipo !== "empresa") return false;
    const det = (b.detalhes ?? {}) as Record<string, unknown>;
    const cnpj = (det.cnpj as string | undefined) ?? "";
    return !cnpj.trim();
  });
  if (empresaSemCnpj) {
    return {
      acao: "Cruzar com Receita Federal",
      motivo: "Participacao societaria sem CNPJ",
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
    acao: "Sem proxima acao clara — revisar dossie completo",
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
