// Reader functions de devedores PARA O ADVOGADO — server-only.
// Sem regra de visibilidade — equipe vê TODOS os devedores rastreados.
import { createAdminClient } from "@/lib/supabase/admin";

export interface CredorResumo {
  id: number;
  nome: string;
}

// Listagem de credores (clientes) com agregados — alimenta a carteira
// hierárquica do escritório (1 entrada por cliente).
export interface CredorListagem {
  id: number;
  tipo: "PF" | "PJ";
  documento: string;
  nome: string;
  email_contato: string | null;
  telefone: string | null;
  observacoes: string | null;
  // agregados
  total_casos: number;
  total_devedores: number; // distintos
  total_bens: number;
  valor_estimado_total_brl: number;
  ultima_consulta_em: string | null;
}

// Visão "credor + casos" pro drill-down da carteira (nível 2).
export interface CredorComCasos {
  credor: {
    id: number;
    nome: string;
    documento: string;
    tipo: "PF" | "PJ";
    email_contato: string | null;
    telefone: string | null;
    observacoes: string | null;
  };
  casos: Array<{
    caso_id: number;
    numero_processo: string | null;
    pasta_themis: string | null;
    valor_credito_brl: number | null;
    status: string;
    responsavel_email: string | null;
    devedor: { id: number; tipo: "PF" | "PJ"; documento: string; nome: string };
    total_bens: number;
    valor_estimado_brl: number;
    ultima_consulta_em: string | null;
  }>;
  totalCasos: number;
  totalDevedores: number;
  totalBens: number;
  valorEstimadoTotal: number;
}

export interface DevedorListagemAdmin {
  id: number;
  tipo: "PF" | "PJ";
  documento: string;
  nome: string;
  total_bens: number;
  valor_estimado_total_brl: number;
  ultima_consulta_em: string | null;
  casos_count: number;
  criado_em: string;
  // Credores vinculados ao devedor via casos.
  // Pode ter 0 (devedor sem caso), 1 ou vários (múltiplos credores).
  credores: CredorResumo[];
}

// ============================================================
// VISÃO "DEVEDORES" — busca direta + paginação (redesign 2026-07-02).
// 1 SELECT paginado de devedores (busca server-side por nome/documento)
// + 2 SELECTs batched (casos c/ credor + bens) agregados em JS.
// Sem N+1: 3 queries por página, qualquer tamanho de base.
// ============================================================

export const DEVEDORES_POR_PAGINA = 30;

export type OrdemDevedores = "recentes" | "valor" | "nome";
export type FiltroRastreio = "todos" | "com-bens" | "aguardando";

export interface DevedorBusca {
  id: number;
  tipo: "PF" | "PJ";
  documento: string;
  nome: string;
  total_bens: number;
  valor_estimado_total_brl: number;
  /** Soma do débito judicial (valor_credito_brl) de todos os casos. */
  debito_total_brl: number;
  ultima_consulta_em: string | null;
  casos_count: number;
  credores: CredorResumo[];
}

export interface ListagemDevedores {
  devedores: DevedorBusca[];
  total: number;
  pagina: number;
  porPagina: number;
}

