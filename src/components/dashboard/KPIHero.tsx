// KPI Hero — card destaque de métrica numérica grande.
// Usado nas 4 a 8 métricas principais no topo do dashboard.
// Valor já vem formatado (string) pra evitar acoplamento com Intl.
//
// Padrão tipográfico: número `text-4xl md:text-5xl font-medium tabular-nums
// tracking-tight` na cor do `accent` (signal/gold/ivory). Espelho do "número
// gigante dourado" do BP CRM, adaptado pra paleta Sonar (gold→signal).

import {
  DashboardCard,
  type DashboardCardAccent,
} from "@/components/dashboard/DashboardCard";

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
  // Ativa o "blob de luz" signal no canto + ring 1px de destaque.
  // Replicar o card destacado do Painel2 do BP.
  destaque?: boolean;
};

// Cores brand mantidas (signal/danger) — neutral usa fg-muted semântico.
const DIRECTION_COLOR: Record<KPIDelta["direction"], string> = {
  up: "var(--color-signal)",
  down: "var(--color-danger)",
  neutral: "var(--color-fg-muted)",
};

const DIRECTION_ARROW: Record<KPIDelta["direction"], string> = {
  up: "↑",
  down: "↓",
  neutral: "→",
};

// Cor do número por accent — verde signal é default (substituiu o gold do BP).
// Brand literais nos accents; neutral usa o token semântico fg.
const VALUE_COLOR: Record<DashboardCardAccent, string> = {
  green: "var(--color-signal)",
  gold: "var(--color-gold)",
  neutral: "var(--color-fg)",
};

export function KPIHero({
  titulo,
  valor,
  subtitulo,
  delta,
  accent = "green",
  info,
  destaque = false,
}: Props) {
  const valueColor = VALUE_COLOR[accent];
  return (
    <DashboardCard
      titulo={titulo}
      accent={accent}
      info={info}
      className={[
        "relative overflow-hidden",
        destaque
          ? accent === "gold"
            ? "ring-1 ring-[rgba(201,162,74,0.20)]"
            : "ring-1 ring-[rgba(60,255,138,0.20)]"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {destaque ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full blur-2xl"
          style={{
            background:
              accent === "gold"
                ? "rgba(201, 162, 74, 0.12)"
                : "rgba(60, 255, 138, 0.10)",
          }}
        />
      ) : null}
      <p
        className="mt-3 text-4xl font-medium leading-none tabular-nums tracking-tight md:text-5xl"
        style={{ color: valueColor }}
      >
        {valor}
      </p>
      {subtitulo ? (
        <p className="mt-2 text-xs text-fg-faint">{subtitulo}</p>
      ) : null}
      {delta ? (
        <div
          className="mt-2 inline-flex items-center gap-1.5 text-xs"
          style={{ color: DIRECTION_COLOR[delta.direction] }}
        >
          <span aria-hidden className="text-xs leading-none">
            {DIRECTION_ARROW[delta.direction]}
          </span>
          <span className="font-medium tabular-nums">{delta.value}</span>
          {delta.label ? (
            <span className="text-fg-muted">{delta.label}</span>
          ) : null}
        </div>
      ) : null}
    </DashboardCard>
  );
}
