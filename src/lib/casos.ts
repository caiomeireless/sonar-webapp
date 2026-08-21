// Reader functions de casos/bens — server-only, usa admin client.
// Mostra dossiê com regra de visibilidade do cliente: ele vê apenas
// os devedores dos casos onde ELE é o email_contato do credor.
import { createAdminClient } from "@/lib/supabase/admin";
import type { TipoBem, FonteBusca } from "./mock-fixtures";
import {
  calcularDistribuicaoGeografica,
  type DistribuicaoGeografica,
} from "./distribuicao-bens";

// Juízo (vara/comarca/UF/gênero/classe da ação). O overlay MOCK que
// preenchia isso a partir de CASOS_DEMO foi REMOVIDO (08/08 — misturava
// dado fictício com processo real); o campo fica undefined até vir do
// Themis/DataJud de verdade.
export type JuizoInfo = {
  vara: number;
  classeVara: string;
  comarca: string;
  uf: string;
  generoJuiz: "M" | "F";
  classeAcao: string;
};

// ============================================================
// TIPOS expostos pras páginas
// ============================================================

export interface DevedorResumo {
  id: number;
  tipo: "PF" | "PJ";
  documento: string;
  nome: string;
}

export interface DevedorCompleto extends DevedorResumo {
  data_nascimento: string | null;
  nome_mae: string | null;
  rg: string | null;
  email: string | null;
  telefone: string | null;
  redes_sociais: string | null;
  /** Mapa campo -> fonte ('assertiva' | 'themis' | 'manual'). Migration 021. */
  origem_campos: Record<string, string>;
  ultima_consulta_em: string | null;
  criado_em: string;
}

export interface Bem {
  id: number;
  devedor_id: number;
  tipo: TipoBem;
  fonte: FonteBusca;
  fonte_consultada_em: string;
  titulo: string;
  detalhes: Record<string, unknown>;
  valor_estimado_brl: number | null;
  ativo: boolean;
}

export interface CasoResumo {
  id: number;
  numero_processo: string | null;
  /** Pasta REAL do Themis (ex.: "1214A - 142") — mig 022. Opcional pra
      não quebrar mocks/demo que antecedem a coluna. */
  pasta_themis?: string | null;
  valor_credito_brl: number | null;
  status: "ativo" | "pausado" | "encerrado" | "satisfeito";
  observacoes: string | null;
  responsavel_email: string | null;
  credor: { id: number; nome: string; documento: string; tipo: "PF" | "PJ" };
  // WORKAROUND DEMO: hidratado a partir do mock CASOS_DEMO em obterDossie.
  // Sem 2: vira do Themis API.
  juizo?: JuizoInfo;
}

export interface CasoListagem {
  caso_id: number;
  numero_processo: string | null;
  /** Pasta REAL do Themis — mig 022 (fallback: caso interno). */
  pasta_themis?: string | null;
  valor_credito_brl: number | null;
  status: string;
  devedor: DevedorResumo;
  total_bens: number;
  valor_estimado_total_brl: number;
  ultima_consulta_em: string | null;
  // WORKAROUND DEMO: hidratado via overlay do mock; Sem 2 vira do Themis API.
  juizo?: JuizoInfo;
}

export interface Dossie {
  devedor: DevedorCompleto;
  casos: CasoResumo[];
  bens: Bem[];
  // Agregados convenientes pra renderizar header
  total_bens: number;
  valor_estimado_total_brl: number;
  por_tipo: Record<TipoBem, Bem[]>;
}

// Processo "vindo do Themis" — no demo (Dia 4) lê da tabela `casos`.
// Quando Themis real entrar (Sem 2), substituir por chamada à API
// preservando esta interface.
export interface ProcessoThemis {
  caso_id: number;
  numero_processo: string | null;
  /** Pasta REAL do Themis (ex.: "1214A - 142") — mig 022. */
  pasta_themis: string | null;
  valor_credito_brl: number | null;
  status: "ativo" | "pausado" | "encerrado" | "satisfeito";
  observacoes: string | null;
  responsavel_email: string | null;
  recebido_em: string;
  credor: { id: number; nome: string; documento: string; tipo: "PF" | "PJ" };
  devedor: { id: number; tipo: "PF" | "PJ"; documento: string; nome: string };
  total_bens: number;
  ja_rastreado: boolean;
}

