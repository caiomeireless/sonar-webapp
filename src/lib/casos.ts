// Reader functions de casos/bens — server-only, usa admin client.
// Mostra dossiê com regra de visibilidade do cliente: ele vê apenas
// os devedores dos casos onde ELE é o email_contato do credor.
import { createAdminClient } from "@/lib/supabase/admin";
import type { TipoBem, FonteBusca } from "./mock-fixtures";
import { CASOS_DEMO } from "./mock-fixtures";
import {
  calcularDistribuicaoGeografica,
  type DistribuicaoGeografica,
} from "./distribuicao-bens";

// WORKAROUND PRA DEMO: hidrata o juízo (vara/comarca/UF/gênero/classe da ação)
// fazendo overlay com o mock CASOS_DEMO por id. No Sem 2, isso vira do Themis
// API e este overlay sai daqui.
export type JuizoInfo = {
  vara: number;
  classeVara: string;
  comarca: string;
  uf: string;
  generoJuiz: "M" | "F";
  classeAcao: string;
};

function juizoMockPorId(casoId: number): JuizoInfo | undefined {
  const c = CASOS_DEMO.find((x) => x.id === casoId);
  return c?.juizo;
}

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

// E-mail demo: quando o "Visualizar como cliente" usa este alias, devolve
// os casos do PRIMEIRO credor existente do banco (fallback que garante a
// demo sempre ter conteúdo, sem precisar rodar o seed de novo).
const DEMO_CLIENTE_EMAIL = "cliente.demo@battaglia.com.br";

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

  let credorIds = (credores ?? []).map((c) => c.id as number);

  // Fallback demo: cliente.demo sempre cai num credor que TEM casos no banco
  // (ignora vinculação por email_contato — se o seed criou esse perfil sem
  // credor próprio ou sem casos, ele "empresta" do primeiro credor com casos).
  if (email === DEMO_CLIENTE_EMAIL) {
    const { data: credoresComCasos } = await sb
      .from("casos")
      .select("credor_id")
      .order("credor_id", { ascending: true })
      .limit(50);
    const idsComCasos = Array.from(
      new Set((credoresComCasos ?? []).map((c) => c.credor_id as number)),
    );
    if (idsComCasos.length > 0) credorIds = idsComCasos;
  }

  if (credorIds.length === 0) return [];

  // Depois pega os casos desses credores.
  const { data: casos } = await sb
    .from("casos")
    .select(`
      id, numero_processo, valor_credito_brl, status,
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
      valor_credito_brl: (c.valor_credito_brl as number | null) ?? null,
      status: (c.status as string) ?? "ativo",
      devedor,
      total_bens: bens?.length ?? 0,
      valor_estimado_total_brl: somarBens(bens ?? []),
      ultima_consulta_em: ultima_consulta,
      juizo: juizoMockPorId(c.id as number),
    });
  }

  // Ordena: maior valor primeiro (case maior primeiro chama atenção na lista).
  result.sort((a, b) => (b.valor_credito_brl ?? 0) - (a.valor_credito_brl ?? 0));
  return result;
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

  // Fallback demo: cliente.demo vê qualquer devedor que exista (visão
  // sintética de "todos os processos" pra apresentação).
  if (email === DEMO_CLIENTE_EMAIL) {
    return obterDossie(devedorId);
  }

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

// Lista TODOS os processos "vindos do Themis" (na demo: tabela casos).
// Usado pela tela /equipe/themis pra mostrar a fila de execuções
// que o escritório precisa rastrear.
export async function listarProcessosThemis(): Promise<ProcessoThemis[]> {
  const sb = createAdminClient();

  const { data: casos } = await sb
    .from("casos")
    .select(`
      id, numero_processo, valor_credito_brl, status, observacoes, responsavel_email, criado_em,
      credor:credores!inner(id, nome, documento, tipo),
      devedor:devedores!inner(id, tipo, documento, nome)
    `)
    .order("criado_em", { ascending: false });

  if (!casos) return [];

  const result: ProcessoThemis[] = [];
  for (const c of casos) {
    const devedor = c.devedor as unknown as ProcessoThemis["devedor"];
    if (!devedor) continue;

    const { count } = await sb
      .from("bens_encontrados")
      .select("*", { count: "exact", head: true })
      .eq("devedor_id", devedor.id)
      .eq("ativo", true);

    result.push({
      caso_id: c.id as number,
      numero_processo: (c.numero_processo as string | null) ?? null,
      valor_credito_brl: (c.valor_credito_brl as number | null) ?? null,
      status: (c.status as ProcessoThemis["status"]) ?? "ativo",
      observacoes: (c.observacoes as string | null) ?? null,
      responsavel_email: (c.responsavel_email as string | null) ?? null,
      recebido_em: (c.criado_em as string) ?? new Date().toISOString(),
      credor: c.credor as unknown as ProcessoThemis["credor"],
      devedor,
      total_bens: count ?? 0,
      ja_rastreado: (count ?? 0) > 0,
    });
  }

  return result;
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
      id, numero_processo, valor_credito_brl, status, observacoes, responsavel_email,
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
    (c) => ({ ...c, juizo: juizoMockPorId(c.id) }),
  );

  return {
    devedor: devedor as unknown as DevedorCompleto,
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

  let credorIds = (credores ?? []).map((c) => c.id as number);

  if (email === DEMO_CLIENTE_EMAIL) {
    const { data: credoresComCasos } = await sb
      .from("casos")
      .select("credor_id")
      .order("credor_id", { ascending: true })
      .limit(50);
    const idsComCasos = Array.from(
      new Set((credoresComCasos ?? []).map((c) => c.credor_id as number)),
    );
    if (idsComCasos.length > 0) credorIds = idsComCasos;
  }

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
    .select("id, valor_estimado_brl")
    .in("devedor_id", devedorIds)
    .eq("ativo", true);

  // Campos cidade/uf ainda não existem no schema atual — a função pura
  // gera fallback estável por hash do id (mesmas cidades que aparecem
  // no dossiê do devedor, pra manter coerência entre as telas).
  return calcularDistribuicaoGeografica((bens ?? []) as { id: number; valor_estimado_brl: number | null }[]);
}
