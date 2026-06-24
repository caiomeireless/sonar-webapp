"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ============================================================================
// CardStack — leque 3D horizontal (fan) com swipe, setas, dots e teclado
// ----------------------------------------------------------------------------
// Card ativo no centro; cards laterais visiveis dos dois lados com rotacao
// + translateX + scale + translateZ negativo. Substitui completamente a
// implementacao antiga que empilhava vertical.
// ============================================================================

// Helper inline pra nao puxar dependencia externa.
function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Retorna a distancia "signed" minima entre dois indices considerando wrap.
 * Quando `loop` esta ativo, escolhe o caminho mais curto (pode ser negativo).
 * Quando desativado, e' apenas i - active.
 */
function signedOffset(
  i: number,
  active: number,
  len: number,
  loop: boolean,
): number {
  if (len === 0) return 0;
  const raw = i - active;
  if (!loop) return raw;
  const half = len / 2;
  if (raw > half) return raw - len;
  if (raw < -half) return raw + len;
  return raw;
}

// ---------------------------------------------------------------------------
// Tipos publicos
// ---------------------------------------------------------------------------

export type CardRenderContext = {
  /** True quando o card e' o do centro (ativo). */
  active: boolean;
  /** Indice absoluto do item na lista. */
  index: number;
  /** Distancia signed em relacao ao ativo (-2, -1, 0, 1, 2...). */
  offset: number;
};

