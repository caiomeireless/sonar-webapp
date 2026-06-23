"use client";

// Card SLIM no dossiê: STATUS ONLY do cálculo do débito judicial.
// A interação completa (editor + impressão) vive em
// /equipe/devedores/[id]/calculo — esse card só mostra "última
// atualização + valor + status" e leva o usuário pra lá.
//
// MOCK pra demo: data "última atualização" é sorteada entre 14 e 60
// dias atrás pra parecer plausível; status (atualizado/desatualizado)
// deriva desse intervalo. Sem 5+ substitui por leitura real.

import Link from "next/link";
import { useMemo } from "react";

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

const fmtBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatBRL(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return fmtBRL.format(v);
}

function formatDataBR(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Pseudo-random determinístico por devedor pra demo não mudar a cada render.
function hashSeed(n: number): number {
  let h = (n * 2654435761) >>> 0;
  h ^= h >>> 16;
  h = (h * 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  return h;
}

// ────────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────────

type Props = {
  devedorId: number;
  euQuery: string;
};

// ────────────────────────────────────────────────────────────────────────
// Componente
// ────────────────────────────────────────────────────────────────────────

export function AtualizadorCalculo({ devedorId, euQuery }: Props) {
  const { dataAtualizacaoTexto, diasDesde, valorAtualizado, atualizado } =
    useMemo(() => {
      const seed = hashSeed(devedorId || 1);
      // Faixa 14..60 dias atras
      const dias = 14 + (seed % 47);
      const ref = new Date();
      ref.setHours(12, 0, 0, 0);
      ref.setDate(ref.getDate() - dias);
      // Valor demo entre R$ 18 mil e R$ 95 mil (deterministico).
      const base = 18000 + ((seed >>> 8) % 77000);
      const centavos = (seed >>> 4) % 100;
      const valor = base + centavos / 100;
      // Status: ATUALIZADO se ≤ 30 dias, DESATUALIZADO se > 30.
      const ok = dias <= 30;
      return {
        dataAtualizacaoTexto: formatDataBR(ref),
        diasDesde: dias,
        valorAtualizado: valor,
        atualizado: ok,
      };
    }, [devedorId]);

  const editorHref = `/equipe/devedores/${devedorId}/calculo${euQuery}`;

  return (
    <div className="rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.65)] p-6 backdrop-blur-md">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        {/* ============ STATUS ============ */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
              Calculo judicial
            </span>
            <span
              className={
                atualizado
                  ? "rounded-full border border-[var(--color-signal)]/50 bg-[var(--color-signal)]/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--color-signal)]"
                  : "rounded-full border border-amber-400/50 bg-amber-400/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300"
              }
            >
              {atualizado ? "Atualizado" : "Desatualizado"}
            </span>
          </div>

          <h3 className="font-serif text-xl text-ivory">
            Calculo do debito judicial
          </h3>

          <div className="space-y-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              Ultima atualizacao:{" "}
              <span className="text-ivory">{dataAtualizacaoTexto}</span>{" "}
              <span className="text-[var(--color-ivory-66)]">
                ({diasDesde} dias)
              </span>
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              Valor atualizado:{" "}
              <span className="font-serif text-2xl font-medium text-[var(--color-gold)]">
                {formatBRL(valorAtualizado)}
              </span>
            </p>
          </div>
        </div>

        {/* ============ CTA ============ */}
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <Link
            href={editorHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-gold)] px-5 py-2.5 text-sm font-semibold text-onyx shadow-[0_4px_24px_rgba(201,162,74,0.4)] transition hover:bg-[var(--color-tip-glow)]"
          >
            Abrir editor →
          </Link>
          <span className="text-center font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)] sm:text-right">
            Editar parametros · imprimir PDF
          </span>
        </div>
      </div>
    </div>
  );
}
