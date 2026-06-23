"use client";

import { useEffect, useRef, useState } from "react";

/**
 * MapaCidadeB — variante "Bairro Brasileiro"
 * Cidade 3D isometrica em CSS transforms puros.
 * Inspiracao: ruas curvas de Pinheiros/Vila Madalena, mix de casas baixas
 * e predios medios, arvores estilizadas pontilhando os quarteiroes.
 */

type TipoBem = "veiculo" | "imovel" | "empresa";

type Pino = {
  id: string;
  /** posicao no palco em pixels (origem no centro). */
  x: number;
  y: number;
  tipo: TipoBem;
  altura: number;
  penhoraConfirmada: boolean;
  rotulo: string;
  valor: string;
};

const PINOS: Pino[] = [
  { id: "p1", x: -190, y: -150, tipo: "imovel", altura: 110, penhoraConfirmada: true, rotulo: "Casa Vila Madalena", valor: "R$ 1.2M" },
  { id: "p2", x: 60, y: -210, tipo: "empresa", altura: 120, penhoraConfirmada: false, rotulo: "Sede empresa", valor: "R$ 4.8M" },
  { id: "p3", x: 220, y: -90, tipo: "imovel", altura: 95, penhoraConfirmada: true, rotulo: "Sobrado Pinheiros", valor: "R$ 2.1M" },
  { id: "p4", x: -100, y: 30, tipo: "veiculo", altura: 80, penhoraConfirmada: false, rotulo: "BMW X5", valor: "R$ 380k" },
  { id: "p5", x: 130, y: 80, tipo: "imovel", altura: 115, penhoraConfirmada: true, rotulo: "Apto Comercial", valor: "R$ 3.4M" },
  { id: "p6", x: -210, y: 180, tipo: "empresa", altura: 100, penhoraConfirmada: false, rotulo: "Filial", valor: "R$ 1.9M" },
  { id: "p7", x: 30, y: 220, tipo: "veiculo", altura: 85, penhoraConfirmada: true, rotulo: "Range Rover", valor: "R$ 520k" },
];

const ONYX = "#0A0C0B";
const GOLD = "#C9A24A";
const SIGNAL = "#3CFF8A";
const IVORY = "#E8E4D6";

// Casas baixas (cubos pequenos) — coordenadas no plano da cidade
const CASAS = [
  { x: -270, y: -110, w: 42, d: 38, h: 30, gold: false },
  { x: -210, y: -60, w: 38, d: 36, h: 28, gold: true },
  { x: -130, y: -80, w: 44, d: 40, h: 32, gold: false },
  { x: -50, y: -150, w: 40, d: 38, h: 30, gold: false },
  { x: 10, y: -100, w: 36, d: 38, h: 26, gold: false },
  { x: 150, y: -180, w: 42, d: 38, h: 30, gold: true },
  { x: 280, y: -40, w: 38, d: 36, h: 28, gold: false },
  { x: -260, y: 40, w: 40, d: 40, h: 32, gold: false },
  { x: -160, y: 80, w: 44, d: 38, h: 30, gold: true },
  { x: -50, y: 110, w: 38, d: 36, h: 28, gold: false },
  { x: 70, y: 150, w: 42, d: 40, h: 30, gold: false },
  { x: 200, y: 180, w: 38, d: 38, h: 28, gold: true },
  { x: 290, y: 110, w: 40, d: 36, h: 30, gold: false },
  { x: -290, y: 220, w: 36, d: 38, h: 26, gold: false },
];

// Predios medios (4-6) — alturas variadas
const PREDIOS = [
  { x: -180, y: -170, w: 56, d: 50, h: 95 },
  { x: 70, y: -230, w: 60, d: 54, h: 110 },
  { x: 220, y: -110, w: 52, d: 52, h: 82 },
  { x: 130, y: 60, w: 64, d: 56, h: 100 },
  { x: -200, y: 170, w: 54, d: 50, h: 88 },
  { x: 30, y: 200, w: 58, d: 54, h: 75 },
];

// Arvores — circulo verde + haste fina (triangulos sao pequenos triangulos no chao)
const ARVORES = [
  { x: -100, y: -40 },
  { x: 100, y: -50 },
  { x: -30, y: 60 },
  { x: 230, y: 30 },
];

function PinoIcone({ tipo }: { tipo: TipoBem }) {
  // emblema circular ~28px com icone interno
  if (tipo === "veiculo") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M3 13l2-5h14l2 5v5h-2v2h-3v-2H8v2H5v-2H3v-5z" stroke={ONYX} strokeWidth="2" fill={ONYX} />
        <circle cx="7.5" cy="16" r="1.5" fill={IVORY} />
        <circle cx="16.5" cy="16" r="1.5" fill={IVORY} />
      </svg>
    );
  }
  if (tipo === "empresa") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="18" stroke={ONYX} strokeWidth="2" fill={ONYX} />
        <rect x="7" y="6" width="2" height="2" fill={IVORY} />
        <rect x="11" y="6" width="2" height="2" fill={IVORY} />
        <rect x="15" y="6" width="2" height="2" fill={IVORY} />
        <rect x="7" y="11" width="2" height="2" fill={IVORY} />
        <rect x="11" y="11" width="2" height="2" fill={IVORY} />
        <rect x="15" y="11" width="2" height="2" fill={IVORY} />
        <rect x="10" y="16" width="4" height="5" fill={IVORY} />
      </svg>
    );
  }
  // imovel
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M3 11L12 3l9 8v10H3V11z" stroke={ONYX} strokeWidth="2" fill={ONYX} strokeLinejoin="round" />
      <rect x="10" y="14" width="4" height="7" fill={IVORY} />
    </svg>
  );
}

