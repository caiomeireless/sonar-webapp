"use client";

// Selo "NOVO" nos andamentos capturados DEPOIS da última visita ao Radar.
// A marca d'água da visita vive no localStorage do navegador de cada um —
// primeira visita não marca nada (senão a página inteira acenderia).
import { useEffect, useState } from "react";

const CHAVE_VISITA = "sonar-radar-visto-em";

// Singleton por carregamento de página: o PRIMEIRO badge a montar lê a visita
// anterior e já grava a atual; os demais reaproveitam o valor lido.
let visitaAnterior: string | null | undefined;

function lerVisitaAnterior(): string | null {
  if (visitaAnterior === undefined) {
    try {
      visitaAnterior = localStorage.getItem(CHAVE_VISITA);
      localStorage.setItem(CHAVE_VISITA, new Date().toISOString());
    } catch {
      visitaAnterior = null;
    }
  }
  return visitaAnterior;
}

export function BadgeNovo({ capturadoEm }: { capturadoEm: string }) {
  const [novo, setNovo] = useState(false);

  useEffect(() => {
    const anterior = lerVisitaAnterior();
    if (!anterior) return;
    const tAnterior = new Date(anterior).getTime();
    const tItem = new Date(capturadoEm).getTime();
    if (Number.isFinite(tAnterior) && Number.isFinite(tItem) && tItem > tAnterior) {
      setNovo(true);
    }
  }, [capturadoEm]);

  if (!novo) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-signal)]/60 bg-[var(--color-signal-soft)] px-2 py-0.5 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
      Novo
    </span>
  );
}
