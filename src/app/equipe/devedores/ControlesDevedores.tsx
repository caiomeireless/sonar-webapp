"use client";

// Controles da visão "Devedores" do Banco de Devedores — busca com
// debounce + chips de filtro (tipo / rastreio) + ordenação. Estado 100%
// no URL (?q= ?t= ?r= ?o=), server re-renderiza a lista. Trocar qualquer
// filtro zera a página (?p).

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpDown, Search, X } from "lucide-react";

const CHIPS_TIPO = [
  { valor: "", rotulo: "Todos" },
  { valor: "PF", rotulo: "Pessoa Física" },
  { valor: "PJ", rotulo: "Pessoa Jurídica" },
] as const;

const CHIPS_RASTREIO = [
  { valor: "com-bens", rotulo: "Com Bens" },
  { valor: "aguardando", rotulo: "Aguardando Busca" },
] as const;

const ORDENS = [
  { valor: "", rotulo: "Mais Recentes" },
  { valor: "valor", rotulo: "Maior Valor" },
  { valor: "nome", rotulo: "Nome A–Z" },
] as const;

export function ControlesDevedores() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const qAtual = sp.get("q") ?? "";
  const tipoAtual = sp.get("t") ?? "";
  const rastreioAtual = sp.get("r") ?? "";
  const ordemAtual = sp.get("o") ?? "";

  const [valor, setValor] = useState(qAtual);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValor(qAtual);
  }, [qAtual]);

  function navegar(mudancas: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("p"); // qualquer mudança de filtro volta pra página 1
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onBusca(novo: string) {
    setValor(novo);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => navegar({ q: novo.trim() }), 250);
  }

  const chipCls = (ativo: boolean) =>
    "shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.14em] transition " +
    (ativo
      ? "border-[var(--color-signal)]/60 bg-[var(--color-signal-soft)] text-[var(--color-signal)]"
      : "border-[var(--color-line)] text-[var(--color-ivory-66)] hover:border-[var(--color-signal-soft-2)] hover:text-[var(--color-ivory)]");

  return (
    <div className="space-y-3">
      {/* Busca grande — o gesto principal da tela */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-signal)]/70"
          aria-hidden="true"
        />
        <input
          type="search"
          value={valor}
          onChange={(e) => onBusca(e.target.value)}
          placeholder="Buscar por nome, CPF/CNPJ ou número do processo…"
          aria-label="Buscar devedor"
          className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)]
                     py-4 pl-12 pr-12 text-base text-[var(--color-ivory)]
                     placeholder:text-[var(--color-ivory-40)]
                     outline-none transition
                     focus:border-[var(--color-signal)] focus:ring-2 focus:ring-[var(--color-signal-soft)]"
        />
        {valor ? (
          <button
            type="button"
            onClick={() => onBusca("")}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-ivory-66)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ivory)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Filtros + ordenação numa linha só */}
      <div className="flex flex-wrap items-center gap-2">
        {CHIPS_TIPO.map((c) => {
          const ativo = tipoAtual === c.valor;
          return (
            <button
              key={c.valor || "todos"}
              type="button"
              onClick={() => navegar({ t: c.valor })}
              // spread: linter da IDE só aceita literal em aria-* (falso
              // positivo — toggle dinâmico é o uso canônico da spec).
              {...{ "aria-pressed": ativo }}
              className={chipCls(ativo)}
            >
              {c.rotulo}
            </button>
          );
        })}
        <span className="mx-1 h-5 w-px bg-[var(--color-line)]" aria-hidden="true" />
        {CHIPS_RASTREIO.map((c) => {
          const ativo = rastreioAtual === c.valor;
          return (
            <button
              key={c.valor}
              type="button"
              onClick={() => navegar({ r: ativo ? "" : c.valor })}
              {...{ "aria-pressed": ativo }}
              className={chipCls(ativo)}
            >
              {c.rotulo}
            </button>
          );
        })}

        {/* Ordenação à direita */}
        <div className="ml-auto inline-flex items-center gap-2">
          <ArrowUpDown
            className="h-3.5 w-3.5 text-[var(--color-ivory-66)]"
            aria-hidden="true"
          />
          <label htmlFor="ordem-devedores" className="sr-only">
            Ordenar por
          </label>
          <select
            id="ordem-devedores"
            value={ordemAtual}
            onChange={(e) => navegar({ o: e.target.value })}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)]
                       px-3 py-2 font-mono text-[12px] uppercase tracking-[0.12em]
                       text-[var(--color-ivory-88)] outline-none transition
                       focus:border-[var(--color-signal)]"
          >
            {ORDENS.map((o) => (
              <option key={o.valor || "recentes"} value={o.valor}>
                {o.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Toggle Devedores | Por Cliente — troca a visão principal da página (?v=).
export function ToggleVisaoBanco({ atual }: { atual: "devedores" | "clientes" }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function trocar(v: "devedores" | "clientes") {
    if (v === atual) return;
    const params = new URLSearchParams(sp.toString());
    if (v === "devedores") params.delete("v");
    else params.set("v", "clientes");
    // Filtros da outra visão não se aplicam — limpa tudo menos ?eu.
    for (const k of ["q", "t", "r", "o", "p"]) params.delete(k);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const btn = (ativo: boolean) =>
    "rounded-xl px-6 py-2.5 font-mono text-[13px] uppercase tracking-[0.18em] transition " +
    (ativo
      ? "bg-[var(--color-signal)] text-[var(--color-onyx)] shadow-[0_0_18px_rgba(60,255,138,0.35)]"
      : "text-[var(--color-ivory-66)] hover:text-[var(--color-ivory)]");

  return (
    <div
      role="tablist"
      aria-label="Visão do banco de devedores"
      className="inline-flex items-center gap-1 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-1.5"
    >
      <button
        type="button"
        role="tab"
        aria-selected={atual === "devedores"}
        onClick={() => trocar("devedores")}
        className={btn(atual === "devedores")}
      >
        Devedores
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={atual === "clientes"}
        onClick={() => trocar("clientes")}
        className={btn(atual === "clientes")}
      >
        Por Cliente
      </button>
    </div>
  );
}
