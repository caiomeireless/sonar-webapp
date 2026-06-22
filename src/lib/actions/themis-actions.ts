"use server";

// Server Actions do Themis — usadas pelo portal da equipe.
// CRITICO: Server Actions sao endpoints publicos. Validar auth antes
// de qualquer redirect.
//
// iniciarBuscaCombo(): dispara a busca patrimonial com modo+APIs escolhidos.
// No demo (Dia 4) e apenas uma animacao cinematografica adaptada ao
// modo/APIs. No real (Sem 2-4) cada fonte chamara sua API com
// confirmacao de custo (ver memoria sonar-consultas-pagas-sob-demanda).

import { redirect } from "next/navigation";
import { perfilLogado } from "@/lib/perfis-server";
import { ehEquipe } from "@/lib/perfis";

export async function iniciarBuscaCombo(formData: FormData) {
  const me = await perfilLogado();
  // Em prod exigimos perfil equipe. Em dev permitimos bypass via ?eu=
  // (gating em lib/dev-auth) — o `eu` vem no FormData.
  if (!ehEquipe(me) && process.env.NODE_ENV === "production") {
    throw new Error("Acesso negado.");
  }

  const devedorIdRaw = formData.get("devedor_id");
  const id = Number.parseInt(String(devedorIdRaw ?? ""), 10);
  if (!Number.isFinite(id)) {
    throw new Error("Devedor invalido.");
  }

  const eu = formData.get("eu");
  const modo = formData.get("modo");
  const apis = formData.get("apis");

  const params = new URLSearchParams();
  if (eu && String(eu).trim()) params.set("eu", String(eu).trim());
  if (modo && ["lead", "doc", "individual"].includes(String(modo))) {
    params.set("modo", String(modo));
  }
  if (apis && String(apis).trim()) {
    params.set("apis", String(apis).trim());
  }

  const qs = params.toString();
  redirect(`/equipe/themis/busca/${id}${qs ? `?${qs}` : ""}`);
}
