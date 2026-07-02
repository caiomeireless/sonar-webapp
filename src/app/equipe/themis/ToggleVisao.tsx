"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";

export type VisaoThemis = "cards" | "lista";

export function ToggleVisao({ atual }: { atual: VisaoThemis }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function aplicar(v: VisaoThemis) {
    if (v === atual) return;
    const params = new URLSearchParams(sp.toString());
    // Padrao = lista (perf); cards agora precisa de ?v=cards no URL.
    if (v === "lista") params.delete("v");
    else params.set("v", v);
    // Trocar de visao volta pra pagina 1 — caso o usuario esteja numa
    // pagina alta, faz menos sentido no outro modo.
    params.delete("p");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const base =
    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-soft-2)]";
  const ativoCls = "bg-[var(--color-signal)] text-[var(--color-onyx)]";
  const inativoCls =
    "text-[var(--color-ivory-66)] hover:text-[var(--color-ivory)]";

  return (
    <div
      role="group"
      aria-label="Alternar visualização"
      className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] p-1"
    >
      <button
        type="button"
        onClick={() => aplicar("cards")}
        aria-pressed={atual === "cards"}
        className={`${base} ${atual === "cards" ? ativoCls : inativoCls}`}
      >
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
        Cards
      </button>
      <button
        type="button"
        onClick={() => aplicar("lista")}
        aria-pressed={atual === "lista"}
        className={`${base} ${atual === "lista" ? ativoCls : inativoCls}`}
      >
        <List className="h-3.5 w-3.5" aria-hidden="true" />
        Lista
      </button>
    </div>
  );
}
