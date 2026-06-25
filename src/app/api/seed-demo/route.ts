// POST /api/seed-demo — dispara o seed dos dados de demonstração.
// Idempotente: pode chamar quantas vezes quiser, sempre reseta os bens
// e atualiza credor/devedores/casos via UPSERT.
//
// GATES (em ordem):
//   1. ALLOW_DEMO_SEED=true — env var explícita; sem isso retorna 404
//      (esconde a existência da rota). Em prod, deixar desligado por padrão.
//   2. perfil logado COM papel admin — bloqueia anônimo + cliente + funcionário.
//
// Use POST (não GET): tem side-effects (DELETE+INSERT em múltiplas tabelas)
// e não deve ser cacheável.
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
    // Expoe a mensagem real pro admin/dono — gate de permissao ja garante
    // que so o dono chega aqui, entao nao ha vazamento pra publico.
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
