// Funil operacional: Tentadas -> Positivas -> Penhoras Efetivadas.
// Visualiza o afunilamento entre o que foi *tentado*, o que retornou
// *positivo* e o que de fato virou *penhora efetivada*. Cada estagio
// herda a contagem do estagio anterior na realidade, entao o cliente
// le a queda como "perda" — cores escalonam de signal (alto) ate gold
// (raro/valioso).
//
// Recharts BarChart layout="vertical" (eixo Y = categorias, X = valor).
"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  CHART_COLOR_GOLD,
  CHART_COLOR_SIGNAL,
  axisLineStyle,
  axisTickStyle,
  tooltipContentStyle,
  tooltipCursorFill,
  tooltipItemStyle,
  tooltipLabelStyle,
} from "@/components/dashboard/ChartTheme";
import type { DashboardFunil } from "@/lib/dashboard-caso";

type Props = {
  funil: DashboardFunil;
};

// Verde-Sonar dessaturado pra o estagio intermediario — nao existe token
// global (--color-signal-mut), entao definimos aqui pra evitar inflar o
// ChartTheme com algo usado por um unico componente.
const CHART_COLOR_SIGNAL_MUT = "#1FAE5C";

type EstagioFunil = {
  estagio: "Tentadas" | "Positivas" | "Penhoras efetivadas";
  valor: number;
  cor: string;
};

function montarSeries(f: DashboardFunil): EstagioFunil[] {
  return [
    { estagio: "Tentadas", valor: f.tentadas, cor: CHART_COLOR_SIGNAL },
    { estagio: "Positivas", valor: f.positivas, cor: CHART_COLOR_SIGNAL_MUT },
    {
      estagio: "Penhoras efetivadas",
      valor: f.penhorasEfetivadas,
      cor: CHART_COLOR_GOLD,
    },
  ];
}

export default function FunilTentadasPositivas({ funil }: Props) {
  const data = montarSeries(funil);
  const totalTentadas = funil.tentadas;

  // Domain explicito evita Recharts colapsar o eixo quando todos os valores
  // sao 0 (caso sem nenhuma medida tomada).
  const maxValor = Math.max(...data.map((d) => d.valor), 1);

  return (
    <DashboardCard
      titulo="Funil operacional"
      descricao="Quantas medidas tomadas viraram resultado positivo e, no fim, penhora efetivada"
      accent="green"
    >
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
            barCategoryGap="22%"
          >
            <XAxis
              type="number"
              domain={[0, maxValor]}
              allowDecimals={false}
              tick={axisTickStyle}
              axisLine={axisLineStyle}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="estagio"
              tick={axisTickStyle}
              axisLine={axisLineStyle}
              tickLine={false}
              width={140}
            />
            <Tooltip
              cursor={{ fill: tooltipCursorFill }}
              contentStyle={tooltipContentStyle}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(value) => {
                const n = Number(value) || 0;
                return [
                  `${n} ${n === 1 ? "medida" : "medidas"}`,
                  "Quantidade",
                ];
              }}
            />
            <Bar dataKey="valor" radius={[0, 6, 6, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.estagio} fill={d.cor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
        {data.map((d) => {
          const pct =
            totalTentadas > 0
              ? Math.round((d.valor / totalTentadas) * 100)
              : 0;
          return (
            <div
              key={d.estagio}
              className="rounded-lg border border-[var(--color-ivory-12)] p-3"
            >
              <dt
                className="eyebrow flex items-center gap-2"
                style={{ color: d.cor }}
              >
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: d.cor }}
                />
                {d.estagio}
              </dt>
              <dd className="mt-1.5 text-lg font-medium text-[var(--color-ivory)]">
                {d.valor}
              </dd>
              <dd className="text-[var(--color-ivory-66)]">
                {totalTentadas > 0 ? `${pct}% das tentadas` : "Sem medidas"}
              </dd>
            </div>
          );
        })}
      </dl>
    </DashboardCard>
  );
}
