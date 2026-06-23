// Tempo Medida -> Penhora — KPI de velocidade operacional.
// Compara o tempo medio (peticao de penhora -> penhora efetivada) contra o
// baseline de mercado. Mais rapido que o baseline = verde (up); mais lento =
// vermelho (down). O baseline vem dos dados — a view nao chuta valor.

import { KPIHero } from "@/components/dashboard/KPIHero";
import type { DashboardTempoMedio } from "@/lib/dashboard-caso";

type Props = {
  dados: DashboardTempoMedio;
};

function formatarDias(dias: number): string {
  if (!Number.isFinite(dias) || dias <= 0) return "—";
  return `${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export default function TempoMedidaPenhora({ dados }: Props) {
  const { dias, baseline } = dados;
  const semAmostra = !Number.isFinite(dias) || dias <= 0;

  // Delta calculado como (baseline - dias): positivo = mais rapido (bom).
  // Sem amostra (zero pares peticao/penhora pareados) -> nao exibe delta.
  const deltaDias = baseline - dias;
  const direction: "up" | "down" | "neutral" = semAmostra
    ? "neutral"
    : deltaDias > 0
      ? "up"
      : deltaDias < 0
        ? "down"
        : "neutral";

  const deltaLabel =
    direction === "up"
      ? "mais rapido que o baseline"
      : direction === "down"
        ? "mais lento que o baseline"
        : "em linha com o baseline";

  const valor = semAmostra ? "—" : formatarDias(dias);
  const subtitulo = semAmostra
    ? `Sem peticoes pareadas a penhoras efetivadas. Baseline de mercado: ${baseline} dias.`
    : `Da peticao de penhora ate a penhora efetivada. Baseline de mercado: ${baseline} dias.`;

  const delta = semAmostra
    ? undefined
    : {
        value: `${Math.abs(deltaDias)} ${Math.abs(deltaDias) === 1 ? "dia" : "dias"}`,
        direction,
        label: deltaLabel,
      };

  return (
    <KPIHero
      titulo="Tempo Medida → Penhora"
      valor={valor}
      subtitulo={subtitulo}
      delta={delta}
      accent={direction === "down" ? "gold" : "green"}
    />
  );
}
