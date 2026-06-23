"use client";

// Mapa de distribuicao geografica dos bens — SVG puro com d3-geo.
//
// Decisao automatica entre 2 mapas:
//   - TODAS as cidades em SP  -> carrega /maps/sp.geojson (municipios)
//   - Pelo menos 1 fora de SP -> carrega /maps/br.geojson (estados)
//
// Renderiza paths transparentes com stroke leve + pin (halo + dot) por cidade.
// Tamanho do pin: sqrt(qtdBens) clampeado [5..14].
// Cor: todos 'gold' por enquanto — todos os bens entram como "identificado".
// Quando o schema ganhar `penhora_confirmada`, alternar pra signal verde
// quando >= 1 confirmado na cidade.
//
// Component CLIENT porque:
//   - fetch do geojson (publica, cacheada) acontece no useEffect
//   - SVG depende de width/height medidos no DOM via ResizeObserver

import { useEffect, useMemo, useRef, useState } from "react";
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
} from "geojson";

import type { DistribuicaoGeografica } from "@/lib/dashboard-caso";
import { buscarCoord } from "@/lib/cidades-coords";
import { formatBRL } from "@/lib/format";

import { DashboardCard } from "@/components/dashboard/DashboardCard";

// ============================================================
// CONSTANTES visuais
// ============================================================

// Verde 'penhora confirmada' (futuro) vs. gold 'identificado' (atual).
// Comentario: quando schema ganhar penhora_confirmada, usar SIGNAL.
const COR_IDENTIFICADO = "#C9A24A"; // gold
const COR_CONFIRMADO = "#3CFF8A"; // signal — placeholder p/ uso futuro

// Faixa de tamanhos do pin (raio do dot).
const PIN_MIN = 5;
const PIN_MAX = 14;

// ============================================================
// TIPOS
// ============================================================

type Props = {
  distribuicao: DistribuicaoGeografica[];
};

type GeoFC = FeatureCollection<Geometry, GeoJsonProperties>;
type GeoFeat = Feature<Geometry, GeoJsonProperties>;

type PinPlot = {
  cidade: string;
  uf: string;
  qtdBens: number;
  valorTotalBrl: number;
  cx: number;
  cy: number;
  raio: number;
  cor: string;
  // penhoraConfirmada: virara campo futuro (DistribuicaoGeografica.confirmados);
  // por hora todos sao 'identificado' -> cor gold.
};

// ============================================================
// HELPERS
// ============================================================

function todasEmSP(itens: DistribuicaoGeografica[]): boolean {
  if (itens.length === 0) return true; // empty -> default pra SP
  return itens.every((d) => (d.uf ?? "").toUpperCase() === "SP");
}

function raioPin(qtd: number): number {
  // sqrt amortiza diferencas grandes; clamp pros extremos visuais.
  const r = Math.sqrt(Math.max(1, qtd)) * 3;
  return Math.max(PIN_MIN, Math.min(PIN_MAX, r));
}

