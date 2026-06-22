// KPI hero do score de recuperabilidade (0-100).
// Server component: recebe o score ja calculado pela page (sem query aqui).
// Faixas: >=60 verde, 30-59 gold, <30 neutral (vermelho-mut sinalizado pelo accent neutro
// — KPIHero hardcoda a cor do valor em ivory; o accent gold/neutral comunica a severidade).

import { KPIHero } from "./KPIHero";
import type { DashboardCardAccent } from "./DashboardCard";

type Props = {
  score: number;
};

function accentDoScore(score: number): DashboardCardAccent {
  if (score >= 60) return "green";
  if (score >= 30) return "gold";
  return "neutral";
}

export default function KPIRecuperabilidade({ score }: Props) {
  // Clamp defensivo: o helper ja garante 0..100, mas a UI nao deveria
  // explodir se o tipo for relaxado no futuro.
  const valor = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <KPIHero
      titulo="Recuperabilidade"
      valor={`${valor}/100`}
      subtitulo="Score estimado de cobranca"
      accent={accentDoScore(valor)}
    />
  );
}
