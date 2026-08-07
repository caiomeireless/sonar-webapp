// Sai do modo "Ver Como Cliente": apaga o cookie de preview e volta
// pro painel da equipe. Alvo do botão "Voltar para a equipe" do banner.
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/equipe", req.url));
  res.cookies.set("sonar.preview_eu", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
