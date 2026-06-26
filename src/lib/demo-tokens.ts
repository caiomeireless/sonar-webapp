// Tokens de acesso a demo na landing — codigo de 6 digitos.
//
// Persistencia: tabela `demo_tokens` no Supabase (migration 008).
// Antes era in-memory, mas na Vercel cada serverless function pode
// estar numa instancia diferente -> o codigo gerado pelo POST nao
// existia mais quando o GET tentava resgatar (cold start).
//
// Fluxo:
//   1. Visitante preenche form -> backend gera codigo 6 digitos
//      numericos e envia EMAIL pro caio@bpadvogados.com.br
//   2. Caio repassa o codigo direto pro visitante (WhatsApp/voz)
//   3. Visitante cola o codigo no card de "Entrar com codigo" que
//      aparece na tela apos enviar o pedido
//   4. /api/demo/{codigo} valida, seta cookie sonar.demo e
//      redireciona pro portal
//
// TTL: 24h a partir do criadoEm. Codigo nao precisa de aprovacao
// (Caio decide se repassa ou nao).

import { randomInt } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

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

type DbRow = {
  codigo: string;
  tipo: DemoTipo;
  nome_visitante: string;
  email_visitante: string;
  motivo: string | null;
  criado_em: string;
  consumido_em: string | null;
};

function rowToToken(r: DbRow): DemoToken {
  return {
    codigo: r.codigo,
    tipo: r.tipo,
    nomeVisitante: r.nome_visitante,
    emailVisitante: r.email_visitante,
    motivo: r.motivo,
    criadoEm: r.criado_em,
    consumidoEm: r.consumido_em,
  };
}

function gerar6Digitos(): string {
  return String(randomInt(100000, 1000000)); // 100000..999999
}

export async function criarToken(args: {
  tipo: DemoTipo;
  nomeVisitante: string;
  emailVisitante: string;
  motivo: string | null;
}): Promise<DemoToken> {
  const sb = createAdminClient();

  // Gera codigo + insere. Em caso de colisao na PK (codigo ja
  // existe e nao expirou), tenta de novo. Ate 10 tentativas — com
  // 1M combinacoes a colisao e' improvavel.
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const codigo = gerar6Digitos();
    const { data, error } = await sb
      .from("demo_tokens")
      .insert({
        codigo,
        tipo: args.tipo,
        nome_visitante: args.nomeVisitante,
        email_visitante: args.emailVisitante,
        motivo: args.motivo,
      })
      .select()
      .single<DbRow>();

    if (!error && data) {
      // Limpa expirados em background (best-effort, ignora erro)
      garbageCollect(sb).catch(() => {});
      return rowToToken(data);
    }

    // Codigo duplicado -> tenta de novo. Outros erros -> propaga.
    const e = error as { code?: string; message?: string } | null;
    if (e && e.code !== "23505") {
      throw new Error(
        `[demo-tokens] criarToken falhou: ${e.message ?? "desconhecido"}`,
      );
    }
  }
  throw new Error(
    "[demo-tokens] criarToken: 10 colisoes consecutivas (improvavel) — abortando",
  );
}

export async function buscarToken(codigo: string): Promise<DemoToken | null> {
  if (!codigo) return null;
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("demo_tokens")
    .select("*")
    .eq("codigo", codigo)
    .maybeSingle<DbRow>();
  if (error || !data) return null;
  return rowToToken(data);
}

// Tenta consumir um codigo. Retorna o token se valido (dentro do
// TTL); retorna null se nao existe ou expirou. Marca consumido_em
// no primeiro uso (informativo — nao invalida pra que o cookie
// possa ser reutilizado pelo proprio visitante durante 24h).
export async function consumirToken(codigo: string): Promise<DemoToken | null> {
  if (!codigo) return null;
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("demo_tokens")
    .select("*")
    .eq("codigo", codigo)
    .maybeSingle<DbRow>();
  if (error || !data) return null;

  const criado = new Date(data.criado_em).getTime();
  if (Date.now() - criado > TTL_MS) return null; // expirado

  if (!data.consumido_em) {
    await sb
      .from("demo_tokens")
      .update({ consumido_em: new Date().toISOString() })
      .eq("codigo", codigo);
  }
  return rowToToken(data);
}

// Garbage collection — apaga tokens com mais de 24h. Best-effort,
// invocado em background na criacao de novos tokens.
async function garbageCollect(
  sb: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const cutoff = new Date(Date.now() - TTL_MS).toISOString();
  await sb.from("demo_tokens").delete().lt("criado_em", cutoff);
}
