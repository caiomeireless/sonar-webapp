// Endpoint clicado pelo Caio no email pra negar um pedido de demo.
// Marca o token como "negado" + mostra pagina HTML de confirmacao.

import { buscarToken, negarToken } from "@/lib/demo-tokens";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") ?? "").trim();
  if (!token) {
    return new Response("Token nao informado", { status: 400 });
  }

  const existente = await buscarToken(token);
  if (!existente) {
    return new Response("Token nao encontrado", { status: 404 });
  }

  await negarToken(token);

  return new Response(
    `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><title>Sonar - Pedido negado</title></head>
<body style="font-family:system-ui,sans-serif;background:#050706;color:#f0ead6;padding:48px;text-align:center">
  <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#ff5b5b">Sonar &middot; Pedido negado</p>
  <h1 style="margin:16px 0 0;font-size:22px">Tudo certo</h1>
  <p style="margin:8px 0 0;color:#aaa">O pedido foi marcado como negado.</p>
</body>
</html>`.trim(),
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