// ============================================================
// HELPERS
// ============================================================

function agruparPorTipo(bens: Bem[]): Record<TipoBem, Bem[]> {
  const grupos: Record<TipoBem, Bem[]> = {
    veiculo: [],
    imovel: [],
    empresa: [],
    processo_credito: [],
    endereco: [],
    vinculo: [],
  };
  for (const b of bens) grupos[b.tipo].push(b);
  return grupos;
}

function somarBens(bens: { valor_estimado_brl: number | null }[]): number {
  return bens.reduce((s, b) => s + (Number(b.valor_estimado_brl) || 0), 0);
}

// ============================================================
// LEITURA — CLIENTE (filtra por email_contato do credor)
// ============================================================

// Lista os casos visíveis pro cliente logado (devedores rastreados pelo
// credor que tem email_contato = clienteEmail).
export async function listarCasosDoCliente(clienteEmail: string): Promise<CasoListagem[]> {
  const sb = createAdminClient();
  const email = clienteEmail.toLowerCase().trim();

  // Primeiro pega credor(es) com esse email_contato.
  const { data: credores } = await sb
    .from("credores")
    .select("id")
    .eq("email_contato", email);

  const credorIds = (credores ?? []).map((c) => c.id as number);

  if (credorIds.length === 0) return [];

  // Depois pega os casos desses credores.
  const { data: casos } = await sb
    .from("casos")
    .select(`
      id, numero_processo, pasta_themis, valor_credito_brl, status,
      devedor:devedores!inner(id, tipo, documento, nome)
    `)
    .in("credor_id", credorIds);

  if (!casos) return [];

  // Pra cada caso, agrega total de bens + valor estimado + última atualização.
  const result: CasoListagem[] = [];
  for (const c of casos) {
    const devedor = c.devedor as unknown as DevedorResumo;
    if (!devedor) continue;

    const { data: bens } = await sb
      .from("bens_encontrados")
      .select("valor_estimado_brl, fonte_consultada_em")
      .eq("devedor_id", devedor.id)
      .eq("ativo", true);

    const ultima_consulta = (bens ?? []).reduce<string | null>((max, b) => {
      const ts = (b.fonte_consultada_em as string | null) ?? null;
      if (!ts) return max;
      if (!max || ts > max) return ts;
      return max;
    }, null);

    result.push({
      caso_id: c.id as number,
      numero_processo: (c.numero_processo as string | null) ?? null,
      pasta_themis: (c.pasta_themis as string | null) ?? null,
      valor_credito_brl: (c.valor_credito_brl as number | null) ?? null,
      status: (c.status as string) ?? "ativo",
      devedor,
      total_bens: bens?.length ?? 0,
      valor_estimado_total_brl: somarBens(bens ?? []),
      ultima_consulta_em: ultima_consulta,
      juizo: undefined,
    });
  }

  // Deduplica por DEVEDOR (nao por caso): se o mesmo devedor aparece em
  // multiplos casos/credores, mostra apenas o caso de MAIOR valor. Sem isso,
  // o CardStack 3D do portal cliente renderiza Carlos Eduardo Mendes
  // Albuquerque 2-3x quando o mock tem ele em 3 casos diferentes.
  const porDevedor = new Map<number, CasoListagem>();
  for (const c of result) {
    const atual = porDevedor.get(c.devedor.id);
    if (!atual) {
      porDevedor.set(c.devedor.id, c);
      continue;
    }
    // Mantem o de maior credito (mais relevante visualmente).
    const valorAtual = atual.valor_credito_brl ?? 0;
    const valorNovo = c.valor_credito_brl ?? 0;
    if (valorNovo > valorAtual) porDevedor.set(c.devedor.id, c);
  }
  const unicos = Array.from(porDevedor.values());

  // Ordena: maior valor primeiro (case maior primeiro chama atenção na lista).
  unicos.sort((a, b) => (b.valor_credito_brl ?? 0) - (a.valor_credito_brl ?? 0));
  return unicos;
}

