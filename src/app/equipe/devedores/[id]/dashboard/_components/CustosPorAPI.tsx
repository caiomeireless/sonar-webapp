// Top 5 APIs com maior gasto no devedor. Mini-barras proporcionais ao maior
// gasto da lista (nao ao total) — assim a barra do #1 sempre preenche 100% e
// as demais sao lidas em comparacao. Total acumulado vai no rodape.
//
// Recebe dados ja agregados — a page chama obterDadosDashboardCaso.
// Server Component: nao precisa de Recharts (lista simples + divs).

import type { DashboardCustoApi } from "@/lib/dashboard-caso";
import { formatBRL } from "@/lib/format";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { CHART_COLOR_GOLD } from "@/components/dashboard/ChartTheme";

type Props = {
  dados: DashboardCustoApi[];
};

export default function CustosPorAPI({ dados }: Props) {
  const total = dados.reduce((s, d) => s + d.custoBrl, 0);
  // Base de proporcao = maior gasto. Se total/maior for 0, barras viram 0%.
  const maior = dados.reduce((m, d) => (d.custoBrl > m ? d.custoBrl : m), 0);

  return (
    <DashboardCard
      titulo="Custos por API"
      descricao="Top 5 fontes de dados pagas neste devedor"
      accent="gold"
    >
      {dados.length === 0 ? (
        <p className="text-sm text-[var(--color-ivory-66)]">
          Nenhuma consulta paga registrada neste devedor.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {dados.map((item) => {
              const pct = maior > 0 ? (item.custoBrl / maior) * 100 : 0;
              return (
                <li
                  key={item.api}
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm text-[var(--color-ivory)]">
                      {item.api}
                    </span>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-[var(--color-ivory)]">
                      {formatBRL(item.custoBrl)}
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-ivory-12)]"
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${pct}%`,
                        background: CHART_COLOR_GOLD,
                        boxShadow:
                          pct > 0
                            ? "0 0 6px rgba(201, 162, 74, 0.4)"
                            : "none",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <footer className="mt-5 flex items-baseline justify-between border-t border-[var(--color-ivory-12)] pt-3">
            <span className="eyebrow text-[var(--color-ivory-66)]">
              Total acumulado
            </span>
            <span className="font-mono text-lg font-medium tabular-nums text-[var(--color-gold)]">
              {formatBRL(total)}
            </span>
          </footer>
        </>
      )}
    </DashboardCard>
  );
}
