"use client";

// Menu radial FLUTUANTE do Sonar — aparece nas abas da equipe quando o modo
// de navegação escolhido no avatar é "radial" (o nav lateral some). Tamanho
// intermediário, dá pra SEGURAR E ARRASTAR pra qualquer canto (posição salva
// no navegador) e o botão "–" recolhe numa bolinha translúcida com a foto.
// No /equipe/inicio ele NÃO monta: lá a roda grande fixa da página assume.
// Portado do RadialFlutuante do BP Internal (bug do setPointerCapture no
// pointerdown incluso: a captura só entra depois que o arrasto engata >6px).

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Minus } from "lucide-react";

import RadialHub, { type ItemRadial } from "./RadialHub";
import { useNavModo } from "./use-nav-modo";
import { ITENS_RADIAL_EQUIPE } from "./itens-radial-equipe";

const TAMANHO = 300; // intermediário (a roda grande do Início tem 500+)
const MARGEM = 8;
const CHAVE_POS = "sonar-radial-pos";
const CHAVE_RECOLHIDO = "sonar-radial-recolhido";
const TAM_BOLINHA = 60;
// A faixa 1 tem ~159px — o radial não estaciona atrás dela.
const TOPO_FAIXA = 166;

function clamp(x: number, y: number, larg: number, alt: number) {
  return {
    x: Math.min(Math.max(x, MARGEM), Math.max(MARGEM, window.innerWidth - larg - MARGEM)),
    y: Math.min(Math.max(y, TOPO_FAIXA), Math.max(TOPO_FAIXA, window.innerHeight - alt - MARGEM)),
  };
}

export default function RadialFlutuante({
  nome,
  fotoUrl,
}: {
  nome: string;
  fotoUrl?: string | null;
}) {
  const pathname = usePathname();
  const modo = useNavModo();

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [recolhido, setRecolhido] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const drag = useRef<{ dx: number; dy: number; moveu: boolean; x0: number; y0: number } | null>(null);
  const arrastou = useRef(false);

  const largAtual = recolhido ? TAM_BOLINHA : TAMANHO;

  useEffect(() => {
    let rec = false;
    try {
      rec = localStorage.getItem(CHAVE_RECOLHIDO) === "1";
    } catch {}
    setRecolhido(rec);
    const larg = rec ? TAM_BOLINHA : TAMANHO;
    let p: { x: number; y: number } | null = null;
    try {
      p = JSON.parse(localStorage.getItem(CHAVE_POS) ?? "null");
    } catch {}
    if (!p || typeof p.x !== "number" || typeof p.y !== "number") {
      p = {
        x: window.innerWidth - larg - 16,
        y: Math.max(TOPO_FAIXA, window.innerHeight / 2 - larg / 2),
      };
    }
    setPos(clamp(p.x, p.y, larg, larg));
  }, []);

  useEffect(() => {
    const ajustar = () => {
      const larg = recolhido ? TAM_BOLINHA : TAMANHO;
      setPos((p) => (p ? clamp(p.x, p.y, larg, larg) : p));
    };
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, [recolhido]);

  function aoDescer(e: React.PointerEvent<HTMLDivElement>) {
    if (!pos) return;
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, moveu: false, x0: e.clientX, y0: e.clientY };
  }

  function aoMover(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    if (!d.moveu) {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
      d.moveu = true;
      setArrastando(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
    setPos(clamp(e.clientX - d.dx, e.clientY - d.dy, largAtual, largAtual));
  }

  function salvarPos() {
    setPos((p) => {
      if (p) {
        try {
          localStorage.setItem(CHAVE_POS, JSON.stringify(p));
        } catch {}
      }
      return p;
    });
  }

  function aoSoltar() {
    const d = drag.current;
    drag.current = null;
    if (d?.moveu) {
      arrastou.current = true;
      setArrastando(false);
      salvarPos();
    }
  }

  function engolirCliquePosArrasto(e: React.MouseEvent) {
    if (arrastou.current) {
      arrastou.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function alternarRecolhido(valor: boolean) {
    setRecolhido(valor);
    try {
      localStorage.setItem(CHAVE_RECOLHIDO, valor ? "1" : "0");
    } catch {}
    const larg = valor ? TAM_BOLINHA : TAMANHO;
    setPos((p) => (p ? clamp(p.x, p.y, larg, larg) : p));
  }

  const itens: ItemRadial[] = ITENS_RADIAL_EQUIPE;

  // Só no modo radial, fora do Início (lá a roda grande fixa assume).
  if (modo !== "radial") return null;
  if (pathname === "/equipe/inicio") return null;
  if (!pos) return null;

  function aoDescerBolinha(e: React.PointerEvent<HTMLDivElement>) {
    if (!pos) return;
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, moveu: false, x0: e.clientX, y0: e.clientY };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }
  function aoSoltarBolinha() {
    const d = drag.current;
    drag.current = null;
    setArrastando(false);
    if (d?.moveu) {
      arrastou.current = true;
      salvarPos();
    } else if (d) {
      alternarRecolhido(false);
    }
  }

  if (recolhido) {
    return (
      <div
        className={`fixed z-40 touch-none select-none ${arrastando ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ left: pos.x, top: pos.y, width: TAM_BOLINHA, height: TAM_BOLINHA }}
        onPointerDown={aoDescerBolinha}
        onPointerMove={aoMover}
        onPointerUp={aoSoltarBolinha}
        onPointerCancel={aoSoltarBolinha}
        onClickCapture={engolirCliquePosArrasto}
        title="Clique para abrir o menu; segure e arraste para mover"
      >
        <div className="grid h-full w-full place-items-center overflow-hidden rounded-full border-2 border-[var(--color-gold)]/40 bg-[var(--color-surface-2)]/70 font-serif text-lg font-semibold text-[var(--color-gold)] opacity-50 shadow-lg backdrop-blur-sm transition hover:opacity-100">
          {nome.trim().charAt(0).toUpperCase() || "•"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-40 touch-none select-none ${arrastando ? "cursor-grabbing opacity-90" : "cursor-grab opacity-95"}`}
      style={{ left: pos.x, top: pos.y, width: TAMANHO, height: TAMANHO }}
      onPointerDown={aoDescer}
      onPointerMove={aoMover}
      onPointerUp={aoSoltar}
      onPointerCancel={aoSoltar}
      onClickCapture={engolirCliquePosArrasto}
      title="Segure e arraste para mover"
    >
      <RadialHub itens={itens} nome={nome} fotoUrl={fotoUrl} size={TAMANHO} compacto />
      {/* Recolher: sai da frente do conteúdo */}
      <button
        type="button"
        onClick={() => alternarRecolhido(true)}
        title="Recolher o menu (vira uma bolinha translúcida)"
        className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-surface-2)]/90 text-[var(--color-gold)] shadow-md transition hover:border-[var(--color-gold)]/70 hover:bg-[var(--color-gold)]/15"
      >
        <Minus className="h-4 w-4" />
      </button>
    </div>
  );
}
