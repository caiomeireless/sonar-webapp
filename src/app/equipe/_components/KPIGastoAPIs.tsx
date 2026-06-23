// KPI gold do Dashboard da Plataforma: gasto em APIs no mês corrente
// com barra de progresso contra o teto mensal. A cor da barra muda em
// faixas (< 70% verde, 70-90% gold, > 90% vermelho) pra dar leitura
// imediata de quão perto do estouro a equipe está.

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { formatBRL } from "@/lib/format";

type Props = {
  gastoMes: number;
  limite: number;
};

// Limites das faixas. Acima de 90% vira vermelho — ainda sem estourar
// o teto, mas já em alerta. Igual ou maior que 100% trata como vermelho
// "cheio" (clampa visualmente em 100% pra barra não transbordar).
const FAIXA_AVISO = 0.7;
const FAIXA_ALERTA = 0.9;

function corDaFaixa(razao: number): string {
  if (razao >= FAIXA_ALERTA) return "#ff5b5b";
  if (razao >= FAIXA_AVISO) return "var(--color-gold)";
  return "var(--color-signal)";
}

export default function KPIGastoAPIs({ gastoMes, limite }: Props) {
  const temLimite = limite > 0;
  const razao = temLimite ? gastoMes / limite : 0;
  const larguraPct = Math.min(100, Math.max(0, razao * 100));
  const cor = corDaFaixa(razao);
  const percentLabel = `${Math.round(razao * 100)}%`;

  return (
    <DashboardCard titulo="Gasto em APIs (mês)" accent="gold">
      <div className="flex flex-col gap-3">
        <div className="text-4xl font-medium leading-none tracking-tight text-[var(--color-ivory)]">
          {formatBRL(gastoMes)}
        </div>

        {temLimite ? (
          <>
            <div className="flex items-center justify-between text-xs text-[var(--color-ivory-66)]">
              <span>
                de <span className="text-[var(--color-ivory)]">{formatBRL(limite)}</span>
              </span>
              <span className="font-medium" style={{ color: cor }}>
                {percentLabel}
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-ivory-12)]"
              role="progressbar"
              aria-valuenow={Math.round(razao * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Uso do limite mensal de APIs"
            >
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${larguraPct}%`,
                  background: cor,
                  boxShadow: `0 0 8px ${cor}`,
                }}
              />
            </div>
          </>
        ) : (
          <p className="text-xs text-[var(--color-ivory-66)]">
            Sem limite definido
          </p>
        )}
      </div>
    </DashboardCard>
  );
}
