"use client";

/**
 * MapaCidadeC — Variante C: Radar Wireframe Sci-fi
 *
 * Estetica de simulacao militar/financeira: paralelepipedos transparentes
 * em vidro, grade hexagonal no chao e um sweep de radar que varre a cena
 * em loop. Marcadores pinos finos com anel signal vazio (penhora aguardando)
 * ou solido (penhora confirmada).
 */

import { useEffect, useMemo, useRef, useState } from "react";

// -----------------------------------------------------------------------------
// Tipos
// -----------------------------------------------------------------------------

type TipoBem = "veiculo" | "imovel" | "empresa";

interface Bem {
  id: string;
  x: number; // -250..250 (centro do palco)
  y: number; // -250..250
  w: number; // largura
  d: number; // profundidade
  h: number; // altura do paralelepipedo
  tipo: TipoBem;
}

interface Pino {
  id: string;
  bemId: string; // a qual bem ele se ancora
  altura: number; // comprimento da haste em px
  tipo: TipoBem;
  penhoraConfirmada: boolean;
  rotuloSecundario?: string;
}

// -----------------------------------------------------------------------------
// Dados da "cidade" (12 bens, 7 pinos)
// -----------------------------------------------------------------------------

const BENS: Bem[] = [
  // Anel central — 4 quadras
  { id: "b1", x: -90, y: -90, w: 70, d: 70, h: 72, tipo: "imovel" },
  { id: "b2", x: 30, y: -90, w: 60, d: 70, h: 110, tipo: "empresa" },
  { id: "b3", x: -90, y: 30, w: 70, d: 60, h: 50, tipo: "imovel" },
  { id: "b4", x: 30, y: 30, w: 60, d: 60, h: 88, tipo: "empresa" },
  // Anel externo
  { id: "b5", x: -200, y: -180, w: 80, d: 80, h: 62, tipo: "imovel" },
  { id: "b6", x: 140, y: -200, w: 90, d: 70, h: 130, tipo: "empresa" },
  { id: "b7", x: 170, y: 130, w: 70, d: 90, h: 76, tipo: "imovel" },
  { id: "b8", x: -190, y: 150, w: 80, d: 70, h: 42, tipo: "veiculo" },
  // Espalhados
  { id: "b9", x: -30, y: -210, w: 50, d: 40, h: 30, tipo: "veiculo" },
  { id: "b10", x: 230, y: -20, w: 40, d: 60, h: 36, tipo: "veiculo" },
  { id: "b11", x: -240, y: 40, w: 50, d: 50, h: 24, tipo: "veiculo" },
  { id: "b12", x: 80, y: 220, w: 90, d: 50, h: 58, tipo: "imovel" },
];

const PINOS: Pino[] = [
  { id: "p1", bemId: "b2", altura: 110, tipo: "empresa", penhoraConfirmada: true, rotuloSecundario: "Holding" },
  { id: "p2", bemId: "b6", altura: 130, tipo: "empresa", penhoraConfirmada: true, rotuloSecundario: "Matriz" },
  { id: "p3", bemId: "b1", altura: 92, tipo: "imovel", penhoraConfirmada: false },
  { id: "p4", bemId: "b7", altura: 98, tipo: "imovel", penhoraConfirmada: true },
  { id: "p5", bemId: "b10", altura: 78, tipo: "veiculo", penhoraConfirmada: false },
  { id: "p6", bemId: "b8", altura: 70, tipo: "veiculo", penhoraConfirmada: true },
  { id: "p7", bemId: "b12", altura: 90, tipo: "imovel", penhoraConfirmada: false },
];

// -----------------------------------------------------------------------------
// Componente
// -----------------------------------------------------------------------------

