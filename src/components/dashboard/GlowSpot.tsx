"use client";

// GlowSpot — sub-componente client do DashboardCard que renderiza o spot
// signal seguindo o cursor (efeito GlowCard). Anexa o handler no `parentElement`
// pra atualizar as CSS vars `--mx` e `--my` no wrapper `.glow-card`.
//
// Fica num arquivo separado pra manter o DashboardCard server-safe.

import { useEffect, useRef } from "react";

export function GlowSpot() {
  const spotRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const spot = spotRef.current;
    if (!spot) return;
    const parent = spot.parentElement;
    if (!parent) return;

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      parent.style.setProperty("--mx", String(mx));
      parent.style.setProperty("--my", String(my));
    };

    parent.addEventListener("mousemove", onMove);
    return () => {
      parent.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <span ref={spotRef} className="glow-card__spot" aria-hidden />;
}
