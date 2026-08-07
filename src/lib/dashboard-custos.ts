// Monitor de Custos — agregadores da tela gerencial de gasto com APIs
// pagas (server-only). Fonte REAL: tabela `custos` (cada consulta paga
// grava uma linha via registrarCusto, com devedor_id desde a migration
// 006 e credor_id desde a 020).
//
// Era mock deterministico (PRNG) ate 2026-07-02 — trocado por leitura
// real quando a Assertiva entrou (Sprint 3). Os agregadores continuam
// puros: a UI nao mudou.

import { createAdminClient } from "@/lib/supabase/admin";
import { ROTULO_TIPO } from "@/lib/custos";
import { perfisPorEmail, nomeOuEmail } from "@/lib/perfis";

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

// Devedor traz o breakdown por API e a última consulta — usado no painel
// do cliente, onde queremos mostrar onde cada real foi gasto em cima de
// CADA devedor do portfólio, não só por API agregada.
export type GastoPorDevedor = {
  id: string;
  nome: string;
  totalBrl: number;
  consultas: number;
  ultimaConsulta: string; // ISO
  porAPI: GastoPorEntidade[]; // ordenado por totalBrl desc
};

export type GastoPorDia = { dia: string; totalBrl: number };

export type PeriodoCustos = "tudo" | "7d" | "30d" | "90d" | "mes" | "ano";

export type FiltrosCustos = {
  credorId?: number;
  periodo?: PeriodoCustos;
};

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
  porDevedor: GastoPorDevedor[];
  consultas: ConsultaCusto[]; // últimas 50
};

// ============================================================
// CONFIG
// ============================================================

// Mesmo teto usado no KPIGastoAPIs do Painel — quando virar configuração
// por escritório, mover pra `preferencias`.
const LIMITE_MES_BRL = 5000;

// Registros mais antigos que isso ficam fora da leitura (o monitor olha
// tendência recente; histórico completo vive no banco).
const MAX_LINHAS = 5000;

// ============================================================
// LEITURA REAL — custos + nomes de credor/devedor/advogado
// ============================================================

interface CustoRow {
  id: number;
  email: string;
  tipo: string;
  descricao: string;
  custo: number;
  criado_em: string;
  devedor_id: number | null;
  credor_id: number | null;
}

async function lerConsultasReais(): Promise<ConsultaCusto[]> {
  const sb = createAdminClient();

  // 1. Custos crus (mais recentes primeiro). credor_id pode nao existir
  //    antes da migration 020 — fallback sem a coluna.
  let rows: CustoRow[] = [];
  const { data, error } = await sb
    .from("custos")
    .select("id, email, tipo, descricao, custo, criado_em, devedor_id, credor_id")
    .order("criado_em", { ascending: false })
    .limit(MAX_LINHAS);
  if (!error && data) {
    rows = data as unknown as CustoRow[];
  } else {
    const legado = await sb
      .from("custos")
      .select("id, email, tipo, descricao, custo, criado_em, devedor_id")
      .order("criado_em", { ascending: false })
      .limit(MAX_LINHAS);
    rows = ((legado.data ?? []) as unknown as Omit<CustoRow, "credor_id">[]).map(
      (r) => ({ ...r, credor_id: null }),
    );
  }
  if (rows.length === 0) return [];

  // 2. Nomes em lote: credores, devedores, perfis.
  const credorIds = Array.from(
    new Set(rows.map((r) => r.credor_id).filter((x): x is number => !!x)),
  );
  const devedorIds = Array.from(
    new Set(rows.map((r) => r.devedor_id).filter((x): x is number => !!x)),
  );

  const nomesCredor = new Map<number, string>();
  if (credorIds.length > 0) {
    const { data: creds } = await sb
      .from("credores")
      .select("id, nome")
      .in("id", credorIds);
    for (const c of creds ?? []) {
      nomesCredor.set(c.id as number, c.nome as string);
    }
  }

  const nomesDevedor = new Map<number, string>();
  if (devedorIds.length > 0) {
    const { data: devs } = await sb
      .from("devedores")
      .select("id, nome")
      .in("id", devedorIds);
    for (const d of devs ?? []) {
      nomesDevedor.set(d.id as number, d.nome as string);
    }
  }

  const mapaPerfis = await perfisPorEmail();

  // 3. Monta o shape que os agregadores esperam.
  return rows.map((r) => ({
    id: r.id,
    data: r.criado_em,
    advogadoEmail: r.email,
    advogadoNome: nomeOuEmail(r.email, mapaPerfis),
    credorId: r.credor_id ?? 0,
    credorNome: r.credor_id
      ? (nomesCredor.get(r.credor_id) ?? `Credor ${r.credor_id}`)
      : "—",
    devedorNome: r.devedor_id
      ? (nomesDevedor.get(r.devedor_id) ?? `Devedor ${r.devedor_id}`)
      : "—",
    apiTipo: r.tipo,
    apiRotulo: ROTULO_TIPO[r.tipo] ?? r.tipo,
    custoBrl: Number(r.custo) || 0,
    contexto: "dossie" as const,
  }));
}

