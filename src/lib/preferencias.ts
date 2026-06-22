// Preferencias do cliente do escritorio — limite mensal de gasto em
// pesquisas pagas (Assertiva, BigDataCorp, ARISP...).
//
// Resiliente: se a tabela `preferencias_cliente` (migration 005) ainda
// nao existir no Supabase, `obterPreferenciasDoCliente` retorna null e
// `salvarPreferencias` retorna { ok: false, error: 'tabela ausente' }.
// Sem panic — UI mostra o formulario vazio.
import { createAdminClient } from "@/lib/supabase/admin";

export interface PreferenciasCliente {
  credor_id: number;
  limite_mensal_brl: number;
  // Limites granulares por MODO (Combo Lead / Combo Doc). 0 = sem limite.
  limite_combo_lead_brl: number;
  limite_combo_doc_brl: number;
  // Limites por API individual ({ "assertiva.enderecos": 50.0, ... }).
  // Ausencia = sem limite no nivel da API. Regra "mais restritivo vence":
  // se qualquer nivel (global/modo/api) estourar, a consulta e bloqueada.
  limites_por_api: Record<string, number>;
  bloquear_ao_exceder: boolean;
  ajustado_por: string | null;
  ajustado_em: string;
  observacoes: string | null;
}

// Le preferencias do credor que tem `email_contato = clienteEmail`.
// Se nao houver registro (cliente nao definiu limite) OU se a tabela
// ainda nao existe, devolve null.
export async function obterPreferenciasDoCliente(
  clienteEmail: string,
): Promise<PreferenciasCliente | null> {
  const email = (clienteEmail ?? "").toLowerCase().trim();
  if (!email) return null;
  try {
    const sb = createAdminClient();
    // Acha o credor pelo email_contato.
    const { data: credor, error: errCredor } = await sb
      .from("credores")
      .select("id")
      .eq("email_contato", email)
      .maybeSingle();
    if (errCredor || !credor) return null;

    const { data, error } = await sb
      .from("preferencias_cliente")
      .select(
        "credor_id, limite_mensal_brl, limite_combo_lead_brl, limite_combo_doc_brl, limites_por_api, bloquear_ao_exceder, ajustado_por, ajustado_em, observacoes",
      )
      .eq("credor_id", credor.id as number)
      .maybeSingle();
    if (error || !data) return null;

    // limites_por_api vem como jsonb -> ja deserializado pelo PostgREST.
    // Sanitiza: aceita so chaves string -> numero finito >= 0.
    const rawLimites = data.limites_por_api as unknown;
    const limitesPorApi: Record<string, number> = {};
    if (rawLimites && typeof rawLimites === "object" && !Array.isArray(rawLimites)) {
      for (const [k, v] of Object.entries(rawLimites as Record<string, unknown>)) {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0) limitesPorApi[k] = n;
      }
    }

    return {
      credor_id: data.credor_id as number,
      limite_mensal_brl: Number(data.limite_mensal_brl) || 0,
      limite_combo_lead_brl: Number(data.limite_combo_lead_brl) || 0,
      limite_combo_doc_brl: Number(data.limite_combo_doc_brl) || 0,
      limites_por_api: limitesPorApi,
      bloquear_ao_exceder: Boolean(data.bloquear_ao_exceder),
      ajustado_por: (data.ajustado_por as string | null) ?? null,
      ajustado_em: (data.ajustado_em as string) ?? "",
      observacoes: (data.observacoes as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

// Salva/atualiza preferencias do cliente. Upsert por credor_id.
// Atualiza ajustado_por + ajustado_em + atualizado_em sempre.
export async function salvarPreferencias(
  credorId: number,
  patch: Partial<Omit<PreferenciasCliente, "credor_id" | "ajustado_em">>,
  ajustadoPor: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!Number.isFinite(credorId)) {
    return { ok: false, error: "credor_id invalido" };
  }
  try {
    const sb = createAdminClient();
    const agora = new Date().toISOString();
    const row: Record<string, unknown> = {
      credor_id: credorId,
      ajustado_por: ajustadoPor || null,
      ajustado_em: agora,
      atualizado_em: agora,
    };
    if (patch.limite_mensal_brl !== undefined) {
      row.limite_mensal_brl = Number(patch.limite_mensal_brl) || 0;
    }
    if (patch.limite_combo_lead_brl !== undefined) {
      row.limite_combo_lead_brl = Number(patch.limite_combo_lead_brl) || 0;
    }
    if (patch.limite_combo_doc_brl !== undefined) {
      row.limite_combo_doc_brl = Number(patch.limite_combo_doc_brl) || 0;
    }
    if (patch.limites_por_api !== undefined) {
      // Sanitiza: garante objeto plano com numeros >= 0.
      const clean: Record<string, number> = {};
      const src = patch.limites_por_api ?? {};
      if (src && typeof src === "object") {
        for (const [k, v] of Object.entries(src)) {
          const n = Number(v);
          if (typeof k === "string" && Number.isFinite(n) && n >= 0) {
            clean[k] = n;
          }
        }
      }
      row.limites_por_api = clean;
    }
    if (patch.bloquear_ao_exceder !== undefined) {
      row.bloquear_ao_exceder = Boolean(patch.bloquear_ao_exceder);
    }
    if (patch.observacoes !== undefined) {
      row.observacoes = patch.observacoes;
    }

    const { error } = await sb
      .from("preferencias_cliente")
      .upsert(row, { onConflict: "credor_id" });
    if (error) {
      // 42P01 = undefined_table no Postgres
      const msg = error.message || "";
      if (
        error.code === "42P01" ||
        /does not exist/i.test(msg) ||
        /relation .* does not exist/i.test(msg)
      ) {
        return { ok: false, error: "tabela ausente" };
      }
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e) {
    const msg = (e as Error).message || "";
    if (/does not exist/i.test(msg)) {
      return { ok: false, error: "tabela ausente" };
    }
    return { ok: false, error: msg || "falha ao salvar" };
  }
}

// Soma o gasto do mes corrente em consultas pagas para um credor.
// O agregado e feito sobre a tabela `custos` filtrando pelos emails da
// equipe (registros do escritorio). Como ainda nao temos vinculacao
// custo->credor formal, isto e um MOCK que retorna ~R$ 47,20 — espelha
// a barra de saldo do mes nos cards de busca paga.
export async function gastoDoMesAtual(_credorId: number): Promise<number> {
  // Workaround mock pra demo. Quando a migration 002 evoluir pra associar
  // custos a credor, este helper agrega de verdade.
  return 47.20;
}
