"use client";

// Acordeao horizontal de cards expansiveis — adaptado do prompt "Escape
// in Style" pra paleta Sonar (onyx + signal/gold/devedor).
// Cada item ocupa 1/N do espaco quando inativo; o item ativo expande
// (flex 7) e mostra titulo + descricao com transicao suave.

import { useEffect, useState, type ReactNode } from "react";

export type AccentToken = "signal" | "gold" | "devedor" | "ivory";

export type InteractiveSelectorItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: ReactNode;
  accent?: AccentToken;
};

type Props = {
  items: InteractiveSelectorItem[];
  /** Card ativo no mount (default = 0). */
  defaultIndex?: number;
  /** Altura da faixa em pixels (default = 420). */
  height?: number;
  /** Cabecalho opcional acima do acordeao. */
  heading?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
  };
};

const ACCENT_BORDER: Record<AccentToken, string> = {
  signal: "var(--color-signal)",
  gold: "var(--color-gold)",
  devedor: "var(--color-devedor)",
  ivory: "var(--color-ivory)",
};

const ACCENT_GLOW: Record<AccentToken, string> = {
  signal: "0 0 0 1px rgba(60,255,138,0.45), 0 20px 60px rgba(0,0,0,0.55)",
  gold: "0 0 0 1px rgba(201,162,74,0.45), 0 20px 60px rgba(0,0,0,0.55)",
  devedor: "0 0 0 1px rgba(220,38,38,0.45), 0 20px 60px rgba(0,0,0,0.55)",
  ivory: "0 0 0 1px rgba(232,228,214,0.25), 0 20px 60px rgba(0,0,0,0.55)",
};

export function InteractiveSelector({
  items,
  defaultIndex = 0,
  height = 420,
  heading,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    items.forEach((_, i) => {
      const timer = setTimeout(() => {
        setAnimatedOptions((prev) => [...prev, i]);
      }, 180 * i);
      timers.push(timer);
    });
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [items.length]);

  function handleOptionClick(index: number) {
    if (index !== activeIndex) setActiveIndex(index);
  }

  return (
    <div className="font-sans text-ivory">
      {heading ? (
        <div className="mx-auto mb-12 max-w-[1100px] px-6 text-center sm:px-10">
          {heading.eyebrow ? (
            <span className="eyebrow mb-6 inline-block">{heading.eyebrow}</span>
          ) : null}
          {heading.title ? (
            <h2 className="font-serif text-[clamp(28px,4vw,46px)] font-medium leading-[1.15] tracking-tight text-ivory">
              {heading.title}
            </h2>
          ) : null}
          {heading.subtitle ? (
            <p className="mx-auto mt-5 max-w-[680px] text-base leading-relaxed text-[var(--color-ivory-88)]">
              {heading.subtitle}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        className="mx-auto flex w-full max-w-[1200px] items-stretch overflow-hidden px-6 sm:px-10"
        style={{ height }}
      >
        {items.map((item, index) => {
          const accent = item.accent ?? "signal";
          const ehAtivo = activeIndex === index;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-pressed={ehAtivo ? "true" : "false"}
              aria-label={item.title}
              onClick={() => handleOptionClick(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOptionClick(index);
                }
              }}
              className="relative flex flex-col justify-end overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal)]"
              style={{
                backgroundImage: `url('${item.image}')`,
                backgroundSize: ehAtivo ? "auto 100%" : "auto 120%",
                backgroundPosition: "center",
                backfaceVisibility: "hidden",
                opacity: animatedOptions.includes(index) ? 1 : 0,
                transform: animatedOptions.includes(index)
                  ? "translateX(0)"
                  : "translateX(-60px)",
                transition:
                  "flex-grow 700ms ease-in-out, box-shadow 700ms ease-in-out, background-size 700ms ease-in-out, background-position 700ms ease-in-out, opacity 500ms ease-in-out, transform 500ms ease-in-out, border-color 300ms ease-in-out",
                minWidth: "60px",
                minHeight: "100px",
                borderWidth: "2px",
                borderStyle: "solid",
                borderColor: ehAtivo
                  ? ACCENT_BORDER[accent]
                  : "var(--color-line)",
                cursor: "pointer",
                backgroundColor: "var(--color-onyx-soft)",
                boxShadow: ehAtivo
                  ? ACCENT_GLOW[accent]
                  : "0 10px 30px rgba(0,0,0,0.30)",
                flex: ehAtivo ? "7 1 0%" : "1 1 0%",
                zIndex: ehAtivo ? 10 : 1,
                willChange:
                  "flex-grow, box-shadow, background-size, background-position",
              }}
            >
              {/* Vinheta inferior pra contrastar com o label */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 right-0 transition-all duration-700 ease-in-out"
                style={{
                  bottom: ehAtivo ? "0" : "-40px",
                  height: "140px",
                  boxShadow: ehAtivo
                    ? "inset 0 -140px 140px -140px #000, inset 0 -140px 140px -90px #000"
                    : "inset 0 -140px 0 -140px #000",
                }}
              />

              {/* Label: icone + titulo + descricao */}
              <div className="absolute bottom-5 left-0 right-0 z-[2] flex h-14 items-center gap-3 px-4 pointer-events-none">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 backdrop-blur-md transition-all duration-200"
                  style={{
                    background: "rgba(10,12,11,0.78)",
                    borderColor: ehAtivo
                      ? ACCENT_BORDER[accent]
                      : "var(--color-line)",
                    color: ACCENT_BORDER[accent],
                  }}
                >
                  {item.icon}
                </div>
                <div className="relative min-w-0 whitespace-pre">
                  <div
                    className="font-serif text-lg font-bold leading-tight transition-all duration-700 ease-in-out"
                    style={{
                      opacity: ehAtivo ? 1 : 0,
                      transform: ehAtivo
                        ? "translateX(0)"
                        : "translateX(25px)",
                      color: ACCENT_BORDER[accent],
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    className="text-sm text-[var(--color-ivory-88)] transition-all duration-700 ease-in-out"
                    style={{
                      opacity: ehAtivo ? 1 : 0,
                      transform: ehAtivo
                        ? "translateX(0)"
                        : "translateX(25px)",
                    }}
                  >
                    {item.description}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
