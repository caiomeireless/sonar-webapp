// Card base do Dashboard do Caso — wrapper visual reutilizavel.
// Toda secao do dashboard (KPI, grafico, lista) entra dentro de um destes.
// Mantem padding, borda e tipografia consistentes; o conteudo varia.
import type { ReactNode } from "react";

export type DashboardCardAccent = "green" | "gold" | "neutral";

const ACCENT_COLOR: Record<DashboardCardAccent, string> = {
  green: "var(--color-signal)",
  gold: "var(--color-gold)",
  neutral: "var(--color-ivory-66)",
};

type Props = {
  titulo: string;
  descricao?: string;
  children: ReactNode;
  accent?: DashboardCardAccent;
  className?: string;
};

export function DashboardCard({
  titulo,
  descricao,
  children,
  accent = "neutral",
  className,
}: Props) {
  const accentColor = ACCENT_COLOR[accent];
  return (
    <section
      className={[
        "rounded-xl border bg-[var(--color-carbon)] p-5",
        "border-[var(--color-ivory-12)]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="mb-4">
        <div
          className="eyebrow flex items-center gap-2"
          style={{ color: accentColor }}
        >
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: accentColor,
              boxShadow:
                accent === "green"
                  ? "0 0 8px rgba(60, 255, 138, 0.6)"
                  : accent === "gold"
                    ? "0 0 8px rgba(201, 162, 74, 0.5)"
                    : "none",
            }}
          />
          {titulo}
        </div>
        {descricao ? (
          <p className="mt-1.5 text-xs text-[var(--color-ivory-66)]">
            {descricao}
          </p>
        ) : null}
      </header>
      <div className="text-[var(--color-ivory)]">{children}</div>
    </section>
  );
}
