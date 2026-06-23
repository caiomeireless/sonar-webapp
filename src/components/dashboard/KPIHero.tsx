// KPI Hero — card destaque de metrica numerica grande.
// Usado nas 4 a 8 metricas principais no topo do dashboard.
// Valor ja vem formatado (string) pra evitar acoplamento com Intl.

import { DashboardCard, type DashboardCardAccent } from "@/components/dashboard/DashboardCard";

export type KPIDelta = {
  value: string;
  direction: "up" | "down" | "neutral";
  label?: string;
};

type Props = {
  titulo: string;
  valor: string;
  subtitulo?: string;
  delta?: KPIDelta;
  accent?: DashboardCardAccent;
  info?: string;
};

const DIRECTION_COLOR: Record<KPIDelta["direction"], string> = {
  up: "var(--color-signal)",
  down: "#ff5b5b",
  neutral: "var(--color-ivory-66)",
};

const DIRECTION_ARROW: Record<KPIDelta["direction"], string> = {
  up: "↑",
  down: "↓",
  neutral: "→",
};

export function KPIHero({
  titulo,
  valor,
  subtitulo,
  delta,
  accent = "green",
  info,
}: Props) {
  return (
    <DashboardCard titulo={titulo} accent={accent} info={info}>
      <div className="flex flex-col gap-2">
        <div className="text-4xl font-medium leading-none tracking-tight text-[var(--color-ivory)]">
          {valor}
        </div>
        {subtitulo ? (
          <p className="text-xs text-[var(--color-ivory-66)]">{subtitulo}</p>
        ) : null}
        {delta ? (
          <div
            className="mt-1 inline-flex items-center gap-1.5 text-xs"
            style={{ color: DIRECTION_COLOR[delta.direction] }}
          >
            <span aria-hidden className="text-sm leading-none">
              {DIRECTION_ARROW[delta.direction]}
            </span>
            <span className="font-medium">{delta.value}</span>
            {delta.label ? (
              <span className="text-[var(--color-ivory-66)]">
                {delta.label}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </DashboardCard>
  );
}
