"use client";

// Fundo "Aether Flow" adaptado pra paleta Sonar.
// - Partículas: maioria verde signal, pitada de dourado.
// - Linhas conectoras entre partículas próximas (alpha bem baixo).
// - Cursor exerce repulsão suave.
// - Vinheta radial escura sobreposta pra proteger leitura no centro.
// - Pointer-events: none (não bloqueia cliques no conteúdo).

import { useEffect, useRef } from "react";

const COR_SIGNAL = "60, 255, 138";
const COR_GOLD = "201, 162, 74";

interface Props {
  /** Densidade — quanto MAIOR, MENOS partículas. Default 11000. */
  densidade?: number;
  /** Raio de repulsão do cursor em px. Default 180. */
  raioMouse?: number;
  /** Multiplicador de alpha global (0..1). Default 1. */
  intensidade?: number;
}

type Particula = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** 'signal' | 'gold'. */
  tipo: "signal" | "gold";
};

export function AetherBackground({
  densidade = 6500,
  raioMouse = 180,
  intensidade = 1,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let particulas: Particula[] = [];
    const mouse = { x: -10_000, y: -10_000 };
    let raf = 0;

    function ajustarTamanho() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      gerarParticulas();
    }

    function gerarParticulas() {
      const total = Math.max(20, Math.floor((w * h) / densidade));
      particulas = [];
      for (let i = 0; i < total; i++) {
        const r = Math.random() * 1.5 + 0.8;
        // 1 a cada 7 partículas é dourada — pitada visual sem dominar.
        const tipo: Particula["tipo"] = i % 7 === 0 ? "gold" : "signal";
        particulas.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r,
          tipo,
        });
      }
    }

    function corDe(p: Particula, alpha: number) {
      const base = p.tipo === "gold" ? COR_GOLD : COR_SIGNAL;
      return `rgba(${base}, ${alpha * intensidade})`;
    }

    function atualizarParticula(p: Particula) {
      // Bounce nas bordas
      if (p.x > w || p.x < 0) p.vx = -p.vx;
      if (p.y > h || p.y < 0) p.vy = -p.vy;

      // Repulsão do mouse
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < raioMouse + p.r) {
        const f = (raioMouse - dist) / raioMouse;
        p.x -= (dx / dist) * f * 2.6;
        p.y -= (dy / dist) * f * 2.6;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Desenha o ponto — alpha baixo pra não competir com texto.
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx!.fillStyle = corDe(p, 0.55);
      ctx!.fill();
    }

    function conectar() {
      const distLimite = Math.min(w, h) / 7;
      const distSq = distLimite * distLimite;
      for (let a = 0; a < particulas.length; a++) {
        const pa = particulas[a];
        for (let b = a + 1; b < particulas.length; b++) {
          const pb = particulas[b];
          const dx = pa.x - pb.x;
          const dy = pa.y - pb.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < distSq) {
            const op = (1 - d2 / distSq) * 0.18 * intensidade;
            // Cor da linha = mistura: se algum dos 2 é gold, fica gold; senão signal.
            const base =
              pa.tipo === "gold" || pb.tipo === "gold" ? COR_GOLD : COR_SIGNAL;
            ctx!.strokeStyle = `rgba(${base}, ${op})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(pa.x, pa.y);
            ctx!.lineTo(pb.x, pb.y);
            ctx!.stroke();
          }
        }
      }
    }

    function loop() {
      raf = requestAnimationFrame(loop);
      ctx!.clearRect(0, 0, w, h);
      for (const p of particulas) atualizarParticula(p);
      conectar();
    }

    function onMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onOut() {
      mouse.x = -10_000;
      mouse.y = -10_000;
    }

    ajustarTamanho();
    const ro = new ResizeObserver(() => ajustarTamanho());
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onOut);
    window.addEventListener("resize", ajustarTamanho);

    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onOut);
      window.removeEventListener("resize", ajustarTamanho);
    };
  }, [densidade, raioMouse, intensidade]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
