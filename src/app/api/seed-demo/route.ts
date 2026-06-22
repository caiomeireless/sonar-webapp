// POST /api/seed-demo — dispara o seed dos dados de demonstracao.
// Idempotente: pode chamar quantas vezes quiser, sempre reseta os bens
// e atualiza credor/devedores/casos via UPSERT.
//
// GATES (em ordem):
//   1. ALLOW_DEMO_SEED=true — env var explicita; sem isso retorna 404
//      (esconde a existencia da rota). Em prod, deixar desligado por padrao.
//   2. perfil logado COM papel admin — bloqueia anonimo + cliente + funcionario.
//
// Use POST (nao GET): tem side-effects (DELETE+INSERT em multiplas tabelas)
// e nao deve ser cacheavel.
import { NextResponse } from "next/server";
import { seedDemoData } from "@/lib/demo-seed";
import { perfilLogado } from "@/lib/perfis-server";
import { ehAdmin } from "@/lib/perfis";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.ALLOW_DEMO_SEED !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const me = await perfilLogado();
  if (!ehAdmin(me)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await seedDemoData();
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[seed-demo] erro:", message);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
