// Endpoint clicado pelo VISITANTE pra resgatar a demo:
//   GET /api/demo/{token}
//
// - Token nao existe / nao foi aprovado / expirou -> 404 com pagina amigavel
// - Token aprovado e valido -> seta cookie `sonar.demo` com tipo e
//   redireciona pra /equipe ou /cliente

import { NextResponse } from "next/server";
import { consumirToken } from "@/lib/demo-tokens";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "sonar.demo";
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24h

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const valido = await consumirToken(token);

  if (!valido) {
    return new Response(paginaErro(), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const url = new URL(request.url);
  const redirectPath = valido.tipo === "equipe" ? "/equipe" : "/cliente";
  const response = NextResponse.redirect(
    new URL(redirectPath, `${url.protocol}//${url.host}`),
  );

  // Cookie de sessao demo — assinado simples (tipo:token) pro middleware
  // verificar. Em prod migrar pra JWT ou cookie sealed.
  const payload = `${valido.tipo}:${valido.token}`;
  response.cookies.set({
    name: COOKIE_NAME,
    value: payload,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
}

function paginaErro(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><title>Sonar - Link invalido</title><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:system-ui,sans-serif;background:#050706;color:#f0ead6;padding:48px;text-align:center;min-height:100vh;margin:0">
  <div style="max-width:480px;margin:0 auto">
    <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#ff5b5b">Sonar &middot; Link invalido</p>
    <h1 style="margin:16px 0 0;font-size:22px">Esse link ja expirou ou nao foi aprovado.</h1>
    <p style="margin:12px 0 0;color:#aaa">Os tokens de demo valem 24 horas a partir da aprovacao. Para um novo link, faca outro pedido na pagina inicial.</p>
    <a href="/" style="display:inline-block;margin-top:24px;padding:10px 20px;background:rgba(60,255,138,0.16);color:#3cff8a;border:1px solid rgba(60,255,138,0.5);border-radius:8px;text-decoration:none">Voltar ao inicio</a>
  </div>
</body>
</html>`.trim();
}
