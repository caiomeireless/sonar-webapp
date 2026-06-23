// Heatmap de eficácia operacional — tipo de medida (linhas) x resultado
// (colunas). Cor: count alto = verde signal forte; count baixo = sombra leve.
// CSS grid puro, sem Recharts — o componente continua server-side.

import type { DashboardHeatmapItem } from "@/lib/dashboard-caso";
import {
  RESULTADO_META,
  TIPO_META,
  type ResultadoMedida,
  type TipoMedida,
} from "@/lib/medidas";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

// Linhas e colunas FIXAS pelo brief — heatmap é um snapshot operacional
// focado, não um cubo completo. Outros tipos/resultados ficam fora aqui.
const TIPOS_LINHA: readonly TipoMedida[] = [
  "sisbajud",
  "infojud",
  "renajud",
  "arisp",
  "penhora_efetivada",
] as const;

const RESULTADOS_COLUNA: readonly ResultadoMedida[] = [
  "positivo",
  "parcial",
  "negativo",
  "aguardando",
] as const;

type Props = {
  heatmap: DashboardHeatmapItem[];
};

type CellData = {
  count: number;
  pct: number;
};

function montarMatriz(
  heatmap: DashboardHeatmapItem[],
): { matriz: Map<string, CellData>; max: number; total: number } {
  const matriz = new Map<string, CellData>();
  let total = 0;
  let max = 0;

  // Soma considera APENAS as células visíveis (tipos+resultados do recorte)
  // — o % por célula precisa bater com 100% no total visível.
  for (const item of heatmap) {
    if (!TIPOS_LINHA.includes(item.tipo)) continue;
    if (!RESULTADOS_COLUNA.includes(item.resultado)) continue;
    total += item.count;
    if (item.count > max) max = item.count;
  }

  for (const item of heatmap) {
    if (!TIPOS_LINHA.includes(item.tipo)) continue;
    if (!RESULTADOS_COLUNA.includes(item.resultado)) continue;
    const k = `${item.tipo}|${item.resultado}`;
    const pct = total > 0 ? (item.count / total) * 100 : 0;
    matriz.set(k, { count: item.count, pct });
  }

  return { matriz, max, total };
}

// Cor base por COLUNA (resultado): verde p/ positivo, amarelo p/ aguardando,
// laranja p/ parcial, vermelho p/ negativo. Intensidade (alpha) varia
// conforme count vs max — heat scale dentro da coluna.
const COR_BASE_POR_RESULTADO: Record<ResultadoMedida, [number, number, number]> = {
  positivo: [60, 255, 138],    // verde signal
  aguardando: [244, 197, 66],  // amarelo
  parcial: [249, 115, 22],     // laranja
  negativo: [255, 91, 91],     // vermelho
  nao_aplica: [169, 169, 169], // cinza (caso entre no recorte no futuro)
};

function corCelula(
  resultado: ResultadoMedida,
  count: number,
  max: number,
): { background: string; border: string } {
  if (count === 0 || max === 0) {
    return {
      background: "rgba(234, 231, 220, 0.03)",
      border: "1px solid rgba(234, 231, 220, 0.06)",
    };
  }
  const [r, g, b] = COR_BASE_POR_RESULTADO[resultado];
  // Escala não-linear (sqrt): count baixo ainda visível, alto sem saturar cedo.
  const ratio = Math.sqrt(count / max);
  const alpha = 0.12 + ratio * 0.78;
  return {
    background: `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`,
    border: `1px solid rgba(${r}, ${g}, ${b}, ${Math.min(1, alpha + 0.12).toFixed(3)})`,
  };
}

function corTexto(count: number, max: number): string {
  if (count === 0 || max === 0) return "var(--color-ivory-66)";
  // Contraste invertido nas células mais quentes — fica preto sobre cor saturada.
  const ratio = max > 0 ? count / max : 0;
  return ratio > 0.55 ? "#050706" : "var(--color-ivory)";
}

export default function HeatmapEficacia({ heatmap }: Props) {
  const { matriz, max, total } = montarMatriz(heatmap);

  return (
    <DashboardCard
      titulo="Eficácia por medida"
      descricao="Tipo de medida x resultado. Cor por coluna (verde positivo, amarelo aguardando, laranja parcial, vermelho negativo) — intensidade = quantidade."
      accent="green"
    >
      {total === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--color-ivory-66)]">
          Sem medidas registradas para o recorte (SISBAJUD, INFOJUD, RENAJUD,
          ARISP, penhora efetivada).
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className="grid gap-1.5 text-xs"
            // Grid: 1 col p/ rótulo de linha + N cols p/ resultados.
            style={{
              gridTemplateColumns: `minmax(140px, 1fr) repeat(${RESULTADOS_COLUNA.length}, minmax(0, 1fr))`,
            }}
          >
            {/* Header: célula vazia + nomes de resultado */}
            <div aria-hidden />
            {RESULTADOS_COLUNA.map((res) => {
              const meta = RESULTADO_META[res];
              return (
                <div
                  key={res}
                  className="px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: meta.cor }}
                >
                  {meta.label}
                </div>
              );
            })}

            {/* Linhas: rótulo de tipo + células */}
            {TIPOS_LINHA.map((tipo) => {
              const tipoMeta = TIPO_META[tipo];
              return (
                <div key={tipo} className="contents">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 shrink-0 rounded-sm"
                      style={{ background: tipoMeta.cor }}
                    />
                    <span className="truncate text-[var(--color-ivory)]">
                      {tipoMeta.label}
                    </span>
                  </div>
                  {RESULTADOS_COLUNA.map((res) => {
                    const cell = matriz.get(`${tipo}|${res}`) ?? {
                      count: 0,
                      pct: 0,
                    };
                    const { background, border } = corCelula(
                      res,
                      cell.count,
                      max,
                    );
                    const color = corTexto(cell.count, max);
                    const titleLabel = `${tipoMeta.label} / ${RESULTADO_META[res].label}: ${cell.count} (${cell.pct.toFixed(1)}%)`;
                    return (
                      <div
                        key={`${tipo}|${res}`}
                        className="flex flex-col items-center justify-center rounded-md px-2 py-3 transition-colors"
                        style={{ background, border, color }}
                        title={titleLabel}
                      >
                        <span className="text-base font-semibold leading-none tabular-nums">
                          {cell.count}
                        </span>
                        <span
                          className="mt-1 text-[10px] leading-none tabular-nums"
                          style={{
                            color:
                              cell.count === 0
                                ? "var(--color-ivory-66)"
                                : color,
                            opacity: cell.count === 0 ? 1 : 0.85,
                          }}
                        >
                          {cell.pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Rodapé: legenda da escala por resultado + total */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-ivory-12)] pt-3 text-[11px] text-[var(--color-ivory-66)]">
            <div className="flex flex-wrap items-center gap-3">
              {RESULTADOS_COLUNA.map((res) => {
                const [r, g, b] = COR_BASE_POR_RESULTADO[res];
                return (
                  <div key={res} className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: `rgb(${r}, ${g}, ${b})` }}
                    />
                    <span>{RESULTADO_META[res].label}</span>
                  </div>
                );
              })}
            </div>
            <div className="tabular-nums">
              <span className="text-[var(--color-ivory)]">{total}</span>
              <span> medidas no recorte</span>
            </div>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
