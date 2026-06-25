// Header glass do dossie: eyebrow gigante "DOSSIE PATRIMONIAL", icone PF/PJ,
// nome serif gold, badges (tipo + status + ultima consulta).
// Quando `dashboardHref` for null, NAO renderiza o atalho Dashboard Analitico
// (visao do cliente nao tem dashboard analitico).
import Link from "next/link";
import { ArrowRight, BarChart3, Building2, User } from "lucide-react";
import { formatTempoRelativo } from "@/lib/format";

export type DevedorHeader = {
  id: number;
  nome: string;
  tipo: "PF" | "PJ";
  documento: string;
  data_nascimento?: string | null;
  nome_mae?: string | null;
  criado_em: string;
  ultima_consulta_em?: string | null;
};

export function HeaderDossie({
  devedor,
  statusLabel,
  statusColor,
  dashboardHref,
}: {
  devedor: DevedorHeader;
  statusLabel: string;
  statusColor: string;
  dashboardHref: string | null;
}) {
  return (
    <header className="mt-10">
      <div className="glass mx-auto max-w-[1100px] px-8 py-10 sm:px-12 sm:py-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--color-gold)]/35 bg-gradient-to-br from-[rgba(201,162,74,0.18)] to-[rgba(201,162,74,0.04)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            {devedor.tipo === "PJ" ? (
              <Building2 className="h-6 w-6 text-[var(--color-gold)]" />
            ) : (
              <User className="h-6 w-6 text-[var(--color-gold)]" />
            )}
          </div>

          <div className="inline-flex items-center gap-4">
            <span
              aria-hidden="true"
              className="inline-block h-px w-12 bg-[var(--color-signal)] opacity-70 sm:w-16"
            />
            <span className="font-mono font-medium uppercase tracking-[0.32em] text-[var(--color-signal)] text-[clamp(20px,2.6vw,32px)]">
              Dossiê Patrimonial
            </span>
            <span
              aria-hidden="true"
              className="inline-block h-px w-12 bg-[var(--color-signal)] opacity-70 sm:w-16"
            />
          </div>
        </div>

        <h1 className="nome-devedor mt-5 break-words font-serif text-[clamp(24px,3.5vw,44px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-devedor)]">
          {devedor.nome}
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <BadgeFicha
            label={devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
            color="var(--color-gold)"
          />
          <BadgeFicha label={statusLabel} color={statusColor} dot />
          {devedor.ultima_consulta_em ? (
            <BadgeFicha
              label={`Última Consulta ${formatTempoRelativo(devedor.ultima_consulta_em)}`}
              color="var(--color-ivory-66)"
            />
          ) : null}
        </div>

        {dashboardHref ? (
          <Link href={dashboardHref} className="btn-neon-signal group mt-6">
            <BarChart3
              className="h-5 w-5"
              style={{
                color: "#FF6B00",
                filter:
                  "drop-shadow(0 0 6px rgba(255,107,0,0.85)) drop-shadow(0 0 12px rgba(255,107,0,0.45))",
              }}
              aria-hidden="true"
            />
            Dashboard Analítico
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
    </header>
  );
}

function BadgeFicha({
  label,
  color,
  dot = false,
}: {
  label: string;
  color: string;
  dot?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[12px] uppercase tracking-[0.22em]"
      style={{
        borderColor: color,
        color,
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      ) : null}
      {label}
    </span>
  );
}
