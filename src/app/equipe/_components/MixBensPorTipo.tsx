"use client";

// Mix de bens por tipo — Dashboard da Plataforma.
// Antes: donut Recharts + legenda lateral. Caio reclamou que ficava
// vertical e os nomes longos (ex. "Processos onde é credor") cortavam.
// Agora: BAR CHART HORIZONTAL Recharts — categoria no eixo Y, qtd no X,
// uma cor por TipoBem. Muito mais legivel pros 6 nomes longos.
// Mantemos o estilo signal+glow do dashboard, accent gold no card,
// total de bens no topo do conteudo (substitui o "centro" do donut).
// Dados ja' vem agregados de obterDadosDashboardPlataforma().

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
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

import type { TipoBem } from "@/lib/mock-fixtures";
import type { MixBensItem } from "@/lib/dashboard-plataforma";
import { formatBRL } from "@/lib/format";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  TIPO_BEM_COLORS,
  axisLineStyle,
  axisTickStyle,
  num,
  tooltipContentStyle,
  tooltipItemStyle,
  tooltipLabelStyle,
} from "@/components/dashboard/ChartTheme";

// ============================================================
// META — label + ícone por tipo de bem.
// ============================================================

const TIPO_BEM_META: Record<TipoBem, { label: string }> = {
  veiculo: { label: "Veículos" },
  imovel: { label: "Imóveis" },
  empresa: { label: "Participações Societárias" },
  processo_credito: { label: "Processos Onde é Credor" },
  endereco: { label: "Endereços Confirmados" },
  vinculo: { label: "Vínculos Familiares" },
};

type BarDatum = {
  tipo: TipoBem;
  name: string;
  value: number;
  valorBrl: number;
};

type Props = {
  dados: MixBensItem[];
};

// ============================================================
// TOOLTIP custom — mostra qtd + valor estimado.
// ============================================================

function BarTooltip({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload as BarDatum | undefined;
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
  // Filtra zeros + ordena DESC por qtd (maior em cima da barra).
  const datums: BarDatum[] = dados
    .filter((d) => d.qtd > 0)
    .map((d) => ({
      tipo: d.tipo,
      name: TIPO_BEM_META[d.tipo]?.label ?? d.tipo,
      value: d.qtd,
      valorBrl: d.valorBrl,
    }))
    .sort((a, b) => b.value - a.value);

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

  // Altura proporcional ao numero de categorias (cada barra ~44px).
  const altura = Math.max(220, datums.length * 44 + 40);

  return (
    <DashboardCard
      titulo="Mix de bens por tipo"
      descricao="Distribuição dos bens rastreados por categoria"
      accent="gold"
    >
      {/* Header com total */}
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Total de Bens
          </p>
          <p className="mt-0.5 font-serif text-3xl leading-none tabular-nums text-[var(--color-gold)]">
            {total}
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          {datums.length} {datums.length === 1 ? "tipo" : "tipos"}
        </p>
      </div>

      <div
        className="chart-neon-glow relative w-full"
        style={{ height: altura }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={datums}
            layout="vertical"
            margin={{ top: 4, right: 56, bottom: 4, left: 0 }}
          >
            <XAxis
              type="number"
              hide
              domain={[0, Math.max(...datums.map((d) => d.value)) * 1.15]}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={170}
              tick={axisTickStyle}
              axisLine={axisLineStyle}
              tickLine={false}
              interval={0}
            />
            <Tooltip
              content={(props) => <BarTooltip {...props} />}
              cursor={{ fill: "rgba(60,255,138,0.05)" }}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
              {datums.map((d) => (
                <Cell key={d.tipo} fill={TIPO_BEM_COLORS[d.tipo] ?? "#EAE7DC"} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v: ValueType) => num(Number(v))}
                style={{
                  fill: "var(--color-ivory)",
                  fontSize: 13,
                  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
