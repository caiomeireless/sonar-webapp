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

    const logoUrl = `${baseUrl}/brand/logo-horizontal.png`;
    const html = htmlEmailPedido({
      logoUrl,
      tipoLabel,
      nome: escapeHtml(nome),
      email: escapeHtml(email),
      motivo: motivo ? escapeHtml(motivo) : null,
      token: token.token,
      urlAprovar,
      urlNegar,
      urlAcesso,
    });

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
      console.error("[demo-token] Resend retornou erro:", JSON.stringify(result.error));
      return {
        ok: false,
        mensagem: `Falha ao enviar e-mail de aviso (${(result.error as { name?: string }).name ?? "erro Resend"}). Por favor, fale direto com Caio: WhatsApp (15) 98115-5238.`,
      };
    }
    console.log("[demo-token] email enviado, id:", result.data?.id);
  } catch (err) {
    console.error("[demo-token] excecao ao enviar email:", err);
    return {
      ok: false,
      mensagem: `Falha ao enviar e-mail (${err instanceof Error ? err.message : "erro desconhecido"}). Por favor, fale direto com Caio: WhatsApp (15) 98115-5238.`,
    };
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

// HTML do email — layout table-based (estilo "newsletter") para garantir
// renderizacao consistente em Outlook/Titan/Gmail. Estetica do Sonar:
// fundo onyx, header verde signal, accent dourado, fonte serif Georgia.
function htmlEmailPedido(a: {
  logoUrl: string;
  tipoLabel: string;
  nome: string;
  email: string;
  motivo: string | null;
  token: string;
  urlAprovar: string;
  urlNegar: string;
  urlAcesso: string;
}): string {
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:0;background:#0a0c0b;font-family:Georgia,'Times New Roman',serif;color:#f0ead6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c0b;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#121514;border:1px solid #1f2422;border-radius:12px;overflow:hidden;">

        <!-- HEADER com faixa verde + logo -->
        <tr><td align="center" style="background:linear-gradient(135deg,#0d1612 0%,#101816 100%);padding:32px 24px 22px;border-bottom:1px solid #1f2422;">
          <img src="${a.logoUrl}" alt="Sonar - Battaglia &amp; Pedrosa Advogados" width="180" style="display:block;max-width:180px;width:60%;height:auto;border:0;outline:none;text-decoration:none;" />
          <p style="margin:18px 0 0;font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#3cff8a;font-family:'Courier New',monospace;">Pedido de Demonstração</p>
        </td></tr>

        <!-- TITULO -->
        <tr><td align="center" style="padding:30px 36px 8px;">
          <h1 style="font-size:24px;margin:0;color:#f8f3df;letter-spacing:.3px;font-weight:500;line-height:1.2;">Nova solicitação<br/><span style="color:#c9a24a;">Demo ${a.tipoLabel}</span></h1>
        </td></tr>

        <!-- DADOS DO VISITANTE -->
        <tr><td style="padding:24px 40px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid #1f2422;border-radius:8px;">
            <tr><td style="padding:18px 22px;">
              <p style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#9a937e;margin:0 0 4px;font-family:'Courier New',monospace;">Nome</p>
              <p style="font-size:16px;color:#f8f3df;margin:0 0 14px;">${a.nome}</p>

              <p style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#9a937e;margin:0 0 4px;font-family:'Courier New',monospace;">E-mail</p>
              <p style="font-size:14px;color:#c9a24a;margin:0 0 ${a.motivo ? "14px" : "0"};"><a href="mailto:${a.email}" style="color:#c9a24a;text-decoration:none;">${a.email}</a></p>
              ${
                a.motivo
                  ? `
              <p style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#9a937e;margin:0 0 4px;font-family:'Courier New',monospace;">Motivo</p>
              <p style="font-size:14px;color:#e8e0c6;margin:0;font-style:italic;line-height:1.5;">"${a.motivo}"</p>`
                  : ""
              }
            </td></tr>
          </table>
        </td></tr>

        <!-- BOTOES APROVAR / NEGAR -->
        <tr><td align="center" style="padding:30px 40px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 6px;">
                <a href="${a.urlAprovar}" style="display:inline-block;background:#3cff8a;color:#0a0c0b;font-weight:700;font-size:14px;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:.04em;font-family:Georgia,serif;box-shadow:0 4px 18px rgba(60,255,138,0.25);">✓ Aprovar pedido</a>
              </td>
              <td style="padding:0 6px;">
                <a href="${a.urlNegar}" style="display:inline-block;background:transparent;color:#9a937e;border:1px solid #2a302d;font-weight:500;font-size:14px;padding:13px 22px;border-radius:8px;text-decoration:none;letter-spacing:.04em;font-family:Georgia,serif;">Negar</a>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0;font-size:12px;color:#7e786a;line-height:1.5;">Ao aprovar, copie o link de acesso abaixo<br/>e envie pelo WhatsApp do visitante.</p>
        </td></tr>

        <!-- LINK DE ACESSO -->
        <tr><td style="padding:26px 40px 6px;">
          <p style="font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#9a937e;margin:0 0 8px;font-family:'Courier New',monospace;">Link de Acesso (24h)</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:14px 18px;background:#0a0c0b;border:1px dashed #2a302d;border-radius:6px;">
              <a href="${a.urlAcesso}" style="display:block;word-break:break-all;font-family:'Courier New',monospace;font-size:12px;color:#3cff8a;text-decoration:none;line-height:1.5;">${a.urlAcesso}</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- DIVIDER + TOKEN -->
        <tr><td style="padding:20px 40px 10px;">
          <div style="height:2px;width:48px;background:#c9a24a;border-radius:1px;margin:0 auto;"></div>
        </td></tr>
        <tr><td align="center" style="padding:4px 40px 28px;">
          <p style="font-size:10px;color:#5a564b;margin:0;font-family:'Courier New',monospace;letter-spacing:.06em;">TOKEN ${a.token}</p>
        </td></tr>

      </table>
      <p style="font-size:11px;color:#5a564b;margin:18px 0 0;font-family:Georgia,serif;">Sonar &middot; Plataforma de Localização Patrimonial<br/><strong style="color:#7e786a;">Battaglia &amp; Pedrosa Advogados</strong></p>
    </td></tr>
  </table>
</body></html>`;
}
