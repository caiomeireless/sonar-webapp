// Atividade da equipe nos últimos 7 dias — barras verticais empilhadas
// (uma barra por advogado, segmentos por tipo de medida). Quem mais
// tocou processos aparece à esquerda; o tooltip abre o breakdown
// completo de cada tipo (SISBAJUD, INFOJUD, ofícios, audiências...).
//
// Client component porque Recharts só renderiza no client (refs/SVG).
// Dados já vem agregados (atividadeEquipe7Dias da DashboardPlataforma).
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
import type { AtividadeEquipeItem } from "@/lib/dashboard-plataforma";
import { TIPO_META, TIPOS_ORDEM, type TipoMedida } from "@/lib/medidas";

type Props = {
  dados: AtividadeEquipeItem[];
};

// Nome curto pro eixo X — primeiro nome + inicial do segundo (cabe melhor
// quando temos 5+ advogados lado a lado). Cai pro email se não houver nome.
function nomeCurto(item: AtividadeEquipeItem): string {
  const nome = (item.advogadoNome ?? "").trim();
  if (!nome || nome === item.advogadoEmail) {
    const local = item.advogadoEmail.split("@")[0] ?? item.advogadoEmail;
    return local;
  }
  const partes = nome.split(/\s+/).filter(Boolean);
  if (partes.length === 1) return partes[0];
  const primeiro = partes[0];
  const segundo = partes[1]?.[0];
  return segundo ? `${primeiro} ${segundo}.` : primeiro;
}

// Linha do dataset que o Recharts consome: nome curto + uma chave numérica
// por TipoMedida (zero quando o advogado não executou aquele tipo).
type Linha = { nome: string; emailKey: string } & Partial<
  Record<TipoMedida, number>
>;

function montarLinhas(dados: AtividadeEquipeItem[]): Linha[] {
  return dados.map((item) => {
    const linha: Linha = {
      nome: nomeCurto(item),
      emailKey: item.advogadoEmail,
    };
    for (const tipo of TIPOS_ORDEM) {
      linha[tipo] = item.breakdown[tipo] ?? 0;
    }
    return linha;
  });
}

// Tooltip do Recharts — payload não tem tipo público estável, então
// modelamos só o que usamos. Mostra só tipos com count > 0, em ordem
// decrescente, mais o total ao final.
interface PayloadItem {
  dataKey?: string | number;
  value?: number;
  color?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

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
          borderColor: "rgba(232, 228, 214, 0.13)", // var(--color-ivory-22)
          ...tooltipItemStyle,
        }}
      >
        <span className="opacity-66">Total</span>
        <span className="font-mono tabular-nums">{total}</span>
      </div>
    </div>
  );
}

export default function AtividadeEquipe7Dias({ dados }: Props) {
  const linhas = montarLinhas(dados);

  return (
    <DashboardCard
      titulo="Atividade da equipe — 7 dias"
      descricao="Medidas tomadas por advogado, empilhadas por tipo de providência"
      accent="green"
    >
      {linhas.length === 0 ? (
        <p className="text-sm text-[var(--color-ivory-66)]">
          Nenhuma medida registrada nos últimos 7 dias.
        </p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={linhas}
              margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
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
                width={28}
              />
              <Tooltip
                cursor={{ fill: tooltipCursorFill }}
                content={<CustomTooltip />}
              />
              {TIPOS_ORDEM.map((tipo, idx) => {
                const meta = TIPO_META[tipo];
                // Arredondamento só no topo da pilha — o último tipo da
                // lista que renderizamos vira o "último segmento" visualmente.
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