// ============================================================
// AGREGADORES PUROS (inalterados desde a versão mock)
// ============================================================

function diaISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

function agruparPorDevedor(consultas: ConsultaCusto[]): GastoPorDevedor[] {
  const acc = new Map<
    string,
    {
      nome: string;
      totalBrl: number;
      consultas: number;
      ultimaConsulta: string;
      porAPI: Map<string, { nome: string; totalBrl: number; consultas: number }>;
    }
  >();
  for (const c of consultas) {
    // Custos sem devedor vinculado nao entram no ranking por devedor.
    if (c.devedorNome === "—") continue;
    const id = c.devedorNome;
    const cur =
      acc.get(id) ?? {
        nome: c.devedorNome,
        totalBrl: 0,
        consultas: 0,
        ultimaConsulta: c.data,
        porAPI: new Map(),
      };
    cur.totalBrl += c.custoBrl;
    cur.consultas += 1;
    if (c.data > cur.ultimaConsulta) cur.ultimaConsulta = c.data;
    const api = cur.porAPI.get(c.apiTipo) ?? {
      nome: c.apiRotulo,
      totalBrl: 0,
      consultas: 0,
    };
    api.totalBrl += c.custoBrl;
    api.consultas += 1;
    cur.porAPI.set(c.apiTipo, api);
    acc.set(id, cur);
  }
  const out: GastoPorDevedor[] = [];
  for (const [id, v] of acc.entries()) {
    const porAPI: GastoPorEntidade[] = [];
    for (const [apiId, a] of v.porAPI.entries()) {
      porAPI.push({
        id: apiId,
        nome: a.nome,
        totalBrl: a.totalBrl,
        consultas: a.consultas,
      });
    }
    porAPI.sort((a, b) => b.totalBrl - a.totalBrl);
    out.push({
      id,
      nome: v.nome,
      totalBrl: v.totalBrl,
      consultas: v.consultas,
      ultimaConsulta: v.ultimaConsulta,
      porAPI,
    });
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
// FILTRO POR PERÍODO
// ============================================================

function corteParaPeriodo(periodo: PeriodoCustos | undefined): string | null {
  if (!periodo || periodo === "tudo") return null;

  const agora = new Date();
  const corte = new Date(agora);

  switch (periodo) {
    case "7d":
      corte.setDate(agora.getDate() - 7);
      return corte.toISOString();
    case "30d":
      corte.setDate(agora.getDate() - 30);
      return corte.toISOString();
    case "90d":
      corte.setDate(agora.getDate() - 90);
      return corte.toISOString();
    case "mes": {
      const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0, 0);
      return inicio.toISOString();
    }
    case "ano": {
      const inicio = new Date(agora.getFullYear(), 0, 1, 0, 0, 0, 0);
      return inicio.toISOString();
    }
    default:
      return null;
  }
}

// ============================================================
// ENTRY POINT
// ============================================================

export async function obterDashboardCustos(
  opts?: FiltrosCustos,
): Promise<DashboardCustos> {
  const todas = await lerConsultasReais();

  const corte = corteParaPeriodo(opts?.periodo);
  const consultas = todas.filter((c) => {
    if (opts?.credorId !== undefined && c.credorId !== opts.credorId) return false;
    if (corte && c.data < corte) return false;
    return true;
  });

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
  const porDevedor = agruparPorDevedor(consultas);

  return {
    totalMesBrl: totalMes(consultas),
    limiteMesBrl: LIMITE_MES_BRL,
    totalConsultas: consultas.length,
    totalAdvogados: porAdvogado.length,
    totalClientes: porCliente.filter((c) => c.id !== 0).length,
    apiMaisUsada: apiMaisUsadaRotulo(porAPI),
    gastosPorDia: agruparPorDia(consultas),
    porCliente,
    porAdvogado,
    porAPI,
    porDevedor,
    consultas: ultimas50(consultas),
  };
}

// Clientes (credores) presentes na tabela de custos — alimenta o dropdown
// do filtro do monitor. Ordenado por nome.
export async function listarClientesParaFiltroCustos(): Promise<
  { id: number; nome: string }[]
> {
  const sb = createAdminClient();
  try {
    const { data: custos } = await sb
      .from("custos")
      .select("credor_id")
      .not("credor_id", "is", null)
      .limit(MAX_LINHAS);
    const ids = Array.from(
      new Set((custos ?? []).map((c) => c.credor_id as number)),
    );
    if (ids.length === 0) return [];
    const { data: creds } = await sb
      .from("credores")
      .select("id, nome")
      .in("id", ids);
    return (creds ?? [])
      .map((c) => ({ id: c.id as number, nome: c.nome as string }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  } catch {
    return [];
  }
}
