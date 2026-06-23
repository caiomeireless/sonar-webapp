// Card base do Dashboard do Caso — wrapper visual reutilizável.
// Toda seção do dashboard (KPI, gráfico, lista) entra dentro de um destes.
// Mantém padding, borda e tipografia consistentes; o conteúdo varia.
//
// Padrão visual: glass nível 1 (surface-1 + blur 18px + sombra dirigida -16px)
// + borda var(--color-line) + rounded-2xl. Espelho do `.glass` do BP CRM.
//
// SSR-safe: o componente em si é server. O efeito GlowCard (cursor-follow)
// fica num sub-componente client (`./GlowSpot`) montado só quando interactive=true.
import type { ReactNode } from "react";
import { GlowSpot } from "./GlowSpot";

export type DashboardCardAccent = "green" | "gold" | "neutral";
export type DashboardCardVariant = "default" | "premium";

// Cores brand mantidas literais nos bullets (assinatura visual intencional).
// `neutral` usa o token semântico fg-muted (alias de ivory-66).
const ACCENT_COLOR: Record<DashboardCardAccent, string> = {
  green: "var(--color-signal)",
  gold: "var(--color-gold)",
  neutral: "var(--color-fg-muted)",
};

const ACCENT_GLOW: Record<DashboardCardAccent, string> = {
  green: "0 0 10px rgba(60, 255, 138, 0.55)",
  gold: "0 0 10px rgba(201, 162, 74, 0.5)",
  neutral: "none",
};

type Props = {
  titulo: string;
  descricao?: string;
  children: ReactNode;
  accent?: DashboardCardAccent;
  className?: string;
  // Texto opcional que aparece num popover ao passar mouse no "?" ao lado
  // do título. CSS-only via group-hover (sem JS).
  info?: string;
  // Ativa o efeito GlowCard: spot signal que segue o cursor + hover border signal.
  interactive?: boolean;
  // `default` = eyebrow JetBrains uppercase tracking 0.32em.
  // `premium` = header serif (Cormorant) — usar em 1-2 cards "hero" do dashboard.
  variant?: DashboardCardVariant;
};

export function DashboardCard({
  titulo,
  descricao,
  children,
  accent = "neutral",
  className,
  info,
  interactive = false,
  variant = "default",
}: Props) {
  const accentColor = ACCENT_COLOR[accent];
  const accentGlow = ACCENT_GLOW[accent];

  return (
    <section
      className={[
        "glass p-5 text-fg",
        interactive ? "glow-card" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {interactive ? <GlowSpot /> : null}
      <header className="relative mb-4">
        <div
          className={[
            "flex items-center gap-2",
            variant === "premium"
              ? "font-serif text-base font-medium tracking-[0.02em]"
              : "eyebrow",
          ].join(" ")}
          style={variant === "premium" ? undefined : { color: accentColor }}
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: accentColor,
              boxShadow: accentGlow,
            }}
          />
          {titulo}
          {info ? (
            <span className="group relative ml-1 inline-flex">
              <span
                aria-label="Mais informações"
                className="flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-line text-[10px] font-medium text-fg-muted transition group-hover:border-line-strong group-hover:text-fg"
              >
                ?
              </span>
              <span className="pointer-events-none invisible absolute left-0 top-full z-50 mt-2 w-72 whitespace-pre-line rounded-lg border border-line-strong bg-surface-solid p-3 text-[11px] normal-case leading-relaxed tracking-normal text-fg opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
                {info}
              </span>
            </span>
          ) : null}
        </div>
        {descricao ? (
          <p className="mt-1 text-xs text-fg-muted">
            {descricao}
          </p>
        ) : null}
      </header>
      <div className="relative text-fg">{children}</div>
    </section>
  );
}
