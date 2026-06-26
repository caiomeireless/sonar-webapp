// Server Action — recebe o pedido de demo da landing e:
//   1. Cria token (in-memory)
//   2. Envia email pro caio@bpadvogados.com.br com links de Aprovar/Negar
//   3. Devolve um objeto { ok, mensagem } pro cliente decidir o que mostrar
//
// Falha silenciosa no Resend: se a env nao tiver RESEND_API_KEY, o token
// e' criado mesmo assim — Caio consulta na /equipe/configuracoes (TODO).
"use server";

import { criarToken, type DemoTipo } from "@/lib/demo-tokens";

const EMAIL_ADMIN = "caio@bpadvogados.com.br";
const SENDER = "Sonar Landing <contato@bpadvogados.com.br>";

export async function pedirDemo(formData: FormData): Promise<{
  ok: boolean;
  mensagem: string;
}> {
  const tipoRaw = String(formData.get("tipo") ?? "").trim();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  if (tipoRaw !== "equipe" && tipoRaw !== "cliente") {
    return { ok: false, mensagem: "Tipo de demo invalido." };
  }
  const tipo: DemoTipo = tipoRaw;

  if (!nome || nome.length < 2) {
    return { ok: false, mensagem: "Informe seu nome." };
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, mensagem: "Informe um e-mail valido." };
  }

  const token = await criarToken({
    tipo,
    nomeVisitante: nome,
    emailVisitante: email,
    motivo,
  });

  // E-mail pro Caio com botoes Aprovar / Negar.
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[demo-token] RESEND_API_KEY ausente em process.env");
      throw new Error("sem RESEND_API_KEY");
    }
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://sonar.vercel.app");

    const urlAprovar = `${baseUrl}/api/demo/aprovar?token=${encodeURIComponent(token.token)}`;
    const urlNegar = `${baseUrl}/api/demo/negar?token=${encodeURIComponent(token.token)}`;
    const urlAcesso = `${baseUrl}/api/demo/${encodeURIComponent(token.token)}`;
    const tipoLabel = tipo === "equipe" ? "EQUIPE" : "CLIENTE";

    const html = `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;line-height:1.55;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e5e5;border-radius:12px;background:#fff">
  <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#888;margin:0 0 4px">Sonar &middot; Pedido de Demo</p>
  <h1 style="margin:0 0 16px;font-size:20px;color:#0a0a0a">Nova solicitacao: Demo ${tipoLabel}</h1>
  <p style="margin:0 0 4px"><strong>Nome:</strong> ${escapeHtml(nome)}</p>
  <p style="margin:0 0 4px"><strong>E-mail:</strong> ${escapeHtml(email)}</p>
  ${motivo ? `<p style="margin:0 0 4px"><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>` : ""}
  <p style="margin:16px 0 0;font-size:12px;color:#666">Token: ${token.token}</p>

  <div style="margin:24px 0 8px;padding:16px;background:#f4f4f4;border-radius:8px;border-left:3px solid #c9a24a">
    <p style="margin:0 0 12px;font-size:13px;color:#444">Aprove pra liberar o link de acesso pro visitante. Ao aprovar, copie o link de acesso abaixo e envie pelo WhatsApp dele.</p>
    <a href="${urlAprovar}" style="display:inline-block;background:#3cff8a;color:#0a0a0a;font-weight:600;padding:10px 16px;border-radius:6px;text-decoration:none;margin-right:8px">Aprovar pedido</a>
    <a href="${urlNegar}" style="display:inline-block;background:#fff;color:#666;border:1px solid #ccc;font-weight:500;padding:10px 16px;border-radius:6px;text-decoration:none">Negar</a>
  </div>

  <div style="margin:16px 0 0;padding:12px;background:#fafafa;border-radius:6px">
    <p style="margin:0 0 6px;font-size:11px;color:#888;letter-spacing:.12em;text-transform:uppercase">Link de acesso (envie pro visitante apos aprovar)</p>
    <code style="display:block;word-break:break-all;font-size:12px;color:#0a0a0a">${urlAcesso}</code>
  </div>

  <p style="margin:24px 0 0;font-size:11px;color:#aaa">Tokens expiram em 24h apos a aprovacao.</p>
</div>`.trim();

    const result = await resend.emails.send({
      from: SENDER,
      to: EMAIL_ADMIN,
      subject: `[Sonar] Pedido de Demo ${tipoLabel} - ${nome}`,
      html,
      text: [
        `Nova solicitacao: Demo ${tipoLabel}`,
        `Nome: ${nome}`,
        `E-mail: ${email}`,
        motivo ? `Motivo: ${motivo}` : null,
        ``,
        `Aprovar: ${urlAprovar}`,
        `Negar: ${urlNegar}`,
        `Link de acesso pro visitante (apos aprovar): ${urlAcesso}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    if (result.error) {
      console.error("[demo-token] Resend retornou erro:", result.error);
    } else {
      console.log("[demo-token] email enviado, id:", result.data?.id);
    }
  } catch (err) {
    console.error("[demo-token] excecao ao enviar email:", err);
  }

  return {
    ok: true,
    mensagem:
      "Pedido enviado. Em breve o Advogado Caio Vicentino entrara em contato para liberar o acesso.",
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
