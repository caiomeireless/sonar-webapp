// Entra no modo "Ver Como Cliente": valida admin/sócio REAL, grava o
// cookie de preview e redireciona pro portal do cliente escolhido.
//
// O cookie existe porque layouts do App Router NUNCA recebem searchParams
// (só pages) — sem ele, o cliente/layout.tsx não sabe quem está sendo
// simulado e os links da sidebar voltariam pro cliente demo no 1º clique.
import { NextResponse, type NextRequest } from "next/server";

import { perfilLogadoReal } from "@/lib/perfis-server";
import { ehAdmin, ehSocio } from "@/lib/perfis";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PREVIEW_COOKIE = "sonar.preview_eu";
// 4 horas: o suficiente pra uma sessão de trabalho; expira sozinho se o
// admin esquecer o modo visualização aberto.
const MAX_AGE_S = 60 * 60 * 4;

export async function GET(req: NextRequest) {
  const perfil = await perfilLogadoReal();
  if (!ehAdmin(perfil) && !ehSocio(perfil)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const eu = (req.nextUrl.searchParams.get("eu") ?? "").toLowerCase().trim();
  if (!eu) {
    return NextResponse.redirect(new URL("/equipe/ver-como", req.url));
  }

  // Só e-mails que são de fato clientes cadastrados viram preview.
  let valido = false;
  if (!valido) {
    try {
      const sb = createAdminClient();
      const { data } = await sb
        .from("credores")
        .select("id")
        .eq("email_contato", eu)
        .maybeSingle();
      valido = !!data;
    } catch {
      valido = false;
    }
  }
  if (!valido) {
    return NextResponse.redirect(new URL("/equipe/ver-como", req.url));
  }

  const res = NextResponse.redirect(
    new URL(`/cliente?eu=${encodeURIComponent(eu)}`, req.url),
  );
  res.cookies.set(PREVIEW_COOKIE, eu, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  });
  return res;
}
