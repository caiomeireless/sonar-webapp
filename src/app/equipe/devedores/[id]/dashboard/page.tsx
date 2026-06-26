// Dashboard analítico do Caso — visão da EQUIPE.
// Server Component: carrega dossiê (cabeçalho) + dados agregados (cards).
// Layout 12-col responsivo; mobile cai pra 1 coluna.
import Link from "next/link";
import { redirect } from "next/navigation";

import { obterDossie } from "@/lib/casos";
import { obterDadosDashboardCasoV2 } from "@/lib/dashboard-caso";
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
import RiscoPrescricao from "./_components/RiscoPrescricao";
import ConcentracaoPatrimonial from "./_components/ConcentracaoPatrimonial";
import BensComRestricao from "./_components/BensComRestricao";
import CustoOportunidade from "./_components/CustoOportunidade";
import ComparativoEscritorio from "./_components/ComparativoEscritorio";
import MapaDistribuicaoBens from "./_components/MapaDistribuicaoBens";
import VinculosPatrimoniais from "./_components/VinculosPatrimoniais";
import CronologiaCaso from "./_components/CronologiaCaso";
import ProximosAtosProcessuais from "./_components/ProximosAtosProcessuais";
import SazonalidadeAtividade from "./_components/SazonalidadeAtividade";

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
    obterDadosDashboardCasoV2(devedorId),
  ]);

  if (!dossie || !dados) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }

  const { devedor, casos } = dossie;
  const dossieHref = `/equipe/devedores/${devedorId}${linkBase}`;

  return (
    <main>
      {/* ============ BARRA DE TOPO ============ */}
      <section className="relative border-b border-[var(--color-ivory-12)]">
        <Link
          href={dossieHref}
          className="btn-neon-gold absolute right-6 top-10 z-10 sm:right-10"
        >
          ← Voltar ao dossiê
        </Link>
        <div className="mx-auto max-w-[1400px] px-6 py-10 text-center sm:px-10">
          <div className="flex items-center justify-center gap-3">
            <span className="eyebrow">Dashboard analítico</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
              Visão da equipe
            </span>
          </div>
          <h1 className="nome-devedor mx-auto mt-4 font-serif text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-tight text-[var(--color-devedor)]">
            {devedor.nome}
          </h1>
          <p className="mt-3 font-mono text-xs text-[var(--color-ivory-66)]">
            {casos.length} {casos.length === 1 ? "caso vinculado" : "casos vinculados"}
            {" · "}
            {devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
            {" · "}
            {devedor.documento}
          </p>
        </div>
      </section>

      {/* ============ GRID DE CARDS ============ */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
          {/* ====================================================
              SEÇÃO 1 — Visão Operacional (cards v1)
              ==================================================== */}
          <header className="mb-5">
            <span className="eyebrow">Seção 1</span>
            <h2 className="mt-2 font-serif text-[clamp(18px,2vw,24px)] font-medium leading-tight tracking-tight text-ivory">
              Visão Operacional
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {/* LINHA 1 — 3 KPIs (4 + 4 + 4) */}
            <div className="col-span-1 md:col-span-4">
              <KPIRecuperabilidade
                score={dados.kpis.scoreRecuperabilidade}
              />
            </div>
            <div className="col-span-1 md:col-span-4">
              <TempoMedidaPenhora dados={dados.tempoMedioMedidaPenhora} />
            </div>
            <div className="col-span-1 md:col-span-4">
              <KPIHero
                titulo="Patrimônio localizado"
                valor={formatBRL(dados.kpis.patrimonioLocalizadoBrl)}
                subtitulo={`${dados.kpis.qtdBens} ${
                  dados.kpis.qtdBens === 1 ? "bem mapeado" : "bens mapeados"
                } neste devedor`}
                accent="gold"
              />
            </div>

            {/* LINHA 2 — Funil (6) + Donut (6) */}
            <div className="col-span-1 md:col-span-6">
              <FunilTentadasPositivas funil={dados.funil} />
            </div>
            <div className="col-span-1 md:col-span-6">
              <DonutBensPorValor dados={dados.breakdownBensPorValor} />
            </div>

            {/* LINHA 3 — Linha financeira full */}
            <div className="col-span-1 md:col-span-12">
              <LinhaCobrancaRecuperacao dados={dados.linhaTempoFinanceira} />
            </div>

            {/* LINHA 4 — Heatmap (6) + Custos (6) */}
            <div className="col-span-1 md:col-span-6">
              <HeatmapEficacia heatmap={dados.heatmap} />
            </div>
            <div className="col-span-1 md:col-span-6">
              <CustosPorAPI dados={dados.custosPorAPI} />
            </div>

            {/* LINHA 5 — Próxima ação full (destaque) */}
            <div className="col-span-1 md:col-span-12">
              <div className="rounded-xl bg-gradient-to-br from-[rgba(60,255,138,0.04)] to-transparent p-px">
                <ProximaAcao proximaAcao={dados.proximaAcaoSugerida} />
              </div>
            </div>
          </div>

          {/* ====================================================
              SEÇÃO 2 — Análise de Risco (cards v2)
              ==================================================== */}
          <header className="mb-5 mt-12">
            <span className="eyebrow">Seção 2</span>
            <h2 className="mt-2 font-serif text-[clamp(18px,2vw,24px)] font-medium leading-tight tracking-tight text-ivory">
              Análise de Risco
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            <div className="col-span-1 md:col-span-6">
              <RiscoPrescricao metrica={dados.riscoPrescricao} />
            </div>
            <div className="col-span-1 md:col-span-6">
              <ConcentracaoPatrimonial dados={dados.concentracaoPatrimonial} />
            </div>

            <div className="col-span-1 md:col-span-6">
              <BensComRestricao dados={dados.bensComRestricao} />
            </div>
            <div className="col-span-1 md:col-span-6">
              <CustoOportunidade dados={dados.custoOportunidade} />
            </div>

            <div className="col-span-1 md:col-span-12">
              <ComparativoEscritorio dados={dados.comparativoEscritorio} />
            </div>
          </div>

          {/* ====================================================
              SEÇÃO 3 — Inteligência Patrimonial (cards v2)
              ==================================================== */}
          <header className="mb-5 mt-12">
            <span className="eyebrow">Seção 3</span>
            <h2 className="mt-2 font-serif text-[clamp(18px,2vw,24px)] font-medium leading-tight tracking-tight text-ivory">
              Inteligência Patrimonial
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            <div className="col-span-1 md:col-span-12">
              <MapaDistribuicaoBens distribuicao={dados.distribuicaoGeografica} />
            </div>

            <div className="col-span-1 md:col-span-6">
              <VinculosPatrimoniais vinculos={dados.vinculosPatrimoniais} />
            </div>
            <div className="col-span-1 md:col-span-6">
              <CronologiaCaso cronologia={dados.cronologiaCaso} />
            </div>

            <div className="col-span-1 md:col-span-7">
              <ProximosAtosProcessuais atos={dados.proximosAtosProcessuais} />
            </div>
            <div className="col-span-1 md:col-span-5">
              <SazonalidadeAtividade sazonalidade={dados.sazonalidadeAtividade} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// Estado vazio — devedor não encontrado / id inválido
// ============================================================

function NaoEncontrado({ voltarHref }: { voltarHref: string }) {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
      <div className="grid place-items-center">
        <SpotlightCard className="max-w-[520px] p-10 text-center">
          <span className="eyebrow !text-[var(--color-gold)]">Não encontrado</span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Devedor não localizado
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            O identificador informado não corresponde a nenhum devedor
            cadastrado.
          </p>
          <Link href={voltarHref} className="btn-neon-gold mt-6">
            ← Voltar para devedores
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}
