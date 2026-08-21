// Ponte Sonar -> Central Financeira do BP INTERNAL (Comunicação de Custos).
//
// O advogado comunica um custo extra de pesquisa (RI Digital, Registro
// Civil...) e o registro cai DIRETO no Supabase do BP INTERNAL — tabela
// `custos_pesquisas` + bucket privado `custos-pesquisas` (migração 063 do
// BP). O financeiro (Edileide) trata tudo na aba /financeiro de lá.
//
// Server-only: usa a service role do BP (BP_SUPABASE_URL +
// BP_SUPABASE_SERVICE_ROLE_KEY). Nunca importar em client component.
import { createClient } from "@supabase/supabase-js";

import type { ComunicacaoCusto } from "@/lib/custos-tipos";

export const BP_CUSTOS_TABELA = "custos_pesquisas";
export const BP_CUSTOS_BUCKET = "custos-pesquisas";

export function bpConfigurado(): boolean {
  return Boolean(
    process.env.BP_SUPABASE_URL && process.env.BP_SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function createBpAdminClient() {
  const url = process.env.BP_SUPABASE_URL;
  const key = process.env.BP_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Integração BP não configurada: falta BP_SUPABASE_URL ou BP_SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Catálogos e tipos compartilhados com o formulário vivem em
// src/lib/custos-tipos.ts (sem dependência de servidor).

// Lista as comunicações do PRÓPRIO advogado (portal Sonar mostra só as suas).
export async function listarMinhasComunicacoes(
  email: string,
): Promise<ComunicacaoCusto[]> {
  if (!bpConfigurado() || !email) return [];
  try {
    const bp = createBpAdminClient();
    const { data, error } = await bp
      .from(BP_CUSTOS_TABELA)
      .select(
        "id, criado_em, origem, tipo, valor_brl, data_gasto, cliente_nome, cliente_documento, processo_ref, descricao, advogado_nome, advogado_email, status, status_obs, anexos",
      )
      .eq("advogado_email", email.toLowerCase())
      .order("criado_em", { ascending: false })
      .limit(100);
    if (error || !data) return [];
    return data as unknown as ComunicacaoCusto[];
  } catch {
    return [];
  }
}
