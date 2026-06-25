// Server Actions da tela de Configurações. Hoje só uma: atualizar o
// status de um bug (admin-only — só Caio passa pela checagem do DONO_EMAIL).
"use server";

import { revalidatePath } from "next/cache";

import { DONO_EMAIL } from "@/lib/config";
import { perfilLogado } from "@/lib/perfis-server";
import { atualizarStatusBug, type BugStatus } from "@/lib/bugs";

const STATUS_VALIDOS: ReadonlySet<BugStatus> = new Set([
  "aberto",
  "em_analise",
  "resolvido",
  "ignorado",
]);

export async function mudarStatusBug(formData: FormData) {
  const perfil = await perfilLogado();
  if (perfil?.email?.toLowerCase() !== DONO_EMAIL.toLowerCase()) return;

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as BugStatus;
  if (!id || !STATUS_VALIDOS.has(status)) return;

  await atualizarStatusBug(id, status);
  revalidatePath("/equipe/configuracoes");
}
