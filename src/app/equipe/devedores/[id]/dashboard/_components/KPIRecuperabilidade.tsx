// KPI hero do score de recuperabilidade (0-100).
// Server component: recebe o score já calculado pela page (sem query aqui).
// Faixas: >=60 verde, 30-59 gold, <30 neutral (vermelho-mut sinalizado pelo accent neutro
// — KPIHero hardcoda a cor do valor em ivory; o accent gold/neutral comunica a severidade).

import { KPIHero } from "@/components/dashboard/KPIHero";
import type { DashboardCardAccent } from "@/components/dashboard/DashboardCard";

type Props = {
  score: number;
};

function accentDoScore(score: number): DashboardCardAccent {
  if (score >= 60) return "green";
  if (score >= 30) return "gold";
  return "neutral";
}

export default function KPIRecuperabilidade({ score }: Props) {
  // Clamp defensivo: o helper já garante 0..100, mas a UI não deveria
  // explodir se o tipo for relaxado no futuro.
  const valor = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <KPIHero
      titulo="Recuperabilidade"
      valor={`${valor}/100`}
      subtitulo="Score estimado de cobrança"
      accent={accentDoScore(valor)}
      info={
        "Score de 0 a 100 que estima a chance de recuperar o crédito.\n\n" +
        "Fórmula:\n" +
        "  (qtd bens x 5) + (casos ativos x 3) + (valor recuperado / cobrança x 50)\n\n" +
        "Faixas:\n" +
        "  >= 60 verde (alta chance)\n" +
        "  30 a 59 ouro (média)\n" +
        "  < 30 baixa (rever caso)\n\n" +
        "Antes das penhoras o score reflete potencial bruto. Após elas, o ROI real domina."
      }
    />
  );
}