// Dossiê completo de um devedor PARA o cliente.
// Retorna null se o cliente não tem direito a ver (devedor não está em
// nenhum caso do credor dele).
export async function obterDossieParaCliente(
  devedorId: number,
  clienteEmail: string,
): Promise<Dossie | null> {
  const sb = createAdminClient();
  const email = clienteEmail.toLowerCase().trim();

  // Verifica se este devedor está em algum caso de credor com esse email.
  const { data: autorizacao } = await sb
    .from("casos")
    .select(`
      id,
      credor:credores!inner(email_contato)
    `)
    .eq("devedor_id", devedorId)
    .eq("credores.email_contato", email)
    .limit(1)
    .maybeSingle();

  if (!autorizacao) return null;
  return obterDossie(devedorId);
}

// ============================================================
// LEITURA — sem checagem (uso interno + admin)
// ============================================================

// Lista os processos reais vindos do Themis pra tela /equipe/themis.
// Antes: SELECT * de casos + N counts de bens em serie (1840 round-trips
// no banco -> aba nao abria por timeout). Agora: 1 SELECT paginado dos
// casos (com count exact pra saber total) + 1 SELECT paginado de bens
// agregando por devedor em JS. eh_demo=false filtra casos-showroom.
//
// Paginacao: 50 por pagina, count exact devolve total pra UI montar
// 1..N. Busca vai pro banco (numero_processo + id) e tambem pagina.
export const THEMIS_POR_PAGINA = 50;

export interface ListagemThemis {
  processos: ProcessoThemis[];
  total: number;
  pagina: number;
  porPagina: number;
}

export async function listarProcessosThemis(
  q?: string,
  pagina: number = 1,
): Promise<ListagemThemis> {
  const sb = createAdminClient();

  const paginaSegura = Math.max(1, Math.floor(pagina) || 1);
  const inicio = (paginaSegura - 1) * THEMIS_POR_PAGINA;
  const fim = inicio + THEMIS_POR_PAGINA - 1;

  const termo = (q ?? "").trim();
  // Clausulas de busca: numero de processo OU pasta do Themis. Escapa
  // % e , (delimitadores do PostgREST .or).
  const filtroOr = (comPasta: boolean): string | null => {
    if (!termo) return null;
    const escaped = termo.replace(/[%,]/g, " ").trim();
    const clausulas = [`numero_processo.ilike.%${escaped}%`];
    if (comPasta) clausulas.push(`pasta_themis.ilike.%${escaped}%`);
    // Termo 100% numerico tambem tenta o id interno do caso.
    if (/^\d+$/.test(escaped)) clausulas.push(`id.eq.${escaped}`);
    return clausulas.join(",");
  };

  type ResultadoCasos = {
    data: unknown[] | null;
    count: number | null;
    error: unknown;
  };

  // Caminhos separados (sem union de literais — o parser de tipos do
  // supabase-js quebra com ternario no select). comPasta=false eh o
  // fallback pra antes da migration 022.
  const buscarComPasta = async (): Promise<ResultadoCasos> => {
    let query = sb
      .from("casos")
      .select(
        `
        id, numero_processo, pasta_themis, valor_credito_brl, status, observacoes, responsavel_email, criado_em,
        credor:credores!inner(id, nome, documento, tipo),
        devedor:devedores!inner(id, tipo, documento, nome)
      `,
        { count: "exact" },
      )
      .eq("eh_demo", false)
      .order("criado_em", { ascending: false });
    const or = filtroOr(true);
    if (or) query = query.or(or);
    return query.range(inicio, fim) as unknown as Promise<ResultadoCasos>;
  };

  const buscarSemPasta = async (): Promise<ResultadoCasos> => {
    let query = sb
      .from("casos")
      .select(
        `
        id, numero_processo, valor_credito_brl, status, observacoes, responsavel_email, criado_em,
        credor:credores!inner(id, nome, documento, tipo),
        devedor:devedores!inner(id, tipo, documento, nome)
      `,
        { count: "exact" },
      )
      .eq("eh_demo", false)
      .order("criado_em", { ascending: false });
    const or = filtroOr(false);
    if (or) query = query.or(or);
    return query.range(inicio, fim) as unknown as Promise<ResultadoCasos>;
  };

  let { data: casosRaw, count, error } = await buscarComPasta();
  if (error) {
    const retry = await buscarSemPasta();
    casosRaw = retry.data;
    count = retry.count;
  }
  const casos = (casosRaw ?? []) as Record<string, unknown>[];

  const total = count ?? 0;
  const base: ListagemThemis = {
    processos: [],
    total,
    pagina: paginaSegura,
    porPagina: THEMIS_POR_PAGINA,
  };
  if (!casos || casos.length === 0) return base;

  const devedorIds = Array.from(
    new Set(
      casos
        .map((c) => (c.devedor as unknown as { id: number } | null)?.id)
        .filter((x): x is number => typeof x === "number"),
    ),
  );

  // Paginacao explicita (PostgREST corta em 1000 sem aviso — [[supabase-paginacao-1000]]).
  const bensPorDevedor = new Map<number, number>();
  const PAGE = 1000;
  let offset = 0;
  while (devedorIds.length > 0) {
    const { data: bens } = await sb
      .from("bens_encontrados")
      .select("devedor_id")
      .in("devedor_id", devedorIds)
      .eq("ativo", true)
      .range(offset, offset + PAGE - 1);
    if (!bens || bens.length === 0) break;
    for (const b of bens) {
      const id = b.devedor_id as number;
      bensPorDevedor.set(id, (bensPorDevedor.get(id) ?? 0) + 1);
    }
    if (bens.length < PAGE) break;
    offset += PAGE;
  }

  const result: ProcessoThemis[] = [];
  for (const c of casos) {
    const devedor = c.devedor as unknown as ProcessoThemis["devedor"];
    if (!devedor) continue;
    const totalBens = bensPorDevedor.get(devedor.id) ?? 0;
    result.push({
      caso_id: c.id as number,
      numero_processo: (c.numero_processo as string | null) ?? null,
      pasta_themis:
        ((c as Record<string, unknown>).pasta_themis as string | null) ?? null,
      valor_credito_brl: (c.valor_credito_brl as number | null) ?? null,
      status: (c.status as ProcessoThemis["status"]) ?? "ativo",
      observacoes: (c.observacoes as string | null) ?? null,
      responsavel_email: (c.responsavel_email as string | null) ?? null,
      recebido_em: (c.criado_em as string) ?? new Date().toISOString(),
      credor: c.credor as unknown as ProcessoThemis["credor"],
      devedor,
      total_bens: totalBens,
      ja_rastreado: totalBens > 0,
    });
  }

  return { ...base, processos: result };
}