export default function MapaCidadeC() {
  const palcoRef = useRef<HTMLDivElement>(null);
  const [pll, setPll] = useState({ x: 0, y: 0 }); // parallax delta
  const [montado, setMontado] = useState(false);

  // Entrada: rotateX(90) opacity 0 -> camera baixa
  useEffect(() => {
    const t = window.setTimeout(() => setMontado(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!palcoRef.current) return;
    const r = palcoRef.current.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
    const cy = (e.clientY - r.top) / r.height - 0.5;
    const clamp = (n: number) => Math.max(-10, Math.min(10, n));
    setPll({ x: clamp(cx * 20), y: clamp(cy * 20) });
  }

  function onLeave() {
    setPll({ x: 0, y: 0 });
  }

  // Camera baixa elegante: rotateX(60) rotateZ(-20)
  const rotX = montado ? 60 + pll.y / 4 : 90;
  const rotZ = montado ? -20 + pll.x / 4 : -20;
  const opacity = montado ? 1 : 0;

  // Lookup bens por id (pinos sao ancorados)
  const bemMap = useMemo(() => {
    const m = new Map<string, Bem>();
    for (const b of BENS) m.set(b.id, b);
    return m;
  }, []);

  return (
    <div
      ref={palcoRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at center, #0E1110 0%, #0A0C0B 65%, #060807 100%)",
        overflow: "hidden",
        perspective: "2000px",
        perspectiveOrigin: "50% 60%",
      }}
    >
      {/* HUD canto: legenda discreta */}
      <Hud />

      {/* Vinheta scanlines suaves */}
      <Scanlines />

      {/* Cena 3D */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "52%",
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `translate(-50%, -50%) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
          transition:
            "transform 2500ms cubic-bezier(0.16, 1, 0.3, 1), opacity 2200ms cubic-bezier(0.16, 1, 0.3, 1)",
          opacity,
        }}
      >
        {/* Chao: grade hexagonal */}
        <ChaoHex />

        {/* Aneis concentricos do radar (estaticos, suaves) */}
        <AneisRadar />

        {/* Sweep de radar — rotaciona em Z na propria cena */}
        <SweepRadar />

        {/* Bens — paralelepipedos wireframe */}
        {BENS.map((b) => (
          <BemWireframe key={b.id} bem={b} />
        ))}

        {/* Pinos */}
        {PINOS.map((p) => {
          const b = bemMap.get(p.bemId);
          if (!b) return null;
          // Centro do topo do bem
          const cx = b.x + b.w / 2 - b.w / 2; // sem offset (origem ja e o centro)
          const cy = b.y + b.d / 2 - b.d / 2;
          return (
            <PinoRadar
              key={p.id}
              x={b.x}
              y={b.y}
              baseZ={b.h}
              pino={p}
            />
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Chao hexagonal
// -----------------------------------------------------------------------------

function ChaoHex() {
  // Padrao hexagonal via SVG inline pra max nitidez
  const size = 1200;
  const hexR = 22; // raio do hex
  const hexW = Math.sqrt(3) * hexR; // largura
  const hexH = 2 * hexR; // altura
  const horizSpacing = hexW;
  const vertSpacing = hexH * 0.75;

  const cols = Math.ceil(size / horizSpacing) + 2;
  const rows = Math.ceil(size / vertSpacing) + 2;

  const linhas: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offsetX = (r % 2) * (horizSpacing / 2);
      const cx = c * horizSpacing + offsetX - size / 2;
      const cy = r * vertSpacing - size / 2;
      // hex apontado pra cima
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const px = cx + hexR * Math.cos(a);
        const py = cy + hexR * Math.sin(a);
        pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
      }
      linhas.push(pts.join(" "));
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        left: -size / 2,
        top: -size / 2,
        width: size,
        height: size,
        transform: "translateZ(0)",
        pointerEvents: "none",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.45,
          maskImage:
            "radial-gradient(ellipse 55% 55% at 50% 50%, #000 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 55% 55% at 50% 50%, #000 30%, transparent 85%)",
        }}
      >
        <g
          stroke="#E8E4D6"
          strokeOpacity="0.12"
          strokeWidth="0.6"
          fill="none"
        >
          {linhas.map((pts, i) => (
            <polygon key={i} points={pts} />
          ))}
        </g>
        {/* Cruz central de referencia */}
        <g stroke="#C9A24A" strokeOpacity="0.25" strokeWidth="0.8">
          <line x1={-size / 2} y1="0" x2={size / 2} y2="0" />
          <line x1="0" y1={-size / 2} x2="0" y2={size / 2} />
        </g>
      </svg>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Aneis concentricos
// -----------------------------------------------------------------------------

function AneisRadar() {
  const raios = [120, 220, 320, 440];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        pointerEvents: "none",
        transform: "translateZ(0.5px)", // levemente acima do chao
      }}
    >
      <svg
        width="1200"
        height="1200"
        viewBox="-600 -600 1200 1200"
        style={{
          position: "absolute",
          left: -600,
          top: -600,
        }}
      >
        {raios.map((r, i) => (
          <circle
            key={i}
            cx="0"
            cy="0"
            r={r}
            fill="none"
            stroke="#3CFF8A"
            strokeOpacity={0.08 + (3 - i) * 0.02}
            strokeWidth="0.8"
            strokeDasharray="4 6"
          />
        ))}
      </svg>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sweep de radar
// -----------------------------------------------------------------------------

function SweepRadar() {
  return (
    <>
      <style>{`
        @keyframes sonarSweep {
          0%   { transform: translateZ(1px) rotate(0deg); }
          100% { transform: translateZ(1px) rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          left: -500,
          top: -500,
          width: 1000,
          height: 1000,
          pointerEvents: "none",
          animation: "sonarSweep 7s linear infinite",
          transformOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            // Conic gradient: feixe radial signal -> transparente
            background:
              "conic-gradient(from 0deg, rgba(60,255,138,0) 0deg, rgba(60,255,138,0.28) 18deg, rgba(60,255,138,0.18) 36deg, rgba(60,255,138,0) 60deg, rgba(60,255,138,0) 360deg)",
            borderRadius: "50%",
            maskImage:
              "radial-gradient(circle at center, #000 0%, #000 48%, transparent 50%)",
            WebkitMaskImage:
              "radial-gradient(circle at center, #000 0%, #000 48%, transparent 50%)",
            filter: "blur(0.3px)",
          }}
        />
        {/* Linha viva do sweep (a "agulha" do radar) */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 500,
            height: 1,
            background:
              "linear-gradient(to right, rgba(60,255,138,0.9) 0%, rgba(60,255,138,0.4) 60%, rgba(60,255,138,0) 100%)",
            transformOrigin: "0% 50%",
            boxShadow: "0 0 6px rgba(60,255,138,0.6)",
          }}
        />
      </div>
    </>
  );
}

// -----------------------------------------------------------------------------
// Paralelepipedo wireframe (apenas arestas + vidro fume)
// -----------------------------------------------------------------------------

function BemWireframe({ bem }: { bem: Bem }) {
  const { x, y, w, d, h } = bem;
  const fill = "rgba(0, 0, 0, 0.40)";
  const stroke = "rgba(60, 255, 138, 0.25)";
  const strokeTopo = "rgba(60, 255, 138, 0.42)"; // topo um pouco mais visivel

  // Posicionamos no chao em x/y (centro do palco); cada face e um div absoluto
  const faceCommon: React.CSSProperties = {
    position: "absolute",
    background: fill,
    border: `1px solid ${stroke}`,
    boxShadow: "inset 0 0 12px rgba(60,255,138,0.05)",
    backfaceVisibility: "hidden",
  };

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: d,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Topo */}
      <div
        style={{
          ...faceCommon,
          width: w,
          height: d,
          border: `1px solid ${strokeTopo}`,
          background: "rgba(60,255,138,0.04)",
          transform: `translateZ(${h}px)`,
        }}
      />
      {/* Frente (y = 0) */}
      <div
        style={{
          ...faceCommon,
          width: w,
          height: h,
          transformOrigin: "0% 0%",
          transform: `rotateX(90deg) translateZ(0px)`,
        }}
      />
      {/* Tras (y = d) */}
      <div
        style={{
          ...faceCommon,
          width: w,
          height: h,
          transformOrigin: "0% 0%",
          transform: `translateY(${d}px) rotateX(90deg) translateZ(0px)`,
        }}
      />
      {/* Esquerda (x = 0) */}
      <div
        style={{
          ...faceCommon,
          width: d,
          height: h,
          transformOrigin: "0% 0%",
          transform: `rotateY(-90deg) rotateX(90deg) translateZ(0px)`,
        }}
      />
      {/* Direita (x = w) */}
      <div
        style={{
          ...faceCommon,
          width: d,
          height: h,
          transformOrigin: "0% 0%",
          transform: `translateX(${w}px) rotateY(-90deg) rotateX(90deg) translateZ(0px)`,
        }}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Pino radar: haste fina + anel signal (vazio ou solido)
// -----------------------------------------------------------------------------

function PinoRadar({
  x,
  y,
  baseZ,
  pino,
}: {
  x: number;
  y: number;
  baseZ: number;
  pino: Pino;
}) {
  const confirmado = pino.penhoraConfirmada;
  const anelTamanho = 28; // px
  const corHaste = "rgba(60, 255, 138, 0.85)";
  const corAnel = "#3CFF8A";

  return (
    <div
      style={{
        position: "absolute",
        left: x + 16, // levemente off-center do bem pra ficar elegante
        top: y + 16,
        transformStyle: "preserve-3d",
        pointerEvents: "none",
      }}
    >
      {/* Haste vertical: usamos um div fino rotacionado em X pra subir em Z */}
      <div
        style={{
          position: "absolute",
          width: 1,
          height: pino.altura,
          left: 0,
          top: 0,
          background: `linear-gradient(to top, rgba(60,255,138,0) 0%, ${corHaste} 30%, ${corHaste} 100%)`,
          transformOrigin: "0% 0%",
          transform: `translateZ(${baseZ}px) rotateX(-90deg)`,
          boxShadow: "0 0 4px rgba(60,255,138,0.5)",
        }}
      />

      {/* Emblema no topo — anel vazio (pendente) ou solido (confirmado) */}
      <div
        style={{
          position: "absolute",
          width: anelTamanho,
          height: anelTamanho,
          left: -anelTamanho / 2,
          top: -anelTamanho / 2,
          transform: `translateZ(${baseZ + pino.altura}px)`,
          // billboard simples: o conteudo dentro contra-rotaciona pra ficar legivel
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `1.5px solid ${corAnel}`,
            background: confirmado
              ? "radial-gradient(circle, rgba(60,255,138,0.85) 0%, rgba(60,255,138,0.55) 60%, rgba(60,255,138,0.35) 100%)"
              : "rgba(60,255,138,0.08)",
            boxShadow: confirmado
              ? "0 0 14px rgba(60,255,138,0.7), 0 0 4px rgba(60,255,138,0.9) inset"
              : "0 0 10px rgba(60,255,138,0.35)",
            position: "relative",
          }}
        >
          {/* mini-cruz central só nos confirmados (subtle) */}
          {confirmado && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                lineHeight: 1,
                color: "#0A0C0B",
                fontFamily: "ui-monospace, Menlo, monospace",
                fontWeight: 700,
              }}
            >
              {iconePorTipo(pino.tipo)}
            </div>
          )}
          {!confirmado && (
            <PulsePing />
          )}
        </div>
      </div>
    </div>
  );
}

