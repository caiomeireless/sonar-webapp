"use client";

// Chips animados de selecao multi (ou unica). Inspirado no padrao
// SelectorChips do design Caio enviou, ADAPTADO ao tema Sonar:
// - Fundo deselected: bg-surface-1, border ivory-22
// - Fundo SELECTED: signal verde (ou gold se opcao usar accent="gold")
// - Texto selected: onyx; deselected: ivory
// - Spring na largura ao virar selected (chip expande)
// - Tick SVG animado entra ao selecionar
//
// Suporta dois modos:
// - mode="single" — radio: clicar troca a selecao atual
// - mode="multi"  — checkbox: cada chip independente

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

type Accent = "signal" | "gold";

export type ChipOpcao<T extends string = string> = {
  valor: T;
  rotulo: string;
};

export type SelectorChipsProps<T extends string = string> = {
  opcoes: ChipOpcao<T>[];
  selecionados: T[];
  mode: "single" | "multi";
  accent?: Accent;
  onChange: (proximos: T[]) => void;
  className?: string;
};

const CORES: Record<
  Accent,
  { selBg: string; selBorder: string; selFg: string }
> = {
  signal: {
    selBg: "#3CFF8A",
    selBorder: "#3CFF8A",
    selFg: "#0A0C0B",
  },
  gold: {
    selBg: "#C9A24A",
    selBorder: "#C9A24A",
    selFg: "#0A0C0B",
  },
};

export function SelectorChips<T extends string = string>({
  opcoes,
  selecionados,
  mode,
  accent = "signal",
  onChange,
  className = "",
}: SelectorChipsProps<T>) {
  function clique(v: T) {
    if (mode === "single") {
      onChange([v]);
      return;
    }
    if (selecionados.includes(v)) {
      onChange(selecionados.filter((x) => x !== v));
    } else {
      onChange([...selecionados, v]);
    }
  }

  const cor = CORES[accent];

  return (
    <div className={"flex flex-wrap items-center gap-2 " + className}>
      {opcoes.map((o) => {
        const sel = selecionados.includes(o.valor);
        return (
          <motion.button
            key={o.valor}
            type="button"
            onClick={() => clique(o.valor)}
            initial={false}
            animate={{
              backgroundColor: sel
                ? cor.selBg
                : "rgba(232, 228, 214, 0.045)",
              borderColor: sel
                ? cor.selBorder
                : "rgba(232, 228, 214, 0.18)",
              color: sel ? cor.selFg : "#E8E4D6",
              transition: {
                backgroundColor: { duration: 0.18 },
                color: { duration: 0.18 },
                borderColor: { duration: 0.18 },
              },
            }}
            whileHover={
              sel
                ? undefined
                : { backgroundColor: "rgba(232, 228, 214, 0.10)" }
            }
            className="
              inline-flex items-center justify-center rounded-full border
              px-4 py-1.5 font-mono text-[12px] uppercase
              tracking-[0.16em] transition-shadow cursor-pointer
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[var(--color-signal)]
            "
            style={{ minHeight: 32 }}
          >
            <div className="flex items-center justify-center">
              <span>{o.rotulo}</span>
              <motion.span
                animate={{
                  width: sel ? 16 : 0,
                  marginLeft: sel ? 6 : 0,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                <AnimatePresence>
                  {sel && (
                    <motion.span
                      key="tick"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 20,
                      }}
                      style={{ pointerEvents: "none" }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden="true"
                      >
                        <motion.path
                          d="M5 10.5L9 14.5L15 7.5"
                          stroke={cor.selFg}
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.22 }}
                        />
                      </svg>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
