// Dominio institucional do escritorio. Usuarios com este sufixo passam
// automaticamente como equipe (admin/socio/funcionario, conforme tabela perfis).
export const ALLOWED_DOMAIN = "bpadvogados.com.br";

// Dono / super-admin: unica conta com acesso a tela de Configuracoes (gestao
// de usuarios e permissoes). Nem outros admins acessam.
export const DONO_EMAIL = "caio@bpadvogados.com.br";

import { createAdminClient } from "@/lib/supabase/admin";

// Autoriza um email a acessar a plataforma.
// - Email do dominio do escritorio: SEMPRE autorizado (equipe).
// - Email externo: autorizado APENAS se houver linha em `perfis` com papel='cliente'.
//   Isso permite o portal do cliente sem barrar pelo dominio.
// Resiliente: se Supabase nao estiver configurado ainda, autoriza so o dominio.
export async function isEmailAutorizado(email: string | null | undefined): Promise<boolean> {
  const e = (email ?? "").toLowerCase();
  if (!e) return false;
  if (e.endsWith("@" + ALLOWED_DOMAIN)) return true;
  try {
    const sb = createAdminClient();
    const { data } = await sb
      .from("perfis")
      .select("papel")
      .eq("email", e)
      .maybeSingle();
    return data?.papel === "cliente";
  } catch {
    return false;
  }
}
