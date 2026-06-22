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