function PulsePing() {
  return (
    <>
      <style>{`
        @keyframes sonarPing {
          0%   { transform: scale(1); opacity: 0.7; }
          80%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
      <div
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: "50%",
          border: "1px solid rgba(60,255,138,0.7)",
          animation: "sonarPing 2.2s ease-out infinite",
        }}
      />
    </>
  );
}

function iconePorTipo(t: TipoBem) {
  if (t === "veiculo") return "V";
  if (t === "imovel") return "I";
  return "E";
}

// -----------------------------------------------------------------------------
// HUD canto: titulo curto + legenda discreta
// -----------------------------------------------------------------------------

function Hud() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 4,
        color: "#E8E4D6",
        fontFamily: "ui-monospace, Menlo, monospace",
      }}
    >
      {/* Canto superior esquerdo */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 22,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          fontSize: 12,
          opacity: 0.85,
        }}
      >
        <div style={{ color: "#3CFF8A" }}>SONAR · WIRE-RADAR</div>
        <div style={{ opacity: 0.55, marginTop: 4 }}>
          Varredura Patrimonial · Tempo Real
        </div>
      </div>

      {/* Canto superior direito — status do sweep */}
      <div
        style={{
          position: "absolute",
          right: 24,
          top: 22,
          textAlign: "right",
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        <div style={{ color: "#C9A24A" }}>// SCAN ATIVO</div>
        <div style={{ opacity: 0.45, marginTop: 4 }}>RAIO 480M · 360 GRAUS</div>
      </div>

      {/* Canto inferior esquerdo — legenda */}
      <div
        style={{
          position: "absolute",
          left: 24,
          bottom: 22,
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.85,
          display: "flex",
          gap: 18,
          alignItems: "center",
        }}
      >
        <LegendaItem confirmado label="Penhora confirmada" />
        <LegendaItem confirmado={false} label="Aguardando" />
      </div>

      {/* Canto inferior direito — coords ficticias */}
      <div
        style={{
          position: "absolute",
          right: 24,
          bottom: 22,
          fontSize: 10,
          letterSpacing: "0.14em",
          opacity: 0.4,
          textAlign: "right",
        }}
      >
        LAT -22.9068 · LON -43.1729
      </div>
    </div>
  );
}

function LegendaItem({
  confirmado,
  label,
}: {
  confirmado: boolean;
  label: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          border: "1.5px solid #3CFF8A",
          background: confirmado ? "#3CFF8A" : "rgba(60,255,138,0.08)",
          boxShadow: confirmado
            ? "0 0 8px rgba(60,255,138,0.7)"
            : "0 0 6px rgba(60,255,138,0.3)",
        }}
      />
      <span>{label}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Scanlines (vinheta sutil)
// -----------------------------------------------------------------------------

function Scanlines() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 3,
        background:
          "repeating-linear-gradient(to bottom, rgba(232,228,214,0.025) 0px, rgba(232,228,214,0.025) 1px, transparent 1px, transparent 3px)",
        mixBlendMode: "screen",
        opacity: 0.6,
      }}
    />
  );
}
