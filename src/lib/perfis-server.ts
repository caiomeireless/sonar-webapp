// Funcoes de perfil que dependem da SESSAO (cookies) — server-only.
// Separado de lib/perfis.ts para que aquele continue importavel por client
// components sem arrastar o next/headers.
import { createClient } from "@/lib/supabase/server";
import { perfilAtual, type Perfil } from "./perfis";

// Perfil do usuario logado (sessao atual). Usar em paginas/acoes server-side.
export async function perfilLogado(): Promise<Perfil | null> {
  try {
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user?.email) return null;
    return perfilAtual(user.email);
  } catch {
    return null;
  }
}
