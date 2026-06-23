"use client";

import { useEffect, useRef } from "react";
import { attachHeroScrollTracker, getHeroScroll } from "@/lib/heroScroll";

interface Vector2D {
  x: number;
  y: number;
}

class Particle {
  pos: Vector2D = { x: 0, y: 0 };
  vel: Vector2D = { x: 0, y: 0 };
  acc: Vector2D = { x: 0, y: 0 };
  target: Vector2D = { x: 0, y: 0 };

  closeEnoughTarget = 100;
  maxSpeed = 1.0;
  maxForce = 0.1;
  particleSize = 10;
  isKilled = false;

  startColor = { r: 0, g: 0, b: 0 };
  targetColor = { r: 0, g: 0, b: 0 };
  colorWeight = 0;
  colorBlendRate = 0.01;

  move() {
    let proximityMult = 1;
    const distance = Math.sqrt(
      Math.pow(this.pos.x - this.target.x, 2) +
        Math.pow(this.pos.y - this.target.y, 2),
    );

    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget;
    }

    const towardsTarget = {
      x: this.target.x - this.pos.x,
      y: this.target.y - this.pos.y,
    };

    const magnitude = Math.sqrt(
      towardsTarget.x * towardsTarget.x + towardsTarget.y * towardsTarget.y,
    );
    if (magnitude > 0) {
      towardsTarget.x =
        (towardsTarget.x / magnitude) * this.maxSpeed * proximityMult;
      towardsTarget.y =
        (towardsTarget.y / magnitude) * this.maxSpeed * proximityMult;
    }

    const steer = {
      x: towardsTarget.x - this.vel.x,
      y: towardsTarget.y - this.vel.y,
    };

    const steerMagnitude = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
    if (steerMagnitude > 0) {
      steer.x = (steer.x / steerMagnitude) * this.maxForce;
      steer.y = (steer.y / steerMagnitude) * this.maxForce;
    }