// Conta bens por fonte pra um devedor — alimenta a animação das 7
// fontes (cada card mostra "N bens encontrados" no final).
export async function contarBensPorFonte(
  devedorId: number,
): Promise<Record<FonteBusca, number>> {
  const sb = createAdminClient();

  const { data } = await sb
    .from("bens_encontrados")
    .select("fonte")
    .eq("devedor_id", devedorId)
    .eq("ativo", true);

  const counts: Record<FonteBusca, number> = {
    DataJud: 0,
    Themis: 0,
    BigDataCorp: 0,
    Assertiva: 0,
    minhareceita: 0,
    SICAR: 0,
    ARISP: 0,
    Escavador: 0,
    Manual: 0,
  };

  for (const b of data ?? []) {
    const f = (b.fonte ?? "") as FonteBusca;
    if (f in counts) counts[f]++;
  }

  return counts;
}

// ============================================================
// CROSS-DETECTION — devedor com casos de mais de 1 credor
// ============================================================

export interface OutroCasoDoDevedor {
  caso_id: number;
  numero_processo: string | null;
  valor_credito_brl: number | null;
  status: string;
  credor: { id: number; nome: string; documento: string; tipo: "PF" | "PJ" };
}

// Devolve TODOS os casos onde este devedor aparece com credores DIFERENTES
// (filtra fora o credor passado, se houver). Útil pra dossiê mostrar alerta
// de cross-reference, e pra carteira drill-down mostrar badge.
export async function outrosCredoresDoDevedor(
  devedorId: number,
  excluirCredorId?: number,
): Promise<OutroCasoDoDevedor[]> {
  const sb = createAdminClient();

  const { data: casos } = await sb
    .from("casos")
    .select(`
      id, numero_processo, valor_credito_brl, status,
      credor:credores!inner(id, nome, documento, tipo)
    `)
    .eq("devedor_id", devedorId);

  if (!casos) return [];

  const result: OutroCasoDoDevedor[] = [];
  for (const c of casos) {
    const credor = c.credor as unknown as OutroCasoDoDevedor["credor"] | null;
    if (!credor) continue;
    if (excluirCredorId !== undefined && credor.id === excluirCredorId) continue;
    result.push({
      caso_id: c.id as number,
      numero_processo: (c.numero_processo as string | null) ?? null,
      valor_credito_brl: (c.valor_credito_brl as number | null) ?? null,
      status: (c.status as string) ?? "ativo",
      credor,
    });
  }

  return result;
}

