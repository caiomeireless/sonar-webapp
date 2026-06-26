// Rota de diagnostico — simula o fluxo COMPLETO do botao "Versao Demo".
// Cria token + envia email igual a server action `pedirDemo`, mas devolve
// um JSON detalhado mostrando o que aconteceu em cada passo.
//
// Uso: https://sonar-bpa.vercel.app/api/demo/teste-pedido

import { criarToken } from "@/lib/demo-tokens";

export const dynamic = "force-dynamic";

const EMAIL_ADMIN = "caio@bpadvogados.com.br";
const SENDER = "Sonar Landing <contato@bpadvogados.com.br>";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nome = url.searchParams.get("nome") ?? "Teste Diagnostico";
  const email = url.searchParams.get("email") ?? "teste@exemplo.com";
  const tipo = (url.searchParams.get("tipo") ?? "equipe") as "equipe" | "cliente";

  const out: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    input: { tipo, nome, email },
    env: {
      RESEND_API_KEY_present: !!process.env.RESEND_API_KEY,
      RESEND_API_KEY_prefix: process.env.RESEND_API_KEY
        ? `${process.env.RESEND_API_KEY.slice(0, 6)}...`
        : null,
      VERCEL_URL: process.env.VERCEL_URL ?? null,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? null,
    },
  };

  // Passo 1: criar token
  let token;
  try {
    token = await criarToken({
      tipo,
      nomeVisitante: nome,
      emailVisitante: email,
      motivo: "Diagnostico via /api/demo/teste-pedido",
    });
    out.passo1_token = { ok: true, token: token.token };
  } catch (err) {
    out.passo1_token = {
      ok: false,
      erro: err instanceof Error ? err.message : String(err),
    };
    return Response.json(out, { status: 200 });
  }

  // Passo 2: importar Resend
  let Resend: typeof import("resend").Resend;
  try {
    const mod = await import("resend");
    Resend = mod.Resend;
    out.passo2_import_resend = { ok: true };
  } catch (err) {
    out.passo2_import_resend = {
      ok: false,
      erro: err instanceof Error ? err.message : String(err),
    };
    return Response.json(out, { status: 200 });
  }

  // Passo 3: enviar email
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      out.passo3_enviar = { ok: false, erro: "RESEND_API_KEY ausente" };
      return Response.json(out, { status: 200 });
    }
    const resend = new Resend(apiKey);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://sonar-bpa.vercel.app");
    const urlAprovar = `${baseUrl}/api/demo/aprovar?token=${encodeURIComponent(token.token)}`;
    const urlAcesso = `${baseUrl}/api/demo/${encodeURIComponent(token.token)}`;
    const tipoLabel = tipo === "equipe" ? "EQUIPE" : "CLIENTE";

    const result = await resend.emails.send({
      from: SENDER,
      to: EMAIL_ADMIN,
      subject: `[Sonar] Pedido de Demo ${tipoLabel} - ${nome} (DIAGNOSTICO)`,
      html: `<div style="font-family:system-ui,sans-serif;padding:24px">
<h1>Pedido de Demo (diagnostico)</h1>
<p>Nome: ${escapeHtml(nome)}</p>
<p>E-mail: ${escapeHtml(email)}</p>
<p>Tipo: ${tipoLabel}</p>
<p><a href="${urlAprovar}">Aprovar</a></p>
<p>Token: ${token.token}</p>
<p>Link de acesso: ${urlAcesso}</p>
</div>`,
      text: `Diagnostico. ${nome} <${email}> pediu Demo ${tipoLabel}.\nAprovar: ${urlAprovar}\nAcesso: ${urlAcesso}`,
    });

    if (result.error) {
      out.passo3_enviar = {
        ok: false,
        erro_resend: result.error,
        usou_from: SENDER,
        usou_to: EMAIL_ADMIN,
      };
    } else {
      out.passo3_enviar = {
        ok: true,
        email_id: result.data?.id ?? null,
        usou_from: SENDER,
        usou_to: EMAIL_ADMIN,
        urlAprovar,
        urlAcesso,
      };
    }
  } catch (err) {
    out.passo3_enviar = {
      ok: false,
      erro_excecao:
        err instanceof Error
          ? { message: err.message, name: err.name, stack: err.stack?.split("\n").slice(0, 3) }
          : String(err),
    };
  }

  return Response.json(out, { status: 200 });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
