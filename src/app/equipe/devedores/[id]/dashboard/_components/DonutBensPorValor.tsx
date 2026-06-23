"use client";

// Donut do Dashboard do Caso: bens agrupados por TIPO, valor em R$.
// Centro = valor total. Legenda lateral = tipo + valor + %.
// Componente CLIENT por causa do Recharts (ResponsiveContainer mede o DOM).
//
// Dados já vêm agregados de obterDadosDashboardCaso(devedorId) — esta view
// não chama Supabase. Recebe `dados` (DashboardBreakdownBem[]) via prop.

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

import type { TipoBem } from "@/lib/mock-fixtures";
import type { DashboardBreakdownBem } from "@/lib/dashboard-caso";
import { formatBRL } from "@/lib/format";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  TIPO_BEM_COLORS,
  tooltipContentStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
} from "@/components/dashboard/ChartTheme";

// ============================================================
// META — label + ícone por tipo de bem (espelha lib/devedores
// page.tsx; sem TIPO_META exportado, inline aqui pra manter
// consistência visual com o dossiê).
// ============================================================

const TIPO_META: Record<TipoBem, { label: string; icone: string }> = {
  veiculo: { label: "Veículos", icone: "V" },
  imovel: { label: "Imóveis", icone: "I" },
  empresa: { label: "Participações societárias", icone: "E" },
  processo_credito: { label: "Processos onde é credor", icone: "P" },
  endereco: { label: "Endereços confirmados", icone: "A" },
  vinculo: { label: "Vínculos familiares", icone: "F" },
};

// Forma que o Recharts consome — `name` vira label do tooltip,
// `value` vira a fatia. `tipo` carrega a chave pra colorir.
type PieDatum = {
  tipo: TipoBem;
  name: string;
  value: number;
  qtd: number;
};

type Props = {
  dados: DashboardBreakdownBem[];
};

// ============================================================
// TOOLTIP custom — tipa o payload pra evitar `any`/`unknown`
// soltos. Recharts entrega payload[].payload com o datum
// original; aqui castamos pro nosso PieDatum.
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
        <span style={{ color: "rgba(234, 231, 220, 0.40)", marginLeft: 6 }}>
          {datum.qtd} {datum.qtd === 1 ? "item" : "itens"}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE
// ============================================================

export default function DonutBensPorValor({ dados }: Props) {
  // Recharts não desenha fatias com value=0; filtramos pra não
  // poluir tooltip nem legenda com tipos vazios.
  const datums: PieDatum[] = dados
    .filter((d) => d.valorBrl > 0)
    .map((d) => ({
      tipo: d.tipo,
      name: TIPO_META[d.tipo]?.label ?? d.tipo,
      value: d.valorBrl,
      qtd: d.qtd,
    }));

  const total = datums.reduce((s, d) => s + d.value, 0);

  if (datums.length === 0 || total === 0) {
    return (
      <DashboardCard
        titulo="Patrimônio por tipo"
        descricao="Distribuição do valor estimado por categoria de bem"
        accent="gold"
      >
        <div className="flex h-48 items-center justify-center text-sm text-[var(--color-ivory-66)]">
          Nenhum bem com valor estimado.
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      titulo="Patrimônio por tipo"
      descricao="Distribuição do valor estimado por categoria de bem"
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
                {datums.map((d) => (
                  <Cell
                    key={d.tipo}
                    fill={TIPO_BEM_COLORS[d.tipo] ?? "#EAE7DC"}
                  />
                ))}
              </Pie>
              <Tooltip content={(props) => <DonutTooltip {...props} />} />
            </PieChart>
          </ResponsiveContainer>

          {/* CENTRO — total. pointer-events-none pra não tampar tooltip. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ivory-66)]">
              Patrimônio total
            </span>
            <span className="mt-1 text-2xl font-medium tracking-tight text-[var(--color-ivory)]">
              {formatBRL(total)}
            </span>
            <span className="mt-0.5 text-[10px] text-[var(--color-ivory-66)]">
              {datums.reduce((s, d) => s + d.qtd, 0)} bens
            </span>
          </div>
        </div>

        {/* LEGENDA */}
        <ul className="flex flex-col gap-2">
          {datums.map((d) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            const cor = TIPO_BEM_COLORS[d.tipo] ?? "#EAE7DC";
            const meta = TIPO_META[d.tipo];
            return (
              <li
                key={d.tipo}
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-ivory-12)] px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-semibold"
                    style={{
                      background: `${cor}22`,
                      color: cor,
                      border: `1px solid ${cor}55`,
                    }}
                  >
                    {meta?.icone ?? "?"}
                  </span>
                  <span className="truncate text-sm text-[var(--color-ivory)]">
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
