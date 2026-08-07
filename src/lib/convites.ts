// Convite de acesso ao portal do cliente — server-only.
// Sprint 2: o admin cadastra o credor com email de contato e clica
// "Enviar Convite". O cliente recebe um email com o link do portal;
// no primeiro login (OTP), perfis.papel=cliente é auto-criado com
// credor_id (ver autoCriarPerfil em lib/perfis.ts).

const SENDER = "Sonar · Battaglia & Pedrosa <contato@bpadvogados.com.br>";

export type ResultadoConvite =
  | { ok: true }
  | { ok: false; erro: string };

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://sonar-bpa.vercel.app")
  );
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Template dourado-sobre-onyx — espelha a identidade da plataforma.
// Tabela + estilos inline (compatibilidade de client de email).
function htmlConvite(opts: {
  nomeCliente: string;
  loginUrl: string;
  logoUrl: string;
}): string {
  const { nomeCliente, loginUrl, logoUrl } = opts;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#0A0C0B;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0C0B;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0F1311;border:1px solid rgba(201,162,74,0.35);border-radius:16px;overflow:hidden;">
        <tr>
          <td align="center" style="padding:36px 40px 20px;">
            <img src="${logoUrl}" alt="Sonar — Battaglia &amp; Pedrosa" width="220" style="display:block;max-width:220px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:8px 40px 0;">
            <p style="margin:0;text-align:center;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#3CFF8A;">
              Acesso Liberado
            </p>
            <h1 style="margin:12px 0 0;text-align:center;font-size:24px;line-height:1.3;color:#C9A24A;font-weight:600;">
              Seu Portal de Acompanhamento Patrimonial
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px 8px;">
            <p style="margin:0;font-size:15px;line-height:1.7;color:#E8E4D6;">
              Olá, <strong style="color:#C9A24A;">${escapeHtml(nomeCliente)}</strong>.
            </p>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#E8E4D6;">
              O escritório <strong>Battaglia &amp; Pedrosa Advogados</strong> liberou
              o seu acesso ao <strong>Sonar</strong>, a plataforma de inteligência
              patrimonial que acompanha seus processos de recuperação de crédito.
            </p>
            <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#E8E4D6;">
              Lá você acompanha, em tempo real: os bens localizados dos devedores,
              as medidas tomadas pela equipe e o andamento de cada processo.
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:28px 40px;">
            <a href="${loginUrl}" style="display:inline-block;background:#3CFF8A;color:#0A0C0B;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:12px;">
              Entrar no Portal
            </a>
            <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#8A8778;">
              Use este mesmo e-mail para entrar — você recebe um código de
              verificação, sem necessidade de senha.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;">
            <hr style="border:none;border-top:1px solid rgba(232,228,214,0.12);margin:0 0 16px;" />
            <p style="margin:0;text-align:center;font-size:11px;line-height:1.6;color:#8A8778;">
              Dúvidas? Responda este e-mail ou fale com seu advogado responsável.<br />
              Sonar · Battaglia &amp; Pedrosa Advogados
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Envia o convite. Falha vira mensagem legível pra UI (não lança).
export async function enviarConvitePortal(opts: {
  nomeCliente: string;
  email: string;
}): Promise<ResultadoConvite> {
  const email = opts.email.trim().toLowerCase();
  if (!email) return { ok: false, erro: "Credor sem e-mail de contato." };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, erro: "RESEND_API_KEY não configurada no ambiente." };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const url = baseUrl();
    const loginUrl = `${url}/login`;
    const logoUrl = `${url}/brand/logo-horizontal.png`;

    const result = await resend.emails.send({
      from: SENDER,
      to: email,
      subject: "Seu acesso ao Sonar foi liberado — Battaglia & Pedrosa",
      html: htmlConvite({ nomeCliente: opts.nomeCliente, loginUrl, logoUrl }),
      text: [
        `Olá, ${opts.nomeCliente}.`,
        ``,
        `O escritório Battaglia & Pedrosa Advogados liberou o seu acesso ao`,
        `Sonar, a plataforma de inteligência patrimonial que acompanha seus`,
        `processos de recuperação de crédito.`,
        ``,
        `Entre no portal: ${loginUrl}`,
        ``,
        `Use este mesmo e-mail para entrar — você recebe um código de`,
        `verificação, sem necessidade de senha.`,
        ``,
        `Dúvidas? Responda este e-mail ou fale com seu advogado responsável.`,
      ].join("\n"),
    });

    if (result.error) {
      const nomeErro =
        (result.error as { name?: string }).name ?? "erro do Resend";
      return { ok: false, erro: `Falha no envio (${nomeErro}).` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      erro: (e as Error).message || "Falha inesperada ao enviar o convite.",
    };
  }
}
