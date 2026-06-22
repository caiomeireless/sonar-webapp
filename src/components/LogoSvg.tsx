// Logo do handoff Claude Design — variante única (v3 refinado).
// Estrutura: escada verde neon + ondas | "Sonar" + signal dash + (escada BP | "Battaglia & Pedrosa" sobre "ADVOGADOS").

// Padrao da escada verde — mesmo do SonarScene (faixa 2)
export const STAIRCASE_PATTERN = [
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

export function LogoSvg({
  height = 104,
  className,
  "aria-label": ariaLabel = "Sonar — Battaglia & Pedrosa Advogados",
}: {
  height?: number;
  className?: string;
  "aria-label"?: string;
}) {
  const width = (920 / 300) * height;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 920 300"
      width={width}
      height={height}
      fill="none"
      aria-label={ariaLabel}
      className={className}
    >
      <defs>
        <linearGradient id="lkv-dashGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3CFF8A" />
          <stop offset="100%" stopColor="#3CFF8A" stopOpacity="0.2" />
        </linearGradient>
        <filter id="lkv-green-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* SIMBOLO: escada verde neon + ondas (substitui o radar) */}
      {/* Escada halftone — scale 4 → ~160x168 em viewBox 920x300 */}
      <g transform="translate(110 30) scale(4)" filter="url(#lkv-green-glow)">
        {STAIRCASE_PATTERN.map((r, i) => (
          <rect
            key={`stair-${i}`}
            x={r.x}
            y={r.y}
            width="6"
            height="6"
            fill="none"
            stroke="#3CFF8A"
            strokeWidth="0.7"
            strokeOpacity={r.op}
          />
        ))}
      </g>

      {/* Ponto emissor pulsando na base da escada */}
      <circle cx="190" cy="228" r="3.5" fill="#3CFF8A" filter="url(#lkv-green-glow)">
        <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.55;1" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* 4 ondas verdes descendo, staggered */}
      <g transform="translate(190 228)" filter="url(#lkv-green-glow)">
        {[0, 0.7, 1.4, 2.1].map((delay, i) => (
          <path
            key={`wave-${i}`}
            d="M -22 0 A 22 16 0 0 0 22 0"
            fill="none"
            stroke="#3CFF8A"
            strokeWidth="1.5"
            strokeOpacity="0"
            transform="scale(0.1)"
          >
            <animateTransform
              attributeName="transform"
              type="scale"
              values="0.1;3.5"
              dur="2.8s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-opacity"
              values="0.9;0"
              dur="2.8s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
          </path>
        ))}
      </g>

      {/* WORDMARK + ASSINATURA EMPILHADA — REMOVIDA NO LogoSymbolStatic */}
      <g transform="translate(295 20)">
        <text x="0" y="155" fontFamily="Manrope, system-ui, sans-serif" fontWeight="500" fontSize="140" letterSpacing="-7" fill="#E8E4D6">
          Sonar
        </text>
        <circle cx="3" cy="178" r="3" fill="#3CFF8A" />
        <rect x="10" y="177" width="580" height="1.6" fill="url(#lkv-dashGrad)" />

        <g transform="translate(2 198)">
          {/* "Battaglia & Pedrosa" alinhado com o "S" de Sonar (x=-2 — escada gold removida) */}
          <text x="-2" y="44" fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="400" fontSize="64" fill="#C9A24A" xmlSpace="preserve">
            Battaglia<tspan fontStyle="italic"> &amp; </tspan>Pedrosa
          </text>

          {/* ADVOGADOS — fontSize 22 */}
          <text x="-2" y="80" fontFamily="JetBrains Mono, monospace" fontWeight="500" fontSize="22" letterSpacing="7" fill="#E8E4D6">
            ADVOGADOS
          </text>
        </g>
      </g>
    </svg>
  );
}

// Variante vertical com simbolo (escada + emit + ondas ESTATICAS) no topo
// e wordmark "Sonar / Battaglia & Pedrosa / ADVOGADOS" abaixo.
// Usada no footer (ultima faixa).
export function LogoSymbolStatic({
  height = 240,
  className,
  "aria-label": ariaLabel = "Sonar — Battaglia & Pedrosa Advogados",
}: {
  height?: number;
  className?: string;
  "aria-label"?: string;
}) {
  const width = (640 / 620) * height;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 620"
      width={width}
      height={height}
      fill="none"
      aria-label={ariaLabel}
      className={className}
    >
      <defs>
        <linearGradient id="lks-dashGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3CFF8A" />
          <stop offset="100%" stopColor="#3CFF8A" stopOpacity="0.2" />
        </linearGradient>
        <filter id="lks-green-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Escada alinhada com o "N" de "Sonar" abaixo (scale 5) */}
      <g transform="translate(150 15) scale(5)" filter="url(#lks-green-glow)">
        {STAIRCASE_PATTERN.map((r, i) => (
          <rect
            key={`stair-static-${i}`}
            x={r.x}
            y={r.y}
            width="6"
            height="6"
            fill="none"
            stroke="#3CFF8A"
            strokeWidth="0.7"
            strokeOpacity={r.op}
          />
        ))}
      </g>

      {/* Ponto emissor estatico na base da escada */}
      <circle cx="250" cy="245" r="4" fill="#3CFF8A" filter="url(#lks-green-glow)" />

      {/* 4 ondas verdes concentricas ESTATICAS descendo */}
      <g transform="translate(250 245)" filter="url(#lks-green-glow)">
        {[1, 1.7, 2.4, 3.0].map((s, i) => (
          <path
            key={`wave-static-${i}`}
            d={`M ${-22 * s} 0 A ${22 * s} ${16 * s} 0 0 0 ${22 * s} 0`}
            fill="none"
            stroke="#3CFF8A"
            strokeWidth="1.5"
            strokeOpacity={0.85 - i * 0.18}
          />
        ))}
      </g>

      {/* Wordmark abaixo: Sonar + dash + Battaglia & Pedrosa + ADVOGADOS — junto com a escada */}
      <g transform="translate(40 280)">
        <text
          x="0"
          y="135"
          fontFamily="Manrope, system-ui, sans-serif"
          fontWeight="500"
          fontSize="140"
          letterSpacing="-7"
          fill="#E8E4D6"
        >
          Sonar
        </text>
        <circle cx="3" cy="178" r="3" fill="#3CFF8A" />
        <rect x="10" y="177" width="560" height="1.6" fill="url(#lks-dashGrad)" />
        <g transform="translate(2 198)">
          <text
            x="-2"
            y="44"
            fontFamily="Cormorant Garamond, Georgia, serif"
            fontWeight="400"
            fontSize="64"
            fill="#C9A24A"
            xmlSpace="preserve"
          >
            Battaglia
            <tspan fontStyle="italic"> &amp; </tspan>
            Pedrosa
          </text>
          <text
            x="-2"
            y="80"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="500"
            fontSize="22"
            letterSpacing="7"
            fill="#E8E4D6"
          >
            ADVOGADOS
          </text>
        </g>
      </g>
    </svg>
  );
}
