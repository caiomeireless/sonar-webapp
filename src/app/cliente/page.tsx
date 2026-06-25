// Dashboard do cliente — visão agregada de TODOS os processos dele.
// Mostra KPIs do portfólio (casos, devedores, bens, patrimônio) + lista
// das medidas tomadas mais recentes pelo escritório.

import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Layers, Coins, Banknote, ArrowRight } from "lucide-react";

import {
  listarCasosDoCliente,
  listarBensPorLocalizacaoDoCliente,
} from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { previewEuFromParam } from "@/lib/dev-auth";
import { formatBRL } from "@/lib/format";
// Mesmo mapa interativo do dashboard analítico do devedor — reaproveitado
// pra que o cliente veja onde estão os bens dos seus processos.
import MapaDistribuicaoBens from "@/app/equipe/devedores/[id]/dashboard/_components/MapaDistribuicaoBens";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function DashboardClientePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  const eu = previewEuFromParam(params.eu, perfil) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const [casos, bensPorLocalizacao] = await Promise.all([
    listarCasosDoCliente(eu),
    listarBensPorLocalizacaoDoCliente(eu),
  ]);

  const totalCasos = casos.length;
  const devedoresUnicos = new Set(casos.map((c) => c.devedor.id)).size;
  const totalBens = casos.reduce((s, c) => s + c.total_bens, 0);
  const patrimonioLocalizado = casos.reduce(
    (s, c) => s + (c.valor_estimado_total_brl ?? 0),
    0,
  );
  const totalCobranca = casos.reduce(
    (s, c) => s + (c.valor_credito_brl ?? 0),
    0,
  );
  const recuperabilidade =
    totalCobranca > 0
      ? Math.min(100, Math.round((patrimonioLocalizado / totalCobranca) * 100))
      : 0;

  const qsBase = params.eu
    ? `?eu=${encodeURIComponent(Array.isArray(params.eu) ? params.eu[0]! : params.eu)}`
    : "";

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
      <header className="title-shield mb-6 text-center">
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Visão Geral dos Seus Processos
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Dashboard
        </p>
        <p className="mx-auto mt-3 max-w-[680px] text-base text-[var(--color-signal)]">
          Acompanhamento patrimonial dos devedores nos processos em que você é credor.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-4">
        <KpiCard
          icon={<FileText className="h-5 w-5" />}
          label="Casos ativos"
          valor={String(totalCasos)}
          accent="signal"
        />
        <KpiCard
          icon={<Layers className="h-5 w-5" />}
          label="Devedores rastreados"
          valor={String(devedoresUnicos)}
          accent="signal"
        />
        <KpiCard
          icon={<Coins className="h-5 w-5" />}
          label="Bens localizados"
          valor={String(totalBens)}
          accent="gold"
        />
        <KpiCard
          icon={<Banknote className="h-5 w-5" />}
          label="Patrimônio identificado"
          valor={formatBRL(patrimonioLocalizado)}
          accent="gold"
        />
      </section>

      {/* Barra de recuperabilidade */}
      <section className="glass mt-6 p-6">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Recuperabilidade estimada
            </p>
            <p className="mt-1 text-2xl font-medium tabular-nums text-[var(--color-signal)]">
              {recuperabilidade}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              Patrimônio / Crédito
            </p>
            <p className="mt-1 font-mono text-base text-[var(--color-gold)]">
              {formatBRL(patrimonioLocalizado)} / {formatBRL(totalCobranca)}
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--color-signal)] shadow-[0_0_12px_rgba(60,255,138,0.45)] transition-all"
            style={{ width: `${recuperabilidade}%` }}
          />
        </div>
      </section>

      {/* Lista resumida dos casos */}
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-serif text-2xl text-ivory">Processos em rastreamento</h2>
          <Link
            href={`/cliente/casos${qsBase}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-signal)] hover:underline"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {casos.length === 0 ? (
          <div className="glass p-8 text-center text-sm text-[var(--color-ivory-66)]">
            Nenhum processo em rastreamento.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {casos.slice(0, 6).map((c) => (
              <Link
                key={c.caso_id}
                href={`/cliente/casos/${c.caso_id}${qsBase}`}
                className="glass-2 group block p-5 transition hover:border-[var(--color-signal-soft-2)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-gold)]">
                    Pasta #{c.caso_id}
                  </span>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                    {c.numero_processo ?? "Sem número"}
                  </p>
                </div>
                <h3 className="nome-devedor mt-2 font-serif text-lg text-[var(--color-devedor)]">
                  {c.devedor.nome}
                </h3>
                <div className="mt-3 flex items-center justify-between text-base">
                  <span className="text-[var(--color-ivory-88)]">
                    {c.total_bens} {c.total_bens === 1 ? "bem" : "bens"}
                  </span>
                  <span className="font-mono tabular-nums text-[var(--color-gold)]">
                    {formatBRL(c.valor_estimado_total_brl ?? 0)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Mapa do Brasil — mesmo componente do dashboard analítico do devedor,
          aqui filtrado pelos bens dos devedores nos processos do cliente. */}
      {bensPorLocalizacao.length > 0 && (
        <section className="mt-8">
          <MapaDistribuicaoBens
            distribuicao={bensPorLocalizacao}
            titulo="Onde Estão Meus Bens Rastreados"
            descricao="Distribuição geográfica dos bens identificados nos seus processos."
          />
        </section>
      )}
    </main>
  );
}

function KpiCard({
  icon,
  label,
  valor,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  valor: string;
  accent: "signal" | "gold";
}) {
  const corValor =
    accent === "signal" ? "var(--color-signal)" : "var(--color-gold)";
  return (
    <div className="glass relative overflow-hidden p-5">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)]"
          style={{ color: corValor }}
        >
          {icon}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          {label}
        </span>
      </div>
      <p
        className="mt-3 text-3xl font-medium leading-none tabular-nums tracking-tight"
        style={{ color: corValor }}
      >
        {valor}
      </p>
    </div>
  );
}
