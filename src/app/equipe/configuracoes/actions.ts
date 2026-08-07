// Server Actions da tela de Configurações:
// - Bugs: atualizar status (exclusivo DONO_EMAIL).
// - Clientes do Portal (Sprint 2): cadastrar credor, editar contato e
//   enviar convite de acesso — admin/sócio.
"use server";

import { revalidatePath } from "next/cache";

import { DONO_EMAIL } from "@/lib/config";
import { perfilLogado, perfilLogadoReal } from "@/lib/perfis-server";
import { ehAdmin, ehSocio } from "@/lib/perfis";
import { atualizarStatusBug, type BugStatus } from "@/lib/bugs";
import {
  atualizarCredor,
  criarCredor,
  type NovoCredorInput,
} from "@/lib/credores-admin";
import { enviarConvitePortal } from "@/lib/convites";
import { createAdminClient } from "@/lib/supabase/admin";

// Estado devolvido pros forms de cliente (useActionState).
export type EstadoAcaoCliente = {
  ok: boolean;
  mensagem: string;
} | null;

async function exigirAdminOuSocio(): Promise<boolean> {
  // Sessão REAL: cadastro/edição/convite não podem aceitar o perfil
  // sintético do cookie demo (que se apresenta como admin sem revalidação).
  const perfil = await perfilLogadoReal();
  return ehAdmin(perfil) || ehSocio(perfil);
}

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

// ============================================================
// Clientes do Portal (Sprint 2)
// ============================================================

export async function cadastrarClienteAction(
  _prev: EstadoAcaoCliente,
  formData: FormData,
): Promise<EstadoAcaoCliente> {
  if (!(await exigirAdminOuSocio())) {
    return { ok: false, mensagem: "Sem permissão para cadastrar clientes." };
  }

  const tipoRaw = String(formData.get("tipo") ?? "PJ").trim();
  const input: NovoCredorInput = {
    tipo: tipoRaw === "PF" ? "PF" : "PJ",
    documento: String(formData.get("documento") ?? "").trim(),
    nome: String(formData.get("nome") ?? "").trim(),
    email_contato: String(formData.get("email") ?? "").trim() || null,
    telefone: String(formData.get("telefone") ?? "").trim() || null,
    observacoes: String(formData.get("observacoes") ?? "").trim() || null,
  };

  const resultado = await criarCredor(input);
  if (!resultado.ok) return { ok: false, mensagem: resultado.erro };

  // Convite automático quando marcado E tem email.
  const conviteAgora = formData.get("enviar_convite") === "on";
  let sufixo = "";
  if (conviteAgora && input.email_contato) {
    const convite = await enviarConvitePortal({
      nomeCliente: input.nome,
      email: input.email_contato,
    });
    sufixo = convite.ok
      ? " Convite enviado por e-mail."
      : ` Cadastro OK, mas o convite falhou: ${convite.erro}`;
  }

  revalidatePath("/equipe/configuracoes");
  return { ok: true, mensagem: `Cliente "${input.nome}" cadastrado.${sufixo}` };
}

export async function atualizarClienteAction(
  _prev: EstadoAcaoCliente,
  formData: FormData,
): Promise<EstadoAcaoCliente> {
  if (!(await exigirAdminOuSocio())) {
    return { ok: false, mensagem: "Sem permissão para editar clientes." };
  }

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, mensagem: "Cliente inválido." };
  }

  const resultado = await atualizarCredor(id, {
    nome: String(formData.get("nome") ?? "").trim(),
    email_contato: String(formData.get("email") ?? "").trim() || null,
    telefone: String(formData.get("telefone") ?? "").trim() || null,
  });
  if (!resultado.ok) return { ok: false, mensagem: resultado.erro };

  revalidatePath("/equipe/configuracoes");
  return { ok: true, mensagem: "Dados do cliente atualizados." };
}

export async function enviarConviteAction(
  _prev: EstadoAcaoCliente,
  formData: FormData,
): Promise<EstadoAcaoCliente> {
  if (!(await exigirAdminOuSocio())) {
    return { ok: false, mensagem: "Sem permissão para enviar convites." };
  }

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, mensagem: "Cliente inválido." };
  }

  const sb = createAdminClient();
  const { data: credor } = await sb
    .from("credores")
    .select("nome, email_contato")
    .eq("id", id)
    .maybeSingle();
  if (!credor) return { ok: false, mensagem: "Cliente não encontrado." };

  const email = (credor.email_contato as string | null)?.trim();
  if (!email) {
    return {
      ok: false,
      mensagem: "Este cliente não tem e-mail de contato cadastrado.",
    };
  }

  const convite = await enviarConvitePortal({
    nomeCliente: credor.nome as string,
    email,
  });
  if (!convite.ok) return { ok: false, mensagem: convite.erro };

  revalidatePath("/equipe/configuracoes");
  return { ok: true, mensagem: `Convite enviado para ${email}.` };
}
