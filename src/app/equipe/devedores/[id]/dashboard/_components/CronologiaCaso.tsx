// Cronologia do Caso — timeline horizontal scrollável com 6 marcos canônicos.
// Cada marco mostra check verde (completo) ou círculo cinza (pendente),
// com a data abaixo. Linha conectora liga os marcos; o próximo pendente
// recebe um anel dourado em destaque.
//
// Server component: não usa Recharts nem estado — scroll horizontal é
// puro CSS (overflow-x-auto).

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  CHART_COLOR_SIGNAL,
  CHART_COLOR_GOLD,
} from "@/components/dashboard/ChartTheme";
import { formatData } from "@/lib/format";
import type { CronologiaItem } from "@/lib/dashboard-caso";

type Props = {
  cronologia: CronologiaItem[];
};

export default function CronologiaCaso({ cronologia }: Props) {
  // Ordena por `ordem` defensivamente — a métrica já vem ordenada, mas
  // se algum dia o agregador mudar isso protege a UI.
  const itens = [...cronologia].sort((a, b) => a.ordem - b.ordem);

  // Próximo pendente = primeiro item sem data, na ordem. Recebe destaque
  // visual (ring dourado) pra orientar o advogado pra ação seguinte.
  const proximoPendenteOrdem =
    itens.find((it) => !it.completo)?.ordem ?? null;

  const completos = itens.filter((it) => it.completo).length;
  const total = itens.length;

  return (
    <DashboardCard
      titulo="Cronologia do caso"
      descricao={`${completos} de ${total} marcos concluídos`}
      accent="gold"
      info="Marcos processuais canônicos do caso. Verde = concluído com data registrada. Cinza = pendente. O próximo pendente fica destacado em ouro."
    >
      <div className="overflow-x-auto pb-2">
        <ol
          className="relative flex min-w-max items-start gap-0 px-2 pt-2"
          aria-label="Cronologia processual"
        >
          {itens.map((item, idx) => {
            const isUltimo = idx === itens.length - 1;
            const proximo = itens[idx + 1];
            // Cor da linha conectora: verde se AMBOS os marcos (atual e
            // próximo) estão completos; senão cinza neutro.
            const conectorCompleto =
              item.completo && !!proximo?.completo;
            const isProximoPendente =
              item.ordem === proximoPendenteOrdem;

            return (
              <li
                key={item.ordem}
                className="relative flex min-w-[140px] flex-col items-center"
              >
                {/* Linha conectora — vai do centro deste marco até o próximo */}
                {!isUltimo ? (
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-5 h-px w-full"
                    style={{
                      background: conectorCompleto
                        ? CHART_COLOR_SIGNAL
                        : "var(--color-ivory-12)",
                      opacity: conectorCompleto ? 0.5 : 1,
                    }}
                  />
                ) : null}

                {/* Marcador circular */}
                <span
                  aria-hidden
                  className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border"
                  style={{
                    background: item.completo
                      ? "rgba(60, 255, 138, 0.12)"
                      : "var(--color-carbon)",
                    borderColor: item.completo
                      ? CHART_COLOR_SIGNAL
                      : isProximoPendente
                        ? CHART_COLOR_GOLD
                        : "var(--color-ivory-22)",
                    boxShadow: isProximoPendente
                      ? `0 0 0 3px rgba(201, 162, 74, 0.18), 0 0 12px rgba(201, 162, 74, 0.35)`
                      : item.completo
                        ? "0 0 8px rgba(60, 255, 138, 0.3)"
                        : "none",
                  }}
                >
                  {item.completo ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M2.5 7.2l3 3 6-6"
                        stroke={CHART_COLOR_SIGNAL}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: isProximoPendente
                          ? CHART_COLOR_GOLD
                          : "var(--color-ivory-22)",
                      }}
                    />
                  )}
                </span>

                {/* Número de ordem do marco */}
                <span
                  className="mt-2 font-mono text-[10px] uppercase tracking-wider"
                  style={{
                    color: isProximoPendente
                      ? CHART_COLOR_GOLD
                      : "var(--color-ivory-66)",
                  }}
                >
                  {String(item.ordem).padStart(2, "0")}
                </span>

                {/* Nome do evento */}
                <span
                  className="mt-1 px-2 text-center text-xs leading-tight"
                  style={{
                    color: item.completo
                      ? "var(--color-ivory)"
                      : isProximoPendente
                        ? "var(--color-ivory)"
                        : "var(--color-ivory-66)",
                    fontWeight: isProximoPendente ? 500 : 400,
                  }}
                >
                  {item.evento}
                </span>

                {/* Data ou "Pendente" */}
                <span
                  className="mt-1 font-mono text-[10px]"
                  style={{
                    color: item.completo
                      ? CHART_COLOR_SIGNAL
                      : isProximoPendente
                        ? CHART_COLOR_GOLD
                        : "var(--color-ivory-66)",
                    opacity: item.completo ? 0.85 : 1,
                  }}
                >
                  {item.completo ? formatData(item.data) : "Pendente"}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </DashboardCard>
  );
}
