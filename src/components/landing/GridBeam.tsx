"use client";

// Background quadriculado degrade verde com "feixe" animado de gradient
// percorrendo as linhas. Mesmo padrao visual da faixa 1 (header).
// Adaptado pro tema Sonar — gradient signal -> gold (verde -> dourado).
//
// Uso: envolver um bloco grande (secao showcase) com <GridBeam>.

import { motion } from "motion/react";
import type { ReactNode } from "react";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

type Props = {
  children: ReactNode;
  className?: string;
  /** Quando true, usa a classe `.bg-grid-strong` (mesma do header). */
  intenso?: boolean;
};

export function GridBeam({ children, className, intenso = true }: Props) {
  return (
    <div
      className={cn(
        "relative w-full",
        intenso
          ? "bg-grid-strong animate-grid-pulse"
          : "bg-grid animate-grid-pulse",
        className,
      )}
    >
      {/* Vinheta vertical: escurece o quadriculado nas bordas top/bottom
          pra blending suave com as secoes vizinhas, mantendo o quadriculado
          mais visivel no centro. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,12,11,0.92) 0%, transparent 12%, transparent 88%, rgba(10,12,11,0.92) 100%)",
        }}
      />

      {/* Halo signal radial sutil no canto */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 30%, rgba(60,255,138,0.10), transparent 70%)",
        }}
      />

      {/* Beam animado — feixes de luz percorrendo as linhas do grid */}
      <Beam className="left-[8%] top-[12%]" delay={0} />
      <Beam className="right-[10%] top-[28%]" delay={1.4} reverse />
      <Beam className="left-[30%] top-[58%]" delay={2.6} />
      <Beam className="right-[20%] bottom-[15%]" delay={0.8} reverse />

      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Feixe SVG individual. Path traz uma "trilha" que segue as linhas do
// grid (4 segmentos horizontais + 2 verticais), e o stroke usa um
// gradient linear animado que percorre o SVG criando o efeito de
// "raio correndo".
function Beam({
  className,
  delay = 0,
  reverse = false,
}: {
  className?: string;
  delay?: number;
  reverse?: boolean;
}) {
  const id = `grad-${Math.random().toString(36).slice(2)}`;
  return (
    <svg
      width="156"
      height="63"
      viewBox="0 0 156 63"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none absolute opacity-80", className)}
      aria-hidden="true"
    >
      <path
        d="M31 .5h32M0 .5h32m30 31h32m-1 0h32m-1 31h32M62.5 32V0m62 63V31"
        stroke={`url(#${id})`}
        strokeWidth={1.5}
      />
      <defs>
        <motion.linearGradient
          id={id}
          variants={{
            initial: reverse
              ? { x1: "0%", x2: "10%", y1: "-40%", y2: "-20%" }
              : { x1: "40%", x2: "50%", y1: "160%", y2: "180%" },
            animate: reverse
              ? { x1: "40%", x2: "50%", y1: "160%", y2: "180%" }
              : { x1: "0%", x2: "10%", y1: "-40%", y2: "-20%" },
          }}
          animate="animate"
          initial="initial"
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            repeatDelay: 2,
            delay,
          }}
        >
          {/* Verde signal -> dourado gold (tema Sonar) */}
          <stop stopColor="var(--color-signal)" stopOpacity="0" />
          <stop stopColor="var(--color-signal)" />
          <stop offset="0.4" stopColor="var(--color-gold)" />
          <stop offset="1" stopColor="var(--color-gold)" stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}
