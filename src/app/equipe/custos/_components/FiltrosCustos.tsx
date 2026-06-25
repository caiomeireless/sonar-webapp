// Filtros do Monitor de Custos — período (chips) + cliente (select).
//
// Client component porque precisa ler/escrever na URL (?periodo=&credor=)
// e usar useTransition para deixar a UI responsiva enquanto o Server
// Component re-renderiza. A página lê os mesmos searchParams e devolve
// dados já filtrados.

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function FiltrosCustos({
  clientes,
}: {
  clientes: { id: number; nome: string }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const periodo = sp.get("periodo") || "tudo";
  const credor = sp.get("credor") || "";

  function aplicar(novoPeriodo: string, novoCredor: string) {
    const p = new URLSearchParams();
    if (novoPeriodo && novoPeriodo !== "tudo") p.set("periodo", novoPeriodo);
    if (novoCredor) p.set("credor", novoCredor);
    const qs = p.toString();
    startTransition(() =>
      router.push(qs ? `/equipe/custos?${qs}` : "/equipe/custos", {
        scroll: false,
      }),
    );
  }

  const PERIODOS = [
    { chave: "tudo", rotulo: "Tudo" },
    { chave: "7d", rotulo: "7 dias" },
    { chave: "30d", rotulo: "30 dias" },
    { chave: "90d", rotulo: "90 dias" },
    { chave: "mes", rotulo: "Este mês" },
    { chave: "ano", rotulo: "Este ano" },
  ];

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
                onClick={() => aplicar(p.chave, credor)}
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
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory)]">
          Cliente
        </span>
        <select
          value={credor}
          onChange={(e) => aplicar(periodo, e.target.value)}
          className="rounded-md border border-[var(--color-ivory-22)] bg-[var(--color-onyx)] px-3 py-1.5 text-xs text-ivory focus:border-[var(--color-signal)] focus:outline-none"
        >
          <option value="">Todos</option>
          {clientes.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      {(periodo !== "tudo" || credor) && (
        <button
          type="button"
          onClick={() => aplicar("tudo", "")}
          className="ml-auto rounded-md border border-[var(--color-ivory-22)] px-2.5 py-1 text-xs text-[var(--color-ivory-88)] transition hover:bg-white/5"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
