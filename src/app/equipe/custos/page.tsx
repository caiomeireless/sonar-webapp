// Monitor de custos — placeholder. Conteúdo real virá com a integração
// das APIs pagas (Sem 2-8) e o registro real de cada chamada.
import { redirect } from "next/navigation";
import { DollarSign } from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { ehEquipe } from "@/lib/perfis";

export const dynamic = "force-dynamic";

export default async function CustosPage() {
  const perfil = await perfilLogado();
  if (!ehEquipe(perfil)) redirect("/login");

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
      <header className="title-shield mb-6 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <DollarSign className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Gastos com APIs
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Monitor de Custos
        </p>
      </header>

      <section className="glass p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-signal-soft)]">
          <DollarSign className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <h2 className="font-serif text-2xl text-ivory">Em construção</h2>
        <p className="mx-auto mt-2 max-w-[520px] text-sm text-[var(--color-ivory-66)]">
          Aqui o escritório acompanha o gasto detalhado por API
          (Assertiva, BigDataCorp, ARISP, etc.), por advogado, por cliente
          e por devedor. Em produção, cada consulta paga registra na
          tabela <code className="font-mono text-[12px]">custos</code>{" "}
          (já existente) e alimenta este painel.
        </p>
      </section>
    </main>
  );
}
