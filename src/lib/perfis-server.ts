// Funcoes de perfil que dependem da SESSAO (cookies) — server-only.
// Separado de lib/perfis.ts para que aquele continue importavel por client
// components sem arrastar o next/headers.
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { perfilAtual, type Perfil } from "./perfis";

// Perfis sinteticos pra sessoes de DEMO (cookie sonar.demo).
// O cliente.demo ja existe na base de demo-seed.
const PERFIL_DEMO_EQUIPE: Perfil = {
  email: "demo.equipe@battaglia.com.br",
  nome: "Demo Equipe",
  fotoPath: null,
  fotoUrl: null,
  papel: "admin",
  acessos: [],
};
const PERFIL_DEMO_CLIENTE: Perfil = {
  email: "cliente.demo@battaglia.com.br",
  nome: "Cliente Demo",
  fotoPath: null,
  fotoUrl: null,
  papel: "cliente",
  acessos: [],
};

// Perfil do usuario logado (sessao atual). Usar em paginas/acoes server-side.
export async function perfilLogado(): Promise<Perfil | null> {
  // 1) Sessao real (Supabase)
  try {
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user?.email) return perfilAtual(user.email);
  } catch {
    // segue pra demo
  }

  // 2) Sessao DEMO via cookie sonar.demo (formato "equipe:<uuid>" ou "cliente:<uuid>")
  try {
    const cookieStore = await cookies();
    const demo = cookieStore.get("sonar.demo")?.value ?? "";
    const [tipo] = demo.split(":");
    if (tipo === "equipe") return PERFIL_DEMO_EQUIPE;
    if (tipo === "cliente") return PERFIL_DEMO_CLIENTE;
  } catch {
    // ignora
  }

  return null;
}
