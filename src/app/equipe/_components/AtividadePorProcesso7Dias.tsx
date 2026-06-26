// Atividade nos ultimos 7 dias — barras verticais empilhadas POR PROCESSO
// (uma barra por caso, segmentos por tipo de medida). Usado no painel do
// CLIENTE (ele nao precisa ver quem do escritorio executou, mas sim em
// qual processo as medidas estao caindo).
//
// Espelha visualmente o AtividadeEquipe7Dias; muda apenas o eixo X
// (Pasta #X em vez de nome do advogado) e a fonte de dados.
"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  axisLineStyle,
  axisTickStyle,
  tooltipContentStyle,
  tooltipCursorFill,
  tooltipItemStyle,
  tooltipLabelStyle,
} from "@/components/dashboard/ChartTheme";
import type { AtividadeProcessoItem } from "@/lib/dashboard-plataforma";
import { TIPO_META, TIPOS_ORDEM, type TipoMedida } from "@/lib/medidas";

type Props = {
  dados: AtividadeProcessoItem[];
};

// Eixo X: "Pasta #X". O tooltip mostra o nome do devedor completo.
function rotuloCurto(item: AtividadeProcessoItem): string {
  return `Pasta #${item.casoId}`;
}

type Linha = { nome: string; casoIdKey: number; devedorNome: string } & Partial<
  Record<TipoMedida, number>
>;

function montarLinhas(dados: AtividadeProcessoItem[]): Linha[] {
  return dados.map((item) => {
    const linha: Linha = {
      nome: rotuloCurto(item),
      casoIdKey: item.casoId,
      devedorNome: item.devedorNome,
    };
    for (const tipo of TIPOS_ORDEM) {
      linha[tipo] = item.breakdown[tipo] ?? 0;
    }
    return linha;
  });
}

interface PayloadItem {
  dataKey?: string | number;
  value?: number;
  color?: string;
  payload?: Linha;
}

interface TooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const devedorNome = payload[0]?.payload?.devedorNome ?? "";

  const itens = payload
    .map((p) => {
      const tipo = String(p.dataKey ?? "") as TipoMedida;
      const valor = Number(p.value) || 0;
      const meta = TIPO_META[tipo];
      return { tipo, valor, label: meta?.label ?? tipo, cor: meta?.cor ?? "#a9a9a9" };
    })
    .filter((i) => i.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const total = itens.reduce((s, i) => s + i.valor, 0);

  return (
    <div style={tooltipContentStyle}>
      <div style={tooltipLabelStyle}>{label}</div>
      {devedorNome ? (
        <div
          className="mb-1.5 font-serif"
          style={{ color: "var(--color-devedor)", fontSize: 13 }}
        >
          {devedorNome}
        </div>
      ) : null}
      <ul className="m-0 flex flex-col gap-1 p-0">
        {itens.map((i) => (
          <li
            key={i.tipo}
            className="flex items-center justify-between gap-4"
            style={tooltipItemStyle}
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: i.cor }}
              />
              {i.label}
            </span>
            <span className="font-mono tabular-nums">{i.valor}</span>
          </li>
        ))}
      </ul>
      <div
        className="mt-2 flex items-center justify-between border-t pt-1.5"
        style={{
          borderColor: "rgba(232, 228, 214, 0.13)",
          ...tooltipItemStyle,
        }}
      >
        <span className="opacity-66">Total</span>
        <span className="font-mono tabular-nums">{total}</span>
      </div>
    </div>
  );
}

export default function AtividadePorProcesso7Dias({ dados }: Props) {
  const linhas = montarLinhas(dados);

  return (
    <DashboardCard
      titulo="Medidas por Processo — 7 dias"
      descricao="Medidas tomadas pelo escritório em cada processo, empilhadas por tipo de providência"
      accent="green"
    >
      {linhas.length === 0 ? (
        <p className="text-sm text-[var(--color-ivory-66)]">
          Nenhuma medida registrada nos últimos 7 dias.
        </p>
      ) : (
        <div className="chart-neon-glow h-[376px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={linhas}
              margin={{ top: 12, right: 24, bottom: 4, left: 0 }}
              barCategoryGap="22%"
            >
              <XAxis
                dataKey="nome"
                type="category"
                tick={axisTickStyle}
                axisLine={axisLineStyle}
                tickLine={false}
                interval={0}
              />
              <YAxis
                type="number"
                allowDecimals={false}
                tick={axisTickStyle}
                axisLine={axisLineStyle}
                tickLine={false}
                width={32}
                tickCount={8}
              />
              <Tooltip
                cursor={{ fill: tooltipCursorFill }}
                content={<CustomTooltip />}
              />
              {TIPOS_ORDEM.map((tipo, idx) => {
                const meta = TIPO_META[tipo];
                const ehTopo = idx === TIPOS_ORDEM.length - 1;
                return (
                  <Bar
                    key={tipo}
                    dataKey={tipo}
                    stackId="medidas"
                    fill={meta.cor}
                    name={meta.label}
                    radius={ehTopo ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    isAnimationActive={false}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardCard>
  );
}
