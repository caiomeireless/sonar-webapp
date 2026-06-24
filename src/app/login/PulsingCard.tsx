// Pulsa o card filho sincronizado com a varredura do radar do login.
//
// IMPORTANTE: usa CSS animation (clock absoluto da pagina), MESMA fonte
// de tempo do <animateTransform> SVG do radar. Em motion/react,
// `repeatDelay` acumulava drift de re-render e dessincronizava apos
// varios ciclos (pulso aparecia quando o radar estava na esquerda).
//
// Cada card recebe animation-delay NEGATIVO calculado pelo angulo do
// card relativo ao centro do radar (centro = ponto medio entre logo
// e cards):
//   - Card Equipe (cima-direita), angulo ~335 graus em SVG (Y+ baixo)
//   - Card Cliente (baixo-direita), angulo ~25 graus
//   - tempo no ciclo: ang/360 * 5.5
//   - animation-delay: tempo_no_ciclo - 5.5 (sempre negativo)
//   - ajuste fino de +/- 0.5s pra alinhar com a percepcao visual do
//     pico do pulso (que tem decay perceptivel)

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Atraso CSS em segundos (negativo) pra sincronizar o pulso com o radar. */
  delaySec: number;
  /** Cor do glow do pulso. */
  accent?: "signal" | "gold";
};

export function PulsingCard({ children, delaySec, accent = "signal" }: Props) {
  const klass = accent === "gold" ? "pulse-card-gold" : "pulse-card-signal";
  return (
    <div className={klass} style={{ animationDelay: `${delaySec}s` }}>
      {children}
    </div>
  );
}
