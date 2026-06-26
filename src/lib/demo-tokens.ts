// Tokens de acesso a demo na landing.
//
// Fluxo (atualizado 2026-06-26 — codigo de 6 digitos sem aprovacao):
//   1. Visitante preenche form -> backend gera codigo de 6 digitos
//      numericos e envia EMAIL pro caio@bpadvogados.com.br com o
//      codigo destacado
//   2. Caio repassa o codigo direto pro visitante (WhatsApp/voz)
//   3. Visitante cola o codigo no card de "Entrar com codigo" que
//      aparece na tela apos enviar o pedido
//   4. Validacao em /api/demo/{codigo} seta cookie sonar.demo e
//      redireciona pro portal correspondente
//
// O codigo nao precisa de aprovacao explicita — assim que e enviado
// pro Caio, ja vale por 24h. O ato de o Caio "aprovar" e simplesmente
// repassar o codigo ou nao.
//
// Storage em memoria. Reset do processo (deploy) limpa tudo —
// aceitavel porque tokens sao de uso curto. Migrar pra tabela
// Supabase quando passar do estado de demo.

import { randomInt } from "node:crypto";

export type DemoTipo = "equipe" | "cliente";

export type DemoToken = {
  codigo: string; // 6 digitos numericos, ex "428193"
  tipo: DemoTipo;
  nomeVisitante: string;
  emailVisitante: string;
  motivo: string | null;
  criadoEm: string;
  consumidoEm: string | null;
};

const TTL_MS = 24 * 60 * 60 * 1000; // 24h

const _tokens: DemoToken[] = [];

// Gera codigo 6 digitos garantindo unicidade entre tokens ainda
// validos (nao expirados). 1M combinacoes — colisao improvavel com
// poucos tokens simultaneos, mas o loop garante seguranca.
function gerarCodigoUnico(): string {
  const agora = Date.now();
  const ativos = new Set(
    _tokens
      .filter(
        (t) =>
          agora - new Date(t.criadoEm).getTime() < TTL_MS,
      )
      .map((t) => t.codigo),
  );
  for (let tentativa = 0; tentativa < 50; tentativa++) {
    const c = String(randomInt(100000, 1000000)); // 100000..999999
    if (!ativos.has(c)) return c;
  }
  // Improvavel chegar aqui — em todo caso, devolve algo.
  return String(randomInt(100000, 1000000));
}

export async function criarToken(args: {
  tipo: DemoTipo;
  nomeVisitante: string;
  emailVisitante: string;
  motivo: string | null;
}): Promise<DemoToken> {
  const novo: DemoToken = {
    codigo: gerarCodigoUnico(),
    tipo: args.tipo,
    nomeVisitante: args.nomeVisitante,
    emailVisitante: args.emailVisitante,
    motivo: args.motivo,
    criadoEm: new Date().toISOString(),
    consumidoEm: null,
  };
  _tokens.unshift(novo);
  // Garbage collection inline — remove tokens expirados
  garbageCollect();
  return novo;
}

export async function buscarToken(codigo: string): Promise<DemoToken | null> {
  if (!codigo) return null;
  return _tokens.find((t) => t.codigo === codigo) ?? null;
}

// Tenta consumir um codigo. Retorna o token se valido (dentro do TTL);
// retorna null se nao existe ou expirou.
export async function consumirToken(codigo: string): Promise<DemoToken | null> {
  const t = _tokens.find((x) => x.codigo === codigo);
  if (!t) return null;
  const criado = new Date(t.criadoEm).getTime();
  if (Date.now() - criado > TTL_MS) {
    return null; // expirado
  }
  // Marca como consumido (informativo — nao invalida pra que o cookie
  // possa ser reutilizado pelo proprio visitante durante as 24h).
  if (!t.consumidoEm) {
    t.consumidoEm = new Date().toISOString();
  }
  return t;
}

function garbageCollect(): void {
  const agora = Date.now();
  for (let i = _tokens.length - 1; i >= 0; i--) {
    const t = _tokens[i];
    if (agora - new Date(t.criadoEm).getTime() > TTL_MS) {
      _tokens.splice(i, 1);
    }
  }
}
