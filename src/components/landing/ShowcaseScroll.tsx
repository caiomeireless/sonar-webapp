"use client";

// Showcase scroll-driven da landing — mostra as principais telas do
// portal da equipe e do cliente em fade-transition conforme o usuario
// rola. Estrutura: coluna esquerda STICKY (prints empilhados absolutos
// com opacity controlada por scroll), coluna direita ROLANDO (blocos
// de texto que mudam o print ativo via IntersectionObserver).
//
// Cada slide eh uma combinacao "print + texto explicativo". O componente
// gerencia qual print esta ativo via state, observando os <article> da
// direita conforme entram no centro do viewport.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export type ShowcaseSlide = {
  id: string;
  imagem: string; // path absoluto a partir de /public
  titulo: string;
  descricao: string;
  destaques: string[];
  cor: "signal" | "gold" | "devedor";
};

type Props = {
  eyebrow: string;
  titulo: string;
  subtitulo?: string;
  slides: ShowcaseSlide[];
};

const COR_TOKEN: Record<ShowcaseSlide["cor"], string> = {
  signal: "var(--color-signal)",
  gold: "var(--color-gold)",
  devedor: "var(--color-devedor)",
};

export function ShowcaseScroll({ eyebrow, titulo, subtitulo, slides }: Props) {
  const [ativo, setAtivo] = useState(0);
  const artigoRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        // pega a entrada mais central da viewport (maior intersectionRatio)
        let melhor = { index: -1, ratio: 0 };
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const idx = artigoRefs.current.findIndex((r) => r === e.target);
          if (idx < 0) continue;
          if (e.intersectionRatio > melhor.ratio) {
            melhor = { index: idx, ratio: e.intersectionRatio };
          }
        }
        if (melhor.index >= 0) setAtivo(melhor.index);
      },
      {
        // o centro vertical da viewport eh o "alvo"
        rootMargin: "-40% 0px -40% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );
    for (const r of artigoRefs.current) {
      if (r) obs.observe(r);
    }
    return () => obs.disconnect();
  }, [slides.length]);

  return (
    <div className="relative">
      {/* Cabecalho da secao */}
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <div className="flex flex-col items-center text-center">
          <span className="eyebrow mb-6">{eyebrow}</span>
          <h2 className="font-serif text-[clamp(28px,4vw,46px)] font-medium leading-[1.15] tracking-tight text-ivory">
            {titulo}
          </h2>
          {subtitulo ? (
            <p className="mx-auto mt-5 max-w-[640px] text-base leading-relaxed text-[var(--color-ivory-88)]">
              {subtitulo}
            </p>
          ) : null}
        </div>
      </div>

      {/* Grid 2 colunas: stack sticky (esq) + scroll de articles (dir) */}
      <div className="mx-auto mt-16 max-w-[1400px] px-6 sm:px-10">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Coluna esquerda: prints empilhados, sticky */}
          <div className="hidden md:block">
            <div className="sticky top-24">
              <div
                className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--color-ivory-12)] bg-[var(--color-onyx-soft)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
                style={{
                  boxShadow: `0 0 0 1px ${COR_TOKEN[slides[ativo]?.cor ?? "signal"]}33, 0 24px 60px -20px rgba(0,0,0,0.8)`,
                }}
              >
                {slides.map((s, i) => (
                  <div
                    key={s.id}
                    className="absolute inset-0 transition-opacity duration-700 ease-out"
                    style={{ opacity: ativo === i ? 1 : 0 }}
                    aria-hidden={ativo === i ? undefined : "true"}
                  >
                    {/* Image com fallback gracioso pra placeholder */}
                    <Image
                      src={s.imagem}
                      alt={s.titulo}
                      fill
                      sizes="(min-width: 1024px) 700px, 100vw"
                      className="object-cover object-top"
                      priority={i === 0}
                    />
                    {/* Vinheta inferior pra contrastar com o titulo */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgba(10,12,11,0.85)] via-[rgba(10,12,11,0.45)] to-transparent"
                    />
                    {/* Selo de portal no canto superior esquerdo */}
                    <span
                      className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] backdrop-blur-md"
                      style={{
                        color: COR_TOKEN[s.cor],
                        borderColor: `color-mix(in srgb, ${COR_TOKEN[s.cor]} 45%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${COR_TOKEN[s.cor]} 14%, transparent)`,
                      }}
                    >
                      {s.titulo}
                    </span>
                  </div>
                ))}
              </div>

              {/* Indicador de progresso vertical (bolinhas) */}
              <div className="mt-5 flex justify-center gap-2">
                {slides.map((s, i) => (
                  <span
                    key={s.id}
                    className="block h-1.5 w-8 rounded-full transition-all"
                    style={{
                      background:
                        ativo === i
                          ? COR_TOKEN[s.cor]
                          : "var(--color-ivory-22)",
                      boxShadow:
                        ativo === i
                          ? `0 0 12px ${COR_TOKEN[s.cor]}`
                          : "none",
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Coluna direita: blocos de texto */}
          <div className="flex flex-col gap-[60vh] py-[20vh]">
            {slides.map((s, i) => (
              <article
                key={s.id}
                ref={(el) => {
                  artigoRefs.current[i] = el;
                }}
                className="relative"
              >
                {/* Em mobile, o print vai junto do texto (sem sticky) */}
                <div className="mb-6 block aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--color-ivory-12)] md:hidden">
                  <Image
                    src={s.imagem}
                    alt={s.titulo}
                    width={1280}
                    height={800}
                    className="h-full w-full object-cover object-top"
                  />
                </div>

                <span
                  className="font-mono text-[11px] uppercase tracking-[0.32em]"
                  style={{ color: COR_TOKEN[s.cor] }}
                >
                  {String(i + 1).padStart(2, "0")} · {s.titulo}
                </span>
                <h3 className="mt-3 font-serif text-[clamp(22px,2.5vw,32px)] font-medium leading-[1.2] text-ivory">
                  {s.descricao}
                </h3>
                <ul className="mt-6 flex flex-col gap-3">
                  {s.destaques.map((d) => (
                    <li
                      key={d}
                      className="flex items-start gap-3 text-[15px] leading-relaxed text-[var(--color-ivory-88)]"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          background: COR_TOKEN[s.cor],
                          boxShadow: `0 0 8px ${COR_TOKEN[s.cor]}`,
                        }}
                      />
                      {d}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
