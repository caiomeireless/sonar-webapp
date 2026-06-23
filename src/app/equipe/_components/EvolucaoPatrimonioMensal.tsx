"use client";

// Evolução mensal da plataforma — patrimônio localizado (R$, ouro) x
// penhoras efetivadas (count, verde) nos últimos 12 meses. Full width na
// linha 2 do Dashboard da Plataforma.
//
// Eixos Y separados: o patrimônio em R$ pode chegar a milhões, enquanto as
// penhoras efetivadas são contagens pequenas. Misturar na mesma escala
// achataria a série verde. Dois <YAxis yAxisId> resolvem isso de forma
// limpa no Recharts.
//
// Recebe `dados` já agregados por `agregarEvolucaoMensal` (server).

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import type { EvolucaoMensalItem } from "@/lib/dashboard-plataforma";
import { formatBRL } from "@/lib/format";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  CHART_COLOR_GOLD,
  CHART_COLOR_SIGNAL,
  axisLineStyle,
  axisTickStyle,
  gridStroke,
  tooltipContentStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
} from "@/components/dashboard/ChartTheme";

type Props = {
  dados: EvolucaoMensalItem[];
};

type Ponto = {
  mes: string;
  rotuloMes: string;
  patrimonioLocalizado: number;
  penhorasEfetivadas: number;
};

const MESES_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

// 'YYYY-MM' -> 'mmm/yy' (pt-BR curto). Sem Intl pra evitar mismatch de
// locale SSR/CSR.
function rotularMes(ym: string): string {
  const [yyyy, mm] = ym.split("-");
  const idx = Number.parseInt(mm ?? "", 10) - 1;
  if (Number.isNaN(idx) || idx < 0 || idx > 11) return ym;
  const yy = (yyyy ?? "").slice(-2);
  return `${MESES_PT[idx]}/${yy}`;
}

function compactBRL(value: number): string {
  if (!Number.isFinite(value)) return "R$ 0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  return `R$ ${value.toFixed(0)}`;
}

function formatInteiro(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(
    value,
  );
}

function TooltipEvolucao({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  const ponto = (payload[0]?.payload ?? null) as Ponto | null;
  if (!ponto) return null;

  return (
    <div style={tooltipContentStyle}>
      <div style={tooltipLabelStyle}>{String(label ?? ponto.rotuloMes)}</div>
      <div className="flex flex-col gap-1">
        <div
          className="flex items-center gap-2"
          style={{ ...tooltipItemStyle, color: CHART_COLOR_GOLD }}
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: CHART_COLOR_GOLD }}
          />
          <span>Patrimônio localizado</span>
          <span className="ml-auto font-medium tabular-nums">
            {formatBRL(ponto.patrimonioLocalizado)}
          </span>
        </div>
        <div
          className="flex items-center gap-2"
          style={{ ...tooltipItemStyle, color: CHART_COLOR_SIGNAL }}
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: CHART_COLOR_SIGNAL }}
          />
          <span>Penhoras efetivadas</span>
          <span className="ml-auto font-medium tabular-nums">
            {formatInteiro(ponto.penhorasEfetivadas)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EvolucaoPatrimonioMensal({ dados }: Props) {
  const pontos = useMemo<Ponto[]>(
    () =>
      dados.map((item) => ({
        mes: item.mes,
        rotuloMes: rotularMes(item.mes),
        patrimonioLocalizado: Number(item.patrimonioLocalizado) || 0,
        penhorasEfetivadas: Number(item.penhorasEfetivadas) || 0,
      })),
    [dados],
  );

  const semDados =
    pontos.length === 0 ||
    pontos.every(
      (p) => p.patrimonioLocalizado === 0 && p.penhorasEfetivadas === 0,
    );

  return (
    <DashboardCard
      titulo="Evolução mensal"
      descricao="Patrimônio localizado e penhoras efetivadas nos últimos 12 meses."
      accent="gold"
    >
      {semDados ? (
        <div className="flex h-72 items-center justify-center text-sm text-[var(--color-ivory-66)]">
          Sem movimentação no período.
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={pontos}
              margin={{ top: 8, right: 12, bottom: 0, left: 4 }}
            >
              <CartesianGrid
                stroke={gridStroke}
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="rotuloMes"
                tick={axisTickStyle}
                axisLine={axisLineStyle}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
              />
              <YAxis
                yAxisId="patrimonio"
                tick={axisTickStyle}
                axisLine={axisLineStyle}
                tickLine={false}
                tickFormatter={compactBRL}
                width={64}
              />
              <YAxis
                yAxisId="penhoras"
                orientation="right"
                tick={axisTickStyle}
                axisLine={axisLineStyle}
                tickLine={false}
                tickFormatter={formatInteiro}
                allowDecimals={false}
                width={40}
              />
              <Tooltip
                content={(props) => <TooltipEvolucao {...props} />}
                cursor={{
                  stroke: "rgba(234, 231, 220, 0.13)",
                  strokeDasharray: "3 3",
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={24}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontFamily:
                    "var(--font-open-sans), system-ui, sans-serif",
                  fontSize: 11,
                  color: "rgba(234, 231, 220, 0.66)",
                }}
              />
              <Line
                yAxisId="patrimonio"
                type="monotone"
                dataKey="patrimonioLocalizado"
                name="Patrimônio localizado"
                stroke={CHART_COLOR_GOLD}
                strokeWidth={2}
                dot={{ r: 2.5, fill: CHART_COLOR_GOLD, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
              <Line
                yAxisId="penhoras"
                type="monotone"
                dataKey="penhorasEfetivadas"
                name="Penhoras efetivadas"
                stroke={CHART_COLOR_SIGNAL}
                strokeWidth={2}
                dot={{ r: 2.5, fill: CHART_COLOR_SIGNAL, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
