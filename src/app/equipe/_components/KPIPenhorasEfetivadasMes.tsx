// KPI ouro do Dashboard da Plataforma — penhoras efetivadas no mes corrente.
// Inteiro grande + subtitulo "X penhoras este mes" + delta vs mes anterior.
//
// Server component puro. Recebe os contadores ja agregados pela page
// (vem de `obterDadosDashboardPlataforma`: kpisGerais.penhorasEfetivadasMes
// pro mes atual, e o penultimo item de evolucaoMensal pro mes anterior).

import { KPIHero, type KPIDelta } from "@/components/dashboard/KPIHero";

type Props = {
  /** Penhoras efetivadas no mes corrente. */
  mesAtual: number;
  /** Penhoras efetivadas no mes imediatamente anterior (pro delta). */
  mesAnterior: number;
};

function formatarDelta(mesAtual: number, mesAnterior: number): KPIDelta {
  const diff = mesAtual - mesAnterior;

  // Sem base de comparacao: ou nao tinha nada antes e ainda nao tem nada,
  // ou nao tinha nada antes mas tem agora (variacao infinita — mostramos
  // como "novo" em vez de "+∞%").
  if (mesAnterior === 0) {
    if (mesAtual === 0) {
      return {
        value: "—",
        direction: "neutral",
        label: "vs. mes anterior",
      };
    }
    return {
      value: `+${mesAtual}`,
      direction: "up",
      label: "vs. mes anterior (sem base)",
    };
  }

  const pct = Math.round((diff / mesAnterior) * 100);
  const sinal = diff > 0 ? "+" : "";
  return {
    value: `${sinal}${pct}%`,
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "neutral",
    label: "vs. mes anterior",
  };
}

export default function KPIPenhorasEfetivadasMes({
  mesAtual,
  mesAnterior,
}: Props) {
  const valor = String(mesAtual);
  const subtitulo =
    mesAtual === 1 ? "1 penhora este mes" : `${mesAtual} penhoras este mes`;
  const delta = formatarDelta(mesAtual, mesAnterior);

  return (
    <KPIHero
      titulo="Penhoras efetivadas"
      valor={valor}
      subtitulo={subtitulo}
      delta={delta}
      accent="gold"
    />
  );
}
