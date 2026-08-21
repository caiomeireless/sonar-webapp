"use client";

// Contador que sobe do zero até o valor real ao montar (estilo painel de
// instrumentos). Respeita prefers-reduced-motion (mostra direto).
import { useEffect, useRef, useState } from "react";

const fmtBrl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const fmtInt = new Intl.NumberFormat("pt-BR");

export function NumeroTicker({
  valor,
  formato = "int",
  duracaoMs = 1400,
  className = "",
}: {
  valor: number;
  formato?: "int" | "brl";
  duracaoMs?: number;
  className?: string;
}) {
  const [atual, setAtual] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      valor === 0
    ) {
      setAtual(valor);
      return;
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duracaoMs);
      // ease-out-quart
      const e = 1 - Math.pow(1 - p, 4);
      setAtual(valor * e);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setAtual(valor);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [valor, duracaoMs]);

  const texto =
    formato === "brl" ? fmtBrl.format(atual) : fmtInt.format(Math.round(atual));
  return <span className={`tabular-nums ${className}`}>{texto}</span>;
}
