"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Variante A — Metropole Classica
 * Mapa 3D isometrico inclinado tipo "cidade em miniatura".
 * CSS 3D transforms puros (sem three.js / spline).
 */

type TipoBem = "veiculo" | "imovel" | "empresa";

interface Pino {
  /** Posicao horizontal em px relativa ao centro da cidade */
  x: number;
  /** Posicao em profundidade em px relativa ao centro da cidade */
  y: number;
  tipo: TipoBem;
  penhoraConfirmada: boolean;
  label?: string;
}

interface Predio {
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
}

interface Carro {
  x: number;
  y: number;
  rot: number;
  cor: string;
}

// ----- Paleta -----
const ONYX = "#0A0C0B";
const ONYX_2 = "#11140F";
const ONYX_3 = "#161A14";
const GOLD = "#C9A24A";
const SIGNAL = "#3CFF8A";
const IVORY = "#E8E4D6";

// ----- Layout da cidade -----
// Grid 5x5 quarteiroes. Cada quarteirao tem 2-3 predios.
const QUARTEIRAO = 110; // tamanho do bloco
const RUA = 28; // largura da rua entre quarteiroes
const CELL = QUARTEIRAO + RUA;
const GRID = 5; // 5x5
const CIDADE = GRID * CELL - RUA; // tamanho total do tabuleiro

// Determinismo: sem Math.random no client (evita hydration mismatch)
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function gerarCidade(): { predios: Predio[]; carros: Carro[]; faixas: { x: number; y: number; horizontal: boolean }[] } {
  const rnd = seeded(42);
  const predios: Predio[] = [];

  for (let gx = 0; gx < GRID; gx++) {
    for (let gy = 0; gy < GRID; gy++) {
      // Cada quarteirao com 2-4 predios
      const n = 2 + Math.floor(rnd() * 3);
      const baseX = gx * CELL - CIDADE / 2;
      const baseY = gy * CELL - CIDADE / 2;

      // Distribuir predios dentro do quarteirao
      for (let i = 0; i < n; i++) {
        const w = 28 + Math.floor(rnd() * 28); // largura
        const d = 28 + Math.floor(rnd() * 28); // profundidade
        const px = baseX + 6 + rnd() * (QUARTEIRAO - w - 12);
        const py = baseY + 6 + rnd() * (QUARTEIRAO - d - 12);
        const h = 40 + Math.floor(rnd() * 120); // altura 40-160
        predios.push({ x: px, y: py, w, d, h });
      }
    }
  }

  // Carros parados em algumas ruas
  const carros: Carro[] = [];
  for (let i = 0; i < 7; i++) {
    const horizontal = rnd() > 0.5;
    const gx = Math.floor(rnd() * (GRID - 1));
    const gy = Math.floor(rnd() * (GRID - 1));
    const baseX = gx * CELL - CIDADE / 2 + QUARTEIRAO;
    const baseY = gy * CELL - CIDADE / 2 + QUARTEIRAO;
    carros.push({
      x: baseX + (horizontal ? rnd() * 30 - 15 : RUA / 2 - 4),
      y: baseY + (horizontal ? RUA / 2 - 3 : rnd() * 30 - 15),
      rot: horizontal ? 0 : 90,
      cor: rnd() > 0.5 ? "#2a2f26" : "#1d2018",
    });
  }

  // Faixas de cruzamento (apenas em alguns cruzamentos)
  const faixas: { x: number; y: number; horizontal: boolean }[] = [];
  for (let gx = 1; gx < GRID; gx++) {
    for (let gy = 1; gy < GRID; gy++) {
      if (rnd() > 0.55) {
        const cx = gx * CELL - CIDADE / 2 - RUA / 2;
        const cy = gy * CELL - CIDADE / 2 - RUA / 2;
        faixas.push({ x: cx, y: cy, horizontal: rnd() > 0.5 });
      }
    }
  }

  return { predios, carros, faixas };
}

