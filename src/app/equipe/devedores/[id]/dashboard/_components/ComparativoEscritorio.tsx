// Comparativo com a media do escritorio — 3 mini barras horizontais lado a
// lado: qtd de bens, valor do patrimonio e qtd de medidas. Cada barra mostra
// "Este caso" vs "Media" + delta percentual. Verde se este caso supera a
// media (sinal bom), gold quando esta abaixo (sinal de atencao).
//
// Server Component: so HTML + CSS, sem Recharts. Recebe dados ja agregados
// de calcularComparativoEscritorio (lib/dashboard-caso.ts).

import type { ComparativoEscritorio as ComparativoEscritorioDados } from "@/lib/dashboard-caso";
import { formatBRL } from "@/lib/format";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  CHART_COLOR_GOLD,
  CHART_COLOR_SIGNAL,
} from "@/components/dashboard/ChartTheme";

type Props = {
  dados: ComparativoEscritorioDados;
};

type FormatadorValor = (n: number) => string;

type Metrica = {
  chave: "qtdBens" | "valorPatrimonio" | "qtdMedidas";
  rotulo: string;
  este: number;
  media: number;
  formatar: FormatadorValor;
};

// Numero formatado com 1 casa decimal quando vem fracionado (medias podem
// vir tipo 4.3), inteiro quando exato. Usa pt-BR pra virgula decimal.
function formatarNumero(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const inteiro = Math.abs(n - Math.round(n)) < 0.05;
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: inteiro ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

// Delta percentual de `este` em relacao a `media`. Quando media=0:
//   - este=0  -> 0% (sem dados pra comparar)
//   - este>0  -> +100% (qualquer coisa contra zero e ganho total)
// Evita Infinity e NaN no render.
function calcularDeltaPct(este: number, media: number): number {
  if (media <= 0) {
    return este > 0 ? 100 : 0;
  }
  return Math.round(((este - media) / media) * 100);
}

// Largura proporcional das barras (este vs media) em uma mesma metrica.
// Base = max(este, media); se ambos forem 0, ambas as barras ficam vazias.
function calcularLargura(valor: number, base: number): number {
  if (base <= 0) return 0;
  return Math.min(100, Math.max(0, (valor / base) * 100));
}

export default function ComparativoEscritorio({ dados }: Props) {
  const metricas: Metrica[] = [
    {
      chave: "qtdBens",
      rotulo: "Bens localizados",
      este: dados.qtdBens.este,
      media: dados.qtdBens.media,
      formatar: formatarNumero,
    },
    {
      chave: "valorPatrimonio",
      rotulo: "Patrimonio (R$)",
      este: dados.valorPatrimonio.este,
      media: dados.valorPatrimonio.media,
      formatar: formatBRL,
    },
    {
      chave: "qtdMedidas",
      rotulo: "Medidas tomadas",
      este: dados.qtdMedidas.este,
      media: dados.qtdMedidas.media,
      formatar: formatarNumero,
    },
  ];

  return (
    <DashboardCard
      titulo="Comparativo com o escritorio"
      descricao="Este caso vs. media dos demais devedores ativos"
      accent="neutral"
      info={
        "Verde: este caso esta acima da media do escritorio.\n" +
        "Gold: este caso esta abaixo da media — pode indicar oportunidade de prospeccao.\n" +
        "Media calculada sobre devedores com pelo menos 1 caso ativo (excluindo este)."
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {metricas.map((m) => {
          const deltaPct = calcularDeltaPct(m.este, m.media);
          const acima = m.este >= m.media;
          const cor = acima ? CHART_COLOR_SIGNAL : CHART_COLOR_GOLD;
          const base = Math.max(m.este, m.media);
          const larguraEste = calcularLargura(m.este, base);
          const larguraMedia = calcularLargura(m.media, base);
          const sinalDelta = deltaPct > 0 ? "+" : "";

          return (
            <div key={m.chave} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="eyebrow text-[var(--color-ivory-66)]">
                  {m.rotulo}
                </span>
                <span
                  className="font-mono text-[11px] tabular-nums"
                  style={{ color: cor }}
                >
                  {sinalDelta}
                  {deltaPct}%
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {/* ESTE CASO */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] text-[var(--color-ivory-66)]">
                      Este caso
                    </span>
                    <span
                      className="shrink-0 font-mono text-xs tabular-nums"
                      style={{ color: cor }}
                    >
                      {m.formatar(m.este)}
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-ivory-12)]"
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${larguraEste}%`,
                        background: cor,
                        boxShadow:
                          larguraEste > 0
                            ? acima
                              ? "0 0 6px rgba(60, 255, 138, 0.4)"
                              : "0 0 6px rgba(201, 162, 74, 0.4)"
                            : "none",
                      }}
                    />
                  </div>
                </div>

                {/* MEDIA DO ESCRITORIO */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[11px] text-[var(--color-ivory-66)]">
                      Media
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--color-ivory-66)]">
                      {m.formatar(m.media)}
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-ivory-12)]"
                  >
                    <div
                      className="h-full rounded-full bg-[var(--color-ivory-22)] transition-[width] duration-500"
                      style={{ width: `${larguraMedia}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
