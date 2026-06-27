// Painel de Pedidos de Demo.
// Tela /equipe/demos — Caio (admin) e Paulo (socio) acompanham os
// visitantes que clicaram "Versão Demo" na landing e preencheram o
// formulario. A landing chama /api/demo/solicitar, que cria o token
// em `demo_tokens` (lib/demo-tokens.ts).
//
// Esta pagina e SOMENTE LEITURA — nao deleta nem reenvia. O fluxo de
// repasse do codigo continua sendo manual (e-mail + WhatsApp).
//
// Acesso: admin/socio. Funcionario cai pra /equipe; cliente cai pra
// /cliente/casos no layout.

import { redirect } from "next/navigation";
import { Mail } from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { ehAdmin, ehSocio } from "@/lib/perfis";
import { listarTodos } from "@/lib/demo-tokens";

import { KPIsDemos } from "./_components/KPIsDemos";
import { TabelaDemos } from "./_components/TabelaDemos";

export const dynamic = "force-dynamic";

export default async function PedidosDeDemoPage() {
  const perfil = await perfilLogado();
  if (!ehAdmin(perfil) && !ehSocio(perfil)) redirect("/equipe");

  const demos = await listarTodos(100);

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8 sm:px-10">
      <header className="title-shield mb-8 text-center">
        <div
          className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-[var(--color-surface-2)]"
          style={{ borderColor: "rgba(168,85,247,0.30)" }}
        >
          <Mail className="h-5 w-5" style={{ color: "#c084fc" }} />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Captação · Landing
        </p>
        <h1 className="mt-2 font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Pedidos de Demo
        </h1>
        <p className="mx-auto mt-3 max-w-[640px] text-sm text-[var(--color-ivory-88)]">
          Visitantes que solicitaram acesso à demo do Sonar pela página
          inicial. Cada pedido gera um código de 6 dígitos com validade de
          24 horas — o repasse ao visitante é manual (WhatsApp ou voz).
        </p>
      </header>

      <KPIsDemos demos={demos} />

      <div className="mt-8">
        <TabelaDemos demos={demos} />
      </div>
    </main>
  );
}
