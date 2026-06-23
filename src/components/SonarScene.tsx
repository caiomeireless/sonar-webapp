import { WireframeGlobe } from "@/components/ui/WireframeGlobe";

// Ilustração animada do hero da landing:
// - Escada B&P em contorno neon verde no topo (transparente por dentro)
// - Ponto emissor pulsando + ondas verdes finas/verticais descendo (4 waves staggered)
// - 3 cards de bens em outline gold com glow (sem fundo) — perto da escada
// - Ondas douradas pequenas voltando de cada card (eco próximo)
// Tudo via SMIL (animate/animateTransform) — sem JS no client.

const staircase = [
  { x: 0, y: 36, op: 1 },
  { x: 6.8, y: 36, op: 0.55 },
  { x: 6.8, y: 29.2, op: 1 },
  { x: 13.6, y: 36, op: 0.55 },
  { x: 13.6, y: 29.2, op: 0.78 },
  { x: 13.6, y: 22.4, op: 1 },
  { x: 20.4, y: 36, op: 0.55 },
  { x: 20.4, y: 29.2, op: 0.7 },
  { x: 20.4, y: 22.4, op: 0.85 },
  { x: 20.4, y: 15.6, op: 1 },
  { x: 27.2, y: 36, op: 0.55 },
  { x: 27.2, y: 29.2, op: 0.65 },
  { x: 27.2, y: 22.4, op: 0.78 },
  { x: 27.2, y: 15.6, op: 0.9 },
  { x: 27.2, y: 8.8, op: 1 },
  { x: 34, y: 36, op: 0.55 },
  { x: 34, y: 29.2, op: 0.62 },
  { x: 34, y: 22.4, op: 0.72 },
  { x: 34, y: 15.6, op: 0.82 },
  { x: 34, y: 8.8, op: 0.92 },
  { x: 34, y: 2, op: 1 },
];

const downWaves = [0, 0.7, 1.4, 2.1];

// Distribui pontos via Fibonacci spiral (parecem manchas continentais halftone)
function getGlobeDots(count: number, radius: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const dots: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const theta = i * golden;
    const r = radius * Math.sqrt((i + 0.5) / count);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta) * 0.85;
    dots.push({ x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) });
  }
  return dots;
}

const globeDots = getGlobeDots(85, 92);

const assets = [
  { cx: 90, label: "IMÓVEIS", icon: "house" as const, delay: 1.4 },
  { cx: 270, label: "VEÍCULOS", icon: "car" as const, delay: 1.6 },
  { cx: 450, label: "EMPRESAS", icon: "company" as const, delay: 1.8 },
  { cx: 630, label: "CRÉDITOS", icon: "credits" as const, delay: 2.0 },
];

export function SonarScene() {
  return (
    <svg
      viewBox="0 0 800 800"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      style={{ overflow: "visible" }}
      aria-label="Sonar emite ondas verdes que atingem bens; ondas douradas retornam como eco"
    >
      <defs>
        <filter id="snr-green-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="snr-gold-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* === GLOBO WIREFRAME === canvas d3 com halftone dots dos continentes */}
      <foreignObject x="-250" y="50" width="1000" height="700">
        <WireframeGlobe
          width={1000}
          height={700}
          globeCenterX={650}
          globeCenterY={350}
        />
      </foreignObject>




    </svg>
  );
}

function AssetCard({
  cx,
  cy,
  label,
  icon,
}: {
  cx: number;
  cy: number;
  label: string;
  icon: "house" | "car" | "company" | "credits";
}) {
  return (
    <g transform={`translate(${cx} ${cy})`} filter="url(#snr-gold-glow)">
      {/* Ícone — apenas contorno gold, escala 1.8 pra ficar grande igual à fonte do "Sonar" */}
      <g transform="translate(0 -12) scale(1.8)">
        {icon === "house" && (
          <>
            <path
              d="M -14 4 L 0 -10 L 14 4 L 14 14 L -14 14 Z"
              fill="none"
              stroke="#C9A24A"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <rect
              x="-3"
              y="5"
              width="6"
              height="9"
              fill="none"
              stroke="#C9A24A"
              strokeWidth="1.2"
            />
          </>
        )}
        {icon === "car" && (
          <>
            <rect
              x="-13"
              y="-1"
              width="26"
              height="9"
              rx="2.5"
              fill="none"
              stroke="#C9A24A"
              strokeWidth="1.5"
            />
            <path
              d="M -10 -1 L -7 -8 L 7 -8 L 10 -1"
              fill="none"
              stroke="#C9A24A"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle
              cx="-7"
              cy="10"
              r="2.4"
              fill="none"
              stroke="#C9A24A"
              strokeWidth="1.3"
            />
            <circle
              cx="7"
              cy="10"
              r="2.4"
              fill="none"
              stroke="#C9A24A"
              strokeWidth="1.3"
            />
          </>
        )}
        {icon === "company" && (
          <>
            {/* Prédio outline */}
            <rect
              x="-11"
              y="-12"
              width="22"
              height="24"
              fill="none"
              stroke="#C9A24A"
              strokeWidth="1.5"
            />
            {/* Janelas 2x2 */}
            <rect x="-7" y="-9" width="4" height="4" fill="none" stroke="#C9A24A" strokeWidth="0.9" />
            <rect x="3" y="-9" width="4" height="4" fill="none" stroke="#C9A24A" strokeWidth="0.9" />
            <rect x="-7" y="-3" width="4" height="4" fill="none" stroke="#C9A24A" strokeWidth="0.9" />
            <rect x="3" y="-3" width="4" height="4" fill="none" stroke="#C9A24A" strokeWidth="0.9" />
            {/* Porta */}
            <rect x="-2" y="4" width="4" height="8" fill="none" stroke="#C9A24A" strokeWidth="1.2" />
          </>
        )}
        {icon === "credits" && (
          <>
            {/* Documento outline com canto dobrado */}
            <path
              d="M -10 -13 L 4 -13 L 11 -7 L 11 13 L -10 13 Z"
              fill="none"
              stroke="#C9A24A"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* Linha do canto dobrado */}
            <path
              d="M 4 -13 L 4 -7 L 11 -7"
              fill="none"
              stroke="#C9A24A"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            {/* Símbolo $ no centro */}
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fontFamily="Georgia, serif"
              fontSize="13"
              fontWeight="700"
              fill="#C9A24A"
            >
              $
            </text>
          </>
        )}
      </g>
      {/* Label gold mono */}
      <text
        x="0"
        y="42"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8"
        letterSpacing="1.4"
        fill="#C9A24A"
      >
        {label}
      </text>
    </g>
  );
}
