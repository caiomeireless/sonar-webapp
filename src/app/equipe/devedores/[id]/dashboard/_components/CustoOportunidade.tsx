// Custo de oportunidade — quanto se gastou (consultas/APIs) vs. quanto dá pra
// recuperar (patrimônio localizado). Razão em destaque, semáforo grande
// indicando se o investimento vale a pena.
//
// Recebe a métrica já agregada — a page chama obterDadosDashboardCasoV2 e
// passa custoOportunidade. Server component: sem Recharts, sem interatividade.

import type { CustoOportunidade as CustoOportunidadeT } from "@/lib/dashboard-caso";
import { formatBRL } from "@/lib/format";
import { DashboardCard, type DashboardCardAccent } from "@/components/dashboard/DashboardCard";
import {
  CHART_COLOR_SIGNAL,
  CHART_COLOR_NEGATIVE,
  CHART_COLOR_WARN,
} from "@/components/dashboard/ChartTheme";

type Props = {
  dados: CustoOportunidadeT;
};

const STATUS_LABEL: Record<CustoOportunidadeT["status"], string> = {
  bom: "Excelente custo-benefício",
  medio: "Custo razoável — monitorar",
  ruim: "Custo alto frente ao potencial",
};

const STATUS_COLOR: Record<CustoOportunidadeT["status"], string> = {
  bom: CHART_COLOR_SIGNAL,
  medio: CHART_COLOR_WARN,
  ruim: CHART_COLOR_NEGATIVE,
};

const STATUS_GLOW: Record<CustoOportunidadeT["status"], string> = {
  bom: "0 0 16px rgba(60, 255, 138, 0.55)",
  medio: "0 0 16px rgba(244, 197, 66, 0.55)",
  ruim: "0 0 16px rgba(255, 91, 91, 0.55)",
};

const STATUS_ACCENT: Record<CustoOportunidadeT["status"], DashboardCardAccent> = {
  bom: "green",
  medio: "gold",
  ruim: "neutral",
};

export default function CustoOportunidade({ dados }: Props) {
  const { custoAcumuladoBrl, valorRecuperavelBrl, razao, status } = dados;
  const cor = STATUS_COLOR[status];
  // razao vem como fração (ex: 0.0834). Pct exibido com 1 casa.
  const pct = Math.round(razao * 1000) / 10;

  return (
    <DashboardCard
      titulo="Custo de oportunidade"
      descricao="Quanto se gastou frente ao que dá pra recuperar"
      accent={STATUS_ACCENT[status]}
      info={
        "Compara o custo acumulado em consultas/APIs com o patrimônio já localizado " +
        "(proxy de valor recuperável).\n\n" +
        "Faixas:\n" +
        "  < 5%   verde — excelente custo-benefício\n" +
        "  5-15%  amarelo — razoável, monitorar\n" +
        "  > 15%  vermelho — custo alto, rever estratégia\n\n" +
        "Antes de localizar bens, qualquer custo soa alto. Após as primeiras " +
        "penhoras, a razão tende a cair rápido."
      }
    >
      <div className="flex flex-col gap-5">
        {/* KPI duplo: custo vs. valor recuperável */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="eyebrow text-[var(--color-ivory-66)]">
              Custo acumulado
            </span>
            <span className="font-mono text-2xl font-medium tabular-nums leading-none text-[var(--color-ivory)]">
              {formatBRL(custoAcumuladoBrl)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="eyebrow text-[var(--color-ivory-66)]">
              Valor recuperável
            </span>
            <span className="font-mono text-2xl font-medium tabular-nums leading-none text-[var(--color-ivory)]">
              {formatBRL(valorRecuperavelBrl)}
            </span>
          </div>
        </div>

        {/* Semáforo + razão em destaque */}
        <div className="flex items-center gap-4 rounded-lg border border-[var(--color-ivory-12)] bg-[var(--color-onyx)] p-4">
          <span
            aria-hidden
            className="h-10 w-10 shrink-0 rounded-full"
            style={{ background: cor, boxShadow: STATUS_GLOW[status] }}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className="font-mono text-xl font-medium tabular-nums leading-tight"
              style={{ color: cor }}
            >
              Custo = {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do potencial
            </span>
            <span className="text-xs text-[var(--color-ivory-66)]">
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
