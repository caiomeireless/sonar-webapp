"use client";

// Overlay (modal) de drill-down de um estado clicado no MapaDistribuicaoBens.
// Mostra o contorno do estado focado em escala ampliada, com pinos verdes nas
// coordenadas das principais cidades e uma lista lateral com cidade + qtd +
// valor. Renderiza via createPortal pra escapar de qualquer ancestral com
// backdrop-filter (regra aprendida: position:fixed fica confinado nesses
// contextos).
//
// Coordenadas das cidades sao projetadas no SVG usando como ancora o
// centroide da UF (cx/cy de BR_STATES). A projecao e equirectangular local:
// 1° lon ~= 1° lat ~= ~25 px nesta escala. Aproximacao suficiente pra
// posicionar pinos com diferenca visual clara entre capitais e cidades do
// interior.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { BR_STATES } from "@/lib/br-geo";
import { formatBRL } from "@/lib/format";

// ---------- Coordenadas medias (lat, lon) por UF -------------------------
// Centroides aproximados das UFs em graus decimais. Usados em conjunto com
// (cx, cy) de BR_STATES pra projetar latitude/longitude no SVG.
const UF_LATLON: Record<string, { lat: number; lon: number }> = {
  AC: { lat: -9.0, lon: -70.0 },
  AL: { lat: -9.5, lon: -36.6 },
  AP: { lat: 1.0, lon: -52.0 },
  AM: { lat: -4.5, lon: -63.5 },
  BA: { lat: -12.5, lon: -41.7 },
  CE: { lat: -5.5, lon: -39.5 },
  DF: { lat: -15.8, lon: -47.9 },
  ES: { lat: -19.5, lon: -40.7 },
  GO: { lat: -16.0, lon: -49.5 },
  MA: { lat: -5.5, lon: -45.5 },
  MT: { lat: -13.0, lon: -56.0 },
  MS: { lat: -20.5, lon: -54.5 },
  MG: { lat: -18.0, lon: -44.5 },
  PA: { lat: -4.0, lon: -52.5 },
  PB: { lat: -7.2, lon: -36.7 },
  PR: { lat: -25.0, lon: -51.5 },
  PE: { lat: -8.5, lon: -38.0 },
  PI: { lat: -7.5, lon: -42.5 },
  RJ: { lat: -22.3, lon: -42.7 },
  RN: { lat: -5.8, lon: -36.5 },
  RS: { lat: -30.1, lon: -53.5 },
  RO: { lat: -10.9, lon: -63.0 },
  RR: { lat: 2.0, lon: -61.5 },
  SC: { lat: -27.0, lon: -50.5 },
  SP: { lat: -22.2, lon: -48.6 },
  SE: { lat: -10.6, lon: -37.4 },
  TO: { lat: -10.0, lon: -48.5 },
};

