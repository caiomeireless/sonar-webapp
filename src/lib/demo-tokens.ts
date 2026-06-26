// Tokens de acesso a demo na landing.
//
// Fluxo:
//   1. Visitante clica "Versao Demo" na landing -> abre modal
//   2. Escolhe "Demo Equipe" ou "Demo Cliente" -> preenche nome+email
//   3. Backend gera token UUID, persiste in-memory, dispara email pro
//      caio@bpadvogados.com.br avisando + link pra Caio APROVAR
//   4. Caio recebe email, clica em "Aprovar" -> token vira aprovado
//   5. Visitante (que recebeu o link com o token) acessa /demo/{token}
//      -> middleware seta cookie 'sonar.demo' + redireciona pra portal
//
// Storage em memoria por enquanto. Migrar pra tabela `demo_tokens` no
// Supabase quando passar de demo. O reset do processo (deploy) limpa
// todos os tokens — comportamento aceitavel ja que sao de uso unico.
//
// Tempo de vida: 24h depois de aprovado. Tokens pendentes (nao
// aprovados) expiram em 7 dias por garbage collection no listarPendentes.

import { randomUUID } from "node:crypto";

export type DemoTipo = "equipe" | "cliente";

export type DemoTokenStatus = "pendente" | "aprovado" | "negado" | "consumido";

export type DemoToken = {
  token: string;
  tipo: DemoTipo;
  nomeVisitante: string;
  emailVisitante: string;
  motivo: string | null;
  status: DemoTokenStatus;
  criadoEm: string;
  aprovadoEm: string | null;
  consumidoEm: string | null;
};

const TTL_PENDENTE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const TTL_APROVADO_MS = 24 * 60 * 60 * 1000; // 24h

const _tokens: DemoToken[] = [];

export async function criarToken(args: {
  tipo: DemoTipo;
  nomeVisitante: string;
  emailVisitante: string;
  motivo: string | null;
}): Promise<DemoToken> {
  const novo: DemoToken = {
    token: randomUUID(),
    tipo: args.tipo,
    nomeVisitante: args.nomeVisitante,
    emailVisitante: args.emailVisitante,
    motivo: args.motivo,
    status: "pendente",
    criadoEm: new Date().toISOString(),
    aprovadoEm: null,
    consumidoEm: null,
  };
  _tokens.unshift(novo);
  return novo;
}

export async function buscarToken(token: string): Promise<DemoToken | null> {
  if (!token) return null;
  return _tokens.find((t) => t.token === token) ?? null;
}

export async function aprovarToken(token: string): Promise<DemoToken | null> {
  const t = _tokens.find((x) => x.token === token);
  if (!t) return null;
  if (t.status !== "pendente") return t; // idempotente
  t.status = "aprovado";
  t.aprovadoEm = new Date().toISOString();
  return t;
}

export async function negarToken(token: string): Promise<DemoToken | null> {
  const t = _tokens.find((x) => x.token === token);
  if (!t) return null;
  if (t.status !== "pendente") return t;
  t.status = "negado";
  return t;
}

export async function consumirToken(token: string): Promise<DemoToken | null> {
  const t = _tokens.find((x) => x.token === token);
  if (!t) return null;
  if (t.status !== "aprovado") return null;
  // Verifica TTL apos aprovado
  const aprovado = t.aprovadoEm ? new Date(t.aprovadoEm).getTime() : 0;
  if (Date.now() - aprovado > TTL_APROVADO_MS) {
    t.status = "consumido"; // marca como expirado/consumido
    return null;
  }
  t.consumidoEm = new Date().toISOString();
  // NAO marca como consumido pra permitir o cookie ser reutilizado pelo
  // proprio visitante durante as 24h. O TTL_APROVADO_MS bloqueia uso futuro.
  return t;
}

export async function listarPendentes(): Promise<DemoToken[]> {
  // Garbage collection inline — remove pendentes muito antigos
  const agora = Date.now();
  for (let i = _tokens.length - 1; i >= 0; i--) {
    const t = _tokens[i];
    if (t.status !== "pendente") continue;
    const criado = new Date(t.criadoEm).getTime();
    if (agora - criado > TTL_PENDENTE_MS) {
      _tokens.splice(i, 1);
    }
  }
  return _tokens.filter((t) => t.status === "pendente");
}
