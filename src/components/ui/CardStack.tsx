"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ============================================================================
// CardStack — baralho 3D em leque com swipe, teclado e autoplay
// ----------------------------------------------------------------------------
// Tema Sonar: cores onyx/signal/line/ivory via tokens em globals.css
// ============================================================================

// Helper inline para nao puxar dependencia externa.
function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Tipos publicos
// ---------------------------------------------------------------------------

/**
 * Contrato minimo de um item exibido pelo baralho.
 * Apenas `id` e obrigatorio — todos os outros campos sao livres para o
 * consumidor decidir como renderizar via `renderCard`.
 */
export type CardStackItem = {
  id: string | number;
  title?: string;
  imageSrc?: string;
  href?: string;
};

export type CardStackProps<T extends CardStackItem> = {
  items: T[];
  /**
   * Render customizado de cada card. Recebe o item e um flag indicando se
   * ele esta no topo do baralho (ativo). Se omitido, exibe um placeholder
   * neutro.
   */
  renderCard?: (item: T, isTop: boolean) => ReactNode;
  /** Quantos cards do topo devem ser visiveis no leque. Default: 3. */
  visibleCount?: number;
  /** Distancia (px) que classifica o gesto como swipe. Default: 90. */
  swipeThreshold?: number;
  /** Autoplay (ms entre cards). 0 ou undefined desliga. */
  autoplayMs?: number;
  /** Mostra os indicadores (pontos) abaixo do baralho. Default: true. */
  showDots?: boolean;
  /** Permite navegar via setas do teclado. Default: true. */
  enableKeyboard?: boolean;
  /** Largura do card em px. Default: 320. */
  cardWidth?: number;
  /** Altura do card em px. Default: 420. */
  cardHeight?: number;
  /** Classes extras no wrapper externo. */
  className?: string;
  /** Callback quando o card do topo muda. */
  onChange?: (index: number, item: T) => void;
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function CardStack<T extends CardStackItem>({
  items,
  renderCard,
  visibleCount = 3,
  swipeThreshold = 90,
  autoplayMs,
  showDots = true,
  enableKeyboard = true,
  cardWidth = 320,
  cardHeight = 420,
  className,
  onChange,
}: CardStackProps<T>) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Direcao do ultimo movimento — 1 = avancou, -1 = voltou. Alimenta a
  // AnimatePresence pra decidir de onde o card entra/sai.
  const [direction, setDirection] = useState<1 | -1>(1);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const total = items.length;

  const wrap = useCallback(
    (i: number) => {
      if (total === 0) return 0;
      return ((i % total) + total) % total;
    },
    [total],
  );

  const goTo = useCallback(
    (next: number, dir: 1 | -1) => {
      if (total === 0) return;
      setDirection(dir);
      setIndex((prev) => {
        const wrapped = wrap(next);
        if (wrapped !== prev) {
          // dispara callback assincronamente pra nao bloquear o render
          queueMicrotask(() => onChange?.(wrapped, items[wrapped]));
        }
        return wrapped;
      });
    },
    [total, wrap, onChange, items],
  );

  const goNext = useCallback(() => goTo(index + 1, 1), [index, goTo]);
  const goPrev = useCallback(() => goTo(index - 1, -1), [index, goTo]);

  // ---- Teclado --------------------------------------------------------------
  useEffect(() => {
    if (!enableKeyboard) return;
    const node = containerRef.current;
    if (!node) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
    };
    node.addEventListener("keydown", handler);
    return () => node.removeEventListener("keydown", handler);
  }, [enableKeyboard, goNext, goPrev]);

  // ---- Autoplay -------------------------------------------------------------
  useEffect(() => {
    if (!autoplayMs || autoplayMs <= 0 || prefersReducedMotion) return;
    const id = window.setInterval(() => {
      goNext();
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayMs, prefersReducedMotion, goNext]);

  // ---- Lista visivel: pega `visibleCount` cards a partir do topo ----------
  const visible = useMemo(() => {
    if (total === 0) return [] as Array<{ item: T; offset: number }>;
    const count = Math.min(visibleCount, total);
    return Array.from({ length: count }, (_, offset) => ({
      item: items[wrap(index + offset)],
      offset,
    }));
  }, [items, index, visibleCount, total, wrap]);

  if (total === 0) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center",
          "text-[var(--color-ivory-58)] text-sm",
          className,
        )}
        style={{ width: cardWidth, height: cardHeight }}
      >
        Sem cartoes pra exibir.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={enableKeyboard ? 0 : -1}
      role="group"
      aria-roledescription="baralho de cartoes"
      aria-label={`Cartao ${index + 1} de ${total}`}
      className={cn(
        "relative outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-signal)]/40",
        className,
      )}
      style={{ width: cardWidth, height: cardHeight + (showDots ? 36 : 0) }}
    >
      {/* Background wash (spotlight) atras do baralho ------------------- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div
          className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-onyx-soft)]/60 blur-3xl"
        />
        <div
          className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-signal-soft)]/30 blur-2xl"
        />
      </div>

      {/* Palco 3D ------------------------------------------------------------ */}
      <div
        className="relative"
        style={{
          width: cardWidth,
          height: cardHeight,
          perspective: 1200,
        }}
      >
        <AnimatePresence initial={false} custom={direction}>
          {visible.map(({ item, offset }) => {
            const isTop = offset === 0;
            return (
              <FanCard
                key={item.id}
                offset={offset}
                isTop={isTop}
                direction={direction}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                swipeThreshold={swipeThreshold}
                prefersReducedMotion={!!prefersReducedMotion}
                onSwipeLeft={goNext}
                onSwipeRight={goPrev}
              >
                {renderCard ? (
                  renderCard(item, isTop)
                ) : (
                  <DefaultPlaceholder item={item} />
                )}
              </FanCard>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dots ------------------------------------------------------------ */}
      {showDots && (
        <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {items.map((it, i) => {
            const active = i === index;
            return (
              <button
                key={it.id}
                type="button"
                aria-label={`Ir para o cartao ${i + 1}`}
                aria-current={active}
                onClick={() => goTo(i, i > index ? 1 : -1)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  active
                    ? "w-6 bg-[var(--color-signal)]"
                    : "w-1.5 bg-[var(--color-ivory-22)] hover:bg-[var(--color-ivory-58)]",
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FanCard — single card no leque com fisica de drag/swipe
// ---------------------------------------------------------------------------

type FanCardProps = {
  offset: number;
  isTop: boolean;
  direction: 1 | -1;
  cardWidth: number;
  cardHeight: number;
  swipeThreshold: number;
  prefersReducedMotion: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children: ReactNode;
};

function FanCard({
  offset,
  isTop,
  direction,
  cardWidth,
  cardHeight,
  swipeThreshold,
  prefersReducedMotion,
  onSwipeLeft,
  onSwipeRight,
  children,
}: FanCardProps) {
  // Cada camada do leque recua um pouco no Y, encolhe e gira de leve.
  const yOffset = offset * 14;
  const scale = 1 - offset * 0.05;
  const rotateBase = offset === 0 ? 0 : (offset % 2 === 0 ? -1 : 1) * offset * 2;

  // Drag so na carta do topo
  const x = useMotionValue(0);
  // Rotaciona conforme arrasta — efeito de "tombo" do baralho
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const swipe = Math.abs(info.offset.x);
    if (swipe < swipeThreshold) {
      // volta pro lugar
      x.set(0);
      return;
    }
    if (info.offset.x < 0) onSwipeLeft();
    else onSwipeRight();
  };

  // Variants pro AnimatePresence: enter de um lado, sai pro outro
  const enterFrom = direction === 1 ? 80 : -80;
  const exitTo = direction === 1 ? -320 : 320;

  return (
    <motion.div
      custom={direction}
      initial={
        prefersReducedMotion
          ? { opacity: 0 }
          : { x: enterFrom, opacity: 0, scale: scale * 0.96, y: yOffset + 8 }
      }
      animate={
        prefersReducedMotion
          ? { opacity: 1 }
          : {
              x: 0,
              opacity: 1,
              scale,
              y: yOffset,
              rotateZ: isTop ? 0 : rotateBase,
            }
      }
      exit={
        prefersReducedMotion
          ? { opacity: 0 }
          : { x: exitTo, opacity: 0, scale: 0.9, rotateZ: direction * 8 }
      }
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 30,
        mass: 0.9,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={isTop ? handleDragEnd : undefined}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: cardWidth,
        height: cardHeight,
        zIndex: 100 - offset,
        cursor: isTop ? "grab" : "default",
        x: isTop ? x : 0,
        rotate: isTop ? rotate : undefined,
        opacity: isTop ? opacity : undefined,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      whileDrag={{ cursor: "grabbing" }}
      className={cn(
        "rounded-2xl border border-[var(--color-line)]",
        "shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]",
        "overflow-hidden bg-[var(--color-onyx-soft)]/40 backdrop-blur-sm",
      )}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Placeholder default — usado so quando `renderCard` nao e' passado
// ---------------------------------------------------------------------------

function DefaultPlaceholder({ item }: { item: CardStackItem }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
      <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--color-ivory-58)]">
        Card #{String(item.id)}
      </span>
      {item.title && (
        <h3 className="text-lg font-medium text-[var(--color-ivory)]">
          {item.title}
        </h3>
      )}
      <span className="mt-2 text-xs text-[var(--color-ivory-58)]">
        Forneca <code className="font-mono">renderCard</code> pra customizar.
      </span>
    </div>
  );
}