function Casa({ x, y, w, d, h, gold }: { x: number; y: number; w: number; d: number; h: number; gold: boolean }) {
  const fachada = ONYX;
  const topo = "#161A18";
  const lateral = "#0E1110";
  const janela = gold ? GOLD : "#1f231f";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        transformStyle: "preserve-3d",
        width: w,
        height: d,
      }}
    >
      {/* base/chao da casa */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #11140F 0%, #0A0C0B 100%)",
          border: "1px solid rgba(201,162,74,0.08)",
        }}
      />
      {/* frente */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: d - 1,
          width: w,
          height: h,
          background: fachada,
          transform: `rotateX(-90deg)`,
          transformOrigin: "top center",
          borderTop: `1px solid ${GOLD}30`,
        }}
      >
        {/* janelinha */}
        <div
          style={{
            position: "absolute",
            left: w / 2 - 4,
            top: h / 2 - 4,
            width: 8,
            height: 6,
            background: janela,
            boxShadow: gold ? `0 0 6px ${GOLD}` : "none",
          }}
        />
      </div>
      {/* lateral direita */}
      <div
        style={{
          position: "absolute",
          left: w,
          top: 0,
          width: h,
          height: d,
          background: lateral,
          transform: `rotateY(90deg)`,
          transformOrigin: "left center",
          borderLeft: `1px solid ${GOLD}20`,
        }}
      />
      {/* telhado plano */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: topo,
          transform: `translateZ(${h}px)`,
          border: `1px solid ${GOLD}25`,
        }}
      />
    </div>
  );
}

function Predio({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  const linhas = Math.floor(h / 14);
  const colunas = Math.max(2, Math.floor(w / 12));
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        transformStyle: "preserve-3d",
        width: w,
        height: d,
      }}
    >
      {/* frente */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: d - 1,
          width: w,
          height: h,
          background: `linear-gradient(180deg, #0E1110 0%, ${ONYX} 100%)`,
          transform: `rotateX(-90deg)`,
          transformOrigin: "top center",
          border: `1px solid ${GOLD}30`,
          display: "grid",
          gridTemplateColumns: `repeat(${colunas}, 1fr)`,
          gridTemplateRows: `repeat(${linhas}, 1fr)`,
          padding: 4,
          gap: 3,
        }}
      >
        {Array.from({ length: linhas * colunas }).map((_, i) => {
          const aceso = (i * 37) % 9 < 2;
          return (
            <div
              key={i}
              style={{
                background: aceso ? GOLD : "#1A1E1B",
                opacity: aceso ? 0.55 : 0.7,
                boxShadow: aceso ? `0 0 4px ${GOLD}` : "none",
              }}
            />
          );
        })}
      </div>
      {/* lateral */}
      <div
        style={{
          position: "absolute",
          left: w,
          top: 0,
          width: h,
          height: d,
          background: "#0B0E0C",
          transform: `rotateY(90deg)`,
          transformOrigin: "left center",
          borderLeft: `1px solid ${GOLD}20`,
        }}
      />
      {/* topo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#15191680",
          transform: `translateZ(${h}px)`,
          border: `1px solid ${GOLD}40`,
          boxShadow: `inset 0 0 12px ${GOLD}20`,
        }}
      />
    </div>
  );
}

function Arvore({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* tronco fino + triangulo no chao */}
      <div
        style={{
          position: "absolute",
          width: 2,
          height: 22,
          background: "#3a2a1a",
          transform: `rotateX(-90deg) translateY(-22px)`,
          transformOrigin: "top center",
          left: -1,
          top: 0,
        }}
      />
      {/* copa — circulo verde */}
      <div
        style={{
          position: "absolute",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 30%, #5fd07a 0%, #2a8c45 60%, #1a5c2d 100%)",
          boxShadow: "0 0 6px rgba(60,255,138,0.35)",
          transform: "translateZ(28px) translate(-9px, -9px)",
          border: `1px solid ${GOLD}25`,
        }}
      />
    </div>
  );
}

