"use client";

// Busca da Carteira: nome de devedor, nome do cliente (credor) ou CNPJ/CPF.
// Estado vive no URL (?q=) com debounce de 250ms.

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function BuscaCarteira() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qAtual = sp.get("q") ?? "";

  const [valor, setValor] = useState(qAtual);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <div className="relative w-full max-w-[640px]">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-ivory-66)]"
        aria-hidden="true"
      />
      <input
        type="search"
        value={valor}
        onChange={onChange}
        placeholder="Buscar por nome do devedor, nome do cliente ou CNPJ/CPF"
        aria-label="Buscar no banco de devedores"
        className="
          w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)]
          py-3.5 pl-12 pr-12 text-base text-[var(--color-ivory)]
          placeholder:text-[var(--color-ivory-40)]
          backdrop-blur-xl outline-none transition
          focus:border-[var(--color-signal)] focus:ring-2 focus:ring-[var(--color-signal-soft)]
        "
      />
      {valor && (
        <button
          type="button"
          onClick={limpar}
          aria-label="Limpar busca"
          title="Limpar busca"
          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--color-ivory-66)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ivory)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