export async function listarDevedoresPaginado(opts: {
  q?: string;
  tipo?: "PF" | "PJ" | "todos";
  rastreio?: FiltroRastreio;
  ordem?: OrdemDevedores;
  pagina?: number;
}): Promise<ListagemDevedores> {
  const sb = createAdminClient();
  const pagina = Math.max(1, Math.floor(opts.pagina ?? 1) || 1);
  const inicio = (pagina - 1) * DEVEDORES_POR_PAGINA;
  const fim = inicio + DEVEDORES_POR_PAGINA - 1;

  let query = sb
    .from("devedores")
    .select("id, tipo, documento, nome, ultima_consulta_em, criado_em", {
      count: "exact",
    })
    .eq("eh_demo", false);

  const termo = (opts.q ?? "").trim();
  if (termo) {
    // Nome, documento OU numero de processo (principal e desdobramentos —
    // ambos viram linhas em `casos`, entao um unico ilike cobre os dois).
    // Escapa % e , (delimitadores do PostgREST .or).
    const escaped = termo.replace(/[%,]/g, " ").trim();
    const digitos = escaped.replace(/\D/g, "");

    // Termo com cara de processo/pasta: resolve os devedores dos casos
    // que batem ANTES da query principal e injeta os ids no .or.
    // Processo pede 7+ digitos; pasta do Themis ("1214A - 142") casa com
    // qualquer termo de 3+ chars que contenha digito.
    let idsPorProcesso: number[] = [];
    const pareceProcesso = digitos.length >= 7;
    const parecePasta = escaped.length >= 3 && /\d/.test(escaped);
    if (pareceProcesso || parecePasta) {
      const clausulasCaso = [];
      if (pareceProcesso) clausulasCaso.push(`numero_processo.ilike.%${escaped}%`);
      if (parecePasta) clausulasCaso.push(`pasta_themis.ilike.%${escaped}%`);
      let { data: casosMatch, error } = await sb
        .from("casos")
        .select("devedor_id")
        .or(clausulasCaso.join(","))
        .eq("eh_demo", false)
        .limit(200);
      // pasta_themis chega na mig 022 — retry so por processo se faltar.
      if (error && pareceProcesso) {
        const retry = await sb
          .from("casos")
          .select("devedor_id")
          .ilike("numero_processo", `%${escaped}%`)
          .eq("eh_demo", false)
          .limit(200);
        casosMatch = retry.data;
      }
      idsPorProcesso = Array.from(
        new Set((casosMatch ?? []).map((c) => c.devedor_id as number)),
      );
    }

    const clausulas = [`nome.ilike.%${escaped}%`];
    if (digitos.length >= 3) clausulas.push(`documento.ilike.%${digitos}%`);
    if (idsPorProcesso.length > 0) {
      clausulas.push(`id.in.(${idsPorProcesso.join(",")})`);
    }
    query = query.or(clausulas.join(","));
  }
  if (opts.tipo === "PF" || opts.tipo === "PJ") {
    query = query.eq("tipo", opts.tipo);
  }

  // Ordenação server-side. "valor" depende dos agregados de bens (pós-
  // batch), então nesse modo ordena a página em JS — aproximação boa o
  // bastante; ordenar globalmente por valor pede view/RPC (Sprint perf).
  const ordem = opts.ordem ?? "recentes";
  if (ordem === "nome") {
    query = query.order("nome", { ascending: true });
  } else {
    query = query.order("ultima_consulta_em", {
      ascending: false,
      nullsFirst: false,
    });
  }

  const { data: devs, count } = await query.range(inicio, fim);
  const total = count ?? 0;
  if (!devs || devs.length === 0) {
    return { devedores: [], total, pagina, porPagina: DEVEDORES_POR_PAGINA };
  }

  const ids = devs.map((d) => d.id as number);

  // Batch 1: casos reais (conta + credores + débito judicial).
  const { data: casos } = await sb
    .from("casos")
    .select("id, devedor_id, pasta_themis, valor_credito_brl, credor:credores(id, nome)")
    .in("devedor_id", ids)
    .eq("eh_demo", false)
    .limit(1000);
  const casosPorDev = new Map<number, number>();
  // Débito deduplica por pasta do Themis: principal + desdobramentos da
  // mesma pasta carregam o MESMO débito — somar tudo dobraria a dívida.
  const debitoPorPasta = new Map<number, Map<string, number>>();
  const credoresPorDev = new Map<number, Map<number, CredorResumo>>();
  for (const c of casos ?? []) {
    const did = c.devedor_id as number;
    casosPorDev.set(did, (casosPorDev.get(did) ?? 0) + 1);
    const chave = (c.pasta_themis as string | null) ?? `caso:${c.id}`;
    const valor = Number(c.valor_credito_brl) || 0;
    const pastas = debitoPorPasta.get(did) ?? new Map<string, number>();
    pastas.set(chave, Math.max(pastas.get(chave) ?? 0, valor));
    debitoPorPasta.set(did, pastas);
    const cred = c.credor as unknown as CredorResumo | null;
    if (cred && typeof cred.id === "number") {
      const m = credoresPorDev.get(did) ?? new Map<number, CredorResumo>();
      m.set(cred.id, { id: cred.id, nome: cred.nome });
      credoresPorDev.set(did, m);
    }
  }
  const debitoPorDev = new Map<number, number>();
  for (const [did, pastas] of debitoPorPasta) {
    let total = 0;
    for (const v of pastas.values()) total += v;
    debitoPorDev.set(did, total);
  }

  // Batch 2: bens ativos (count + soma).
  const { data: bens } = await sb
    .from("bens_encontrados")
    .select("devedor_id, valor_estimado_brl")
    .in("devedor_id", ids)
    .eq("ativo", true)
    .limit(2000);
  const bensPorDev = new Map<number, { n: number; valor: number }>();
  for (const b of bens ?? []) {
    const did = b.devedor_id as number;
    const cur = bensPorDev.get(did) ?? { n: 0, valor: 0 };
    cur.n += 1;
    cur.valor += Number(b.valor_estimado_brl) || 0;
    bensPorDev.set(did, cur);
  }

  let lista: DevedorBusca[] = devs.map((d) => {
    const id = d.id as number;
    const agregado = bensPorDev.get(id) ?? { n: 0, valor: 0 };
    const credores = Array.from(
      (credoresPorDev.get(id) ?? new Map()).values(),
    ) as CredorResumo[];
    credores.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return {
      id,
      tipo: d.tipo as "PF" | "PJ",
      documento: d.documento as string,
      nome: d.nome as string,
      total_bens: agregado.n,
      valor_estimado_total_brl: agregado.valor,
      debito_total_brl: debitoPorDev.get(id) ?? 0,
      ultima_consulta_em: (d.ultima_consulta_em as string | null) ?? null,
      casos_count: casosPorDev.get(id) ?? 0,
      credores,
    };
  });

  // Filtro de rastreio pós-agregação (depende de bens).
  if (opts.rastreio === "com-bens") {
    lista = lista.filter((d) => d.total_bens > 0);
  } else if (opts.rastreio === "aguardando") {
    lista = lista.filter((d) => d.total_bens === 0);
  }
  if (ordem === "valor") {
    lista.sort(
      (a, b) => b.valor_estimado_total_brl - a.valor_estimado_total_brl,
    );
  }

  return { devedores: lista, total, pagina, porPagina: DEVEDORES_POR_PAGINA };
}

