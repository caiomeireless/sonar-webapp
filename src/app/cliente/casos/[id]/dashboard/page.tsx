// Dashboard analitico do devedor — VISAO DO CLIENTE.
// Reusa os mesmos componentes do /equipe/devedores/[id]/dashboard
// (paridade visual total). Esconde CustosPorAPI (info sensivel do
// escritorio). Mesma logica de autorizacao do dossie do cliente:
// obterDossieParaCliente garante que o devedor pertence a um caso de
// credor com email_contato = eu (cliente real). Admin/socio fallback.

import Link from "next/link";
import { redirect } from "next/navigation";

import {
  obterDossie,
  obterDossieParaCliente,
} from "@/lib/casos";
import { obterDadosDashboardCasoV2 } from "@/lib/dashboard-caso";
import { perfilLogado } from "@/lib/perfis-server";
import { previewEuFromParam } from "@/lib/dev-auth";
import { formatBRL } from "@/lib/format";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

// Reusa os mesmos componentes do dashboard analitico da equipe.
import KPIRecuperabilidade from "@/app/equipe/devedores/[id]/dashboard/_components/KPIRecuperabilidade";
import TempoMedidaPenhora from "@/app/equipe/devedores/[id]/dashboard/_components/TempoMedidaPenhora";
import { KPIHero } from "@/components/dashboard/KPIHero";
import FunilTentadasPositivas from "@/app/equipe/devedores/[id]/dashboard/_components/FunilTentadasPositivas";
import DonutBensPorValor from "@/app/equipe/devedores/[id]/dashboard/_components/DonutBensPorValor";
import LinhaCobrancaRecuperacao from "@/app/equipe/devedores/[id]/dashboard/_components/LinhaCobrancaRecuperacao";
import HeatmapEficacia from "@/app/equipe/devedores/[id]/dashboard/_components/HeatmapEficacia";
import ProximaAcao from "@/app/equipe/devedores/[id]/dashboard/_components/ProximaAcao";
import RiscoPrescricao from "@/app/equipe/devedores/[id]/dashboard/_components/RiscoPrescricao";
import ConcentracaoPatrimonial from "@/app/equipe/devedores/[id]/dashboard/_components/ConcentracaoPatrimonial";
import BensComRestricao from "@/app/equipe/devedores/[id]/dashboard/_components/BensComRestricao";
import CustoOportunidade from "@/app/equipe/devedores/[id]/dashboard/_components/CustoOportunidade";
import ComparativoEscritorio from "@/app/equipe/devedores/[id]/dashboard/_components/ComparativoEscritorio";
import MapaDistribuicaoBens from "@/app/equipe/devedores/[id]/dashboard/_components/MapaDistribuicaoBens";
import VinculosPatrimoniais from "@/app/equipe/devedores/[id]/dashboard/_components/VinculosPatrimoniais";
import CronologiaCaso from "@/app/equipe/devedores/[id]/dashboard/_components/CronologiaCaso";
import ProximosAtosProcessuais from "@/app/equipe/devedores/[id]/dashboard/_components/ProximosAtosProcessuais";
import SazonalidadeAtividade from "@/app/equipe/devedores/[id]/dashboard/_components/SazonalidadeAtividade";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

function NaoEncontrado({ voltarHref }: { voltarHref: string }) {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
      <div className="grid place-items-center">
        <SpotlightCard className="max-w-[520px] p-10 text-center">
          <span className="eyebrow !text-[var(--color-gold)]">
            Não encontrado
          </span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Devedor não localizado
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            O identificador informado não corresponde a nenhum devedor da
            sua carteira.
          </p>
          <Link href={voltarHref} className="btn-neon-gold mt-6">
            ← Voltar para casos
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}