async function carregarGeojson(url: string): Promise<GeoFC> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Falha ao carregar ${url}: ${res.status}`);
  const json = (await res.json()) as GeoFC;
  return json;
}

// ============================================================
// COMPONENTE
// ============================================================

export default function MapaDistribuicaoBens({ distribuicao }: Props) {
  // Escolhe SP vs BR antes de qualquer fetch — memo evita troca de geojson
  // a cada render caso `distribuicao` venha estavel.
  const usarSP = useMemo(() => todasEmSP(distribuicao), [distribuicao]);

  const [geojson, setGeojson] = useState<GeoFC | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tamanho, setTamanho] = useState<{ w: number; h: number }>({
    w: 600,
    h: 450,
  });

  // ----- fetch do geojson quando a escolha SP/BR muda -----
  useEffect(() => {
    let cancelado = false;
    setGeojson(null);
    setErro(null);
    const url = usarSP ? "/maps/sp.geojson" : "/maps/br.geojson";
    carregarGeojson(url)
      .then((j) => {
        if (!cancelado) setGeojson(j);
      })
      .catch((e: unknown) => {
        if (!cancelado) {
          const msg = e instanceof Error ? e.message : "Erro desconhecido";
          setErro(msg);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [usarSP]);

  // ----- mede o container (ResizeObserver) pra projection responsive -----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        const w = Math.max(1, Math.round(cr.width));
        const h = Math.max(1, Math.round(cr.height));
        setTamanho((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ----- projection + path generator (memoizados) -----
  const proj = useMemo(() => {
    if (!geojson) return null;
    // fitSize escolhe scale+translate pra encaixar a FC inteira no svg.
    return geoMercator().fitSize(
      [tamanho.w, tamanho.h],
      geojson as GeoPermissibleObjects,
    );
  }, [geojson, tamanho.w, tamanho.h]);

  const pathGen = useMemo(() => {
    if (!proj) return null;
    return geoPath(proj);
  }, [proj]);

  // ----- pins plotaveis (precisam de coord) -----
  const pins: PinPlot[] = useMemo(() => {
    if (!proj) return [];
    const out: PinPlot[] = [];
    for (const d of distribuicao) {
      const coord = buscarCoord(d.cidade, d.uf);
      if (!coord) continue;
      const xy = proj([coord.lng, coord.lat]);
      if (!xy) continue;
      out.push({
        cidade: d.cidade,
        uf: d.uf,
        qtdBens: d.qtdBens,
        valorTotalBrl: d.valorTotalBrl,
        cx: xy[0],
        cy: xy[1],
        raio: raioPin(d.qtdBens),
        // Por enquanto fixo no gold. Quando penhoraConfirmada existir:
        //   cor: (d.qtdConfirmados ?? 0) >= 1 ? COR_CONFIRMADO : COR_IDENTIFICADO
        cor: COR_IDENTIFICADO,
      });
    }
    return out;
  }, [distribuicao, proj]);

  // Marca onde COR_CONFIRMADO sera usado no futuro — evita "declarado mas
  // nao lido" do TS strict ate o schema chegar.
  void COR_CONFIRMADO;

  // ----- features pra iterar com chave estavel -----
  const features: GeoFeat[] = geojson?.features ?? [];

  // ============================================================
  // RENDER
  // ============================================================

  const titulo = "Distribuicao geografica dos bens";
  const descricao = usarSP
    ? "Mapa de SP com pinos nas cidades onde ha bens identificados"
    : "Mapa do Brasil com pinos nas cidades onde ha bens identificados";

  return (
    <DashboardCard titulo={titulo} descricao={descricao} accent="green">
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ aspectRatio: "4 / 3" }}
      >
        {/* ===== Loading skeleton ===== */}
        {!geojson && !erro ? (
          <div className="absolute inset-0 animate-pulse rounded-md bg-[var(--color-ivory-12)]" />
        ) : null}

        {/* ===== Erro de fetch ===== */}
        {erro ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--color-ivory-66)]">
            Nao foi possivel carregar o mapa ({erro}).
          </div>
        ) : null}

        {/* ===== SVG (so renderiza quando geojson + projection prontos) ===== */}
        {geojson && pathGen ? (
          <svg
            width={tamanho.w}
            height={tamanho.h}
            viewBox={`0 0 ${tamanho.w} ${tamanho.h}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={titulo}
          >
            {/* Paths dos municipios/estados — fundo discreto, so contorno. */}
            <g>
              {features.map((f, i) => {
                const d = pathGen(f);
                if (!d) return null;
                // Chave estavel: tenta id, depois properties.name/codarea, depois index.
                const props = (f.properties ?? {}) as Record<string, unknown>;
                const id =
                  (f.id as string | number | undefined) ??
                  (props.id as string | undefined) ??
                  (props.name as string | undefined) ??
                  (props.codarea as string | undefined) ??
                  i;
                return (
                  <path
                    key={String(id)}
                    d={d}
                    fill="rgba(232, 228, 214, 0.02)"
                    stroke="var(--color-ivory-22)"
                    strokeWidth={0.5}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>

            {/* Pins — halo + dot + tooltip nativo via <title>. */}
            <g>
              {pins.map((p, i) => (
                <g key={`${p.uf}-${p.cidade}-${i}`}>
                  <title>
                    {`${p.cidade}/${p.uf}\n${p.qtdBens} ${
                      p.qtdBens === 1 ? "bem" : "bens"
                    }\n${formatBRL(p.valorTotalBrl)}`}
                  </title>
                  {/* halo — circulo maior, baixa opacidade */}
                  <circle
                    cx={p.cx}
                    cy={p.cy}
                    r={p.raio * 1.9}
                    fill={p.cor}
                    opacity={0.18}
                  />
                  {/* dot principal */}
                  <circle
                    cx={p.cx}
                    cy={p.cy}
                    r={p.raio}
                    fill={p.cor}
                    stroke="var(--color-carbon)"
                    strokeWidth={1.2}
                  />
                </g>
              ))}
            </g>
          </svg>
        ) : null}

        {/* ===== Empty state — sem nenhuma coord encontrada ===== */}
        {geojson && pathGen && pins.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-[var(--color-ivory-66)]">
            Sem dados geograficos disponiveis.
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
}
