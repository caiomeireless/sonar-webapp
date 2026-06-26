// Server Action — recebe o pedido de demo da landing e:
//   1. Cria token de 6 digitos (in-memory, TTL 24h)
//   2. Envia email pro caio@bpadvogados.com.br destacando o codigo
//      pra ele copiar e repassar pro visitante (WhatsApp/voz)
//   3. Devolve { ok, mensagem } pro modal mostrar o card com input
//      pro visitante colar o codigo e entrar
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

  // E-mail pro Caio mostrando o CODIGO em destaque (sem botoes — Caio so
  // copia o codigo e repassa pro visitante pelo proprio canal de contato).
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
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://sonar-bpa.vercel.app");
    const tipoLabel = tipo === "equipe" ? "EQUIPE" : "CLIENTE";
    const logoUrl = `${baseUrl}/brand/logo-horizontal.png`;

    const html = htmlEmailPedido({
      logoUrl,
      tipoLabel,
      nome: escapeHtml(nome),
      email: escapeHtml(email),
      motivo: motivo ? escapeHtml(motivo) : null,
      codigo: token.codigo,
    });

    const result = await resend.emails.send({
      from: SENDER,
      to: EMAIL_ADMIN,
      subject: `[Sonar] Demo ${tipoLabel} - ${nome} - Codigo ${token.codigo}`,
      html,
      text: [
        `Novo pedido de Demo ${tipoLabel}`,
        ``,
        `Codigo de acesso: ${token.codigo}`,
        ``,
        `Visitante: ${nome}`,
        `E-mail: ${email}`,
        motivo ? `Motivo: ${motivo}` : null,
        ``,
        `Repasse o codigo de 6 digitos acima pro visitante via WhatsApp.`,
        `Ele vai colar no card "Entrar com codigo" que ja esta aberto`,
        `na landing pra ele.`,
        ``,
        `O codigo expira em 24h.`,
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
      "Pedido recebido. O Advogado Caio Vicentino vai te enviar um codigo de 6 digitos pelo WhatsApp.",
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

// HTML do email — layout table-based pra Outlook/Titan/Gmail.
// Centraliza o CODIGO em destaque (fonte grande, monospace, fundo
// onyx, accent dourado) pra ser facil de bater olho e copiar.
function htmlEmailPedido(a: {
  logoUrl: string;
  tipoLabel: string;
  nome: string;
  email: string;
  motivo: string | null;
  codigo: string;
}): string {
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:0;background:#0a0c0b;font-family:Georgia,'Times New Roman',serif;color:#f0ead6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c0b;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#121514;border:1px solid #1f2422;border-radius:12px;overflow:hidden;">

        <!-- HEADER -->
        <tr><td align="center" style="background:linear-gradient(135deg,#0d1612 0%,#101816 100%);padding:32px 24px 22px;border-bottom:1px solid #1f2422;">
          <img src="${a.logoUrl}" alt="Sonar - Battaglia &amp; Pedrosa Advogados" width="180" style="display:block;max-width:180px;width:60%;height:auto;border:0;outline:none;text-decoration:none;" />
          <p style="margin:18px 0 0;font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#3cff8a;font-family:'Courier New',monospace;">Pedido de Demonstração</p>
        </td></tr>

        <!-- TITULO -->
        <tr><td align="center" style="padding:30px 36px 6px;">
          <h1 style="font-size:24px;margin:0;color:#f8f3df;letter-spacing:.3px;font-weight:500;line-height:1.2;">Novo pedido<br/><span style="color:#c9a24a;">Demo ${a.tipoLabel}</span></h1>
        </td></tr>

        <!-- CODIGO EM DESTAQUE -->
        <tr><td align="center" style="padding:28px 40px 18px;">
          <p style="font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#9a937e;margin:0 0 10px;font-family:'Courier New',monospace;">Codigo de acesso</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr><td style="background:#0a0c0b;border:1px solid rgba(60,255,138,0.4);border-radius:12px;padding:22px 40px;box-shadow:0 0 24px rgba(60,255,138,0.15);">
              <p style="margin:0;font-family:'Courier New',monospace;font-size:42px;font-weight:700;letter-spacing:.32em;color:#3cff8a;line-height:1;text-shadow:0 0 8px rgba(60,255,138,0.4);">${a.codigo}</p>
            </td></tr>
          </table>
          <p style="margin:14px 0 0;font-size:12px;color:#7e786a;line-height:1.5;max-width:380px;">Copie e envie pelo WhatsApp do visitante.<br/>Ele vai colar no card que ja esta aberto na tela dele.</p>
        </td></tr>

        <!-- DADOS DO VISITANTE -->
        <tr><td style="padding:18px 40px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid #1f2422;border-radius:8px;">
            <tr><td style="padding:18px 22px;">
              <p style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#9a937e;margin:0 0 4px;font-family:'Courier New',monospace;">Visitante</p>
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

        <!-- DIVIDER + FOOTER -->
        <tr><td style="padding:24px 40px 10px;">
          <div style="height:2px;width:48px;background:#c9a24a;border-radius:1px;margin:0 auto;"></div>
        </td></tr>
        <tr><td align="center" style="padding:4px 40px 28px;">
          <p style="font-size:11px;color:#7e786a;margin:0;font-family:Georgia,serif;">O codigo expira em 24 horas</p>
        </td></tr>

      </table>
      <p style="font-size:11px;color:#5a564b;margin:18px 0 0;font-family:Georgia,serif;">Sonar &middot; Plataforma de Localização Patrimonial<br/><strong style="color:#7e786a;">Battaglia &amp; Pedrosa Advogados</strong></p>
    </td></tr>
  </table>
</body></html>`;
}
