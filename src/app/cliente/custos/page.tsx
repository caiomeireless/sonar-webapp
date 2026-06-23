// Monitor de custos — portal do cliente. Mostra o gasto agregado do mês
// vs. o limite definido nas preferências. NUNCA detalha por consulta —
// regra do projeto (privacidade operacional).

import { redirect } from "next/navigation";
import Link from "next/link";
import { DollarSign, ArrowRight } from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { previewEuFromParam } from "@/lib/dev-auth";
import { formatBRL } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function CustosClientePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  const eu = previewEuFromParam(params.eu, perfil) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  // Demo: valores fixos. Em produção, vem da tabela `custos` agrupada
  // pelo credor_id correspondente a este e-mail.
  const limiteMes = 500;
  const gastoMes = 187.4;
  const pct = Math.min(100, Math.round((gastoMes / limiteMes) * 100));

  const qsBase = params.eu
    ? `?eu=${encodeURIComponent(Array.isArray(params.eu) ? params.eu[0]! : params.eu)}`
    : "";

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10">
      <header className="title-shield mb-6 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <DollarSign className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Quanto Está Sendo Investido no Seu Portfólio
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Monitor de Custos
        </p>
      </header>

      <section className="glass p-8">
        <div className="flex items-baseline justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Gasto do mês
            </p>
            <p className="mt-1 text-4xl font-medium tabular-nums text-[var(--color-signal)]">
              {formatBRL(gastoMes)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Limite mensal
            </p>
            <p className="mt-1 font-mono text-2xl text-[var(--color-gold)]">
              {formatBRL(limiteMes)}
            </p>
          </div>
        </div>

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--color-signal)] shadow-[0_0_14px_rgba(60,255,138,0.45)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          {pct}% utilizado
        </p>

        <Link
          href={`/cliente/preferencias${qsBase}`}
          className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-signal)] hover:underline"
        >
          Ajustar limites e preferências <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      <p className="mt-6 max-w-[640px] text-xs text-[var(--color-ivory-66)]">
        Para preservar a estratégia do escritório, o detalhamento por consulta
        é restrito à equipe. Você acompanha o valor agregado do mês, com
        transparência sobre o teto contratado.
      </p>
    </main>
  );
}
