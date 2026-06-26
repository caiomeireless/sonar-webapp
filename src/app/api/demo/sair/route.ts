// Limpa o cookie sonar.demo e redireciona pra landing.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(
    new URL("/", `${url.protocol}//${url.host}`),
  );
  response.cookies.set({
    name: "sonar.demo",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
