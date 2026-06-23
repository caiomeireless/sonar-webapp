// Sazonalidade da atividade processual — heatmap calendario horizontal
// (1 linha x 12 meses). Cor verde por qtdMedidas (intensidade = volume).
// Mini-indicador no canto superior direito = proporcao de qtdPositivas.
// Server component: CSS grid puro, sem Recharts.

import type { SazonalidadeAtividade as SazonalidadeAtividadeItem } from "@/lib/dashboard-caso";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

type Props = {
  sazonalidade: SazonalidadeAtividadeItem[];
};

const MES_LABEL_CURTO: readonly string[] = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const MES_LABEL_LONGO: readonly string[] = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Verde Sonar (3CFF8A) decomposto em RGB pra mexer no alpha por intensidade.
const SIGNAL_RGB: readonly [number, number, number] = [60, 255, 138];

function corCelula(
  qtd: number,
  max: number,
): { background: string; border: string; textColor: string } {
  if (qtd === 0 || max === 0) {
    return {
      background: "rgba(234, 231, 220, 0.03)",
      border: "1px solid rgba(234, 231, 220, 0.06)",
      textColor: "var(--color-ivory-66)",
    };
  }
  const [r, g, b] = SIGNAL_RGB;
  // sqrt: meses fracos ainda visiveis, picos nao saturam cedo.
  const ratio = Math.sqrt(qtd / max);
  const alpha = 0.12 + ratio * 0.78;
  // Inverte texto em celulas saturadas pra manter contraste.
  const textColor = qtd / max > 0.55 ? "#050706" : "var(--color-ivory)";
  return {
    background: `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`,
    border: `1px solid rgba(${r}, ${g}, ${b}, ${Math.min(1, alpha + 0.12).toFixed(3)})`,
    textColor,
  };
}

export default function SazonalidadeAtividade({ sazonalidade }: Props) {
  const totalMedidas = sazonalidade.reduce((acc, m) => acc + m.qtdMedidas, 0);
  const totalPositivas = sazonalidade.reduce((acc, m) => acc + m.qtdPositivas, 0);
  const maxQtd = sazonalidade.reduce(
    (acc, m) => (m.qtdMedidas > acc ? m.qtdMedidas : acc),
    0,
  );
  const taxaPositiva =
    totalMedidas > 0 ? (totalPositivas / totalMedidas) * 100 : 0;

  return (
    <DashboardCard
      titulo="Sazonalidade da atividade"
      descricao="Volume de medidas por mes nos ultimos 12 meses. Intensidade verde = quantidade; barra inferior = proporcao de resultados positivos."
      accent="green"
      info="Picos de volume revelam janelas processuais ativas. Quando o volume sobe e a barra de positivos cai, vale revisar a estrategia daquela janela."
    >
      {totalMedidas === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--color-ivory-66)]">
          Sem medidas registradas nos ultimos 12 meses.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className="grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${sazonalidade.length}, minmax(0, 1fr))`,
            }}
          >
            {sazonalidade.map((item) => {
              const { background, border, textColor } = corCelula(
                item.qtdMedidas,
                maxQtd,
              );
              const idxMes = item.mes - 1;
              const proporcao =
                item.qtdMedidas > 0 ? item.qtdPositivas / item.qtdMedidas : 0;
              const titleLabel = `${MES_LABEL_LONGO[idxMes]}/${item.ano} - ${item.qtdMedidas} medidas, ${item.qtdPositivas} positivas (${(proporcao * 100).toFixed(0)}%)`;
              return (
                <div
                  key={`${item.ano}-${item.mes}`}
                  className="relative flex flex-col items-center justify-center rounded-md px-1 py-3"
                  style={{ background, border, color: textColor }}
                  title={titleLabel}
                >
                  {/* Mini-indicador de positivas: ponto dourado no canto, opacidade = proporcao. */}
                  {item.qtdPositivas > 0 ? (
                    <span
                      aria-hidden
                      className="absolute right-1 top-1 inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        background: "var(--color-gold)",
                        opacity: 0.35 + proporcao * 0.65,
                        boxShadow: "0 0 4px rgba(201, 162, 74, 0.6)",
                      }}
                    />
                  ) : null}
                  <span className="text-base font-semibold leading-none tabular-nums">
                    {item.qtdMedidas}
                  </span>
                  <span
                    className="mt-1.5 text-[10px] uppercase leading-none tracking-wider"
                    style={{
                      color: textColor,
                      opacity: item.qtdMedidas === 0 ? 1 : 0.7,
                    }}
                  >
                    {MES_LABEL_CURTO[idxMes]}
                  </span>
                  {/* Barra fina inferior: proporcao positivas/total no mes. */}
                  {item.qtdMedidas > 0 ? (
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-0 h-0.5 rounded-b-md"
                      style={{
                        width: `${proporcao * 100}%`,
                        background: "var(--color-gold)",
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-ivory-12)] pt-3 text-[11px] text-[var(--color-ivory-66)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{
                    background: `rgba(${SIGNAL_RGB.join(", ")}, 0.85)`,
                  }}
                />
                <span>Volume de medidas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: "var(--color-gold)",
                    boxShadow: "0 0 4px rgba(201, 162, 74, 0.6)",
                  }}
                />
                <span>Positivas no mes</span>
              </div>
            </div>
            <div className="tabular-nums">
              <span className="text-[var(--color-ivory)]">{totalMedidas}</span>
              <span> medidas - </span>
              <span className="text-[var(--color-ivory)]">{totalPositivas}</span>
              <span> positivas </span>
              <span className="text-[var(--color-ivory-66)]">
                ({taxaPositiva.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