export type CardStackProps<T> = {
  items: T[];
  /** Renderiza um card. Recebe item + contexto. */
  renderCard: (item: T, ctx: CardRenderContext) => ReactNode;
  /** Indice inicialmente ativo. Default 0. */
  initialIndex?: number;
  /**
   * Quantos cards exibir no leque ao redor do ativo (inclusive).
   * Deve ser impar pra simetria; default 5.
   */
  maxVisible?: number;
  /** Largura do card. Default 400. */
  cardWidth?: number;
  /** Altura do card. Default 460. */
  cardHeight?: number;
  /** Sobreposicao horizontal entre cards (0..1). 0.35 = 35% sobrepostos. */
  overlap?: number;
  /** Rotacao Z total (graus) distribuido nos cards laterais. Default 16. */
  spreadDeg?: number;
  /** Perspectiva 3D em px. Default 1200. */
  perspectivePx?: number;
  /** translateZ negativo dos laterais (px). Default 120. */
  depthPx?: number;
  /** Tilt X (graus) aplicado aos cards inativos. Default 8. */
  tiltXDeg?: number;
  /** Lift Y (px) do card ativo. Default 14. */
  activeLiftPx?: number;
  /** Escala do card ativo. Default 1.05. */
  activeScale?: number;
  /** Escala dos cards inativos. Default 0.9. */
  inactiveScale?: number;
  /** Spring stiffness. Default 280. */
  springStiffness?: number;
  /** Spring damping. Default 28. */
  springDamping?: number;
  /** Navegacao circular nas pontas. Default true. */
  loop?: boolean;
  /** Mostra setas < > laterais. Default true. */
  showArrows?: boolean;
  /** Mostra os dots abaixo do leque. Default true. */
  showDots?: boolean;
  /** Navegacao por teclado. Default true. */
  enableKeyboard?: boolean;
  /** Autoplay em ms. Omita pra desligar. */
  autoplayMs?: number;
  /** Pausa autoplay com hover. Default true. */
  pauseOnHover?: boolean;
  /** Classes extras no wrapper externo. */
  className?: string;
  /** Callback quando o card ativo muda. */
  onChange?: (index: number, item: T) => void;
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function CardStack<T>({
  items,
  renderCard,
  initialIndex = 0,
  maxVisible = 5,
  cardWidth = 400,
  cardHeight = 460,
  overlap = 0.35,
  spreadDeg = 16,
  perspectivePx = 1200,
  depthPx = 120,
  tiltXDeg = 8,
  activeLiftPx = 14,
  activeScale = 1.05,
  inactiveScale = 0.9,
  springStiffness = 280,
  springDamping = 28,
  loop = true,
  showArrows = true,
  showDots = true,
  enableKeyboard = true,
  autoplayMs,
  pauseOnHover = true,
  className,
  onChange,
}: CardStackProps<T>) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const total = items.length;

  const [active, setActive] = useState(() => {
    if (total === 0) return 0;
    const clamped = Math.max(0, Math.min(total - 1, initialIndex));
    return clamped;
  });
  const [hovering, setHovering] = useState(false);

  const wrap = useCallback(
    (i: number) => {
      if (total === 0) return 0;
      if (loop) return ((i % total) + total) % total;
      return Math.max(0, Math.min(total - 1, i));
    },
    [total, loop],
  );

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      const wrapped = wrap(next);
      setActive((prev) => {
        if (wrapped !== prev) {
          queueMicrotask(() => onChange?.(wrapped, items[wrapped]));
        }
        return wrapped;
      });
    },
    [total, wrap, onChange, items],
  );

  const goNext = useCallback(() => goTo(active + 1), [active, goTo]);
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo]);

  // ---- Teclado --------------------------------------------------------------
  useEffect(() => {
    if (!enableKeyboard) return;
    const node = containerRef.current;
    if (!node) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
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
    if (pauseOnHover && hovering) return;
    const id = window.setInterval(() => {
      goNext();
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayMs, prefersReducedMotion, goNext, pauseOnHover, hovering]);

  // ---- Geometria do leque ---------------------------------------------------
  const maxOffset = Math.floor(maxVisible / 2);
  const cardSpacing = cardWidth * (1 - overlap);
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;
  // Altura do stage acomoda o lift do ativo + um folego pro fan crescer.
  const stageHeight = cardHeight + 80;

  // Lista com offset signed pra cada item visivel.
  const visible = useMemo(() => {
    if (total === 0) return [] as Array<{ item: T; index: number; offset: number }>;
    const out: Array<{ item: T; index: number; offset: number }> = [];
    for (let i = 0; i < total; i++) {
      const off = signedOffset(i, active, total, loop);
      if (Math.abs(off) <= maxOffset) {
        out.push({ item: items[i], index: i, offset: off });
      }
    }
    return out;
  }, [items, active, total, loop, maxOffset]);

  if (total === 0) {
    return (
      <div
        className={cn(
          "relative flex w-full items-center justify-center",
          "text-[var(--color-ivory-58)] text-sm",
          className,
        )}
        style={{ height: cardHeight }}
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
      aria-roledescription="leque de cartoes"
      aria-label={`Cartao ${active + 1} de ${total}`}
      onMouseEnter={pauseOnHover ? () => setHovering(true) : undefined}
      onMouseLeave={pauseOnHover ? () => setHovering(false) : undefined}
      className={cn(
        "relative w-full outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-signal)]/40",
        className,
      )}
    >
      {/* Stage 3D (largura total, altura calculada) ----------------------- */}
      <div
        className="relative w-full"
        style={{
          height: stageHeight,
          perspective: perspectivePx,
        }}
      >
        {/* Background washes atras do leque ------------------------------ */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[80%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-onyx-soft)]/50 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[50%] w-[35%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-signal-soft)]/30 blur-2xl" />
        </div>

        <AnimatePresence initial={false}>
          {visible.map(({ item, index, offset }) => (
            <FanCard
              key={index}
              offset={offset}
              maxOffset={maxOffset}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              cardSpacing={cardSpacing}
              stepDeg={stepDeg}
              depthPx={depthPx}
              tiltXDeg={tiltXDeg}
              activeLiftPx={activeLiftPx}
              activeScale={activeScale}
              inactiveScale={inactiveScale}
              springStiffness={springStiffness}
              springDamping={springDamping}
              prefersReducedMotion={!!prefersReducedMotion}
              onActivate={() => {
                if (offset !== 0) goTo(index);
              }}
              onSwipeNext={goNext}
              onSwipePrev={goPrev}
            >
              {renderCard(item, { active: offset === 0, index, offset })}
            </FanCard>
          ))}
        </AnimatePresence>

        {/* Setas laterais ----------------------------------------------- */}
        {showArrows && total > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              onClick={goPrev}
              className="btn-neon-circle absolute left-2 top-1/2 z-50 -translate-y-1/2"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Próximo"
              onClick={goNext}
              className="btn-neon-circle absolute right-2 top-1/2 z-50 -translate-y-1/2"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots (fora do stage pra nao bagunca a altura) -------------------- */}
      {showDots && total > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {items.map((_, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Ir para o cartao ${i + 1}`}
                aria-current={isActive}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-300",
                  isActive
                    ? "bg-[var(--color-signal)] scale-[1.4]"
                    : "bg-[var(--color-ivory-22)] hover:bg-[var(--color-ivory-58)]",
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
// FanCard — single card no leque com drag/swipe
// ---------------------------------------------------------------------------

type FanCardProps = {
  offset: number;
  maxOffset: number;
  cardWidth: number;
  cardHeight: number;
  cardSpacing: number;
  stepDeg: number;
  depthPx: number;
  tiltXDeg: number;
  activeLiftPx: number;
  activeScale: number;
  inactiveScale: number;
  springStiffness: number;
  springDamping: number;
  prefersReducedMotion: boolean;
  onActivate: () => void;
  onSwipeNext: () => void;
  onSwipePrev: () => void;
  children: ReactNode;
};

function FanCard({
  offset,
  maxOffset,
  cardWidth,
  cardHeight,
  cardSpacing,
  stepDeg,
  depthPx,
  tiltXDeg,
  activeLiftPx,
  activeScale,
  inactiveScale,
  springStiffness,
  springDamping,
  prefersReducedMotion,
  onActivate,
  onSwipeNext,
  onSwipePrev,
  children,
}: FanCardProps) {
  const isActive = offset === 0;
  const absOff = Math.abs(offset);

  // Posicionamento geometrico
  const x = offset * cardSpacing;
  const scale = isActive ? activeScale : inactiveScale;
  const rotateZ = isActive ? 0 : offset * stepDeg;
  // tiltX igual nos dois lados pra dar sensacao de leque inclinado
  const rotateX = isActive ? 0 : tiltXDeg;
  const translateZ = isActive ? 0 : -absOff * depthPx;
  const y = isActive ? -activeLiftPx : 0;
  // Fade conforme a distancia (mantem ativo em 1, ultimo visivel em ~0.55)
  const fadeStep = maxOffset > 0 ? 0.18 : 0;
  const opacity = Math.max(0, 1 - absOff * fadeStep);

  const zIndex = 100 - absOff;

  // Drag swipe so no ativo
  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const travel = info.offset.x;
    const velocity = info.velocity.x;
    if (Math.abs(travel) > 160 || Math.abs(velocity) > 650) {
      if (travel < 0 || velocity < 0) onSwipeNext();
      else onSwipePrev();
    }
  };

  const handleClick = () => {
    if (!isActive) onActivate();
  };

  return (
    <motion.div
      initial={
        prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, x, y, scale: scale * 0.96, rotateZ, rotateX, z: translateZ }
      }
      animate={
        prefersReducedMotion
          ? { opacity }
          : { opacity, x, y, scale, rotateZ, rotateX, z: translateZ }
      }
      exit={
        prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, scale: scale * 0.9 }
      }
      transition={{
        type: "spring",
        stiffness: springStiffness,
        damping: springDamping,
        mass: 0.9,
      }}
      drag={isActive ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      onDragEnd={isActive ? handleDragEnd : undefined}
      onClick={handleClick}
      style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        width: cardWidth,
        height: cardHeight,
        marginLeft: -cardWidth / 2,
        zIndex,
        cursor: isActive ? "grab" : "pointer",
        transformStyle: "preserve-3d",
        transformOrigin: "center bottom",
        willChange: "transform, opacity",
      }}
      whileDrag={{ cursor: "grabbing" }}
      className={cn(
        "rounded-2xl border border-[var(--color-line)]",
        "shadow-[0_30px_60px_-25px_rgba(0,0,0,0.7)]",
        "overflow-hidden bg-[var(--color-onyx-soft)]/40 backdrop-blur-sm",
      )}
    >
      {children}
    </motion.div>
  );
}
