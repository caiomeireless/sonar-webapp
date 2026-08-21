"use client";

// Borda METAL LÍQUIDO de verdade (shader WebGL @paper-design, ref. 21st.dev)
// — anel líquido animado ao redor do conteúdo, miolo intacto. Usar com MUITA
// parcimônia: cada instância abre um contexto WebGL (o navegador limita
// ~16 por página). Pra abas/botões em massa existe o primo barato em CSS
// (.contorno-liquido / btn-neon-* em globals.css).
import {
  liquidMetalFragmentShader,
  ShaderMount,
} from "@paper-design/shaders";
import { useEffect, useRef } from "react";

// Tinta por cima do metal prateado do shader — mantém a cor do contexto.
const TINTAS: Record<string, string> = {
  gold: "sepia(1) saturate(2.2) hue-rotate(8deg) brightness(1.06)",
  signal: "sepia(1) saturate(2.6) hue-rotate(85deg) brightness(1.05)",
};

type Props = {
  children: React.ReactNode;
  /** Cor do reflexo metálico (padrão: gold). */
  cor?: "gold" | "signal";
  /** Raio externo em px (o miolo desconta a espessura do anel). */
  radius?: number;
  className?: string;
};

export function BordaLiquidaMetal({
  children,
  cor = "gold",
  radius = 14,
  className = "",
}: Props) {
  const host = useRef<HTMLDivElement | null>(null);
  // biome-ignore lint/suspicious/noExplicitAny: lib externa sem tipos
  const mount = useRef<any>(null);

  useEffect(() => {
    // Reduced motion: fica só o anel estático (sem shader).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!host.current) return;
    try {
      mount.current = new ShaderMount(
        host.current,
        liquidMetalFragmentShader,
        {
          u_repetition: 4,
          u_softness: 0.5,
          u_shiftRed: 0.3,
          u_shiftBlue: 0.3,
          u_distortion: 0,
          u_contour: 0,
          u_angle: 45,
          u_scale: 8,
          u_shape: 1,
          u_offsetX: 0.1,
          u_offsetY: -0.1,
        },
        undefined,
        0.6,
      );
    } catch {
      // WebGL indisponível — o anel estático de fundo segura a onda.
    }
    return () => {
      try {
        mount.current?.destroy?.();
      } catch {
        // já destruído
      }
      mount.current = null;
    };
  }, []);

  return (
    <div
      className={`relative p-[2.5px] ${className}`}
      style={{ borderRadius: radius }}
    >
      {/* Camada do shader — vira o "anel" porque o miolo cobre o centro. */}
      <div
        ref={host}
        aria-hidden="true"
        className="ml-shader-host pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          borderRadius: radius,
          filter: TINTAS[cor],
          // Fallback estático (antes do shader montar / sem WebGL).
          background:
            "linear-gradient(120deg, #6d6d68, #f2f2ec 30%, #8a8a84 55%, #e6e6e0 80%, #6d6d68)",
        }}
      />
      <div
        className="relative h-full w-full"
        style={{
          borderRadius: Math.max(4, radius - 3),
          background: "var(--color-onyx)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
