// Cliente da API Assertiva — server-only. Porte do padrão validado no
// BP CRM, adaptado ao domínio do Sonar (alvo = DEVEDOR, custos com
// devedor_id + credor_id, achados viram bens_encontrados).
//
// Produtos contratados (2026-07): Localiza (enriquecimento cadastral) +
// Veículos (frota em nome do documento).
//
// Auth: OAuth2 client_credentials.
//   POST {base}/oauth2/v3/token
//   Authorization: Basic base64(clientId:secret)
//   Body grant_type=client_credentials -> { access_token, expires_in }
//
// Regra do produto [[sonar-consultas-pagas-sob-demanda]]: consulta paga
// SÓ sob demanda da equipe, com preço + confirmação na UI. O cliente
// nunca vê o botão — só o resultado.
//
// Cache: primeira consulta de um documento é paga e fica em
// assertiva_cache (migration 020); repetição sai de graça.

import { createAdminClient } from "@/lib/supabase/admin";

if (typeof window !== "undefined") {
  throw new Error("lib/assertiva.ts e server-only.");
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CLIENT_ID = process.env.ASSERTIVA_CLIENT_ID || "";
const CLIENT_SECRET = process.env.ASSERTIVA_CLIENT_SECRET || "";
const BASE_URL = (
  process.env.ASSERTIVA_BASE_URL || "https://api.assertivasolucoes.com.br"
).replace(/\/$/, "");

// Teto mensal de gasto com Assertiva (R$). Trava dura — consulta é
// bloqueada quando o acumulado do mês bate aqui.
// Proposta Q-19312-1 (jul/2026): Plano Inicial 3 = R$ 600/mês CONSUMÍVEL
// e NÃO acumulativo (cláusula 1.4) — abaixo de 600 já está pago.
export const TETO_MENSAL_BRL =
  Number(process.env.ASSERTIVA_TETO_MENSAL_BRL ?? "600") || 600;

// Preços por consulta (R$, brutos c/ tributos — proposta Q-19312-1):
//   Localize "Identificações"            R$ 0,203
//   Veículos "Histórico CPF/CNPJ"        R$ 14,795
export const CUSTO_LOCALIZE_BRL =
  Number(process.env.ASSERTIVA_CUSTO_LOCALIZE_BRL ?? "0.203") || 0.203;
export const CUSTO_VEICULOS_BRL =
  Number(process.env.ASSERTIVA_CUSTO_VEICULOS_BRL ?? "14.795") || 14.795;

const ENDPOINT_CPF = process.env.ASSERTIVA_ENDPOINT_CPF || "/localize/v3/cpf";
const ENDPOINT_CNPJ = process.env.ASSERTIVA_ENDPOINT_CNPJ || "/localize/v3/cnpj";
// Confirmado no Swagger oficial (integracao.assertivasolucoes.com.br/v3/doc):
//   GET /veiculos/v3/historico-veiculos?documento={cpf|cnpj}&idFinalidade=N
// Atencao: o produto Veiculos usa o param "documento" (nao cpf/cnpj).
const ENDPOINT_VEICULOS =
  process.env.ASSERTIVA_ENDPOINT_VEICULOS || "/veiculos/v3/historico-veiculos";

// idFinalidade (obrigatório por LGPD): 4 = execução de contrato.
const ID_FINALIDADE = Number(process.env.ASSERTIVA_ID_FINALIDADE ?? "4") || 4;

export function temCredenciais(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

export function soDigitos(s: string): string {
  return (s ?? "").replace(/\D/g, "");
}

export function tipoDocumento(s: string): "cpf" | "cnpj" | null {
  const d = soDigitos(s);
  if (d.length === 11) return "cpf";
  if (d.length === 14) return "cnpj";
  return null;
}

// ---------------------------------------------------------------------------
// Token OAuth2 (cache em memória, TTL ~25min — token dura 30min)
// ---------------------------------------------------------------------------

let tokenCache: { token: string; expiraEm: number } | null = null;

type ResultadoToken =
  | { ok: true; token: string }
  | { ok: false; status: number; mensagem: string };

async function obterToken(): Promise<ResultadoToken> {
  if (!temCredenciais()) {
    return {
      ok: false,
      status: 0,
      mensagem:
        "Credenciais Assertiva não configuradas (ASSERTIVA_CLIENT_ID / ASSERTIVA_CLIENT_SECRET).",
    };
  }

  const agora = Date.now();
  if (tokenCache && tokenCache.expiraEm > agora + 5 * 60_000) {
    return { ok: true, token: tokenCache.token };
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/oauth2/v3/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
  } catch (e) {
    return {
      ok: false,
      status: 0,
      mensagem: `Falha de rede no token Assertiva: ${(e as Error).message}`,
    };
  }

  if (!res.ok) {
    return { ok: false, status: res.status, mensagem: `Token Assertiva: HTTP ${res.status}.` };
  }

  let json: { access_token?: string; expires_in?: number };
  try {
    json = await res.json();
  } catch {
    return { ok: false, status: res.status, mensagem: "Resposta não-JSON no token." };
  }
  if (!json.access_token) {
    return { ok: false, status: res.status, mensagem: "Resposta sem access_token." };
  }

  tokenCache = {
    token: json.access_token,
    expiraEm: agora + (json.expires_in ?? 1799) * 1000,
  };
  return { ok: true, token: json.access_token };
}

// ---------------------------------------------------------------------------
// Consumo mensal (trava do teto) — soma da tabela custos tipo assertiva-*
// ---------------------------------------------------------------------------

export interface ConsumoAssertiva {
  custoBrl: number;
  consultas: number;
  tetoBrl: number;
  percentualUsado: number;
  podeConsultarMais: boolean;
}

export async function consumoMensalAssertiva(): Promise<ConsumoAssertiva> {
  const sb = createAdminClient();
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  let custoBrl = 0;
  let consultas = 0;
  try {
    const { data } = await sb
      .from("custos")
      .select("custo")
      .like("tipo", "assertiva%")
      .gte("criado_em", inicioMes.toISOString())
      .limit(5000);
    for (const r of data ?? []) {
      custoBrl += Number(r.custo) || 0;
      consultas++;
    }
  } catch {
    /* tabela ausente -> 0 */
  }

  return {
    custoBrl: Math.round(custoBrl * 10000) / 10000,
    consultas,
    tetoBrl: TETO_MENSAL_BRL,
    percentualUsado:
      TETO_MENSAL_BRL > 0
        ? Math.min(100, Math.round((custoBrl / TETO_MENSAL_BRL) * 100))
        : 0,
    podeConsultarMais: custoBrl < TETO_MENSAL_BRL,
  };
}

// ---------------------------------------------------------------------------
// Cache de consultas (assertiva_cache — migration 020)
// ---------------------------------------------------------------------------

async function buscarNoCache(
  documento: string,
  tipo: "cpf" | "cnpj",
  produto: string,
): Promise<Record<string, unknown> | null> {
  try {
    const sb = createAdminClient();
    const { data } = await sb
      .from("assertiva_cache")
      .select("resposta")
      .eq("documento", soDigitos(documento))
      .eq("tipo", tipo)
      .eq("produto", produto)
      .eq("sucesso", true)
      .order("consultado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data?.resposta as Record<string, unknown>) ?? null;
  } catch {
    return null;
  }
}

async function gravarNoCache(input: {
  documento: string;
  tipo: "cpf" | "cnpj";
  produto: string;
  endpoint: string;
  resposta: Record<string, unknown>;
  custoBrl: number;
  email: string;
  sucesso: boolean;
  erroMsg?: string;
}): Promise<void> {
  try {
    const sb = createAdminClient();
    await sb.from("assertiva_cache").upsert(
      {
        documento: soDigitos(input.documento),
        tipo: input.tipo,
        produto: input.produto,
        endpoint: input.endpoint,
        resposta: input.resposta,
        custo_brl: input.custoBrl,
        consultado_por_email: input.email,
        sucesso: input.sucesso,
        erro_msg: input.erroMsg ?? "",
        consultado_em: new Date().toISOString(),
      },
      { onConflict: "documento,tipo,produto" },
    );
  } catch {
    /* best-effort */
  }
}

// ---------------------------------------------------------------------------
// Chamada genérica de produto
// ---------------------------------------------------------------------------

export type ResultadoAssertiva =
  | { ok: true; dados: Record<string, unknown>; custoBrl: number; doCache: boolean }
  | { ok: false; status: number; mensagem: string };

async function consultarProduto(input: {
  documento: string;
  tipo: "cpf" | "cnpj";
  produto: "localize" | "veiculos";
  email: string;
  custoBrl: number;
  ignorarCache?: boolean;
}): Promise<ResultadoAssertiva> {
  const doc = soDigitos(input.documento);
  if (!doc) return { ok: false, status: 0, mensagem: "Documento vazio." };

  // 1. Cache (custo zero)
  if (!input.ignorarCache) {
    const cache = await buscarNoCache(doc, input.tipo, input.produto);
    if (cache) return { ok: true, dados: cache, custoBrl: 0, doCache: true };
  }

  // 2. Teto mensal
  const consumo = await consumoMensalAssertiva();
  if (!consumo.podeConsultarMais) {
    return {
      ok: false,
      status: 0,
      mensagem: `Teto mensal de R$ ${TETO_MENSAL_BRL.toFixed(2)} atingido (R$ ${consumo.custoBrl.toFixed(2)} usados). Consulta bloqueada.`,
    };
  }

  // 3. Token
  const tok = await obterToken();
  if (!tok.ok) return { ok: false, status: tok.status, mensagem: tok.mensagem };

  // 4. Chamada — documento em query string + idFinalidade (LGPD).
  // Localize usa cpf=/cnpj=; Veiculos usa documento= (Swagger oficial).
  const endpoint =
    input.produto === "veiculos"
      ? ENDPOINT_VEICULOS
      : input.tipo === "cpf"
        ? ENDPOINT_CPF
        : ENDPOINT_CNPJ;
  const paramDoc = input.produto === "veiculos" ? "documento" : input.tipo;
  const params = new URLSearchParams({
    [paramDoc]: doc,
    idFinalidade: String(ID_FINALIDADE),
  });
  const url = `${BASE_URL}${endpoint}?${params.toString()}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${tok.token}`, Accept: "application/json" },
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, status: 0, mensagem: `Falha de rede: ${(e as Error).message}` };
  }

  const corpo = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = JSON.parse(corpo);
  } catch {
    /* não-JSON */
  }

  if (!res.ok) {
    await gravarNoCache({
      documento: doc,
      tipo: input.tipo,
      produto: input.produto,
      endpoint,
      resposta: json ?? { erro: corpo.slice(0, 1000) },
      custoBrl: 0,
      email: input.email,
      sucesso: false,
      erroMsg: `HTTP ${res.status}`,
    });
    return {
      ok: false,
      status: res.status,
      mensagem: `Assertiva devolveu ${res.status} (${endpoint}).`,
    };
  }

  const dados = json ?? {};
  await gravarNoCache({
    documento: doc,
    tipo: input.tipo,
    produto: input.produto,
    endpoint,
    resposta: dados,
    custoBrl: input.custoBrl,
    email: input.email,
    sucesso: true,
  });

  return { ok: true, dados, custoBrl: input.custoBrl, doCache: false };
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

