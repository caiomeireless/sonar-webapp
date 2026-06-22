"use server";

// Server Actions de preferencias do cliente — limite mensal de gasto
// em pesquisas pagas.
//
// CRITICO: Server Actions sao endpoints publicos (qualquer cliente pode
// chamar). SEMPRE valida perfilLogado + vinculacao ao credor ANTES de
// qualquer trabalho no DB. Pagina ter checagem nao protege a action.
import { salvarPreferencias } from "@/lib/preferencias";
import { perfilLogado } from "@/lib/perfis-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function atualizarPreferenciasCliente(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const me = await perfilLogado();
  if (!me) return { ok: false, error: "Nao autenticado." };

  // SO o cliente do credor pode atualizar suas preferencias.
  const sb = createAdminClient();
  const { data: credor } = await sb
    .from("credores")
    .select("id")
    .eq("email_contato", me.email)
    .maybeSingle();
  if (!credor) {
    return { ok: false, error: "Voce nao esta vinculado a nenhum credor." };
  }

  const limiteRaw = formData.get("limite_mensal_brl");
  const limite = Number(limiteRaw);
  const limite_combo_lead = Number(formData.get("limite_combo_lead_brl") ?? 0);
  const limite_combo_doc = Number(formData.get("limite_combo_doc_brl") ?? 0);
  const bloquear = formData.get("bloquear_ao_exceder") === "true";
  const observacoesRaw = formData.get("observacoes");
  const observacoes =
    observacoesRaw === null || observacoesRaw === undefined
      ? null
      : observacoesRaw.toString();

  if (!Number.isFinite(limite) || limite < 0) {
    return { ok: false, error: "Limite invalido." };
  }
  if (!Number.isFinite(limite_combo_lead) || limite_combo_lead < 0) {
    return { ok: false, error: "Limite Combo Lead invalido." };
  }
  if (!Number.isFinite(limite_combo_doc) || limite_combo_doc < 0) {
    return { ok: false, error: "Limite Combo Documento invalido." };
  }

  // limites_por_api vem como JSON string serializado pelo client.
  // Tolerante: parse falhou => trata como vazio (sem limite por API).
  const limitesPorApiRaw = formData.get("limites_por_api")?.toString() ?? "{}";
  let limitesPorApi: Record<string, number> = {};
  try {
    const parsed = JSON.parse(limitesPorApiRaw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        const n = Number(v);
        if (typeof k === "string" && Number.isFinite(n) && n >= 0) {
          limitesPorApi[k] = n;
        }
      }
    }
  } catch {
    limitesPorApi = {};
  }

  const r = await salvarPreferencias(
    credor.id as number,
    {
      limite_mensal_brl: limite,
      limite_combo_lead_brl: limite_combo_lead,
      limite_combo_doc_brl: limite_combo_doc,
      limites_por_api: limitesPorApi,
      bloquear_ao_exceder: bloquear,
      observacoes,
    },
    me.email,
  );
  if (r.ok) revalidatePath("/cliente/preferencias");
  return r;
}