// Lista todos os devedores rastreados pelo escritório,
// ordenados por ultima_consulta_em (mais recente primeiro).
export async function listarDevedoresRastreados(): Promise<DevedorListagemAdmin[]> {
  const sb = createAdminClient();
  const { data: devs } = await sb
    .from("devedores")
    .select("id, tipo, documento, nome, ultima_consulta_em, criado_em")
    .order("ultima_consulta_em", { ascending: false, nullsFirst: false });
  if (!devs) return [];

  const result: DevedorListagemAdmin[] = [];
  for (const d of devs) {
    const { data: bens } = await sb
      .from("bens_encontrados")
      .select("valor_estimado_brl")
      .eq("devedor_id", d.id)
      .eq("ativo", true);
    const { count: casosCount } = await sb
      .from("casos")
      .select("*", { count: "exact", head: true })
      .eq("devedor_id", d.id);

    // Credores ligados ao devedor pelos casos (join via credor_id).
    const { data: casosComCredor } = await sb
      .from("casos")
      .select("credor:credores!inner(id, nome)")
      .eq("devedor_id", d.id);

    // Deduplica por id — o mesmo credor pode aparecer em vários casos.
    const credoresMap = new Map<number, CredorResumo>();
    for (const row of casosComCredor ?? []) {
      const cred = row.credor as unknown as CredorResumo | null;
      if (cred && typeof cred.id === "number" && !credoresMap.has(cred.id)) {
        credoresMap.set(cred.id, { id: cred.id, nome: cred.nome });
      }
    }
    const credores = Array.from(credoresMap.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );

    const valor_total = (bens ?? []).reduce(
      (s, b) => s + (Number(b.valor_estimado_brl) || 0),
      0,
    );

    result.push({
      id: d.id as number,
      tipo: d.tipo as "PF" | "PJ",
      documento: d.documento as string,
      nome: d.nome as string,
      total_bens: bens?.length ?? 0,
      valor_estimado_total_brl: valor_total,
      ultima_consulta_em: (d.ultima_consulta_em as string | null) ?? null,
      casos_count: casosCount ?? 0,
      criado_em: d.criado_em as string,
      credores,
    });
  }
  return result;
}

