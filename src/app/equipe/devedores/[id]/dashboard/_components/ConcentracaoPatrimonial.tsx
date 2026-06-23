"use client";

// Concentração patrimonial — mini-donut + KPI lateral.
// Donut em 2 fatias: bem dominante (topBemPct) x resto.
// KPI: "Top 1 = X%" + nome/tipo do bem. Subtítulo: Herfindahl + faixa.
//
// CLIENT por causa do Recharts (ResponsiveContainer mede o DOM).
// Recebe já agregado em `dados: ConcentracaoPatrimonial` — page passa.

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import type { TipoBem } from "@/lib/mock-fixtures";
import type { ConcentracaoPatrimonial as ConcentracaoData } from "@/lib/dashboard-caso";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { TIPO_BEM_COLORS } from "@/components/dashboard/ChartTheme";

// Label PT-BR por tipo de bem. Inline pra manter consistência com o resto
// do dashboard — não há export central de TIPO_META pra bens.
const TIPO_LABEL: Record<TipoBem, string> = {
  veiculo: "Veículo",
  imovel: "Imóvel",
  empresa: "Participação societária",
  processo_credito: "Processo onde é credor",
  endereco: "Endereço",
  vinculo: "Vínculo familiar",
};

// Faixas do Herfindahl (HHI normalizado 0..1):
//   < 0.25  diversificado
//   0.25..0.5 moderado
//   > 0.5   concentrado
function classificarHHI(hhi: number): {
  label: string;
  cor: string;
  descricao: string;
} {
  if (hhi > 0.5) {
    return {
      label: "concentrado",
      cor: "#FF5B5B",
      descricao: "patrimônio depende de poucos bens",
    };
  }
  if (hhi >= 0.25) {
    return {
      label: "moderado",
      cor: "var(--color-gold)",
      descricao: "concentração média",
    };
  }
  return {
    label: "diversificado",
    cor: "var(--color-signal)",
    descricao: "patrimônio bem distribuído",
  };
}

type Props = {
  dados: ConcentracaoData;
};

export default function ConcentracaoPatrimonial({ dados }: Props) {
  const { topBemPct, topBemTitulo, topBemTipo, indiceHerfindahl } = dados;

  // Sem bens com valor — page já zerou; mostra placeholder.
  if (topBemPct === 0 || !topBemTitulo) {
    return (
      <DashboardCard
        titulo="Concentração patrimonial"
        descricao="Peso do maior bem sobre o total"
        accent="gold"
      >
        <div className="flex h-48 items-center justify-center text-sm text-[var(--color-ivory-66)]">
          Sem bens com valor estimado.
        </div>
      </DashboardCard>
    );
  }

  const topPct = Math.max(0, Math.min(100, topBemPct));
  const restoPct = Math.max(0, 100 - topPct);

  const corTop = TIPO_BEM_COLORS[topBemTipo] ?? "var(--color-gold)";
  const corResto = "rgba(234, 231, 220, 0.16)";

  const slices = [
    { name: "Top 1", value: topPct, fill: corTop },
    { name: "Resto", value: restoPct, fill: corResto },
  ];

  const hhi = classificarHHI(indiceHerfindahl);
  const tipoLabel = TIPO_LABEL[topBemTipo] ?? topBemTipo;

  return (
    <DashboardCard
      titulo="Concentração patrimonial"
      descricao="Peso do maior bem sobre o total"
      accent="gold"
      info={
        "Mostra o quanto o patrimônio do devedor depende de um único bem.\n\n" +
        "Top 1: percentual do bem mais valioso sobre o total.\n\n" +
        "Índice Herfindahl (HHI): soma dos quadrados das fatias.\n" +
        "  < 0.25 diversificado (vários bens equivalentes)\n" +
        "  0.25 a 0.5 moderado\n" +
        "  > 0.5 concentrado (poucos bens carregam o caso)\n\n" +
        "Caso concentrado = risco alto: perder o bem dominante esvazia a execução."
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
        {/* MINI-DONUT */}
        <div className="chart-neon-glow relative mx-auto h-32 w-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="65%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                stroke="var(--color-carbon)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map((s) => (
                  <Cell key={s.name} fill={s.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ivory-66)]">
              Top 1
            </span>
            <span
              className="mt-0.5 text-xl font-medium tabular-nums tracking-tight"
              style={{ color: corTop }}
            >
              {topPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* KPI LATERAL */}
        <div className="flex min-w-0 flex-col gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ivory-66)]">
              Bem dominante
            </div>
            <div className="mt-1 truncate text-base font-medium text-[var(--color-ivory)]">
              {topBemTitulo}
            </div>
            <div
              className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em]"
              style={{ color: corTop }}
            >
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: corTop }}
              />
              {tipoLabel}
            </div>
          </div>

          <div className="mt-1 rounded-md border border-[var(--color-ivory-12)] px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ivory-66)]">
                Herfindahl
              </span>
              <span className="text-sm tabular-nums text-[var(--color-ivory)]">
                {indiceHerfindahl.toFixed(3)}
              </span>
            </div>
            <div
              className="mt-1 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em]"
              style={{ color: hhi.cor }}
            >
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: hhi.cor }}
              />
              {hhi.label}
            </div>
            <p className="mt-1 text-[11px] normal-case leading-relaxed text-[var(--color-ivory-66)]">
              {hhi.descricao}
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
