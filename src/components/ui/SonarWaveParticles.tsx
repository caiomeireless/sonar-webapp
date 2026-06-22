"use client";

import { useEffect, useRef } from "react";

// Particulas distribuidas em arco half-ellipse que cresce do emit ate max scale,
// estilo halftone (mesmo padrao visual do SonarParticleText). 4 ondas staggered.

const RX = 18;
const RY = 30;
const N_PARTICLES = 26;
const WAVE_COUNT = 4;
const WAVE_DURATION = 2.6; // segundos
const WAVE_INTERVAL = 0.65;
const MAX_SCALE = 3.0;
const COLOR_RGB = "60, 255, 138"; // signal green #3CFF8A

interface Particle {
  angle: number;
  pos: { x: number; y: number };
}

interface SonarWaveParticlesProps {
  width?: number;
  height?: number;
  centerX?: number;
  centerY?: number;
  className?: string;
}

export function SonarWaveParticles({
  width = 220,
  height = 240,
  centerX = 20,
  centerY = 120,
  className,
}: SonarWaveParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 4 ondas, cada uma com N particulas distribuidas no half-arc
    const waves = Array.from({ length: WAVE_COUNT }, (_, w) => ({
      delay: w * WAVE_INTERVAL,
      lastCycle: -1,
      particles: Array.from({ length: N_PARTICLES }, (_, i): Particle => {
        const t = i / (N_PARTICLES - 1);
        const angle = -Math.PI / 2 + t * Math.PI;
        return { angle, pos: { x: centerX, y: centerY } };
      }),
    }));

    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      for (const wave of waves) {
        const phaseTime = elapsed - wave.delay;
        if (phaseTime < 0) continue;
        const cycle = Math.floor(phaseTime / WAVE_DURATION);
        const waveT = (phaseTime / WAVE_DURATION) % 1;

        // Reset particulas ao iniciar nova onda — snap pro centro
        if (cycle !== wave.lastCycle) {
          for (const p of wave.particles) {
            p.pos.x = centerX;
            p.pos.y = centerY;
          }
          wave.lastCycle = cycle;
        }

        const scale = 0.1 + waveT * (MAX_SCALE - 0.1);
        const opacity = Math.pow(1 - waveT, 0.7);

        for (const p of wave.particles) {
          const targetX = centerX + RX * Math.cos(p.angle) * scale;
          const targetY = centerY + RY * Math.sin(p.angle) * scale;

          // Lerp suave (estilo fly-in do SonarParticleText)
          p.pos.x += (targetX - p.pos.x) * 0.28;
          p.pos.y += (targetY - p.pos.y) * 0.28;

          // Particula com glow interno
          ctx.fillStyle = `rgba(${COLOR_RGB}, ${opacity * 0.95})`;
          ctx.beginPath();
          ctx.arc(p.pos.x, p.pos.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(220, 255, 230, ${opacity * 0.6})`;
          ctx.beginPath();
          ctx.arc(p.pos.x, p.pos.y, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [width, height, centerX, centerY]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", background: "transparent" }}
      aria-hidden="true"
    />
  );
}