// Lista todos os credores (clientes) do escritório com agregados.
// É o nível 1 da carteira hierárquica: 1 entrada por CLIENTE — em vez
// de uma linha por devedor (que repetia o nome do cliente N vezes).
// Ordenação: maior valor estimado primeiro (cliente "mais quente" no topo).
export async function listarCredoresComResumo(): Promise<CredorListagem[]> {
  const sb = createAdminClient();

  // Caminho rapido: view SQL (migration 017) agrega casos + devedores + bens
  // em 1 SELECT. Antes eram 1 + 3N queries (~151 pra 50 credores, 5-15s).
  // A view ja filtra eh_demo=false e exclui credor sem caso real.
  const { data: viaView, error } = await sb
    .from("credores_com_agregados")
    .select("*")
    .order("valor_estimado_total_brl", { ascending: false });

  if (!error && viaView) {
    return viaView.map((c) => ({
      id: c.id as number,
      tipo: c.tipo as "PF" | "PJ",
      documento: c.documento as string,
      nome: c.nome as string,
      email_contato: (c.email_contato as string | null) ?? null,
      telefone: (c.telefone as string | null) ?? null,
      observacoes: (c.observacoes as string | null) ?? null,
      total_casos: Number(c.total_casos) || 0,
      total_devedores: Number(c.total_devedores) || 0,
      total_bens: Number(c.total_bens) || 0,
      valor_estimado_total_brl: Number(c.valor_estimado_total_brl) || 0,
      ultima_consulta_em: (c.ultima_consulta_em as string | null) ?? null,
    }));
  }

  // Fallback N+1 (migration 017 ainda nao aplicada): mesmo resultado, lento.
  console.warn(
    "[devedores] view credores_com_agregados indisponivel (rode migration 017):",
    error?.message,
  );
  const { data: credores } = await sb
    .from("credores")
    .select("id, tipo, documento, nome, email_contato, telefone, observacoes");
  if (!credores) return [];

  const result: CredorListagem[] = [];
  for (const c of credores) {
    // Casos REAIS deste credor (eh_demo=false). Casos demo nao contam.
    const { data: casos } = await sb
      .from("casos")
      .select("id, devedor_id")
      .eq("credor_id", c.id as number)
      .eq("eh_demo", false);

    const casosList = casos ?? [];
    const total_casos = casosList.length;

    // Credor sem nenhum caso real e' showroom — nao entra na carteira.
    if (total_casos === 0) continue;

    const devedorIds = Array.from(
      new Set(casosList.map((r) => r.devedor_id as number)),
    );
    const total_devedores = devedorIds.length;

    let total_bens = 0;
    let valor_estimado_total_brl = 0;
    let ultima_consulta_em: string | null = null;

    if (devedorIds.length > 0) {
      // Bens dos devedores deste credor (ativos). Inclui valor e timestamp.
      const { data: bens } = await sb
        .from("bens_encontrados")
        .select("valor_estimado_brl, fonte_consultada_em")
        .in("devedor_id", devedorIds)
        .eq("ativo", true);

      const bensList = bens ?? [];
      total_bens = bensList.length;
      for (const b of bensList) {
        valor_estimado_total_brl += Number(b.valor_estimado_brl) || 0;
        const ts = (b.fonte_consultada_em as string | null) ?? null;
        if (ts && (!ultima_consulta_em || ts > ultima_consulta_em)) {
          ultima_consulta_em = ts;
        }
      }
    }

    result.push({
      id: c.id as number,
      tipo: c.tipo as "PF" | "PJ",
      documento: c.documento as string,
      nome: c.nome as string,
      email_contato: (c.email_contato as string | null) ?? null,
      telefone: (c.telefone as string | null) ?? null,
      observacoes: (c.observacoes as string | null) ?? null,
      total_casos,
      total_devedores,
      total_bens,
      valor_estimado_total_brl,
      ultima_consulta_em,
    });
  }

  // Cliente com mais valor estimado primeiro.
  result.sort(
    (a, b) => b.valor_estimado_total_brl - a.valor_estimado_total_brl,
  );
  return result;
}