export async function obterDossie(devedorId: number): Promise<Dossie | null> {
  const sb = createAdminClient();

  const { data: devedor } = await sb
    .from("devedores")
    .select("*")
    .eq("id", devedorId)
    .maybeSingle();
  if (!devedor) return null;

  const { data: casos } = await sb
    .from("casos")
    .select(`
      id, numero_processo, pasta_themis, valor_credito_brl, status, observacoes, responsavel_email,
      credor:credores!inner(id, nome, documento, tipo)
    `)
    .eq("devedor_id", devedorId);

  const { data: bensRaw } = await sb
    .from("bens_encontrados")
    .select("*")
    .eq("devedor_id", devedorId)
    .eq("ativo", true)
    .order("tipo");

  const bens = (bensRaw ?? []) as unknown as Bem[];

  // Overlay do juízo a partir do mock — workaround pra demo, vai sair em Sem 2.
  const casosHidratados = ((casos ?? []) as unknown as CasoResumo[]).map(
    (c) => ({ ...c, juizo: undefined }),
  );

  // Campos rg/email/telefone/redes_sociais vem da migration 020 e sao
  // preenchidos pelo Localize (Assertiva). Antes dela rodar, o select *
  // simplesmente nao traz as chaves — normaliza pra null (UI mostra "—").
  const d = devedor as unknown as Partial<DevedorCompleto> & DevedorResumo;
  const devedorCompleto: DevedorCompleto = {
    ...(devedor as unknown as DevedorCompleto),
    rg: d.rg ?? null,
    email: d.email ?? null,
    telefone: d.telefone ?? null,
    redes_sociais: d.redes_sociais ?? null,
    origem_campos: d.origem_campos ?? {},
  };

  return {
    devedor: devedorCompleto,
    casos: casosHidratados,
    bens,
    total_bens: bens.length,
    valor_estimado_total_brl: somarBens(bens),
    por_tipo: agruparPorTipo(bens),
  };
}

// Distribuição geográfica dos bens DOS DEVEDORES rastreados pelo cliente
// logado. Alimenta o MapaDistribuicaoBens no Painel do Cliente.
// Aplica as mesmas regras de visibilidade de listarCasosDoCliente — só
// devedores em casos onde o cliente é o email_contato do credor (com o
// mesmo fallback do cliente.demo).
export async function listarBensPorLocalizacaoDoCliente(
  clienteEmail: string,
): Promise<DistribuicaoGeografica[]> {
  const sb = createAdminClient();
  const email = clienteEmail.toLowerCase().trim();

  const { data: credores } = await sb
    .from("credores")
    .select("id")
    .eq("email_contato", email);

  const credorIds = (credores ?? []).map((c) => c.id as number);

  if (credorIds.length === 0) return [];

  const { data: casos } = await sb
    .from("casos")
    .select("devedor_id")
    .in("credor_id", credorIds);

  const devedorIds = Array.from(
    new Set((casos ?? []).map((c) => c.devedor_id as number)),
  );
  if (devedorIds.length === 0) return [];

  const { data: bens } = await sb
    .from("bens_encontrados")
    .select("id, tipo, valor_estimado_brl, detalhes")
    .in("devedor_id", devedorIds)
    .eq("ativo", true);

  // Localizacao real vem de detalhes (Assertiva grava "SOROCABA/SP");
  // sem ela a função pura gera fallback estável por hash do id (mesmas
  // cidades do dossiê, pra manter coerência entre as telas).
  return calcularDistribuicaoGeografica(
    (bens ?? []) as { id: number; tipo: string; valor_estimado_brl: number | null }[],
  );
}
