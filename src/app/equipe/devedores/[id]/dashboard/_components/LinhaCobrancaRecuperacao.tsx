"use client";

// Linha do tempo financeira — cobrança acumulada (ouro BP) x valor recuperado
// (verde Sonar) nos últimos 12 meses. Recharts roda no client.
//
// Recebe os dados já agregados pelo helper obterDadosDashboardCaso (server).
// A única transformação feita aqui é o ACUMULADO da cobrança: o helper
// devolve cobrança mensal (linear); a série do gráfico mostra o saldo
// acumulado mês a mês, que é a leitura natural pra credor.

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

import type { DashboardLinhaTempoItem } from "@/lib/dashboard-caso";
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
  dados: DashboardLinhaTempoItem[];
};

type Ponto = {
  mes: string;
  rotuloMes: string;
  cobrancaAcumulada: number;
  valorRecuperado: number;
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

// 'YYYY-MM' -> 'mmm/yy' (pt-BR curto). Evita Intl pra não depender de locale
// no SSR — o helper já entrega o YYYY-MM canônico.
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

function TooltipFinanceiro({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  // Recharts entrega payload na ordem das <Line>s. Buscar por dataKey é mais
  // seguro do que confiar em índice.
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
          <span>Cobrança acumulada</span>
          <span className="ml-auto font-medium tabular-nums">
            {formatBRL(ponto.cobrancaAcumulada)}
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
          <span>Valor recuperado</span>
          <span className="ml-auto font-medium tabular-nums">
            {formatBRL(ponto.valorRecuperado)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LinhaCobrancaRecuperacao({ dados }: Props) {
  const pontos = useMemo<Ponto[]>(() => {
    let acumulado = 0;
    return dados.map((item) => {
      acumulado += Number(item.cobranca) || 0;
      return {
        mes: item.mes,
        rotuloMes: rotularMes(item.mes),
        cobrancaAcumulada: acumulado,
        valorRecuperado: Number(item.recuperacao) || 0,
      };
    });
  }, [dados]);

  const semDados =
    pontos.length === 0 ||
    pontos.every(
      (p) => p.cobrancaAcumulada === 0 && p.valorRecuperado === 0,
    );

  return (
    <DashboardCard
      titulo="Cobrança x recuperação"
      descricao="Cobrança acumulada e valor recuperado nos últimos 12 meses."
      accent="gold"
    >
      {semDados ? (
        <div className="flex h-64 items-center justify-center text-sm text-[var(--color-ivory-66)]">
          Sem movimentação financeira no período.
        </div>
      ) : (
        <div className="h-64 w-full">
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
                tick={axisTickStyle}
                axisLine={axisLineStyle}
                tickLine={false}
                tickFormatter={compactBRL}
                width={64}
              />
              <Tooltip
                content={(props) => <TooltipFinanceiro {...props} />}
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
                type="monotone"
                dataKey="cobrancaAcumulada"
                name="Cobrança acumulada"
                stroke={CHART_COLOR_GOLD}
                strokeWidth={2}
                dot={{ r: 2.5, fill: CHART_COLOR_GOLD, strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="valorRecuperado"
                name="Valor recuperado"
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
