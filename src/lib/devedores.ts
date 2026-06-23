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
  const { data: credores } = await sb
    .from("credores")
    .select("id, tipo, documento, nome, email_contato, telefone, observacoes");
  if (!credores) return [];

  const result: CredorListagem[] = [];
  for (const c of credores) {
    // Casos deste credor (id + devedor_id) — origem dos agregados.
    const { data: casos } = await sb
      .from("casos")
      .select("id, devedor_id")
      .eq("credor_id", c.id as number);

    const casosList = casos ?? [];
    const total_casos = casosList.length;
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
      `id, numero_processo, valor_credito_brl, status, responsavel_email,
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
