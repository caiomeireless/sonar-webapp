import { createClient } from "@supabase/supabase-js";

// Cliente Supabase com a SERVICE ROLE KEY — ignora RLS e nao usa cookies.
// SO server-side (rota de sync, jobs). Nunca importar em componente de cliente.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin nao configurado: falta NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
