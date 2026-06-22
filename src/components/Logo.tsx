// Lockup horizontal — variante B (escada B&P ao lado de "Battaglia").
// Composto via React + tokens (sem inline SVG do handoff), pra que cores e
// fontes respondam aos tokens do projeto (Tailwind v4 + next/font).
import { SonarMark } from "./SonarMark";

type Size = "sm" | "md" | "lg";

const cfg: Record<Size, { mark: number; word: string; dash: string; firm: string }> = {
  sm: { mark: 40,  word: "text-[40px]",  dash: "w-[120px]", firm: "text-[14px]" },
  md: { mark: 64,  word: "text-[64px]",  dash: "w-[200px]", firm: "text-[18px]" },
  lg: { mark: 100, word: "text-[100px]", dash: "w-[320px]", firm: "text-[24px]" },
};

export function Logo({ size = "md" }: { size?: Size }) {
  const c = cfg[size];
  return (
    <div className="flex items-center gap-6">
      <SonarMark size={c.mark} aria-label="Sonar" />
      <div className="flex flex-col">
        <span className={`sonar-wordmark ${c.word}`}>Sonar</span>

        {/* Signal dash neon */}
        <div className={`signal-dash mt-3 ${c.dash}`} aria-hidden="true" />

        {/* Assinatura institucional: escada B&P + Battaglia & Pedrosa + ADVOGADOS */}
        <div className="mt-3 flex items-center gap-3">
          <BPStaircase />
          <span className="h-5 w-px bg-[var(--color-gold)] opacity-50" />
          <span className={`firm-name ${c.firm}`}>
            Battaglia <em>&amp;</em> Pedrosa
          </span>
          <span className="firm-suffix">ADVOGADOS</span>
        </div>
      </div>
    </div>
  );
}

/* Escada B&P em halftone dourado — 21 quadrados em escada de luz crescente.
   Coordenadas exatas do handoff (logo-horizontal-B-staircase-beside.svg). */
function BPStaircase() {
  const cells: { x: number; y: number; o: number }[] = [
    { x: 0,    y: -5.4,  o: 1.0  },
    { x: 3.4,  y: -5.4,  o: 0.45 }, { x: 3.4,  y: -8.8,  o: 1.0  },
    { x: 6.8,  y: -5.4,  o: 0.45 }, { x: 6.8,  y: -8.8,  o: 0.72 }, { x: 6.8,  y: -12.2, o: 1.0  },
    { x: 10.2, y: -5.4,  o: 0.45 }, { x: 10.2, y: -8.8,  o: 0.63 }, { x: 10.2, y: -12.2, o: 0.82 }, { x: 10.2, y: -15.6, o: 1.0  },
    { x: 13.6, y: -5.4,  o: 0.45 }, { x: 13.6, y: -8.8,  o: 0.59 }, { x: 13.6, y: -12.2, o: 0.72 }, { x: 13.6, y: -15.6, o: 0.86 }, { x: 13.6, y: -19,   o: 1.0  },
    { x: 17,   y: -5.4,  o: 0.45 }, { x: 17,   y: -8.8,  o: 0.56 }, { x: 17,   y: -12.2, o: 0.67 }, { x: 17,   y: -15.6, o: 0.78 }, { x: 17,   y: -19,   o: 0.89 }, { x: 17,   y: -22.4, o: 1.0  },
  ];
  return (
    <svg width="22" height="26" viewBox="-1 -23 22 26" aria-label="Battaglia & Pedrosa">
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width="3" height="3" fill="#C9A24A" fillOpacity={c.o} />
      ))}
    </svg>
  );
}