// Marcadores fixos (curados para ficarem espalhados sobre os bens)
const PINOS: Pino[] = [
  { x: -CIDADE / 2 + CELL * 0.6, y: -CIDADE / 2 + CELL * 0.7, tipo: "imovel", penhoraConfirmada: true, label: "Imovel Sao Paulo" },
  { x: CIDADE / 2 - CELL * 0.7, y: -CIDADE / 2 + CELL * 0.6, tipo: "empresa", penhoraConfirmada: false, label: "Holding LTDA" },
  { x: 0, y: -CIDADE / 2 + CELL * 0.5, tipo: "veiculo", penhoraConfirmada: false, label: "BMW X5" },
  { x: -CIDADE / 2 + CELL * 1.5, y: 0, tipo: "imovel", penhoraConfirmada: true, label: "Galpao Logistico" },
  { x: CIDADE / 2 - CELL * 1.4, y: CELL * 0.3, tipo: "veiculo", penhoraConfirmada: true, label: "Frota Comercial" },
  { x: -CELL * 0.4, y: CIDADE / 2 - CELL * 0.8, tipo: "empresa", penhoraConfirmada: false, label: "Fintech" },
  { x: CELL * 1.2, y: CIDADE / 2 - CELL * 0.6, tipo: "imovel", penhoraConfirmada: false, label: "Cobertura" },
  { x: -CIDADE / 2 + CELL * 0.4, y: CELL * 1.0, tipo: "empresa", penhoraConfirmada: true, label: "Industria Quimica" },
];

