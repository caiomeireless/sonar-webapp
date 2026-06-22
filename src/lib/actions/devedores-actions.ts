"use server";

// Server Actions de devedores — usadas pelo portal da equipe.
// CRITICO: Server Actions sao endpoints publicos (qualquer cliente pode chamar).
// SEMPRE valida perfilLogado + ehEquipe ANTES de qualquer trabalho no DB.
// Pagina ter checagem nao protege a action — atacante pode chamar direto.
import { createAdminClient } from "@/lib/supabase/admin";
import { perfilLogado } from "@/lib/perfis-server";
import { ehEquipe } from "@/lib/perfis";

export type CriarDevedorInput = {
  tipo: "PF" | "PJ";
  documento: string;
  nome: string;
  data_nascimento?: string | null;
  credor_id: number;
  numero_processo?: string | null;
  valor_credito_brl?: number | null;
};

export type CriarDevedorResult =
  | { ok: true; devedor_id: number; caso_id: number }
  | { ok: false; error: string };

export async function criarDevedorECaso(
  input: CriarDevedorInput,
): Promise<CriarDevedorResult> {
  // GUARD: apenas perfis da equipe podem criar devedor/caso.
  const me = await perfilLogado();
  if (!ehEquipe(me)) {
    return { ok: false, error: "Acesso negado." };
  }

  const sb = createAdminClient();

  const documento = (input.documento ?? "").trim();
  const nome = (input.nome ?? "").trim();

  if (!documento) return { ok: false, error: "Documento obrigatorio." };
  if (!nome) return { ok: false, error: "Nome obrigatorio." };
  if (!Number.isFinite(input.credor_id)) {
    return { ok: false, error: "Credor invalido." };
  }

  // 1) Confirma que o credor existe.
  const { data: credor, error: errCredor } = await sb
    .from("credores")
    .select("id")
    .eq("id", input.credor_id)
    .maybeSingle();
  if (errCredor) return { ok: false, error: errCredor.message };
  if (!credor) return { ok: false, error: "Credor nao encontrado." };

  // 2) UPSERT do devedor por documento.
  // Procura existente primeiro pra decidir entre INSERT / UPDATE nome.
  const { data: existente } = await sb
    .from("devedores")
    .select("id, nome")
    .eq("documento", documento)
    .maybeSingle();

  let devedorId: number;
  if (existente) {
    devedorId = existente.id as number;
    if ((existente.nome as string) !== nome) {
      const { error: errUpd } = await sb
        .from("devedores")
        .update({ nome })
        .eq("id", devedorId);
      if (errUpd) return { ok: false, error: errUpd.message };
    }
  } else {
    const { data: novo, error: errIns } = await sb
      .from("devedores")
      .insert({
        tipo: input.tipo,
        documento,
        nome,
        data_nascimento: input.data_nascimento ?? null,
      })
      .select("id")
      .single();
    if (errIns) return { ok: false, error: errIns.message };
    if (!novo) return { ok: false, error: "Falha ao criar devedor." };
    devedorId = novo.id as number;
  }

  // 3) Cria caso ligando credor + devedor. Se ja existe combinacao, devolve
  //    erro amigavel (ou poderiamos optar por reutilizar — por enquanto erro
  //    deixa o usuario consciente do conflito).
  const { data: casoExistente } = await sb
    .from("casos")
    .select("id")
    .eq("credor_id", input.credor_id)
    .eq("devedor_id", devedorId)
    .maybeSingle();
  if (casoExistente) {
    return {
      ok: false,
      error:
        "Este credor ja possui um caso vinculado a este devedor. Abra o devedor existente.",
    };
  }

  const { data: caso, error: errCaso } = await sb
    .from("casos")
    .insert({
      credor_id: input.credor_id,
      devedor_id: devedorId,
      numero_processo: input.numero_processo ?? null,
      valor_credito_brl: input.valor_credito_brl ?? null,
      status: "ativo",
    })
    .select("id")
    .single();
  if (errCaso) return { ok: false, error: errCaso.message };
  if (!caso) return { ok: false, error: "Falha ao criar caso." };

  return { ok: true, devedor_id: devedorId, caso_id: caso.id as number };
}
