// Dominio institucional do escritorio. Usuarios com este sufixo passam
// automaticamente como equipe (admin/socio/funcionario, conforme tabela perfis).
export const ALLOWED_DOMAIN = "bpadvogados.com.br";

// Dono / super-admin: unica conta com acesso a tela de Configuracoes (gestao
// de usuarios e permissoes). Nem outros admins acessam.
export const DONO_EMAIL = "caio@bpadvogados.com.br";

// Email do cliente DEMO (seed). Sempre liberado — usado pra screencast e
// onboarding sem precisar cadastrar perfil/credor antes.
export const DEMO_CLIENTE_EMAIL = "cliente.demo@battaglia.com.br";

import { createAdminClient } from "@/lib/supabase/admin";

// Autoriza um email a acessar a plataforma.
// Regras (primeiro match vence):
// 1. Dominio do escritorio (@bpadvogados.com.br) -> sempre autorizado (equipe).
// 2. Email do cliente DEMO (seed) -> autorizado (mesmo sem registro em perfis).
// 3. Email externo cadastrado em `perfis` com papel='cliente' -> autorizado.
// 4. Email externo cadastrado em `credores.email_contato` -> autorizado
//    (compatibilidade: clientes nascem como credor antes do perfil ser criado).
// 5. Resto -> NAO autorizado.
//
// Resiliente: se Supabase nao estiver configurado ainda, libera so o dominio
// (fail-closed pra emails externos).
export async function isEmailAutorizado(email: string | null | undefined): Promise<boolean> {
  const e = (email ?? "").toLowerCase().trim();
  if (!e) return false;
  if (e.endsWith("@" + ALLOWED_DOMAIN)) return true;
  if (e === DEMO_CLIENTE_EMAIL) return true;
  try {
    const sb = createAdminClient();
    // Camada 1: perfis com papel=cliente (cadastro explicito pelo admin)
    const { data: perfil } = await sb
      .from("perfis")
      .select("papel")
      .eq("email", e)
      .maybeSingle();
    if (perfil?.papel === "cliente") return true;

    // Camada 2: credor cadastrado com este email_contato (fluxo padrao —
    // o admin cadastra o credor com email; o perfil pode ainda nao existir).
    const { data: credor } = await sb
      .from("credores")
      .select("id")
      .eq("email_contato", e)
      .maybeSingle();
    if (credor?.id) return true;

    return false;
  } catch {
    return false;
  }
}
