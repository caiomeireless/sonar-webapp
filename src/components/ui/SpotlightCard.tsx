"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

// Listener global compartilhado por todos os cards.
const subscribers = new Set<HTMLDivElement>();
let registered = false;

function ensureListener() {
  if (registered || typeof window === "undefined") return;
  registered = true;
  document.addEventListener(
    "pointermove",
    (e: PointerEvent) => {
      const x = e.clientX.toFixed(2);
      const y = e.clientY.toFixed(2);
      const xp = (e.clientX / window.innerWidth).toFixed(3);
      const yp = (e.clientY / window.innerHeight).toFixed(3);
      subscribers.forEach((el) => {
        el.style.setProperty("--x", x);
        el.style.setProperty("--y", y);
        el.style.setProperty("--xp", xp);
        el.style.setProperty("--yp", yp);
      });
    },
    { passive: true },
  );
}

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  /** Raio da borda em px (default 16) — pra encaixar dentro de molduras. */
  radius?: number;
  /** Desliga o backdrop-blur — obrigatório em LISTAS (dezenas de cards com
      backdrop-filter travam o scroll; sobre fundo preto o blur é invisível). */
  blur?: boolean;
  /** Modo LOCAL: o glow segue o cursor em coordenadas do PRÓPRIO card
      (handlers no elemento), sem listener global e sem background-attachment
      fixed. Obrigatório em listas (attachment fixed repinta todas as linhas
      a cada frame de scroll) e dentro de elementos com transform (CardStack:
      fixed vira scroll pela spec e o glow some). */
  local?: boolean;
  /** Vidro CLARO/esbranquiçado (ditado 23/08): base ivory translúcida +
      brilho branco no topo + borda mais visível. Usar junto com `local`
      (a camada extra de gradiente assume attachment scroll). */
  claro?: boolean;
  /** Camada extra de fundo (CSS background-image, ex. linear-gradient)
      pintada por baixo do glow — pro card de filtro com degradê verde
      escuro → preto (ditado 24/08). Usar junto com `local`. */
  degrade?: string;
};

// Adaptado do prompt "spotlight-card" (GlowCard original) para o tema Sonar:
// hue fixo em signal-green (146), vidro opaco em onyx-carbon, sem sizeMap
// (grid pai decide a largura). Borda brilhante via ::before/::after com mask
// 'intersect' — efeito de "anel iluminado seguindo o cursor".
export function SpotlightCard({
  children,
  className = "",
  radius = 16,
  blur = true,
  local = false,
  claro = false,
  degrade,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (local) return; // modo local não usa o listener global
    const el = ref.current;
    if (!el) return;
    subscribers.add(el);
    ensureListener();
    return () => {
      subscribers.delete(el);
    };
  }, [local]);

  // Modo local: 1 getBoundingClientRect por frame SÓ no card sob o cursor
  // (contra 4 writes × N cards do listener global).
  function onMoveLocal(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", (e.clientX - r.left).toFixed(2));
    el.style.setProperty("--y", (e.clientY - r.top).toFixed(2));
  }
  function onLeaveLocal() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--x", "-9999");
    el.style.setProperty("--y", "-9999");
  }

  const style: CSSProperties = {
    // Tunables do efeito
    ["--base" as string]: "146",
    ["--spread" as string]: "0",
    ["--radius" as string]: String(radius),
    ["--border" as string]: "1.5",
    ["--backdrop" as string]: claro
      ? "rgba(236, 233, 226, 0.12)"
      : "rgba(5, 7, 6, 0.82)",
    ["--backup-border" as string]: claro
      ? "rgba(232, 228, 214, 0.20)"
      : "rgba(232, 228, 214, 0.10)",
    ["--size" as string]: "260",
    ["--border-size" as string]: "calc(var(--border) * 1px)",
    ["--spotlight-size" as string]: "calc(var(--size) * 1px)",
    ["--hue" as string]: "calc(var(--base) + (var(--xp, 0) * var(--spread)))",
    backgroundColor: "var(--backdrop)",
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
      hsl(var(--hue) 100% 62% / 0.12), transparent 70%
    )${
      claro
        ? ", linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.015) 55%, transparent 80%)"
        : ""
    }${degrade ? `, ${degrade}` : ""}`,
    backgroundRepeat: "no-repeat",
    border: "var(--border-size) solid var(--backup-border)",
    borderRadius: "calc(var(--radius) * 1px)",
    position: "relative",
    ...(local
      ? {
          // Coords locais + attachment scroll: glow inicia fora do card
          // (-9999) até o primeiro pointermove sobre ele.
          ["--x" as string]: "-9999",
          ["--y" as string]: "-9999",
          backgroundSize: "100% 100%",
          backgroundPosition: "0 0",
        }
      : {
          backgroundSize:
            "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
          backgroundPosition: "50% 50%",
          backgroundAttachment: "fixed",
        }),
    ...(blur
      ? {
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }
      : {}),
  };

  return (
    <div
      ref={ref}
      data-spotlight={local ? "local" : "true"}
      style={style}
      className={className}
      onPointerMove={local ? onMoveLocal : undefined}
      onPointerLeave={local ? onLeaveLocal : undefined}
    >
      {children}
    </div>
  );
}