// ---------- Catalogo de cidades conhecidas (lat, lon) --------------------
// Usado quando a cidade vinda dos dados bate por nome aproximado. Pra
// cidades nao mapeadas, gera offset deterministico a partir do hash do nome
// (assim a posicao do pino fica estavel entre re-renders).
const CIDADES_CONHECIDAS: Record<string, { lat: number; lon: number }> = {
  // SP
  "sao paulo": { lat: -23.55, lon: -46.63 },
  "campinas": { lat: -22.91, lon: -47.06 },
  "sorocaba": { lat: -23.5, lon: -47.45 },
  "santos": { lat: -23.96, lon: -46.33 },
  "ribeirao preto": { lat: -21.18, lon: -47.81 },
  "sao jose dos campos": { lat: -23.18, lon: -45.88 },
  "guarulhos": { lat: -23.46, lon: -46.53 },
  "osasco": { lat: -23.53, lon: -46.79 },
  // RJ
  "rio de janeiro": { lat: -22.91, lon: -43.17 },
  "niteroi": { lat: -22.88, lon: -43.1 },
  "volta redonda": { lat: -22.52, lon: -44.1 },
  "petropolis": { lat: -22.5, lon: -43.18 },
  "nova iguacu": { lat: -22.76, lon: -43.45 },
  // MG
  "belo horizonte": { lat: -19.92, lon: -43.94 },
  "uberlandia": { lat: -18.91, lon: -48.27 },
  "contagem": { lat: -19.93, lon: -44.05 },
  "juiz de fora": { lat: -21.76, lon: -43.35 },
  // BA
  "salvador": { lat: -12.97, lon: -38.5 },
  "feira de santana": { lat: -12.27, lon: -38.97 },
  "vitoria da conquista": { lat: -14.86, lon: -40.84 },
  // PR
  "curitiba": { lat: -25.42, lon: -49.27 },
  "londrina": { lat: -23.31, lon: -51.16 },
  "maringa": { lat: -23.42, lon: -51.93 },
  // RS
  "porto alegre": { lat: -30.03, lon: -51.23 },
  "caxias do sul": { lat: -29.17, lon: -51.18 },
  "pelotas": { lat: -31.77, lon: -52.34 },
  // DF
  "brasilia": { lat: -15.78, lon: -47.93 },
  // PE
  "recife": { lat: -8.05, lon: -34.88 },
  "olinda": { lat: -8.01, lon: -34.86 },
  // CE
  "fortaleza": { lat: -3.71, lon: -38.54 },
  // GO
  "goiania": { lat: -16.68, lon: -49.25 },
  "anapolis": { lat: -16.33, lon: -48.95 },
  // SC
  "florianopolis": { lat: -27.6, lon: -48.55 },
  "joinville": { lat: -26.3, lon: -48.85 },
  // PA
  "belem": { lat: -1.46, lon: -48.49 },
  // AM
  "manaus": { lat: -3.12, lon: -60.02 },
  // MA
  "sao luis": { lat: -2.53, lon: -44.3 },
  // MT
  "cuiaba": { lat: -15.6, lon: -56.1 },
  // MS
  "campo grande": { lat: -20.45, lon: -54.62 },
  // AL
  "maceio": { lat: -9.65, lon: -35.73 },
  // SE
  "aracaju": { lat: -10.91, lon: -37.07 },
  // PB
  "joao pessoa": { lat: -7.12, lon: -34.86 },
  // RN
  "natal": { lat: -5.79, lon: -35.21 },
  // PI
  "teresina": { lat: -5.09, lon: -42.8 },
  // ES
  "vitoria": { lat: -20.32, lon: -40.34 },
  "vila velha": { lat: -20.34, lon: -40.29 },
  // RO
  "porto velho": { lat: -8.76, lon: -63.9 },
  // TO
  "palmas": { lat: -10.25, lon: -48.32 },
  // RR
  "boa vista": { lat: 2.82, lon: -60.67 },
  // AP
  "macapa": { lat: 0.03, lon: -51.07 },
  // AC
  "rio branco": { lat: -9.97, lon: -67.81 },
};

