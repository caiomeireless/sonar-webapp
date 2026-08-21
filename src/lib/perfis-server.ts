// Funcoes de perfil que dependem da SESSAO (cookies) — server-only.
// Separado de lib/perfis.ts para que aquele continue importavel por client
// components sem arrastar o next/headers.
//
// DEMO REMOVIDA (pedido Caio 08/08 — o mock misturava com dados reais; sera
// refeita depois do lancamento). Os perfis sinteticos e o fallback do cookie
// `sonar.demo` foram apagados — historico no git se precisar reconstruir.
// Hoje perfilLogado == perfilLogadoReal (so sessao Supabase); os dois nomes
// ficam porque paginas com PII ja padronizaram no "Real".
import { createClient } from "@/lib/supabase/server";
import { perfilAtual, type Perfil } from "./perfis";

// Perfil de sessao REAL (Supabase). OBRIGATORIO em paginas/acoes com dados
// sensiveis (PII de clientes, cadastro, convites).
export async function perfilLogadoReal(): Promise<Perfil | null> {
  try {
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user?.email) return perfilAtual(user.email);
  } catch {
    // sem sessao real
  }
  return null;
}

// Perfil do usuario logado (sessao atual). Usar em paginas/acoes server-side.
export async function perfilLogado(): Promise<Perfil | null> {
  return perfilLogadoReal();
}