// Drill-down: pega 1 credor + a lista dos casos (cada caso = 1 devedor).
// Alimenta /equipe/devedores/credor/[id].
export async function obterCredorComCasos(
  credorId: number,
): Promise<CredorComCasos | null> {
  const sb = createAdminClient();

  const { data: credor } = await sb
    .from("credores")
    .select(
      "id, tipo, documento, nome, email_contato, telefone, observacoes",
    )
    .eq("id", credorId)
    .maybeSingle();
  if (!credor) return null;

  const { data: casos } = await sb
    .from("casos")
    .select(
      `id, numero_processo, pasta_themis, valor_credito_brl, status, responsavel_email,
       devedor:devedores!inner(id, tipo, documento, nome)`,
    )
    .eq("credor_id", credorId);

  const casosOut: CredorComCasos["casos"] = [];
  const devedoresDistintos = new Set<number>();
  let totalBens = 0;
  let valorEstimadoTotal = 0;

  for (const c of casos ?? []) {
    const dev = c.devedor as unknown as {
      id: number;
      tipo: "PF" | "PJ";
      documento: string;
      nome: string;
    } | null;
    if (!dev) continue;

    devedoresDistintos.add(dev.id);

    const { data: bens } = await sb
      .from("bens_encontrados")
      .select("valor_estimado_brl, fonte_consultada_em")
      .eq("devedor_id", dev.id)
      .eq("ativo", true);

    const bensList = bens ?? [];
    let valorCaso = 0;
    let ultimaCaso: string | null = null;
    for (const b of bensList) {
      valorCaso += Number(b.valor_estimado_brl) || 0;
      const ts = (b.fonte_consultada_em as string | null) ?? null;
      if (ts && (!ultimaCaso || ts > ultimaCaso)) ultimaCaso = ts;
    }

    totalBens += bensList.length;
    valorEstimadoTotal += valorCaso;

    casosOut.push({
      caso_id: c.id as number,
      numero_processo: (c.numero_processo as string | null) ?? null,
      pasta_themis: (c.pasta_themis as string | null) ?? null,
      valor_credito_brl: (c.valor_credito_brl as number | null) ?? null,
      status: (c.status as string) ?? "ativo",
      responsavel_email: (c.responsavel_email as string | null) ?? null,
      devedor: dev,
      total_bens: bensList.length,
      valor_estimado_brl: valorCaso,
      ultima_consulta_em: ultimaCaso,
    });
  }

  // Caso de maior valor estimado primeiro.
  casosOut.sort((a, b) => b.valor_estimado_brl - a.valor_estimado_brl);

  return {
    credor: {
      id: credor.id as number,
      nome: credor.nome as string,
      documento: credor.documento as string,
      tipo: credor.tipo as "PF" | "PJ",
      email_contato: (credor.email_contato as string | null) ?? null,
      telefone: (credor.telefone as string | null) ?? null,
      observacoes: (credor.observacoes as string | null) ?? null,
    },
    casos: casosOut,
    totalCasos: casosOut.length,
    totalDevedores: devedoresDistintos.size,
    totalBens,
    valorEstimadoTotal,
  };
}
