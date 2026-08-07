"use client";

// Navegação interna do dossiê — barra sticky de chips que acompanha o
// scroll (scrollspy via IntersectionObserver). O dossiê tem 6+ seções
// longas; sem isso o usuário rola às cegas.
//
// Uso: as seções da página recebem id + scroll-mt (offset da barra);
// a página passa a lista {id, rotulo} na ordem visual.

import { useEffect, useRef, useState } from "react";

export type SecaoNav = { id: string; rotulo: string };

export function NavDossie({ secoes }: { secoes: SecaoNav[] }) {
  const [ativa, setAtiva] = useState<string>(secoes[0]?.id ?? "");
  const barraRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const alvos = secoes
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (alvos.length === 0) return;

    // Seção ativa = a que cruza a faixa superior da viewport (25% a 45%).
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setAtiva(e.target.id);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: 0 },
    );
    alvos.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [secoes]);

  function irPara(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduz ? "auto" : "smooth", block: "start" });
    setAtiva(id);
  }

  if (secoes.length < 2) return null;

  return (
    <nav
      ref={barraRef}
      aria-label="Seções do dossiê"
      className="sticky top-0 z-20 -mx-6 border-b border-[var(--color-ivory-12)] bg-[var(--color-onyx)]/92 px-6 py-2.5 backdrop-blur-md sm:-mx-10 sm:px-10"
    >
      <div className="mx-auto flex max-w-[1400px] gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {secoes.map((s) => {
          const ehAtiva = s.id === ativa;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => irPara(s.id)}
              aria-current={ehAtiva ? "true" : undefined}
              className={
                "shrink-0 rounded-full px-3.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.16em] transition-colors duration-200 " +
                (ehAtiva
                  ? "bg-[var(--color-signal-soft)] text-[var(--color-signal)] ring-1 ring-[var(--color-signal-soft-2)]"
                  : "text-[var(--color-ivory-66)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ivory)]")
              }
            >
              {s.rotulo}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
