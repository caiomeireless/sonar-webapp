// Endpoint clicado pelo VISITANTE quando ele cola o codigo de 6 digitos
// no card "Entrar com codigo" da landing:
//   GET /api/demo/{codigo}
//
// - Codigo nao existe / expirou (>24h) -> 404 com pagina amigavel
//   (volta pra landing pedindo pra falar com o Caio)
// - Codigo valido -> seta cookie `sonar.demo` com tipo e redireciona
//   pra /equipe ou /cliente

import { NextResponse } from "next/server";
import { consumirToken } from "@/lib/demo-tokens";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "sonar.demo";
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24h

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: codigoUrl } = await params;
  // Aceita apenas 6 digitos numericos
  const codigo = (codigoUrl ?? "").replace(/\D/g, "");
  if (codigo.length !== 6) {
    return new Response(paginaErro(), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const valido = await consumirToken(codigo);

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

  // Cookie de sessao demo (formato "tipo:codigo") pro middleware ler.
  const payload = `${valido.tipo}:${valido.codigo}`;
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
<head><meta charset="utf-8"/><title>Sonar - Codigo invalido</title><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:system-ui,sans-serif;background:#050706;color:#f0ead6;padding:48px;text-align:center;min-height:100vh;margin:0">
  <div style="max-width:480px;margin:0 auto">
    <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#ff5b5b">Sonar &middot; Codigo invalido</p>
    <h1 style="margin:16px 0 0;font-size:22px">Esse codigo nao foi reconhecido ou ja expirou.</h1>
    <p style="margin:12px 0 0;color:#aaa">Os codigos de demo valem 24 horas. Para um novo, peca um codigo de volta na pagina inicial ou fale direto com o Caio: WhatsApp (15) 98115-5238.</p>
    <a href="/" style="display:inline-block;margin-top:24px;padding:10px 20px;background:rgba(168,85,247,0.16);color:#e9d5ff;border:1px solid rgba(192,132,252,0.5);border-radius:8px;text-decoration:none">Voltar ao inicio</a>
  </div>
</body>
</html>`.trim();
}