    this.acc.x += steer.x;
    this.acc.y += steer.y;

    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.acc.x = 0;
    this.acc.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D, drawAsPoints: boolean) {
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0);
    }

    const currentColor = {
      r: Math.round(
        this.startColor.r +
          (this.targetColor.r - this.startColor.r) * this.colorWeight,
      ),
      g: Math.round(
        this.startColor.g +
          (this.targetColor.g - this.startColor.g) * this.colorWeight,
      ),
      b: Math.round(
        this.startColor.b +
          (this.targetColor.b - this.startColor.b) * this.colorWeight,
      ),
    };

    if (drawAsPoints) {
      ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
    } else {
      ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  kill(width: number, height: number) {
    if (!this.isKilled) {
      const randomPos = generateRandomPos(
        width / 2,
        height / 2,
        (width + height) / 2,
      );
      this.target.x = randomPos.x;
      this.target.y = randomPos.y;

      this.startColor = {
        r:
          this.startColor.r +
          (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g:
          this.startColor.g +
          (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b:
          this.startColor.b +
          (this.targetColor.b - this.startColor.b) * this.colorWeight,
      };
      this.targetColor = { r: 0, g: 0, b: 0 };
      this.colorWeight = 0;

      this.isKilled = true;
    }
  }
}

function generateRandomPos(x: number, y: number, mag: number): Vector2D {
  const randomX = Math.random() * 1000;
  const randomY = Math.random() * 500;

  const direction = {
    x: randomX - x,
    y: randomY - y,
  };

  const magnitude = Math.sqrt(
    direction.x * direction.x + direction.y * direction.y,
  );
  if (magnitude > 0) {
    direction.x = (direction.x / magnitude) * mag;
    direction.y = (direction.y / magnitude) * mag;
  }

  return {
    x: x + direction.x,
    y: y + direction.y,
  };
}

interface SonarParticleTextProps {
  word?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  color?: { r: number; g: number; b: number };
  pixelSteps?: number;
  className?: string;
  "aria-label"?: string;
}

// Cor padrão: ivory #E8E4D6 (mesma do wordmark Sonar original)
const DEFAULT_COLOR = { r: 232, g: 228, b: 214 };

export function SonarParticleText({
  word = "Sonar",
  width = 560,
  height = 140,
  fontSize = 140,
  color = DEFAULT_COLOR,
  pixelSteps = 6,
  className,
  "aria-label": ariaLabel,
}: SonarParticleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -10000,
    y: -10000,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    const drawAsPoints = true;
    const particles = particlesRef.current;

    const renderTextParticles = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.fillStyle = "white";
      offCtx.font = `500 ${fontSize}px Manrope, system-ui, sans-serif`;
      offCtx.textAlign = "left";
      offCtx.textBaseline = "middle";
      offCtx.fillText(word, 4, height / 2);

      const imageData = offCtx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      let particleIndex = 0;

      const coordsIndexes: number[] = [];
      for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
        coordsIndexes.push(i);
      }

      for (let i = coordsIndexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [coordsIndexes[i], coordsIndexes[j]] = [
          coordsIndexes[j],
          coordsIndexes[i],
        ];
      }

      for (const coordIndex of coordsIndexes) {
        const alpha = pixels[coordIndex + 3];
        if (alpha > 0) {
          const x = (coordIndex / 4) % width;
          const y = Math.floor(coordIndex / 4 / width);

          let particle: Particle;
          if (particleIndex < particles.length) {
            particle = particles[particleIndex];
            particle.isKilled = false;
            particleIndex++;
          } else {
            particle = new Particle();
            // Spawn próximo do target (jitter pequeno) — aparece imediato,
            // sem fly-in longo de fora da tela
            const jitter = 18;
            particle.pos.x = x + (Math.random() - 0.5) * 2 * jitter;
            particle.pos.y = y + (Math.random() - 0.5) * 2 * jitter;
            particle.maxSpeed = Math.random() * 4 + 6;
            particle.maxForce = particle.maxSpeed * 0.12;
            particle.particleSize = Math.random() * 6 + 6;
            particle.colorBlendRate = Math.random() * 0.04 + 0.02;
            particles.push(particle);
          }

          particle.startColor = {
            r:
              particle.startColor.r +
              (particle.targetColor.r - particle.startColor.r) *
                particle.colorWeight,
            g:
              particle.startColor.g +
              (particle.targetColor.g - particle.startColor.g) *
                particle.colorWeight,
            b:
              particle.startColor.b +
              (particle.targetColor.b - particle.startColor.b) *
                particle.colorWeight,
          };
          particle.targetColor = color;
          particle.colorWeight = 0;

          particle.target.x = x;
          particle.target.y = y;
        }
      }

      for (let i = particleIndex; i < particles.length; i++) {
        particles[i].kill(width, height);
      }
    };

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fundo transparente — clear total a cada frame (sem trail)
      ctx.clearRect(0, 0, width, height);

      // Dissolve baseado no scroll do hero — partículas se afastam radialmente
      // do centro e fade conforme o usuário rola pra fora da faixa 2.
      const scroll = getHeroScroll();
      const dissolveT = Math.min(1, Math.max(0, scroll * 2.5));
      const opacity = 1 - dissolveT;
      const cx = width / 2;
      const cy = height / 2;

      if (opacity < 0.01) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.globalAlpha = opacity;

      // Repulsão por mouse: empurra partículas pra fora do raio do cursor
      const mouse = mouseRef.current;
      const REPEL_RADIUS = 80;
      const REPEL_STRENGTH = 2.5;

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        if (mouse.active) {
          const mdx = particle.pos.x - mouse.x;
          const mdy = particle.pos.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < REPEL_RADIUS && mdist > 0) {
            const force = (1 - mdist / REPEL_RADIUS) * REPEL_STRENGTH;
            particle.acc.x += (mdx / mdist) * force;
            particle.acc.y += (mdy / mdist) * force;
          }
        }

        particle.move();

        // Aplica deslocamento radial APENAS no desenho (não na simulação)
        // — assim, rolando de volta, o efeito reverte suavemente.
        const dx = particle.pos.x - cx;
        const dy = particle.pos.y - cy;
        const savedX = particle.pos.x;
        const savedY = particle.pos.y;
        particle.pos.x = savedX + dx * dissolveT * 1.4;
        particle.pos.y = savedY + dy * dissolveT * 1.4;
        particle.draw(ctx, drawAsPoints);
        particle.pos.x = savedX;
        particle.pos.y = savedY;

        if (particle.isKilled) {
          if (
            particle.pos.x < 0 ||
            particle.pos.x > width ||
            particle.pos.y < 0 ||
            particle.pos.y > height
          ) {
            particles.splice(i, 1);
          }
        }
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    // Mouse tracking pra repelir partículas no hover
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * width;
      mouseRef.current.y = ((e.clientY - rect.top) / rect.height) * height;
      mouseRef.current.active = true;
    };
    const onLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -10000;
      mouseRef.current.y = -10000;
    };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    const detachHeroScroll = attachHeroScrollTracker();
    renderTextParticles();
    animate();

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current = [];
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      detachHeroScroll();
    };
  }, [word, width, height, fontSize, color, pixelSteps]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label={ariaLabel ?? word}
      role="img"
    />
  );
}
