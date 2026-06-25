"use client";

// Gráfico de gastos por dia — últimos 30 dias. Area chart com fill gradient
// signal (espelho visual de EvolucaoPatrimonioMensal, mas em verde + um
// único eixo R$). Renderizado como Client Component porque Recharts exige
// document para medir.

import {
  Area,
  AreaChart,
  CartesianGrid,
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

import type { GastoPorDia } from "@/lib/dashboard-custos";
import { formatBRL } from "@/lib/format";
import {
  CHART_COLOR_SIGNAL,
  AREA_GRADIENT_SIGNAL,
  axisLineStyle,
  axisTickStyle,
  gridStroke,
  tooltipContentStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
} from "@/components/dashboard/ChartTheme";

type Props = {
  dados: GastoPorDia[];
};

type Ponto = {
  dia: string;
  rotulo: string;
  totalBrl: number;
};

function rotuloDia(ymd: string): string {
  const [, mm, dd] = ymd.split("-");
  if (!mm || !dd) return ymd;
  return `${dd}/${mm}`;
}

function compactBRL(value: number): string {
  if (!Number.isFinite(value)) return "R$ 0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}k`;
  return `R$ ${value.toFixed(0)}`;
}

function TooltipDia({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;
  const ponto = (payload[0]?.payload ?? null) as Ponto | null;
  if (!ponto) return null;
  return (
    <div style={tooltipContentStyle}>
      <div style={tooltipLabelStyle}>{String(label ?? ponto.rotulo)}</div>
      <div
        className="flex items-center gap-2"
        style={{ ...tooltipItemStyle, color: CHART_COLOR_SIGNAL }}
      >
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: CHART_COLOR_SIGNAL }}
        />
        <span>Gasto no dia</span>
        <span className="ml-auto font-medium tabular-nums">
          {formatBRL(ponto.totalBrl)}
        </span>
      </div>
    </div>
  );
}

export default function GraficoGastosPorDia({ dados }: Props) {
  const pontos: Ponto[] = dados.map((d) => ({
    dia: d.dia,
    rotulo: rotuloDia(d.dia),
    totalBrl: Number(d.totalBrl) || 0,
  }));

  const semDados = pontos.every((p) => p.totalBrl === 0);

  if (semDados) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-[var(--color-ivory-66)]">
        Sem consultas pagas registradas nos últimos 30 dias.
      </div>
    );
  }

  return (
    <div className="chart-neon-glow h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={pontos}
          margin={{ top: 8, right: 12, bottom: 0, left: 4 }}
        >
          <defs>
            <linearGradient
              id={AREA_GRADIENT_SIGNAL.id}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={AREA_GRADIENT_SIGNAL.from}
                stopOpacity={AREA_GRADIENT_SIGNAL.fromOpacity}
              />
              <stop
                offset="100%"
                stopColor={AREA_GRADIENT_SIGNAL.to}
                stopOpacity={AREA_GRADIENT_SIGNAL.toOpacity}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke={gridStroke}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="rotulo"
            tick={axisTickStyle}
            axisLine={axisLineStyle}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            tick={axisTickStyle}
            axisLine={axisLineStyle}
            tickLine={false}
            tickFormatter={compactBRL}
            width={64}
          />
          <Tooltip
            content={(props) => <TooltipDia {...props} />}
            cursor={{
              stroke: "rgba(60, 255, 138, 0.35)",
              strokeDasharray: "3 3",
            }}
          />
          <Area
            type="monotone"
            dataKey="totalBrl"
            name="Gasto"
            stroke={CHART_COLOR_SIGNAL}
            strokeWidth={2}
            fill={`url(#${AREA_GRADIENT_SIGNAL.id})`}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLOR_SIGNAL, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
