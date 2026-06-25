// Server Actions do canal de notificacoes da EQUIPE.
//
// Em produca: ler/escrever em uma tabela `notificacoes` no Supabase. Por
// enquanto, manipulamos os arrays in-memory expostos por `lib/notificacoes.ts`.
"use server";

import { revalidatePath } from "next/cache";

import {
  marcarComoLida,
  marcarTodasComoLidas,
} from "@/lib/notificacoes";

export async function marcarComoLidaAction(id: string) {
  await marcarComoLida(id);
  revalidatePath("/equipe/notificacoes");
  revalidatePath("/equipe");
}

export async function marcarTodasComoLidasAction() {
  await marcarTodasComoLidas("equipe");
  revalidatePath("/equipe/notificacoes");
  revalidatePath("/equipe");
}

// Versao que aceita FormData — usada pelos <form action=...> nos botoes.
export async function marcarComoLidaForm(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await marcarComoLida(id);
  revalidatePath("/equipe/notificacoes");
  revalidatePath("/equipe");
}

export async function marcarTodasComoLidasForm() {
  await marcarTodasComoLidas("equipe");
  revalidatePath("/equipe/notificacoes");
  revalidatePath("/equipe");
}
