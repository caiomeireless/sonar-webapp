// Card de caso vinculado: numero + Pasta # + Credor + Credito + status.
// Prop `mostrarAdvogado` (default true) controla a linha do email do advogado
// responsavel — cliente passa false (nao mostra email interno).
import { Hash } from "lucide-react";
import { formatBRL, formatStatus } from "@/lib/format";
import type { CasoResumo } from "@/lib/casos";

export function CardCasoVinculado({
  caso,
  mostrarAdvogado = true,
}: {
  caso: CasoResumo;
  mostrarAdvogado?: boolean;
}) {
  const status = formatStatus(caso.status);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.5)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-mono text-base text-[var(--color-ivory-66)]">
          {caso.numero_processo || "Sem processo cadastrado"}
        </p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          <Hash className="h-3 w-3" />
          Pasta {caso.id}
        </span>
        <p className="mt-1 text-xl text-ivory">
          Credor:{" "}
          <span className="text-[var(--color-gold)]">{caso.credor.nome}</span>
        </p>
        <p className="mt-1 text-xl text-ivory">
          Crédito:{" "}
          <span className="text-[var(--color-gold)]">
            {formatBRL(caso.valor_credito_brl)}
          </span>
        </p>
        {mostrarAdvogado ? (
          <p className="mt-1 font-mono text-[15px] text-[var(--color-ivory-66)]">
            Advogado responsável:{" "}
            <span className="text-[var(--color-advogado)]">
              {caso.responsavel_email ?? "—"}
            </span>
          </p>
        ) : null}
      </div>
      <span
        className="self-start rounded-full border px-3 py-1 font-mono text-[12px] uppercase tracking-[0.18em] sm:self-auto"
        style={{ borderColor: status.color, color: status.color }}
      >
        {status.label}
      </span>
    </div>
  );
}
