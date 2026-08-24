// Grid completo do Dashboard Analítico do caso (Seções 1-3) — extraído
// da página /dashboard pra ser REUSADO no fim da Ficha do Devedor
// (reforma 25/08: o dashboard virou um setor da própria ficha).
import { formatBRL } from "@/lib/format";
import type { obterDadosDashboardCasoV2 } from "@/lib/dashboard-caso";

import KPIRecuperabilidade from "./KPIRecuperabilidade";
import TempoMedidaPenhora from "./TempoMedidaPenhora";
import { KPIHero } from "@/components/dashboard/KPIHero";
import FunilTentadasPositivas from "./FunilTentadasPositivas";
import DonutBensPorValor from "./DonutBensPorValor";
import LinhaCobrancaRecuperacao from "./LinhaCobrancaRecuperacao";
import HeatmapEficacia from "./HeatmapEficacia";
import CustosPorAPI from "./CustosPorAPI";
import ProximaAcao from "./ProximaAcao";
import RiscoPrescricao from "./RiscoPrescricao";
import ConcentracaoPatrimonial from "./ConcentracaoPatrimonial";
import BensComRestricao from "./BensComRestricao";
import CustoOportunidade from "./CustoOportunidade";
import ComparativoEscritorio from "./ComparativoEscritorio";
import MapaDistribuicaoBens from "./MapaDistribuicaoBens";
import VinculosPatrimoniais from "./VinculosPatrimoniais";
import CronologiaCaso from "./CronologiaCaso";
import ProximosAtosProcessuais from "./ProximosAtosProcessuais";
import SazonalidadeAtividade from "./SazonalidadeAtividade";

export type DadosDashboardCaso = NonNullable<
  Awaited<ReturnType<typeof obterDadosDashboardCasoV2>>
>;

function TituloSecaoDash({
  numero,
  texto,
}: {
  numero: string;
  texto: string;
}) {
  return (
    <header className="mb-5">
      <span className="eyebrow">{numero}</span>
      <h2 className="mt-2 font-serif text-[clamp(18px,2vw,24px)] font-medium leading-tight tracking-tight text-ivory">
        {texto}
      </h2>
    </header>
  );
}

export function DashboardCasoGrid({ dados }: { dados: DadosDashboardCaso }) {
  return (
    <div>
      {/* ==================== SEÇÃO 1 — Visão Operacional ============= */}
      <TituloSecaoDash numero="Seção 1" texto="Visão Operacional" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <div className="col-span-1 md:col-span-4">
          <KPIRecuperabilidade score={dados.kpis.scoreRecuperabilidade} />
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

        <div className="col-span-1 md:col-span-6">
          <FunilTentadasPositivas funil={dados.funil} />
        </div>
        <div className="col-span-1 md:col-span-6">
          <DonutBensPorValor dados={dados.breakdownBensPorValor} />
        </div>

        <div className="col-span-1 md:col-span-12">
          <LinhaCobrancaRecuperacao dados={dados.linhaTempoFinanceira} />
        </div>

        <div className="col-span-1 md:col-span-6">
          <HeatmapEficacia heatmap={dados.heatmap} />
        </div>
        <div className="col-span-1 md:col-span-6">
          <CustosPorAPI dados={dados.custosPorAPI} />
        </div>

        <div className="col-span-1 md:col-span-12">
          <div className="rounded-xl bg-gradient-to-br from-[rgba(60,255,138,0.04)] to-transparent p-px">
            <ProximaAcao proximaAcao={dados.proximaAcaoSugerida} />
          </div>
        </div>
      </div>

      {/* ==================== SEÇÃO 2 — Análise de Risco ============== */}
      <div className="mt-12">
        <TituloSecaoDash numero="Seção 2" texto="Análise de Risco" />
      </div>

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

      {/* ============ SEÇÃO 3 — Inteligência Patrimonial ============== */}
      <div className="mt-12">
        <TituloSecaoDash numero="Seção 3" texto="Inteligência Patrimonial" />
      </div>

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
  );
}
