"use client";

// Gráfico de área — gasto diário do cliente nos últimos 30 dias.
// Recebe os dados já agregados de `obterDashboardCustos` (server). Não
// consulta nada — apenas renderiza com Recharts.
//
// Cor: signal (verde Sonar) com gradiente suave — mesma linguagem dos
// gráficos do dashboard do escritório.

import { useMemo } from "react";
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
  AREA_GRADIENT_SIGNAL,
  CHART_COLOR_SIGNAL,
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

// 'YYYY-MM-DD' -> 'DD/MM' (curto, evita Intl pra não depender de locale SSR).
function rotularDia(iso: string): string {
  const [, mm, dd] = iso.split("-");
  if (!mm || !dd) return iso;
  return `${dd}/${mm}`;
}

function compactBRL(value: number): string {
  if (!Number.isFinite(value)) return "R$ 0";
  const abs = Math.abs(value);
  if (abs >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}k`;
  return `R$ ${value.toFixed(0)}`;
}

function TooltipGasto({
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

export default function GastosPorDiaChart({ dados }: Props) {
  const pontos = useMemo<Ponto[]>(
    () =>
      dados.map((item) => ({
        dia: item.dia,
        rotulo: rotularDia(item.dia),
        totalBrl: Number(item.totalBrl) || 0,
      })),
    [dados],
  );

  const semDados = pontos.length === 0 || pontos.every((p) => p.totalBrl === 0);

  if (semDados) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--color-ivory-66)]">
        Sem consultas registradas nos últimos 30 dias.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
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
            width={56}
          />
          <Tooltip
            content={(props) => <TooltipGasto {...props} />}
            cursor={{
              stroke: "rgba(232, 228, 214, 0.13)",
              strokeDasharray: "3 3",
            }}
          />
          <Area
            type="monotone"
            dataKey="totalBrl"
            name="Gasto diário"
            stroke={CHART_COLOR_SIGNAL}
            strokeWidth={2}
            fill={`url(#${AREA_GRADIENT_SIGNAL.id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
