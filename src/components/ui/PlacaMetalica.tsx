"use client";

// Placa de metal REATIVA (ref. 21st.dev "metallic business card", colada
// pelo Caio em 21/08): o reflexo cônico + a luz acompanham o ponteiro e a
// placa inclina de leve em 3D. Adaptada pra casa: sem styled-jsx (CSS em
// globals: .placa-metalica), inclinação contida (placas de cabeçalho, não
// cartão de visita) e metais no tema (prata / gold).
import { useEffect, useMemo, useRef } from "react";

const BASE_METAL: Record<string, string> = {
  prata: "#dddde0",
  gold: "#f0c268",
};

type Props = {
  children: React.ReactNode;
  metal?: "prata" | "gold";
  /** Inclinação máxima em graus (bem menor que o cartão original). */
  maxRotacao?: number;
  className?: string;
};

export function PlacaMetalica({
  children,
  metal = "prata",
  maxRotacao = 6,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const alvo = useRef({ ang: 0, rx: 0, ry: 0, gx: 50, gy: 50 });
  const atual = useRef({ ang: 0, rx: 0, ry: 0, gx: 50, gy: 50 });
  const raf = useRef(0);
  const idRuido = useMemo(
    () => `placa-ruido-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  useEffect(() => {
    const reduzido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduzido) return;
    const lerp = (a: number, b: number) => a + (b - a) * 0.08;
    const tick = () => {
      const c = atual.current;
      const t = alvo.current;
      c.ang = lerp(c.ang, t.ang);
      c.rx = lerp(c.rx, t.rx);
      c.ry = lerp(c.ry, t.ry);
      c.gx = lerp(c.gx, t.gx);
      c.gy = lerp(c.gy, t.gy);
      const el = ref.current;
      if (el) {
        el.style.setProperty("--pm-ang", `${c.ang}deg`);
        el.style.setProperty("--pm-rx", `${c.rx}deg`);
        el.style.setProperty("--pm-ry", `${c.ry}deg`);
        el.style.setProperty("--pm-gx", `${c.gx}%`);
        el.style.setProperty("--pm-gy", `${c.gy}%`);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  function aoMover(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    alvo.current = {
      gx: 50 - (nx - 0.5) * 40,
      gy: 50 - (ny - 0.5) * 40,
      ry: (nx - 0.5) * maxRotacao * 2,
      rx: (0.5 - ny) * maxRotacao * 2,
      ang: (120 * (1 - nx)) * (1 - ny) + 120 * nx * ny,
    };
  }

  function aoSair() {
    alvo.current = { ang: 0, rx: 0, ry: 0, gx: 50, gy: 50 };
  }

  return (
    <div
      ref={ref}
      onPointerMove={aoMover}
      onPointerLeave={aoSair}
      className={`placa-metalica ${className}`}
      style={
        {
          "--pm-base": BASE_METAL[metal],
          "--pm-ruido": `url(#${idRuido})`,
        } as React.CSSProperties
      }
    >
      {/* Filtro de ruído (grão do metal) — id único por instância. */}
      <svg width="0" height="0" aria-hidden="true" focusable="false">
        <filter
          id={idRuido}
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
          colorInterpolationFilters="linearRGB"
        >
          <feTurbulence
            type="turbulence"
            baseFrequency="0.3"
            numOctaves="4"
            seed="15"
            stitchTiles="stitch"
            result="turbulence"
          />
          <feSpecularLighting
            surfaceScale="1"
            specularConstant="1.8"
            specularExponent="10"
            lightingColor="#7957A8"
            in="turbulence"
            result="specularLighting"
          >
            <feDistantLight azimuth="3" elevation="50" />
          </feSpecularLighting>
          <feColorMatrix type="saturate" values="0" in="specularLighting" />
        </filter>
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
