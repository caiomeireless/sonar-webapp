// Símbolo do logo ISOLADO (pedido do Caio 21/08): só a escada verde neon +
// ponto emissor pulsando + ondas descendo — recorte ANIMADO do LogoSvg
// (mesmas coordenadas e SMIL), sem wordmark. Server-safe (SVG puro).
import { STAIRCASE_PATTERN } from "@/components/LogoSvg";

export function SimboloSonar({
  height = 110,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  // Recorte do viewBox original (920x300 do LogoSvg ampliado): a escada
  // vive em x 100-280, e as ondas descem até y ~295.
  const VB = { x: 100, y: 20, w: 180, h: 275 };
  const width = (VB.w / VB.h) * height;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
      width={width}
      height={height}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <filter id="simb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Escada halftone */}
      <g transform="translate(110 30) scale(4)" filter="url(#simb-glow)">
        {STAIRCASE_PATTERN.map((r, i) => (
          <rect
            key={`simb-stair-${i}`}
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

      {/* Ponto emissor pulsando */}
      <circle cx="190" cy="228" r="3.5" fill="#3CFF8A" filter="url(#simb-glow)">
        <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.55;1" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* 4 ondas descendo, staggered */}
      <g transform="translate(190 228)" filter="url(#simb-glow)">
        {[0, 0.7, 1.4, 2.1].map((delay, i) => (
          <path
            key={`simb-wave-${i}`}
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
    </svg>
  );
}