function normalizar(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

// Hash deterministico simples (Knuth) — devolve numero em [0, 1)
function hashFracao(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

// Parser leve do atributo `d` SVG pra extrair bbox aproximada. So extrai
// pares de coordenadas absolutas (M/L) — suficiente pros paths de BR_STATES
// que sao gerados ja simplificados.
function bboxDoPath(d: string): { x: number; y: number; w: number; h: number } {
  const nums = d.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return { x: 0, y: 0, w: 1000, h: 968 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = Number(nums[i]);
    const y = Number(nums[i + 1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 1000, h: 968 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

// ------------------------------------------------------------------------

export interface CidadeDrilldown {
  nome: string;
  qtd: number;
  valor: number;
}

interface Props {
  uf: string;
  ufNome: string;
  cidades: CidadeDrilldown[];
  qtdTotalUf: number;
  valorTotalUf: number;
  totalGeralBens: number;
  onClose: () => void;
}

export default function MapaEstadoDrilldown({
  uf,
  ufNome,
  cidades,
  qtdTotalUf,
  valorTotalUf,
  totalGeralBens,
  onClose,
}: Props) {
  // createPortal exige montagem no DOM real — em SSR/initial render
  // document nao existe. Esse padrao (mounted flag) ja e usado em outros
  // overlays do projeto (AdicionarMedidaForm, BotaoGerarPeca).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ESC fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Trava scroll do body enquanto aberto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const cardRef = useRef<HTMLDivElement | null>(null);

  // Estado focado
  const estado = useMemo(() => BR_STATES.find((s) => s.uf === uf), [uf]);
  const bbox = useMemo(
    () => (estado ? bboxDoPath(estado.d) : { x: 0, y: 0, w: 100, h: 100 }),
    [estado],
  );
  // Padding ao redor pra nao colar nas bordas
  const padding = Math.max(bbox.w, bbox.h) * 0.08;
  const viewBoxDoEstado = `${bbox.x - padding} ${bbox.y - padding} ${
    bbox.w + padding * 2
  } ${bbox.h + padding * 2}`;

  const refUf = UF_LATLON[uf];

  // Projeta cidade -> SVG coords usando centroide da UF como ancora
  function projetar(cidadeNome: string, idx: number): { x: number; y: number } {
    const chave = normalizar(cidadeNome);
    const conhecida = CIDADES_CONHECIDAS[chave];
    if (estado && refUf && conhecida) {
      // 1° longitude / latitude ~= 25 px nesta escala (Brasil inteiro
      // ocupa ~1000x968 pra ~37° x ~38°). Latitude cresce pra baixo, logo
      // y aumenta quando lat fica mais negativa (sul).
      const dx = (conhecida.lon - refUf.lon) * 25;
      const dy = (refUf.lat - conhecida.lat) * 25;
      const x = estado.cx + dx;
      const y = estado.cy + dy;
      // Garante que o pino nao caia fora da bbox do estado (margem de 12%)
      const minX = bbox.x + bbox.w * 0.1;
      const maxX = bbox.x + bbox.w * 0.9;
      const minY = bbox.y + bbox.h * 0.1;
      const maxY = bbox.y + bbox.h * 0.9;
      return {
        x: Math.min(Math.max(x, minX), maxX),
        y: Math.min(Math.max(y, minY), maxY),
      };
    }
    // Fallback deterministico: distribui pelas bordas internas via hash
    if (estado) {
      const frac1 = hashFracao(`${uf}|${cidadeNome}|x|${idx}`);
      const frac2 = hashFracao(`${uf}|${cidadeNome}|y|${idx}`);
      return {
        x: bbox.x + bbox.w * (0.2 + frac1 * 0.6),
        y: bbox.y + bbox.h * (0.2 + frac2 * 0.6),
      };
    }
    return { x: 0, y: 0 };
  }

  // Top 12 cidades mostradas como pinos. Lista lateral mostra todas.
  const cidadesOrdenadas = useMemo(
    () => [...cidades].sort((a, b) => b.qtd - a.qtd),
    [cidades],
  );
  const cidadesComPino = cidadesOrdenadas.slice(0, 12);

  if (!mounted || !estado) return null;

  // Escala dos pinos relativa ao bbox — mantem proporcional independente do
  // tamanho do estado (RR e RS dao raios visualmente parecidos).
  const escala = Math.max(bbox.w, bbox.h) / 100; // pra estados pequenos vira <1
  const raioPino = Math.max(1.6, escala * 0.9);
  const haloPino = raioPino * 2.4;
  const tamFontePino = Math.max(2.4, escala * 1.4);

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Bens em ${ufNome}`}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md sm:p-8"
      onClick={(e) => {
        // Click fora do card fecha
        if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={cardRef}
        className="relative grid w-full max-w-5xl gap-0 overflow-hidden rounded-2xl border border-[var(--color-signal)]/30 bg-[var(--color-onyx)]/95 shadow-[0_30px_120px_-20px_rgba(60,255,138,0.18)] lg:grid-cols-[1fr_300px]"
        style={{ maxHeight: "90vh" }}
      >
        {/* Botao fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-[var(--color-ivory-22)] bg-black/40 text-[var(--color-ivory-88)] backdrop-blur transition hover:border-[var(--color-signal)]/60 hover:text-[var(--color-signal)]"
        >
          <X size={16} strokeWidth={1.6} />
        </button>

        {/* ===== Mapa do estado focado ===== */}
        <div className="relative border-b border-[var(--color-ivory-12)] bg-[var(--color-onyx)] p-5 lg:border-b-0 lg:border-r">
          <div className="mb-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Drill-down · {uf}
            </p>
            <h2 className="mt-0.5 text-xl font-medium text-[var(--color-ivory)]">
              {ufNome}
            </h2>
            <p className="mt-1 text-[12px] text-[var(--color-ivory-66)]">
              {qtdTotalUf} {qtdTotalUf === 1 ? "bem" : "bens"} identificados
              {totalGeralBens
                ? ` · ${((qtdTotalUf / totalGeralBens) * 100).toFixed(1)}% do total`
                : ""}
              {" · "}
              <span className="text-[var(--color-gold)]">
                {formatBRL(valorTotalUf)}
              </span>
            </p>
          </div>

          <div className="relative">
            <svg
              viewBox={viewBoxDoEstado}
              className="block h-auto w-full"
              role="img"
              aria-label={`Estado de ${ufNome} ampliado`}
              style={{ maxHeight: "62vh" }}
            >
              <defs>
                <filter
                  id={`pino-glow-${uf}`}
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation={escala * 0.9} result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Contorno do estado focado */}
              <path
                d={estado.d}
                style={{
                  fill: "rgba(60, 255, 138, 0.08)",
                  stroke: "var(--color-signal)",
                  strokeWidth: 1.2,
                }}
                vectorEffect="non-scaling-stroke"
              />

              {/* Pinos das cidades */}
              {cidadesComPino.map((c, i) => {
                const { x, y } = projetar(c.nome, i);
                const id = `${uf}-${c.nome}-${i}`;
                return (
                  <g key={id} filter={`url(#pino-glow-${uf})`}>
                    {/* halo pulsante */}
                    <circle
                      cx={x}
                      cy={y}
                      r={haloPino}
                      style={{
                        fill: "rgba(60, 255, 138, 0.22)",
                        opacity: 0.85,
                      }}
                    >
                      <animate
                        attributeName="r"
                        values={`${haloPino};${haloPino * 1.25};${haloPino}`}
                        dur="2.6s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.85;0.45;0.85"
                        dur="2.6s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    {/* pino */}
                    <circle
                      cx={x}
                      cy={y}
                      r={raioPino}
                      style={{
                        fill: "#3CFF8A",
                        stroke: "#0a1f12",
                        strokeWidth: 0.4,
                      }}
                      vectorEffect="non-scaling-stroke"
                    />
                    {/* rotulo */}
                    <text
                      x={x + raioPino * 1.4}
                      y={y + tamFontePino * 0.35}
                      style={{
                        fill: "var(--color-ivory)",
                        fontFamily: "var(--font-mono, ui-monospace, monospace)",
                        fontSize: tamFontePino,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        paintOrder: "stroke",
                        stroke: "rgba(5,7,6,0.7)",
                        strokeWidth: tamFontePino * 0.25,
                      }}
                    >
                      {c.nome}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* ===== Lista lateral ===== */}
        <aside className="flex max-h-[90vh] flex-col bg-[var(--color-onyx)]/80 p-5 lg:max-h-none">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Cidades com bens
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--color-ivory-66)]">
            {cidades.length}{" "}
            {cidades.length === 1 ? "cidade mapeada" : "cidades mapeadas"}
          </p>

          <ul className="mt-3 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {cidadesOrdenadas.map((c, i) => {
              const destacada = i < 12;
              return (
                <li
                  key={`${c.nome}-${i}`}
                  className="rounded-lg border border-[var(--color-ivory-12)] bg-[var(--color-onyx)]/60 p-2.5 transition hover:border-[var(--color-signal)]/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {destacada && (
                          <span
                            aria-hidden="true"
                            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-signal)] shadow-[0_0_6px_var(--color-signal)]"
                          />
                        )}
                        <span className="truncate text-[13px] font-medium text-[var(--color-ivory)]">
                          {c.nome}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] tabular-nums text-[var(--color-gold)]">
                        {formatBRL(c.valor)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-medium tabular-nums leading-none text-[var(--color-signal)]">
                        {c.qtd}
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                        {c.qtd === 1 ? "bem" : "bens"}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 border-t border-[var(--color-ivory-12)] pt-2 text-[10px] text-[var(--color-ivory-66)]">
            ESC ou clique fora pra fechar.
          </p>
        </aside>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
