// Server Actions do canal de notificacoes do CLIENTE.
"use server";

import { revalidatePath } from "next/cache";

import {
  marcarComoLida,
  marcarTodasComoLidas,
} from "@/lib/notificacoes";

export async function marcarComoLidaAction(id: string) {
  await marcarComoLida(id);
  revalidatePath("/cliente/notificacoes");
  revalidatePath("/cliente");
}

export async function marcarTodasComoLidasAction(emailCliente?: string | null) {
  await marcarTodasComoLidas("cliente", emailCliente);
  revalidatePath("/cliente/notificacoes");
  revalidatePath("/cliente");
}

export async function marcarComoLidaForm(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await marcarComoLida(id);
  revalidatePath("/cliente/notificacoes");
  revalidatePath("/cliente");
}

export async function marcarTodasComoLidasForm(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim() || null;
  await marcarTodasComoLidas("cliente", email);
  revalidatePath("/cliente/notificacoes");
  revalidatePath("/cliente");
}
