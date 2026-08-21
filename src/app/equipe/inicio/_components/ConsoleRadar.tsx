"use client";

// Mostrador de radar do Console Sonar — o menu radial (RadialHub) vira o
// centro de um radar de verdade: anéis concêntricos, feixe varrendo e
// "blips" reais (andamentos de alto sinal capturados pelos robôs). Clique
// num blip → Radar de Movimentações.
//
// Performance: o feixe anima só transform:rotate (compositor, sem repaint)
// e os blips pulsam com animation baratinha; prefers-reduced-motion desliga
// o giro (globals.css, .console-sweep).
import Link from "next/link";
import { useEffect, useState } from "react";

import RadialHub from "@/components/ui/RadialHub";
import { ITENS_RADIAL_EQUIPE } from "@/components/ui/itens-radial-equipe";
import type { BlipRadar } from "@/lib/console-inicio";

export default function ConsoleRadar({
  nome,
  fotoUrl,
  blips,
}: {
  nome: string;
  fotoUrl: string | null;
  blips: BlipRadar[];
}) {
  const [tam, setTam] = useState(600);

  useEffect(() => {
    const ajustar = () =>
      setTam(
        Math.max(
          340,
          Math.min(640, window.innerWidth - 48, window.innerHeight - 220),
        ),
      );
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  const roda = Math.round(tam * 0.68);

  return (
    <div
      className="relative mx-auto"
      style={{ width: tam, height: tam }}
      aria-label="Radar da plataforma"
    >
      {/* Anéis concêntricos */}
      {[1, 0.82, 0.64].map((f) => (
        <div
          key={f}
          aria-hidden="true"
          className="absolute rounded-full border border-[var(--color-signal)]/14"
          style={{
            width: tam * f,
            height: tam * f,
            left: (tam * (1 - f)) / 2,
            top: (tam * (1 - f)) / 2,
          }}
        />
      ))}
      {/* Cruzeta (linhas cardeais) */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-full w-px bg-[var(--color-signal)]/8"
      />
      <div
        aria-hidden="true"
        className="absolute left-0 top-1/2 h-px w-full bg-[var(--color-signal)]/8"
      />

      {/* Feixe de varredura */}
      <div
        aria-hidden="true"
        className="console-sweep absolute inset-0 overflow-hidden rounded-full"
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(60,255,138,0.16), rgba(60,255,138,0.05) 46deg, transparent 70deg)",
          }}
        />
      </div>

      {/* Blips — contatos reais dos robôs, clique abre o Radar */}
      {blips.map((b) => {
        const rad = ((b.angulo - 90) * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * b.raioFrac * 50;
        const y = 50 + Math.sin(rad) * b.raioFrac * 50;
        return (
          <Link
            key={b.id}
            href="/equipe/radar"
            title={b.rotulo}
            className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span className="relative block h-2.5 w-2.5">
              <span className="absolute inset-0 rounded-full bg-[var(--color-signal)] opacity-80 shadow-[0_0_8px_rgba(60,255,138,0.9)] transition group-hover:scale-150" />
              <span className="console-blip-ping absolute inset-0 rounded-full bg-[var(--color-signal)]" />
            </span>
          </Link>
        );
      })}

      {/* Roda de navegação no centro do mostrador */}
      <div
        className="absolute"
        style={{
          width: roda,
          height: roda,
          left: (tam - roda) / 2,
          top: (tam - roda) / 2,
        }}
      >
        <RadialHub
          itens={ITENS_RADIAL_EQUIPE}
          nome={nome}
          fotoUrl={fotoUrl}
          size={roda}
        />
      </div>
    </div>
  );
}
