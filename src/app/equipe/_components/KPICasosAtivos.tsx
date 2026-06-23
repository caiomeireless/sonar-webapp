// KPI hero do Dashboard da Plataforma — casos ativos total (inteiro).
// Acompanha mini-barra empilhada com breakdown ativos/pausados/encerrados,
// pra dar contexto do total sem ocupar outro card.

import { DashboardCard } from "@/components/dashboard/DashboardCard";

type Props = {
  ativos: number;
  pausados: number;
  encerrados: number;
};

const COR_ATIVO = "var(--color-signal)";
const COR_PAUSADO = "var(--color-gold)";
const COR_ENCERRADO = "var(--color-ivory-22)";

export default function KPICasosAtivos({
  ativos,
  pausados,
  encerrados,
}: Props) {
  // Total inclui todos os status — denominador da barra empilhada.
  // Se zerado, evitamos divisão por zero exibindo a barra "vazia".
  const total = ativos + pausados + encerrados;
  const pctAtivos = total > 0 ? (ativos / total) * 100 : 0;
  const pctPausados = total > 0 ? (pausados / total) * 100 : 0;
  const pctEncerrados = total > 0 ? (encerrados / total) * 100 : 0;

  const subtitulo = `${ativos} ativos / ${pausados} pausados / ${encerrados} encerrados`;

  return (
    <DashboardCard titulo="Casos ativos" accent="green">
      <div className="flex flex-col gap-3">
        <div className="text-4xl font-medium leading-none tracking-tight text-[var(--color-ivory)]">
          {ativos.toLocaleString("pt-BR")}
        </div>

        <div
          className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-ivory-12)]"
          role="img"
          aria-label={`Distribuição: ${subtitulo}`}
        >
          {pctAtivos > 0 ? (
            <span
              className="h-full"
              style={{
                width: `${pctAtivos}%`,
                background: COR_ATIVO,
                boxShadow: "0 0 6px rgba(60, 255, 138, 0.45)",
              }}
            />
          ) : null}
          {pctPausados > 0 ? (
            <span
              className="h-full"
              style={{ width: `${pctPausados}%`, background: COR_PAUSADO }}
            />
          ) : null}
          {pctEncerrados > 0 ? (
            <span
              className="h-full"
              style={{ width: `${pctEncerrados}%`, background: COR_ENCERRADO }}
            />
          ) : null}
        </div>

        <p className="text-xs text-[var(--color-ivory-66)]">{subtitulo}</p>
      </div>
    </DashboardCard>
  );
}
