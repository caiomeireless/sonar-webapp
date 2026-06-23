// Proximos atos processuais — timeline vertical do Dashboard do Caso.
// Lista atos com prazo fatal, dias restantes e badge de urgencia.
// Dados ja chegam ordenados/agregados pela page (calcularProximosAtosProcessuais).
// MOCK por enquanto — quando Themis API entregar prazos fatais reais,
// substituir a fonte em dashboard-caso.ts mantendo a interface ProximoAtoProcessual.
//
// Server component: sem estado, sem Recharts, so render.

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { ProximoAtoProcessual } from "@/lib/dashboard-caso";

type Urgencia = ProximoAtoProcessual["urgencia"];

const URGENCIA_RANK: Record<Urgencia, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

const URGENCIA_LABEL: Record<Urgencia, string> = {
  alta: "Alta",
  media: "Media",
  baixa: "Baixa",
};

// Cores rgba literais — o badge precisa de fill + border com alpha,
// e usar CSS vars dentro de rgba() nao funciona consistente.
const URGENCIA_BADGE: Record<
  Urgencia,
  { fg: string; bg: string; border: string; dot: string }
> = {
  alta: {
    fg: "#FF5B5B",
    bg: "rgba(255, 91, 91, 0.10)",
    border: "rgba(255, 91, 91, 0.35)",
    dot: "#FF5B5B",
  },
  media: {
    fg: "#F4C542",
    bg: "rgba(244, 197, 66, 0.10)",
    border: "rgba(244, 197, 66, 0.35)",
    dot: "#F4C542",
  },
  baixa: {
    fg: "rgba(234, 231, 220, 0.66)",
    bg: "rgba(234, 231, 220, 0.05)",
    border: "rgba(234, 231, 220, 0.18)",
    dot: "rgba(234, 231, 220, 0.55)",
  },
};

function formatarDataBR(iso: string): string {
  // iso vem no formato 'YYYY-MM-DD' do helper — Date() interpreta como UTC
  // e pode trocar o dia em TZ negativa; partimos pelos componentes.
  const [yyyy, mm, dd] = iso.split("-");
  if (!yyyy || !mm || !dd) return iso;
  return `${dd}/${mm}/${yyyy}`;
}

function formatarDias(dias: number): string {
  if (dias < 0) return `${Math.abs(dias)} dias em atraso`;
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "1 dia restante";
  return `${dias} dias restantes`;
}

type Props = {
  atos: ProximoAtoProcessual[];
};

export default function ProximosAtosProcessuais({ atos }: Props) {
  const ordenados = [...atos].sort(
    (a, b) =>
      URGENCIA_RANK[a.urgencia] - URGENCIA_RANK[b.urgencia] ||
      a.diasRestantes - b.diasRestantes,
  );

  const accent = ordenados.some((a) => a.urgencia === "alta")
    ? "gold"
    : "neutral";

  return (
    <DashboardCard
      titulo="Proximos atos processuais"
      descricao="Prazos fatais ordenados por urgencia"
      accent={accent}
      info="Lista mock ate a integracao com a API do Themis. A urgencia e calculada pelos dias restantes ate o prazo fatal: alta (<=10 dias), media (<=30), baixa (>30)."
    >
      {ordenados.length === 0 ? (
        <p className="text-sm text-[var(--color-ivory-66)]">
          Nenhum prazo fatal mapeado para este caso.
        </p>
      ) : (
        <ol className="relative space-y-4">
          {/* trilho vertical da timeline */}
          <span
            aria-hidden
            className="absolute left-[7px] top-1 bottom-1 w-px"
            style={{ background: "var(--color-ivory-12)" }}
          />

          {ordenados.map((ato, idx) => {
            const cores = URGENCIA_BADGE[ato.urgencia];
            return (
              <li
                key={`${ato.ato}-${idx}`}
                className="relative pl-6"
              >
                {/* no na timeline */}
                <span
                  aria-hidden
                  className="absolute left-0 top-1.5 inline-block h-3.5 w-3.5 rounded-full border-2"
                  style={{
                    background: "var(--color-carbon)",
                    borderColor: cores.dot,
                    boxShadow:
                      ato.urgencia === "alta"
                        ? `0 0 8px ${cores.dot}66`
                        : "none",
                  }}
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-[var(--color-ivory)]">
                      {ato.ato}
                    </p>
                    <p className="mt-1 flex items-baseline gap-2 text-xs text-[var(--color-ivory-66)]">
                      <span className="font-mono tracking-tight">
                        {formatarDataBR(ato.prazoFatal)}
                      </span>
                      <span aria-hidden>•</span>
                      <span>{formatarDias(ato.diasRestantes)}</span>
                    </p>
                  </div>

                  <span
                    className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                    style={{
                      color: cores.fg,
                      background: cores.bg,
                      borderColor: cores.border,
                    }}
                  >
                    {URGENCIA_LABEL[ato.urgencia]}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </DashboardCard>
  );
}
