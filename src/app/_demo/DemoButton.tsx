"use client";

// Botao "Versao Demo" em neon lilas que abre o DemoModal.
//
// Aparece em 3 lugares na landing:
//   1. Ao lado do "ENTRAR" no canto direito do header (variant="mini")
//   2. Abaixo do "Acessar plataforma" no Hero (variant="hero")
//   3. Abaixo do "Acessar plataforma" na faixa CTA (variant="cta")
//
// O modal portala pra document.body (evita confinamento por backdrop-filter
// dos ancestrais).

import { useState } from "react";
import { DemoModal } from "./DemoModal";

type Variant = "mini" | "hero" | "cta";

const baseClass =
  "relative inline-flex items-center justify-center font-semibold transition focus:outline-none";

// Cor lilas neon (#c084fc base + #a855f7 glow).
const neonStyle = {
  background: "rgba(168, 85, 247, 0.16)",
  color: "#e9d5ff",
  border: "1px solid rgba(192, 132, 252, 0.6)",
  boxShadow:
    "0 0 0 1px rgba(192,132,252,0.25), 0 0 18px rgba(168,85,247,0.45), inset 0 0 12px rgba(168,85,247,0.18)",
  textShadow: "0 0 8px rgba(232,213,255,0.6)",
} satisfies React.CSSProperties;

const neonHoverStyle = {
  background: "rgba(168, 85, 247, 0.28)",
  boxShadow:
    "0 0 0 1px rgba(192,132,252,0.5), 0 0 28px rgba(168,85,247,0.75), inset 0 0 16px rgba(168,85,247,0.32)",
} satisfies React.CSSProperties;

function getVariantClass(variant: Variant): string {
  switch (variant) {
    case "mini":
      return "rounded-lg px-2.5 py-1.5 text-[10px] tracking-tight uppercase";
    case "hero":
      return "rounded-lg px-8 py-4 text-base tracking-tight";
    case "cta":
      return "mt-3 rounded-lg px-8 py-4 text-sm tracking-tight";
  }
}

export function DemoButton({ variant }: { variant: Variant }) {
  const [aberto, setAberto] = useState(false);
  const [hover, setHover] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        className={`${baseClass} ${getVariantClass(variant)}`}
        style={hover ? { ...neonStyle, ...neonHoverStyle } : neonStyle}
      >
        {variant === "mini" ? "VERSÃO DEMO" : "Versão Demo"}
      </button>
      <DemoModal aberto={aberto} onFechar={() => setAberto(false)} />
    </>
  );
}
