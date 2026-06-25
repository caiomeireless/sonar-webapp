"use client";

// Mix de bens por tipo — Dashboard da Plataforma.
// Donut Recharts agrupando bens pelos 6 TipoBem. Métrica = QUANTIDADE
// (o gêmeo `DonutBensPorValor` do Dashboard do Caso já mostra valor;
// aqui a leitura útil pra gestão da equipe é "quantos veículos vs
// quantos imóveis estamos rastreando" — distribuição do esforço).
// Centro = total de bens. Legenda lateral = tipo + qtd + %.
// Client por causa do Recharts (mede o DOM no ResponsiveContainer).
// Dados já vem agregados de obterDadosDashboardPlataforma(); o componente
// NÃO chama Supabase.

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
import type { MixBensItem } from "@/lib/dashboard-plataforma";
import { formatBRL } from "@/lib/format";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  TIPO_BEM_COLORS,
  tooltipContentStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
} from "@/components/dashboard/ChartTheme";

// ============================================================
// META — label + ícone por tipo de bem.
// Espelha o mapa usado em DonutBensPorValor / equipe/devedores/[id]
// pra consistência visual entre dashboards. Não há TIPO_META exportado
// pra bens em /lib (só existe pra medidas).
// ============================================================

const TIPO_BEM_META: Record<TipoBem, { label: string; icone: string }> = {
  veiculo: { label: "Veículos", icone: "V" },
  imovel: { label: "Imóveis", icone: "I" },
  empresa: { label: "Participações societárias", icone: "E" },
  processo_credito: { label: "Processos onde é credor", icone: "P" },
  endereco: { label: "Endereços confirmados", icone: "A" },
  vinculo: { label: "Vínculos familiares", icone: "F" },
};

// Forma consumida pelo Recharts. `value` = quantidade (eixo do donut).
// `valorBrl` viaja junto pro tooltip mostrar também o patrimônio do tipo.
type PieDatum = {
  tipo: TipoBem;
  name: string;
  value: number;
  valorBrl: number;
};

type Props = {
  dados: MixBensItem[];
};

// ============================================================
// TOOLTIP custom — tipa o payload pra evitar any/unknown solto.
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
        <strong>
          {datum.value} {datum.value === 1 ? "bem" : "bens"}
        </strong>
        <span style={{ color: "#8E866F", marginLeft: 6 }}>
          {formatBRL(datum.valorBrl)}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE
// ============================================================

export default function MixBensPorTipo({ dados }: Props) {
  // Recharts não desenha fatias com value=0; filtra antes pra não
  // poluir legenda e tooltip com tipos vazios.
  const datums: PieDatum[] = dados
    .filter((d) => d.qtd > 0)
    .map((d) => ({
      tipo: d.tipo,
      name: TIPO_BEM_META[d.tipo]?.label ?? d.tipo,
      value: d.qtd,
      valorBrl: d.valorBrl,
    }));

  const total = datums.reduce((s, d) => s + d.value, 0);

  if (datums.length === 0 || total === 0) {
    return (
      <DashboardCard
        titulo="Mix de bens por tipo"
        descricao="Distribuição dos bens rastreados por categoria"
        accent="gold"
      >
        <div className="flex h-48 items-center justify-center text-sm text-[var(--color-ivory-66)]">
          Nenhum bem rastreado.
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      titulo="Mix de bens por tipo"
      descricao="Distribuicao dos bens rastreados por categoria"
      accent="gold"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        {/* DONUT */}
        <div className="chart-neon-glow relative h-64 w-full">
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

          {/* CENTRO — total de bens (count). pointer-events-none pra
              não bloquear hover do tooltip nas fatias. */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ivory-66)]">
              Total de bens
            </span>
            <span className="mt-1 text-3xl font-medium tracking-tight tabular-nums text-[var(--color-ivory)]">
              {total}
            </span>
            <span className="mt-0.5 text-[10px] text-[var(--color-ivory-66)]">
              {datums.length} {datums.length === 1 ? "tipo" : "tipos"}
            </span>
          </div>
        </div>

        {/* LEGENDA */}
        <ul className="flex flex-col gap-2">
          {datums.map((d) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            const cor = TIPO_BEM_COLORS[d.tipo] ?? "#EAE7DC";
            const meta = TIPO_BEM_META[d.tipo];
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
                  <span className="whitespace-normal text-sm leading-tight text-[var(--color-ivory)]">
                    {d.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-baseline gap-2">
                  <span className="text-sm tabular-nums text-[var(--color-ivory)]">
                    {d.value}
                  </span>
                  <span className="w-12 text-right text-[11px] tabular-nums text-[var(--color-ivory-66)]">
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
