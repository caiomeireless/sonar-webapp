"use client";

// Filtro de busca da Fila Themis. Estado vive no URL (?q=) — server-side
// re-renderiza filtrando os processos. Debounce 250ms pra não disparar
// uma navegação por tecla.

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function FiltroThemis() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qAtual = sp.get("q") ?? "";

  const [valor, setValor] = useState(qAtual);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mantém input sincronizado com URL (volta/avança do navegador).
  useEffect(() => {
    setValor(qAtual);
  }, [qAtual]);

  function aplicar(novo: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      const trimmed = novo.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 250);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValor(v);
    aplicar(v);
  }

  function limpar() {
    setValor("");
    aplicar("");
  }

  return (
    <div className="relative w-full max-w-[520px]">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ivory-66)]"
        aria-hidden="true"
      />
      <input
        type="search"
        value={valor}
        onChange={onChange}
        placeholder="Filtrar por número do processo, pasta ou nome do devedor"
        aria-label="Filtrar processos"
        className="
          w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]
          py-2.5 pl-10 pr-10 text-sm text-[var(--color-ivory)]
          placeholder:text-[var(--color-ivory-40)]
          backdrop-blur-xl outline-none transition
          focus:border-[var(--color-signal)] focus:ring-2 focus:ring-[var(--color-signal-soft)]
        "
      />
      {valor && (
        <button
          type="button"
          onClick={limpar}
          aria-label="Limpar filtro"
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-ivory-66)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ivory)]"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