function Pino({ pino }: { pino: Pino }) {
  const cor = pino.penhoraConfirmada ? SIGNAL : GOLD;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate3d(${pino.x}px, ${pino.y}px, 0)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* haste vertical */}
      <div
        style={{
          position: "absolute",
          width: 2,
          height: pino.altura,
          background: `linear-gradient(180deg, ${cor} 0%, ${cor}40 100%)`,
          transform: `rotateX(-90deg) translateY(-${pino.altura}px)`,
          transformOrigin: "top center",
          left: -1,
          top: 0,
          boxShadow: `0 0 6px ${cor}80`,
        }}
      />
      {/* base luminosa no chao */}
      <div
        style={{
          position: "absolute",
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${cor}60 0%, transparent 70%)`,
          left: -8,
          top: -8,
        }}
      />
      {/* emblema circular no topo */}
      <div
        style={{
          position: "absolute",
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: cor,
          border: `2px solid ${ONYX}`,
          boxShadow: `0 0 12px ${cor}, 0 2px 4px rgba(0,0,0,0.5)`,
          transform: `translateZ(${pino.altura + 14}px) translate(-14px, -14px) rotateX(-55deg) rotateZ(25deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {pino.penhoraConfirmada ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke={ONYX} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <PinoIcone tipo={pino.tipo} />
        )}
      </div>
    </div>
  );
}

export default function MapaCidadeB() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMontado(true), 50);
    return () => clearTimeout(t);
  }, []);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1..1
    const py = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v)) * 10;
    setParallax({ x: clamp(px), y: clamp(py) });
  }

  function onLeave() {
    setParallax({ x: 0, y: 0 });
  }

  const rotX = montado ? 54 + parallax.y / 4 : 90;
  const rotZ = montado ? -26 + parallax.x / 4 : -26;
  const opacity = montado ? 1 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 600,
        background: `radial-gradient(ellipse at 50% 60%, #11140F 0%, ${ONYX} 70%, #050706 100%)`,
        perspective: "2000px",
        overflow: "hidden",
        cursor: "grab",
      }}
    >
      {/* halo de horizonte */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "55%",
          width: 900,
          height: 200,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(ellipse, ${GOLD}10 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      {/* CENA */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `translate(-50%, -50%) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
          transition: "transform 2.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 2.5s cubic-bezier(0.16, 1, 0.3, 1)",
          opacity,
        }}
      >
        {/* PLATAFORMA / CHAO */}
        <div
          style={{
            position: "absolute",
            width: 820,
            height: 620,
            left: -410,
            top: -310,
            background: `
              linear-gradient(135deg, #0E1110 0%, ${ONYX} 100%)
            `,
            border: `1px solid ${GOLD}40`,
            boxShadow: `0 0 60px ${GOLD}15, inset 0 0 40px rgba(0,0,0,0.6)`,
          }}
        >
          {/* grid sutil */}
          <svg width="820" height="620" style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
            <defs>
              <pattern id="gridB" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={GOLD} strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="820" height="620" fill="url(#gridB)" />
          </svg>

          {/* RUA CURVA — SVG vetorial atravessando a cena */}
          <svg
            width="820"
            height="620"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            viewBox="0 0 820 620"
          >
            <defs>
              <linearGradient id="ruaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1a1d1a" stopOpacity="0" />
                <stop offset="15%" stopColor="#2a2d2a" stopOpacity="1" />
                <stop offset="85%" stopColor="#2a2d2a" stopOpacity="1" />
                <stop offset="100%" stopColor="#1a1d1a" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* asfalto curvo */}
            <path
              d="M 0 380 C 200 280, 350 480, 500 360 S 720 220, 820 280"
              stroke="url(#ruaGrad)"
              strokeWidth="32"
              fill="none"
              strokeLinecap="round"
            />
            {/* faixa central tracejada */}
            <path
              d="M 0 380 C 200 280, 350 480, 500 360 S 720 220, 820 280"
              stroke={GOLD}
              strokeWidth="1"
              fill="none"
              strokeDasharray="6 10"
              opacity="0.45"
            />
            {/* rua secundaria */}
            <path
              d="M 410 0 C 380 150, 460 300, 420 620"
              stroke="#252825"
              strokeWidth="22"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>

          {/* CASAS BAIXAS */}
          {CASAS.map((c, i) => (
            <Casa key={`c${i}`} {...c} />
          ))}

          {/* PREDIOS MEDIOS */}
          {PREDIOS.map((p, i) => (
            <Predio key={`pr${i}`} {...p} />
          ))}

          {/* ARVORES */}
          {ARVORES.map((a, i) => (
            <Arvore key={`a${i}`} {...a} />
          ))}

          {/* PINOS / MARCADORES */}
          {PINOS.map((p) => (
            <Pino key={p.id} pino={p} />
          ))}
        </div>
      </div>

      {/* legenda flutuante */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 12,
          letterSpacing: "0.05em",
          color: IVORY,
          textTransform: "uppercase",
          opacity: 0.7,
          lineHeight: 1.8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: SIGNAL, boxShadow: `0 0 8px ${SIGNAL}` }} />
          Penhora confirmada
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px ${GOLD}` }} />
          Bem identificado
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11,
          letterSpacing: "0.08em",
          color: GOLD,
          textTransform: "uppercase",
          opacity: 0.5,
        }}
      >
        Bairro Pinheiros / SP
      </div>
    </div>
  );
}
