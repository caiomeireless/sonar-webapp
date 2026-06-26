// Endpoint clicado pelo Caio no email pra aprovar um pedido de demo.
// Marca o token como "aprovado" + mostra pagina HTML com instrucao pra
// copiar o link de acesso e mandar pro visitante.

import { aprovarToken, buscarToken } from "@/lib/demo-tokens";

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

  await aprovarToken(token);

  const baseUrl = `${url.protocol}//${url.host}`;
  const linkAcesso = `${baseUrl}/api/demo/${encodeURIComponent(token)}`;

  return new Response(paginaSucesso(existente.nomeVisitante, existente.tipo, linkAcesso), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function paginaSucesso(nome: string, tipo: "equipe" | "cliente", link: string): string {
  const tipoLabel = tipo === "equipe" ? "EQUIPE" : "CLIENTE";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Sonar - Pedido aprovado</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#050706;color:#f0ead6;line-height:1.5;margin:0;padding:32px;min-height:100vh">
  <div style="max-width:560px;margin:0 auto;background:#0c0f0e;border:1px solid rgba(60,255,138,0.3);border-radius:16px;padding:32px">
    <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#3cff8a;margin:0 0 8px">Sonar &middot; Pedido aprovado</p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#fff">Demo ${tipoLabel} liberada</h1>
    <p style="margin:0 0 16px">Visitante: <strong>${escapeHtml(nome)}</strong></p>
    <p style="margin:0 0 8px;font-size:12px;color:#999;letter-spacing:.12em;text-transform:uppercase">Copie e envie pelo WhatsApp do visitante</p>
    <div style="padding:14px;background:#000;border:1px solid #333;border-radius:8px;word-break:break-all;font-family:monospace;font-size:13px;color:#3cff8a">${link}</div>
    <p style="margin:24px 0 0;font-size:12px;color:#888">O link vale por 24h. Ao acessar, o navegador recebe um cookie de sessao de demo e ve o portal como ${tipo === "equipe" ? "advogado" : "cliente"}.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
