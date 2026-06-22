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
};

// Adaptado do prompt "spotlight-card" (GlowCard original) para o tema Sonar:
// hue fixo em signal-green (146), vidro opaco em onyx-carbon, sem sizeMap
// (grid pai decide a largura). Borda brilhante via ::before/::after com mask
// 'intersect' — efeito de "anel iluminado seguindo o cursor".
export function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    subscribers.add(el);
    ensureListener();
    return () => {
      subscribers.delete(el);
    };
  }, []);

  const style: CSSProperties = {
    // Tunables do efeito
    ["--base" as string]: "146",
    ["--spread" as string]: "0",
    ["--radius" as string]: "16",
    ["--border" as string]: "1.5",
    ["--backdrop" as string]: "rgba(5, 7, 6, 0.82)",
    ["--backup-border" as string]: "rgba(232, 228, 214, 0.10)",
    ["--size" as string]: "260",
    ["--border-size" as string]: "calc(var(--border) * 1px)",
    ["--spotlight-size" as string]: "calc(var(--size) * 1px)",
    ["--hue" as string]: "calc(var(--base) + (var(--xp, 0) * var(--spread)))",
    backgroundColor: "var(--backdrop)",
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
      hsl(var(--hue) 100% 62% / 0.12), transparent 70%
    )`,
    backgroundSize:
      "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
    backgroundPosition: "50% 50%",
    backgroundAttachment: "fixed",
    backgroundRepeat: "no-repeat",
    border: "var(--border-size) solid var(--backup-border)",
    borderRadius: "calc(var(--radius) * 1px)",
    position: "relative",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
  };

  return (
    <div ref={ref} data-spotlight style={style} className={className}>
      {children}
    </div>
  );
}
