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
import { SpotlightCard } from "@/components/ui/SpotlightCard";

// Vidro POLIDO com brilho — mesma receita da tela de Início (ditado
// 25/08: dashboard com a arte da tela inicial).
const VIDRO_BRILHO = [
  "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03) 38%, transparent 55%)",
  "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.06) 34%, rgba(255,255,255,0.13) 45%, rgba(255,255,255,0.05) 56%, transparent 72%)",
].join(", ");

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
    <SpotlightCard
      local
      degrade={VIDRO_BRILHO}
      borda="rgba(232, 228, 214, 0.25)"
      className={["overflow-hidden p-6 text-fg", className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      {interactive ? <GlowSpot /> : null}
      <header className="relative mb-4">
        <div
          className={[
            "flex items-center gap-2",
            variant === "premium"
              ? "font-serif text-lg font-medium tracking-[0.02em]"
              : "font-mono text-[13px] font-semibold uppercase tracking-[0.26em]",
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
                className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-line text-[11px] font-medium text-fg-muted transition group-hover:border-line-strong group-hover:text-fg"
              >
                ?
              </span>
              <span className="pointer-events-none invisible absolute left-0 top-full z-50 mt-2 w-80 whitespace-pre-line rounded-lg border border-line-strong bg-surface-solid p-3.5 text-[13px] normal-case leading-relaxed tracking-normal text-fg opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
                {info}
              </span>
            </span>
          ) : null}
        </div>
        {descricao ? (
          <p className="mt-1.5 text-sm leading-snug text-[var(--color-ivory-88)]">
            {descricao}
          </p>
        ) : null}
      </header>
      <div className="relative text-fg">{children}</div>
    </SpotlightCard>
  );
}