// Localize: dados cadastrais (endereços, telefones, emails, nascimento,
// nome da mãe). PF via CPF, PJ via CNPJ.
export function consultarLocalize(input: {
  documento: string;
  email: string;
  ignorarCache?: boolean;
}): Promise<ResultadoAssertiva> {
  const tipo = tipoDocumento(input.documento);
  if (!tipo) {
    return Promise.resolve({
      ok: false,
      status: 0,
      mensagem: "Documento não é CPF (11 dígitos) nem CNPJ (14).",
    });
  }
  return consultarProduto({
    documento: input.documento,
    tipo,
    produto: "localize",
    email: input.email,
    custoBrl: CUSTO_LOCALIZE_BRL,
    ignorarCache: input.ignorarCache,
  });
}

// Veículos: frota registrada no documento (placa, marca/modelo, ano).
export function consultarVeiculos(input: {
  documento: string;
  email: string;
  ignorarCache?: boolean;
}): Promise<ResultadoAssertiva> {
  const tipo = tipoDocumento(input.documento);
  if (!tipo) {
    return Promise.resolve({
      ok: false,
      status: 0,
      mensagem: "Documento não é CPF (11 dígitos) nem CNPJ (14).",
    });
  }
  return consultarProduto({
    documento: input.documento,
    tipo,
    produto: "veiculos",
    email: input.email,
    custoBrl: CUSTO_VEICULOS_BRL,
    ignorarCache: input.ignorarCache,
  });
}
