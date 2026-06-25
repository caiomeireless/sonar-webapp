// Filtros do Monitor de Custos do CLIENTE — só o chip de período.
//
// Diferente do filtro da equipe (/equipe/custos), aqui não tem dropdown
// de cliente (o cliente sempre é ele mesmo) nem ranking por advogado
// (privacidade — cliente não vê estrutura interna do escritório). Único
// controle: período (Tudo / 7d / 30d / 90d / mês / ano).
//
// URL-driven: ?periodo=mes. Preserva ?eu= quando admin/sócio está
// usando "visualizar como cliente" — sem isso, o filtro derrubaria o
// preview ao trocar de período.

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const PERIODOS = [
  { chave: "tudo", rotulo: "Tudo" },
  { chave: "7d", rotulo: "7 dias" },
  { chave: "30d", rotulo: "30 dias" },
  { chave: "90d", rotulo: "90 dias" },
  { chave: "mes", rotulo: "Este mês" },
  { chave: "ano", rotulo: "Este ano" },
];

export default function FiltrosClienteCustos() {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const periodo = sp.get("periodo") || "tudo";
  const eu = sp.get("eu") || "";

  function aplicar(novoPeriodo: string) {
    const p = new URLSearchParams();
    if (eu) p.set("eu", eu);
    if (novoPeriodo && novoPeriodo !== "tudo") p.set("periodo", novoPeriodo);
    const qs = p.toString();
    startTransition(() =>
      router.push(qs ? `/cliente/custos?${qs}` : "/cliente/custos", {
        scroll: false,
      }),
    );
  }

  return (
    <div
      className="glass mb-6 flex flex-wrap items-center gap-4 p-4"
      data-pending={pending ? "1" : "0"}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory)]">
          Período
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {PERIODOS.map((p) => {
            const sel = periodo === p.chave;
            return (
              <button
                key={p.chave}
                type="button"
                onClick={() => aplicar(p.chave)}
                className={
                  "rounded-md px-2.5 py-1 text-xs transition " +
                  (sel
                    ? "bg-[var(--color-signal)] text-onyx"
                    : "border border-[var(--color-ivory-22)] bg-transparent text-[var(--color-ivory-88)] hover:bg-white/5")
                }
              >
                {p.rotulo}
              </button>
            );
          })}
        </div>
      </div>
      {periodo !== "tudo" && (
        <button
          type="button"
          onClick={() => aplicar("tudo")}
          className="ml-auto rounded-md border border-[var(--color-ivory-22)] px-2.5 py-1 text-xs text-[var(--color-ivory-88)] transition hover:bg-white/5"
        >
          Limpar filtro
        </button>
      )}
    </div>
  );
}
