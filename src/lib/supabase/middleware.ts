import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ALLOWED_DOMAIN, isEmailAutorizado } from "@/lib/config";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Sem env Supabase configurado: em dev deixa passar (modo "antes do setup",
  // permite ver a landing/login mesmo sem ter criado o projeto Supabase).
  // Em prod, fail-closed — config incompleta NAO pode liberar /app, /clientes,
  // /casos para anonimos. Redireciona pra landing com aviso de config.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    if (process.env.NODE_ENV === "production") {
      const redir = request.nextUrl.clone();
      redir.pathname = "/";
      redir.searchParams.set("erro", "config");
      return NextResponse.redirect(redir);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    anon,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() valida o token no servidor — diferente de getSession() (so le cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Rotas publicas (landing, /login, /auth/*, demos do mapa 3D): nao redireciona.
  const isLandingOuAuth =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/mapa-3d-demo");

  // Dev shortcut: em desenvolvimento, ?eu=<email> bypassa auth (pra
  // testar paginas do cliente/equipe sem rodar OTP). Em producao,
  // ignora — auth real eh obrigatorio.
  const hasDevEuParam =
    process.env.NODE_ENV !== "production" &&
    request.nextUrl.searchParams.has("eu");

  // Sem login + rota privada -> /login
  if (!user && !isLandingOuAuth && !hasDevEuParam) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logado, mas email nao autorizado (nao e do dominio do escritorio e nao e cliente cadastrado)
  if (user && !(await isEmailAutorizado(user.email))) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("erro", "dominio");
    return NextResponse.redirect(url);
  }

  // Logado tentando acessar /login: manda pro app
  if (user && path.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// re-export para suprimir warning de unused import
export { ALLOWED_DOMAIN };
