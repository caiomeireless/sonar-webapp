// Carteira por advogado (Dashboard da Plataforma).
// BarChart horizontal: cada barra = 1 advogado, X = valor de patrimonio
// gerido (soma dos bens dos devedores cujos casos estao sob sua
// responsabilidade), ordenado desc. Tooltip mostra qtd casos + gasto
// do mes com APIs (tracking de custo individual).
//
// Client-only por causa do Recharts. Recebe `itens` ja agregados — a
// page faz a leitura via `obterDadosDashboardPlataforma`.
"use client";

import {
  Bar,
  BarChart,
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

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  CHART_COLOR_GOLD,
  axisLineStyle,
  axisTickStyle,
  tooltipContentStyle,
  tooltipCursorFill,
  tooltipLabelStyle,
} from "@/components/dashboard/ChartTheme";
import { formatBRL } from "@/lib/format";
import type { CarteiraAdvogadoItem } from "@/lib/dashboard-plataforma";

type Props = {
  itens: CarteiraAdvogadoItem[];
};

// Compacto pra eixo X: "R$ 1,2 mi" ao inves de "R$ 1.234.567,89" (rotulo
// curto evita sobreposicao). Mantemos formatBRL no tooltip e na lista.
function formatBRLCompacto(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 1,
  }).format(value);
}

// Trunca nome longo no eixo Y pra evitar overflow (ate ~22 chars cabem
// na largura de 160px reservada).
function truncar(nome: string, max = 22): string {
  if (nome.length <= max) return nome;
  return `${nome.slice(0, max - 1)}…`;
}

type PayloadItem = CarteiraAdvogadoItem & { nomeCurto: string };

function TooltipCarteira({
  active,
  payload,
}: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload as PayloadItem | undefined;
  if (!item) return null;

  const labelCasos = `${item.qtdCasos} ${item.qtdCasos === 1 ? "caso" : "casos"}`;

  return (
    <div style={tooltipContentStyle}>
      <div style={tooltipLabelStyle}>{item.advogadoNome}</div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--color-ivory-66)]">Patrimonio gerido</span>
          <span className="font-medium tabular-nums">
            {formatBRL(item.valorPatrimonioGerido)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--color-ivory-66)]">Casos</span>
          <span className="font-medium tabular-nums">{labelCasos}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[var(--color-ivory-66)]">Gasto do mes</span>
          <span className="font-medium tabular-nums">
            {formatBRL(item.gastoMes)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CarteiraPorAdvogado({ itens }: Props) {
  if (itens.length === 0) {
    return (
      <DashboardCard
        titulo="Carteira por advogado"
        descricao="Patrimonio sob responsabilidade de cada membro da equipe"
        accent="gold"
      >
        <p className="text-sm text-[var(--color-ivory-66)]">
          Nenhum caso atribuido a advogado ainda.
        </p>
      </DashboardCard>
    );
  }

  // Recharts pinta de cima pra baixo na ordem do array em layout vertical.
  // Como queremos o maior no topo, mantemos a ordem desc que ja vem do agregador.
  const data: PayloadItem[] = itens.map((it) => ({
    ...it,
    nomeCurto: truncar(it.advogadoNome),
  }));

  // Domain explicito evita o eixo colapsar quando ha um unico advogado
  // com valor 0 (escritorio recem-onboardado).
  const maxValor = Math.max(...data.map((d) => d.valorPatrimonioGerido), 1);

  // Altura adaptativa: 44px por advogado + 32px de margem. Garante que
  // barras nao fiquem espremidas com 8 pessoas, nem sobre espaco com 2.
  const alturaPx = Math.max(180, data.length * 44 + 32);

  return (
    <DashboardCard
      titulo="Carteira por advogado"
      descricao="Patrimonio sob responsabilidade de cada membro da equipe"
      accent="gold"
    >
      <div style={{ height: alturaPx }} className="w-full">
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
              tick={axisTickStyle}
              axisLine={axisLineStyle}
              tickLine={false}
              tickFormatter={(v: number) => formatBRLCompacto(v)}
            />
            <YAxis
              type="category"
              dataKey="nomeCurto"
              tick={axisTickStyle}
              axisLine={axisLineStyle}
              tickLine={false}
              width={160}
            />
            <Tooltip
              cursor={{ fill: tooltipCursorFill }}
              content={(props) => <TooltipCarteira {...props} />}
            />
            <Bar
              dataKey="valorPatrimonioGerido"
              fill={CHART_COLOR_GOLD}
              radius={[0, 6, 6, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
