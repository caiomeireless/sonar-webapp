"use client";

// Grade de pontos interativa — adapta o componente "interactive-grid"
// pra paleta Sonar: cor fixa verde signal (#3CFF8A), brightness varia
// pela proximidade do cursor. Renderizada como BACKGROUND da área
// principal (pointer-events: none — não bloqueia cliques).

import { useEffect, useRef } from "react";

interface Props {
  /** Espaçamento entre pontos em px. Default 32. */
  dotDistance?: number;
  /** Raio do ponto em px. Default 1.6. */
  dotRadius?: number;
  /** Raio (em px) de proximidade que ativa o brilho. Default 220. */
  minProximity?: number;
}

export function InteractiveGrid({
  dotDistance = 36,
  dotRadius = 1.1,
  minProximity = 150,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const dotsRef = useRef<{ x: number; y: number }[]>([]);
  const sizeRef = useRef({ w: 0, h: 0 });
  const minProxSq = minProximity * minProximity;

  // (Re)gera grade de pontos cobrindo o canvas.
  function gerarPontos(w: number, h: number) {
    const pts: { x: number; y: number }[] = [];
    for (let x = dotDistance / 2; x < w; x += dotDistance) {
      for (let y = dotDistance / 2; y < h; y += dotDistance) {
        pts.push({ x, y });
      }
    }
    dotsRef.current = pts;
  }

  function ajustarTamanho() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    sizeRef.current = { w, h };
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gerarPontos(w, h);
  }

  useEffect(() => {
    ajustarTamanho();

    const onMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const onLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    const ro = new ResizeObserver(() => ajustarTamanho());
    if (canvasRef.current?.parentElement) {
      ro.observe(canvasRef.current.parentElement);
    }
    window.addEventListener("resize", ajustarTamanho);

    let raf = 0;

    function frame() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { w, h } = sizeRef.current;
      const mouse = mouseRef.current;
      ctx.clearRect(0, 0, w, h);

      for (const p of dotsRef.current) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;

        if (d2 <= minProxSq) {
          const t = 1 - d2 / minProxSq; // 1 = colado no cursor; 0 = na borda do raio
          // Brilho discreto — fundo ambiente, não pode competir com os
          // dados que estão por cima dos cards.
          const alphaPonto = 0.06 + t * 0.18;
          const alphaLinha = 0.015 + t * 0.05;
          ctx.fillStyle = `rgba(60, 255, 138, ${alphaPonto})`;
          ctx.strokeStyle = `rgba(60, 255, 138, ${alphaLinha})`;
          ctx.lineWidth = 0.6;

          ctx.beginPath();
          ctx.arc(p.x, p.y, dotRadius + t * 0.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        } else {
          // Ponto neutro discreto — usa ivory bem fraco pra ficar elegante
          // tanto no tema escuro quanto no claro.
          ctx.fillStyle = "rgba(234, 231, 220, 0.05)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", ajustarTamanho);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dotDistance, dotRadius, minProximity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
