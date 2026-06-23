// Dashboard analitico do Caso — visao da EQUIPE.
// Server Component: carrega dossie (cabecalho) + dados agregados (cards).
// Layout 12-col responsivo; mobile cai pra 1 coluna.
import Link from "next/link";
import { redirect } from "next/navigation";

import { obterDossie } from "@/lib/casos";
import { obterDadosDashboardCaso } from "@/lib/dashboard-caso";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { formatBRL } from "@/lib/format";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

import KPIRecuperabilidade from "./_components/KPIRecuperabilidade";
import TempoMedidaPenhora from "./_components/TempoMedidaPenhora";
import { KPIHero } from "@/components/dashboard/KPIHero";
import FunilTentadasPositivas from "./_components/FunilTentadasPositivas";
import DonutBensPorValor from "./_components/DonutBensPorValor";
import LinhaCobrancaRecuperacao from "./_components/LinhaCobrancaRecuperacao";
import HeatmapEficacia from "./_components/HeatmapEficacia";
import CustosPorAPI from "./_components/CustosPorAPI";
import ProximaAcao from "./_components/ProximaAcao";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function DashboardCasoPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const eu = devEuFromParam(sp.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const euDev = devEuFromParam(sp.eu);
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  if (!/^\d+$/.test(id)) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }
  const devedorId = Number.parseInt(id, 10);
  if (!Number.isFinite(devedorId)) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }

  const [dossie, dados] = await Promise.all([
    obterDossie(devedorId),
    obterDadosDashboardCaso(devedorId),
  ]);

  if (!dossie || !dados) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }

  const { devedor, casos } = dossie;
  const dossieHref = `/equipe/devedores/${devedorId}${linkBase}`;

  return (
    <main>
      {/* ============ BARRA DE TOPO ============ */}
      <section className="border-b border-[var(--color-ivory-12)]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="eyebrow">Dashboard analitico</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
                Visao da equipe
              </span>
            </div>
            <h1 className="mt-3 truncate font-serif text-[clamp(22px,3vw,32px)] font-medium leading-tight tracking-tight text-ivory">
              {devedor.nome}
            </h1>
            <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
              {casos.length} {casos.length === 1 ? "caso vinculado" : "casos vinculados"}
              {" · "}
              {devedor.tipo === "PF" ? "Pessoa Fisica" : "Pessoa Juridica"}
              {" · "}
              {devedor.documento}
            </p>
          </div>

          <Link
            href={dossieHref}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-ivory transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
          >
            ← Voltar ao dossie
          </Link>
        </div>
      </section>

      {/* ============ GRID DE CARDS ============ */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {/* LINHA 1 — 3 KPIs (4 + 4 + 4) */}
            <div className="md:col-span-4">
              <KPIRecuperabilidade
                score={dados.kpis.scoreRecuperabilidade}
              />
            </div>
            <div className="md:col-span-4">
              <TempoMedidaPenhora dados={dados.tempoMedioMedidaPenhora} />
            </div>
            <div className="md:col-span-4">
              <KPIHero
                titulo="Patrimonio localizado"
                valor={formatBRL(dados.kpis.patrimonioLocalizadoBrl)}
                subtitulo={`${dados.kpis.qtdBens} ${
                  dados.kpis.qtdBens === 1 ? "bem mapeado" : "bens mapeados"
                } neste devedor`}
                accent="gold"
              />
            </div>

            {/* LINHA 2 — Funil (6) + Donut (6) */}
            <div className="md:col-span-6">
              <FunilTentadasPositivas funil={dados.funil} />
            </div>
            <div className="md:col-span-6">
              <DonutBensPorValor dados={dados.breakdownBensPorValor} />
            </div>

            {/* LINHA 3 — Linha financeira full */}
            <div className="md:col-span-12">
              <LinhaCobrancaRecuperacao dados={dados.linhaTempoFinanceira} />
            </div>

            {/* LINHA 4 — Heatmap (6) + Custos (6) */}
            <div className="md:col-span-6">
              <HeatmapEficacia heatmap={dados.heatmap} />
            </div>
            <div className="md:col-span-6">
              <CustosPorAPI dados={dados.custosPorAPI} />
            </div>

            {/* LINHA 5 — Proxima acao full (destaque) */}
            <div className="md:col-span-12">
              <div className="rounded-xl bg-gradient-to-br from-[rgba(60,255,138,0.04)] to-transparent p-px">
                <ProximaAcao proximaAcao={dados.proximaAcaoSugerida} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// Estado vazio — devedor nao encontrado / id invalido
// ============================================================

function NaoEncontrado({ voltarHref }: { voltarHref: string }) {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
      <div className="grid place-items-center">
        <SpotlightCard className="max-w-[520px] p-10 text-center">
          <span className="eyebrow !text-[var(--color-gold)]">Nao encontrado</span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Devedor nao localizado
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            O identificador informado nao corresponde a nenhum devedor
            cadastrado.
          </p>
          <Link
            href={voltarHref}
            className="mt-6 inline-block rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            ← Voltar para devedores
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}