export default function MapaCidadeA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [montado, setMontado] = useState(false);

  const { predios, carros, faixas } = useMemo(() => gerarCidade(), []);

  useEffect(() => {
    // Disparar animacao de entrada depois do paint inicial
    const t = setTimeout(() => setMontado(true), 60);
    return () => clearTimeout(t);
  }, []);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1; // -1..1
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    // clamp -10..10 (regra: x/4 sobre valor -10..10 nominal)
    const px = Math.max(-10, Math.min(10, nx * 10));
    const py = Math.max(-10, Math.min(10, ny * 10));
    setTilt({ x: px, y: py });
  }

  function onLeave() {
    setTilt({ x: 0, y: 0 });
  }

  // Variante A: camera mais alta (rotateX 58 / rotateZ -22)
  const baseRotX = 58;
  const baseRotZ = -22;
  const sceneTransform = montado
    ? `rotateX(${baseRotX + tilt.y / 4}deg) rotateZ(${baseRotZ + tilt.x / 4}deg)`
    : `rotateX(90deg) rotateZ(${baseRotZ}deg)`;
  const sceneOpacity = montado ? 1 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 600,
        position: "relative",
        perspective: 2000,
        perspectiveOrigin: "50% 45%",
        background: `radial-gradient(ellipse at center, ${ONYX_2} 0%, ${ONYX} 70%)`,
        overflow: "hidden",
        cursor: "grab",
      }}
    >
      {/* Vinheta superior — sensacao de luz vinda de cima */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, rgba(201,162,74,0.06) 0%, transparent 55%)`,
          pointerEvents: "none",
        }}
      />

      {/* Cena 3D */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: sceneTransform,
          opacity: sceneOpacity,
          transition:
            "transform 2500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 2500ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Chao (asfalto) */}
        <div
          style={{
            position: "absolute",
            width: CIDADE + 200,
            height: CIDADE + 200,
            left: -(CIDADE + 200) / 2,
            top: -(CIDADE + 200) / 2,
            background:
              `linear-gradient(135deg, ${ONYX_3} 0%, ${ONYX_2} 100%)`,
            transformStyle: "preserve-3d",
            boxShadow: `0 0 80px rgba(201,162,74,0.08) inset`,
          }}
        />

        {/* Quarteiroes (calcadas) */}
        {Array.from({ length: GRID }).map((_, gx) =>
          Array.from({ length: GRID }).map((_, gy) => {
            const x = gx * CELL - CIDADE / 2;
            const y = gy * CELL - CIDADE / 2;
            return (
              <div
                key={`bloco-${gx}-${gy}`}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: QUARTEIRAO,
                  height: QUARTEIRAO,
                  background: ONYX_3,
                  border: `0.5px solid rgba(201,162,74,0.08)`,
                  transform: "translateZ(0.5px)",
                }}
              />
            );
          })
        )}

        {/* Faixas de pedestre (cruzamentos) */}
        {faixas.map((f, i) => (
          <div
            key={`faixa-${i}`}
            style={{
              position: "absolute",
              left: f.x,
              top: f.y,
              width: f.horizontal ? RUA : 14,
              height: f.horizontal ? 14 : RUA,
              background: `repeating-linear-gradient(${
                f.horizontal ? "90deg" : "0deg"
              }, rgba(232,228,214,0.32) 0 3px, transparent 3px 6px)`,
              transform: "translateZ(1px)",
            }}
          />
        ))}

        {/* Carros (sombrinhas paradas nas ruas) */}
        {carros.map((c, i) => (
          <div
            key={`carro-${i}`}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: 10,
              height: 5,
              background: c.cor,
              transform: `translateZ(2px) rotate(${c.rot}deg)`,
              borderRadius: 1,
              boxShadow: `0 0 0 0.5px rgba(232,228,214,0.15)`,
            }}
          />
        ))}

        {/* Predios */}
        {predios.map((p, i) => (
          <Predio key={`predio-${i}`} predio={p} />
        ))}

        {/* Pinos marcadores */}
        {PINOS.map((pino, i) => (
          <PinoMarcador key={`pino-${i}`} pino={pino} />
        ))}
      </div>

      {/* HUD: legenda canto inferior */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          padding: "10px 14px",
          fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: IVORY,
          background: "rgba(10,12,11,0.55)",
          border: `0.5px solid rgba(201,162,74,0.25)`,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                background: GOLD,
                borderRadius: "50%",
                boxShadow: `0 0 6px ${GOLD}`,
              }}
            />
            Bem localizado
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                background: SIGNAL,
                borderRadius: "50%",
                boxShadow: `0 0 6px ${SIGNAL}`,
              }}
            />
            Penhora confirmada
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------- Subcomponentes ----------

function Predio({ predio }: { predio: Predio }) {
  const { x, y, w, d, h } = predio;
  // Cada face do predio em transformStyle preserve-3d
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: d,
        transformStyle: "preserve-3d",
        transform: `translateZ(${h / 2}px)`,
      }}
    >
      {/* Topo plano */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: ONYX_2,
          border: `0.5px solid rgba(60,255,138,0.20)`,
          transform: `translateZ(${h / 2}px)`,
        }}
      />
      {/* Base (sombra projetada) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          transform: `translateZ(${-h / 2}px)`,
          filter: "blur(2px)",
        }}
      />
      {/* Face Norte */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: w,
          height: h,
          background: `linear-gradient(180deg, ${ONYX_2} 0%, ${ONYX} 100%)`,
          border: `0.5px solid rgba(60,255,138,0.10)`,
          transformOrigin: "top center",
          transform: `rotateX(-90deg) translateY(${-h / 2}px) translateZ(${-d / 2}px)`,
        }}
      />
      {/* Face Sul */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: w,
          height: h,
          background: `linear-gradient(180deg, ${ONYX_3} 0%, ${ONYX} 100%)`,
          border: `0.5px solid rgba(60,255,138,0.10)`,
          transformOrigin: "top center",
          transform: `rotateX(-90deg) translateY(${-h / 2}px) translateZ(${d / 2}px)`,
        }}
      />
      {/* Face Leste */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: d,
          height: h,
          background: `linear-gradient(180deg, ${ONYX_3} 0%, ${ONYX_2} 100%)`,
          border: `0.5px solid rgba(60,255,138,0.10)`,
          transformOrigin: "top left",
          transform: `rotateY(90deg) translateX(${-d / 2}px) translateY(${-h / 2}px) translateZ(${w / 2}px)`,
        }}
      />
      {/* Face Oeste */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: d,
          height: h,
          background: `linear-gradient(180deg, ${ONYX_2} 0%, ${ONYX_3} 100%)`,
          border: `0.5px solid rgba(60,255,138,0.10)`,
          transformOrigin: "top left",
          transform: `rotateY(90deg) translateX(${-d / 2}px) translateY(${-h / 2}px) translateZ(${-w / 2}px)`,
        }}
      />
    </div>
  );
}

function PinoMarcador({ pino }: { pino: Pino }) {
  const ALTURA = 110; // pinos altos na variante A
  const corBase = pino.penhoraConfirmada ? SIGNAL : GOLD;

  return (
    <div
      style={{
        position: "absolute",
        left: pino.x,
        top: pino.y,
        transformStyle: "preserve-3d",
        // Animacao de subida do pino (atrasada apos a entrada da cena)
        animation: "sonar-pino-rise 1200ms cubic-bezier(0.16, 1, 0.3, 1) both",
        animationDelay: `${1800 + Math.random() * 400}ms`,
      }}
    >
      {/* Anel de base (no chao) */}
      <div
        style={{
          position: "absolute",
          width: 22,
          height: 22,
          left: -11,
          top: -11,
          borderRadius: "50%",
          border: `1px solid ${corBase}`,
          opacity: 0.65,
          boxShadow: `0 0 10px ${corBase}`,
          transform: "translateZ(0.5px)",
        }}
      />

      {/* Pulso (anel maior, pulsante) */}
      <div
        style={{
          position: "absolute",
          width: 22,
          height: 22,
          left: -11,
          top: -11,
          borderRadius: "50%",
          border: `1px solid ${corBase}`,
          transform: "translateZ(0.6px)",
          animation: "sonar-pino-pulse 2400ms ease-out infinite",
        }}
      />

      {/* Haste vertical */}
      <div
        style={{
          position: "absolute",
          width: 1.5,
          height: ALTURA,
          left: -0.75,
          top: -ALTURA,
          background: `linear-gradient(to top, transparent 0%, ${corBase} 40%, ${corBase} 100%)`,
          boxShadow: `0 0 4px ${corBase}`,
          // Coloca em pe: o div esta no plano da cidade; rotateX(-90) ergue
          transformOrigin: "bottom center",
          transform: `rotateX(-90deg)`,
        }}
      />

      {/* Emblema circular no topo */}
      <div
        style={{
          position: "absolute",
          width: 28,
          height: 28,
          left: -14,
          top: -14,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${corBase} 0%, ${
            pino.penhoraConfirmada ? "#1f8f4d" : "#7a5e22"
          } 100%)`,
          border: `1px solid ${corBase}`,
          boxShadow: `0 0 12px ${corBase}, 0 0 2px ${corBase} inset`,
          // Eleva o emblema na altura da haste, mantendo paralelo ao chao da cena
          transform: `translateZ(${ALTURA}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: ONYX,
          fontFamily: "var(--font-mono, ui-monospace, monospace)",
          fontWeight: 700,
        }}
      >
        {pino.penhoraConfirmada ? <CheckIcon /> : <TipoIcon tipo={pino.tipo} />}
      </div>

      <style jsx>{`
        @keyframes sonar-pino-rise {
          from {
            opacity: 0;
            transform: translateZ(-40px);
          }
          to {
            opacity: 1;
            transform: translateZ(0);
          }
        }
        @keyframes sonar-pino-pulse {
          0% {
            opacity: 0.8;
            width: 22px;
            height: 22px;
            left: -11px;
            top: -11px;
          }
          100% {
            opacity: 0;
            width: 70px;
            height: 70px;
            left: -35px;
            top: -35px;
          }
        }
      `}</style>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ONYX} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TipoIcon({ tipo }: { tipo: TipoBem }) {
  // Glifos minimalistas (sem dependencias)
  if (tipo === "veiculo") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ONYX} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17h14M5 17v-4l2-5h10l2 5v4M5 17v2M19 17v2" />
        <circle cx="8" cy="17" r="1.5" fill={ONYX} />
        <circle cx="16" cy="17" r="1.5" fill={ONYX} />
      </svg>
    );
  }
  if (tipo === "imovel") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ONYX} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-7 9 7v9H3z" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ONYX} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="14" />
      <path d="M4 10h16M9 6V4h6v2M9 14h2M13 14h2M9 17h2M13 17h2" />
    </svg>
  );
}