export default async function DashboardClienteCasoPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  const eu =
    previewEuFromParam(sp.eu, perfil) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const qsEu =
    typeof sp.eu === "string"
      ? `?eu=${encodeURIComponent(sp.eu)}`
      : Array.isArray(sp.eu) && sp.eu[0]
        ? `?eu=${encodeURIComponent(sp.eu[0])}`
        : "";

  if (!/^\d+$/.test(id)) {
    return <NaoEncontrado voltarHref={`/cliente/casos${qsEu}`} />;
  }
  const devedorId = Number.parseInt(id, 10);
  if (!Number.isFinite(devedorId)) {
    return <NaoEncontrado voltarHref={`/cliente/casos${qsEu}`} />;
  }

  // Autorizacao: cliente real precisa estar vinculado ao devedor;
  // admin/socio em modo visualizacao tem fallback.
  let dossie = await obterDossieParaCliente(devedorId, eu);
  if (
    !dossie &&
    (perfil?.papel === "admin" || perfil?.papel === "socio")
  ) {
    dossie = await obterDossie(devedorId);
  }
  if (!dossie) {
    return <NaoEncontrado voltarHref={`/cliente/casos${qsEu}`} />;
  }

  const dados = await obterDadosDashboardCasoV2(devedorId);
  if (!dados) {
    return <NaoEncontrado voltarHref={`/cliente/casos${qsEu}`} />;
  }

  const { devedor, casos } = dossie;
  const dossieHref = `/cliente/casos/${devedorId}${qsEu}`;

  return (
    <main>
      {/* ============ BARRA DE TOPO ============ */}
      <section className="border-b border-[var(--color-ivory-12)]">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="eyebrow">Dashboard anal&iacute;tico</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
                Vis&atilde;o do cliente
              </span>
            </div>
            <h1 className="nome-devedor mt-3 truncate font-serif text-[clamp(22px,3vw,32px)] font-medium leading-tight tracking-tight text-[var(--color-devedor)]">
              {devedor.nome}
            </h1>
            <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
              {casos.length}{" "}
              {casos.length === 1 ? "caso vinculado" : "casos vinculados"}
              {" · "}
              {devedor.tipo === "PF" ? "Pessoa F&iacute;sica" : "Pessoa Jur&iacute;dica"}
              {" · "}
              {devedor.documento}
            </p>
          </div>

          <Link href={dossieHref} className="btn-neon-gold shrink-0">
            ← Voltar ao dossi&ecirc;
          </Link>
        </div>
      </section>

      {/* ============ GRID DE CARDS ============ */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
          {/* SECAO 1 — Visao Operacional */}
          <header className="mb-5">
            <span className="eyebrow">Se&ccedil;&atilde;o 1</span>
            <h2 className="mt-2 font-serif text-[clamp(18px,2vw,24px)] font-medium leading-tight tracking-tight text-ivory">
              Vis&atilde;o Operacional
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
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
                titulo="Patrim&ocirc;nio localizado"
                valor={formatBRL(dados.kpis.patrimonioLocalizadoBrl)}
                subtitulo={`${dados.kpis.qtdBens} ${
                  dados.kpis.qtdBens === 1 ? "bem mapeado" : "bens mapeados"
                } neste devedor`}
                accent="gold"
              />
            </div>

            <div className="col-span-1 md:col-span-6">
              <FunilTentadasPositivas funil={dados.funil} />
            </div>
            <div className="col-span-1 md:col-span-6">
              <DonutBensPorValor dados={dados.breakdownBensPorValor} />
            </div>

            <div className="col-span-1 md:col-span-12">
              <LinhaCobrancaRecuperacao dados={dados.linhaTempoFinanceira} />
            </div>

            {/* Cliente NAO ve CustosPorAPI (custos das consultas eh interno).
                Heatmap fica full-width neste lugar. */}
            <div className="col-span-1 md:col-span-12">
              <HeatmapEficacia heatmap={dados.heatmap} />
            </div>

            <div className="col-span-1 md:col-span-12">
              <div className="rounded-xl bg-gradient-to-br from-[rgba(60,255,138,0.04)] to-transparent p-px">
                <ProximaAcao proximaAcao={dados.proximaAcaoSugerida} />
              </div>
            </div>
          </div>

          {/* SECAO 2 — Analise de Risco */}
          <header className="mb-5 mt-12">
            <span className="eyebrow">Se&ccedil;&atilde;o 2</span>
            <h2 className="mt-2 font-serif text-[clamp(18px,2vw,24px)] font-medium leading-tight tracking-tight text-ivory">
              An&aacute;lise de Risco
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            <div className="col-span-1 md:col-span-6">
              <RiscoPrescricao metrica={dados.riscoPrescricao} />
            </div>
            <div className="col-span-1 md:col-span-6">
              <ConcentracaoPatrimonial
                dados={dados.concentracaoPatrimonial}
              />
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

          {/* SECAO 3 — Inteligencia Patrimonial */}
          <header className="mb-5 mt-12">
            <span className="eyebrow">Se&ccedil;&atilde;o 3</span>
            <h2 className="mt-2 font-serif text-[clamp(18px,2vw,24px)] font-medium leading-tight tracking-tight text-ivory">
              Intelig&ecirc;ncia Patrimonial
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            <div className="col-span-1 md:col-span-12">
              <MapaDistribuicaoBens
                distribuicao={dados.distribuicaoGeografica}
              />
            </div>

            <div className="col-span-1 md:col-span-6">
              <VinculosPatrimoniais vinculos={dados.vinculosPatrimoniais} />
            </div>
            <div className="col-span-1 md:col-span-6">
              <CronologiaCaso cronologia={dados.cronologiaCaso} />
            </div>

            <div className="col-span-1 md:col-span-7">
              <ProximosAtosProcessuais
                atos={dados.proximosAtosProcessuais}
              />
            </div>
            <div className="col-span-1 md:col-span-5">
              <SazonalidadeAtividade
                sazonalidade={dados.sazonalidadeAtividade}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
