// Next 16: 'middleware' foi renomeado para 'proxy'. Runtime e nodejs.
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Exclui /api (auth proprio por rota) e assets estaticos.
    // .js incluso pra liberar scripts hospedados em /public/lib/ (ex.: particles.min.js).
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|woff|woff2|ttf|otf|ico|txt|xml|json|map)$).*)",
  ],
};
