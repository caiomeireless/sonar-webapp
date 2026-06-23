// KPI ouro do Dashboard da Plataforma — penhoras efetivadas no mês corrente.
// Inteiro grande + subtítulo "X penhoras este mês" + delta vs mês anterior.
//
// Server component puro. Recebe os contadores já agregados pela page
// (vem de `obterDadosDashboardPlataforma`: kpisGerais.penhorasEfetivadasMes
// pro mês atual, e o penúltimo item de evolucaoMensal pro mês anterior).

import { KPIHero, type KPIDelta } from "@/components/dashboard/KPIHero";

type Props = {
  /** Penhoras efetivadas no mês corrente. */
  mesAtual: number;
  /** Penhoras efetivadas no mês imediatamente anterior (pro delta). */
  mesAnterior: number;
};

function formatarDelta(mesAtual: number, mesAnterior: number): KPIDelta {
  const diff = mesAtual - mesAnterior;

  // Sem base de comparação: ou não tinha nada antes e ainda não tem nada,
  // ou não tinha nada antes mas tem agora (variação infinita — mostramos
  // como "novo" em vez de "+∞%").
  if (mesAnterior === 0) {
    if (mesAtual === 0) {
      return {
        value: "—",
        direction: "neutral",
        label: "vs. mês anterior",
      };
    }
    return {
      value: `+${mesAtual}`,
      direction: "up",
      label: "vs. mês anterior (sem base)",
    };
  }

  const pct = Math.round((diff / mesAnterior) * 100);
  const sinal = diff > 0 ? "+" : "";
  return {
    value: `${sinal}${pct}%`,
    direction: diff > 0 ? "up" : diff < 0 ? "down" : "neutral",
    label: "vs. mês anterior",
  };
}

export default function KPIPenhorasEfetivadasMes({
  mesAtual,
  mesAnterior,
}: Props) {
  const valor = String(mesAtual);
  const subtitulo =
    mesAtual === 1 ? "1 penhora este mês" : `${mesAtual} penhoras este mês`;
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
