// Helper de auth para desenvolvimento.
// O ?eu=email eh atalho DE DEV/PREVIEW pra testar paginas como diferentes
// usuarios sem rodar o fluxo de OTP. Em producao, eh IGNORADO — auth real
// pelo Supabase eh obrigatorio.
//
// Padrao de uso nas paginas:
//   const params = await searchParams ?? {};
//   const eu = devEuFromParam(params.eu) ?? perfil?.email ?? null;

export function devEuFromParam(
  value: string | string[] | undefined,
): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

// Permite admin/sócio "visualizar como cliente" em prod. Aceita ?eu= se:
// - estamos em dev (qualquer perfil), OU
// - perfil logado tem papel admin ou sócio (visualização autorizada).
import type { Perfil } from "./perfis";

export function previewEuFromParam(
  value: string | string[] | undefined,
  perfil: Perfil | null,
): string | undefined {
  if (!value) return undefined;
  const email = Array.isArray(value) ? value[0] : value;
  if (process.env.NODE_ENV !== "production") return email;
  if (perfil?.papel === "admin" || perfil?.papel === "socio") return email;
  return undefined;
}
