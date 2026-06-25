"use client";

// Donut do Dashboard da Plataforma: custos do mês agrupados por API.
// Top 5 APIs com maior gasto + fatia "Outros" se houver excedente.
// Centro = total R$ gasto no mês corrente. Legenda lateral = API + R$ + %.
// Client Component por causa do Recharts (ResponsiveContainer mede o DOM).
//
// Dados já vem agregados (CustoApiItem[]) de obterDadosDashboardPlataforma().
// Este componente NÃO consulta Supabase.

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import type { CustoApiItem } from "@/lib/dashboard-plataforma";
import { formatBRL } from "@/lib/format";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  CHART_COLORS,
  tooltipContentStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
} from "@/components/dashboard/ChartTheme";

// Quantas APIs entram nominalmente — o restante vira "Outros".
const TOP_N = 5;

// Cor neutra reservada para a fatia "Outros" — fica fora da paleta primária
// pra reforçar que é um agregado, não uma API individual.
const OUTROS_COLOR = "rgba(234, 231, 220, 0.40)";
const OUTROS_KEY = "__outros__";

// Forma consumida pelo Recharts. `tipo` carrega a chave (pra cor estável),
// `name` vira label do tooltip, `value` é a fatia.
type PieDatum = {
  tipo: string;
  name: string;
  value: number;
};

type Props = {
  dados: CustoApiItem[];
};

// ============================================================
// TOOLTIP custom — tipa o payload pra evitar `any` solto.

// ============================================================

function DonutTooltip({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as PieDatum | undefined;
  if (!datum) return null;
  return (
    <div style={tooltipContentStyle}>
      <div style={tooltipLabelStyle}>{datum.name}</div>
      <div style={tooltipItemStyle}>
        <strong>{formatBRL(datum.value)}</strong>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE
// ============================================================

export default function CustosPorAPIDonut({ dados }: Props) {
  // `dados` vem ordenado desc por custoBrl (ver agregarCustosPorApi).
  // Filtramos zerados antes de cortar — Recharts não desenha fatias com
  // value=0 e não queremos pagar slot do top-N com lixo.
  const positivos = dados.filter((d) => d.custoBrl > 0);

  const top = positivos.slice(0, TOP_N);
  const resto = positivos.slice(TOP_N);
  const valorOutros = resto.reduce((s, d) => s + d.custoBrl, 0);

  const datums: PieDatum[] = top.map((d) => ({
    tipo: d.tipo,
    name: d.descricaoRotulo,
    value: d.custoBrl,
  }));

  if (valorOutros > 0) {
    datums.push({
      tipo: OUTROS_KEY,
      name: `Outros (${resto.length})`,
      value: valorOutros,
    });
  }

  const total = datums.reduce((s, d) => s + d.value, 0);

  if (datums.length === 0 || total === 0) {
    return (
      <DashboardCard
        titulo="Custos por API"
        descricao="Gasto do mês por fonte de dados paga"
        accent="gold"
      >
        <div className="flex h-48 items-center justify-center text-sm text-[var(--color-ivory-66)]">
          Nenhuma consulta paga registrada neste mês.
        </div>
      </DashboardCard>
    );
  }

  const corPorIndice = (i: number, tipo: string) =>
    tipo === OUTROS_KEY ? OUTROS_COLOR : CHART_COLORS[i % CHART_COLORS.length];

  return (
    <DashboardCard
      titulo="Custos por API"
      descricao="Gasto do mes por fonte de dados paga"
      accent="gold"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        {/* DONUT */}
        <div className="relative h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={datums}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="62%"
                outerRadius="92%"
                paddingAngle={2}
                stroke="var(--color-carbon)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {datums.map((d, i) => (
                  <Cell key={d.tipo} fill={corPorIndice(i, d.tipo)} />
                ))}
              </Pie>
              <Tooltip content={(props) => <DonutTooltip {...props} />} />
            </PieChart>
          </ResponsiveContainer>

          {/* CENTRO — total do mês. px-8 + valor menor + nowrap pra nao
              encostar na borda do anel do donut (Caio: estava cortado). */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
            <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.12em] text-[var(--color-ivory-66)]">
              Gasto no mês
            </span>
            <span className="mt-1 whitespace-nowrap text-lg font-medium tabular-nums tracking-normal text-[var(--color-ivory)]">
              {formatBRL(total)}
            </span>
            <span className="mt-0.5 whitespace-nowrap text-[10px] text-[var(--color-ivory-66)]">
              {datums.length} {datums.length === 1 ? "fonte" : "fontes"}
            </span>
          </div>
        </div>

        {/* LEGENDA */}
        <ul className="flex flex-col gap-2">
          {datums.map((d, i) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            const cor = corPorIndice(i, d.tipo);
            return (
              <li
                key={d.tipo}
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-ivory-12)] px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: cor }}
                  />
                  <span className="text-sm leading-tight text-[var(--color-ivory)]">
                    {d.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-baseline gap-2">
                  <span className="text-sm tabular-nums text-[var(--color-ivory)]">
                    {formatBRL(d.value)}
                  </span>
                  <span className="w-10 text-right text-[11px] tabular-nums text-[var(--color-ivory-66)]">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </DashboardCard>
  );
}
