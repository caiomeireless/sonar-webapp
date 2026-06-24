"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";
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
// CardDeck — pilha VERTICAL 3D com drag pra cima/baixo + setas laterais
// ----------------------------------------------------------------------------
// Diferente do CardStack (leque horizontal), aqui os cards ficam empilhados:
// o ativo na frente, e os de tras ficam menores/mais opacos, ligeiramente
// deslocados pra cima. O usuario arrasta o card da frente VERTICAL pra
// reordenar a pilha. Setas laterais permitem rotacionar o deck sem arrastar.
//
// Visual: accent GOLD (#C9A24A) — distingue dos CardStack de cliente, que
// usam accent signal verde. Pensado pra contextos da plataforma onde o card
// representa um destaque do escritorio (ex.: relacionamento, marketing).
// ============================================================================

// Helper inline pra nao puxar dependencia externa.
function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Tipos publicos
// ---------------------------------------------------------------------------

export type CardDeckItem = { id: string | number };

export type CardRenderContext = {
  /** True quando o card e' o da frente (ativo). */
  active: boolean;
  /** Indice absoluto do item na lista original. */
  index: number;
  /** Posicao na pilha visivel (0 = frente, 1 = segunda camada, ...). */
  offset: number;
};

export type CardDeckProps<T extends CardDeckItem> = {
  items: T[];
  /** Renderiza um card. Recebe item + contexto. */
  renderCard: (item: T, ctx: CardRenderContext) => ReactNode;
  /** Largura do card. Default 380. */
  cardWidth?: number;
  /** Altura do card. Default 480. */
  cardHeight?: number;
  /** Quantos cards exibir empilhados (inclui o da frente). Default 4. */
  visibleCount?: number;
  /** Deslocamento Y por camada empilhada (% do cardHeight). Default 8. */
  offsetTopPct?: number;
  /** Reducao de escala por camada empilhada. Default 0.05. */
  scaleStep?: number;
  /** Reducao de brilho por camada (filter brightness). Default 0.12. */
  dimStep?: number;
  /** Travel/velocity minimo (px) pra disparar swipe. Default 60. */
  swipeThreshold?: number;
  /** Spring stiffness. Default 170. */
  springStiffness?: number;
  /** Spring damping. Default 26. */
  springDamping?: number;
  /** Mostra setas < > laterais. Default true. */
  showArrows?: boolean;
  /** Mostra dots de progresso no topo. Default true. */
  showProgress?: boolean;
  /** Navegacao circular nas pontas. Default true. */
  loop?: boolean;
  /** Callback quando o card da frente muda. */
  onChange?: (index: number, item: T) => void;
  /** Classes extras no wrapper externo. */
  className?: string;
};

// ---------------------------------------------------------------------------
// Helpers de rotacao do deck
// ---------------------------------------------------------------------------

/** Manda o primeiro item pro final: [a,b,c,d] -> [b,c,d,a]. */
function rotateToEnd<T>(arr: T[]): T[] {
  if (arr.length <= 1) return arr;
  return [...arr.slice(1), arr[0]];
}

/** Manda o ultimo item pro inicio: [a,b,c,d] -> [d,a,b,c]. */
function rotateToStart<T>(arr: T[]): T[] {
  if (arr.length <= 1) return arr;
  return [arr[arr.length - 1], ...arr.slice(0, -1)];
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function CardDeck<T extends CardDeckItem>({
  items,
  renderCard,
  cardWidth = 380,
  cardHeight = 480,
  visibleCount = 4,
  offsetTopPct = 8,
  scaleStep = 0.05,
  dimStep = 0.12,
  swipeThreshold = 60,
  springStiffness = 170,
  springDamping = 26,
  showArrows = true,
  showProgress = true,
  loop = true,
  onChange,
  className,
}: CardDeckProps<T>) {
  // Estado: ordem atual dos cards. Manipulamos a ordem em vez de
  // currentIndex porque a animacao do empilhamento depende da
  // POSICAO de cada item na pilha, e reordenar mantem a sensacao
  // de "puxei pra cima e mandei pro fim do baralho".
  const [deck, setDeck] = useState<T[]>(items);
  const total = items.length;

  // Reseta o deck se a lista de itens mudar.
  useEffect(() => {
    setDeck(items);
  }, [items]);

  // Indice (na lista ORIGINAL) do card que esta na frente.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const frontItem = deck[0];
  const currentIndex = useMemo(() => {
    if (!frontItem) return 0;
    const i = items.findIndex((it) => it.id === frontItem.id);
    return i === -1 ? 0 : i;
  }, [items, frontItem]);

  // Dispara onChange so quando o card da frente realmente muda.
  const lastNotified = useRef<string | number | null>(null);
  useEffect(() => {
    if (!frontItem) return;
    if (lastNotified.current === frontItem.id) return;
    lastNotified.current = frontItem.id;
    onChangeRef.current?.(currentIndex, frontItem);
  }, [frontItem, currentIndex]);

  // ---- Navegacao -----------------------------------------------------------
  const goNext = useCallback(() => {
    if (!loop && deck.length <= 1) return;
    setDeck((d) => rotateToEnd(d));
  }, [deck.length, loop]);

  const goPrev = useCallback(() => {
    if (!loop && deck.length <= 1) return;
    setDeck((d) => rotateToStart(d));
  }, [deck.length, loop]);

  // ---- Drag motion value (compartilhado com transforms) --------------------
  const dragY = useMotionValue(0);
  // Tilt sutil baseado em dragY: arrastar pra cima inclina o card pra tras.
  // Range pequeno pra nao virar trapezio bizarro.
  const rotateX = useTransform(dragY, [-200, 0, 200], [10, 0, -10]);
  const dragOpacity = useTransform(dragY, [-300, 0, 300], [0.5, 1, 0.5]);

  // ---- Empty state ---------------------------------------------------------
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

  // ---- Pilha visivel -------------------------------------------------------
  // Pegamos os primeiros `visibleCount` cards do deck. Cada um recebe um
  // offset (0 = frente, 1+ = atras).
  const visible = deck.slice(0, Math.min(visibleCount, deck.length));

  // Container precisa caber a altura do card + folego pro stack pra cima.
  const containerMinHeight = cardHeight + 100;

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ minHeight: containerMinHeight }}
      role="group"
      aria-roledescription="baralho de cartoes"
      aria-label={`Cartao ${currentIndex + 1} de ${total}`}
    >
      {/* Progress indicator no topo -------------------------------------- */}
      {showProgress && total > 1 && (
        <div className="mb-4 flex items-center justify-center gap-1.5">
          {items.map((it, i) => {
            const isActive = i === currentIndex;
            return (
              <div
                key={it.id}
                aria-hidden
                className={cn(
                  "h-1.5 rounded-full transition-all duration-400",
                  isActive
                    ? "w-8 bg-[#FF3366]"
                    : "w-1.5 bg-[var(--color-ivory-22)]",
                )}
              />
            );
          })}
        </div>
      )}

      {/* Stage 3D ---------------------------------------------------------- */}
      <div
        className="relative w-full"
        style={{
          height: cardHeight + 60,
          perspective: 1000,
        }}
      >
        {/* Background wash atras do deck ------------------------------ */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[80%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-onyx-soft)]/50 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[50%] w-[35%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF3366]/10 blur-2xl" />
        </div>

        <AnimatePresence initial={false}>
          {visible.map((item, stackIdx) => {
            const isFront = stackIdx === 0;
            const absIndex = items.findIndex((it) => it.id === item.id);
            return (
              <DeckCard
                key={item.id}
                item={item}
                stackIdx={stackIdx}
                isFront={isFront}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                offsetTopPct={offsetTopPct}
                scaleStep={scaleStep}
                dimStep={dimStep}
                visibleCount={visibleCount}
                swipeThreshold={swipeThreshold}
                springStiffness={springStiffness}
                springDamping={springDamping}
                dragY={dragY}
                dragRotateX={rotateX}
                dragOpacity={dragOpacity}
                onSwipeUp={goNext}
                onSwipeDown={goPrev}
              >
                {renderCard(item, {
                  active: isFront,
                  index: absIndex === -1 ? stackIdx : absIndex,
                  offset: stackIdx,
                })}
              </DeckCard>
            );
          })}
        </AnimatePresence>

        {/* Setas laterais ------------------------------------------------ */}
        {showArrows && total > 1 && (
          <>
            <button
              type="button"
              aria-label="Cartao anterior"
              onClick={goPrev}
              className="btn-neon-circle-red absolute left-4 top-1/2 z-20 -translate-y-1/2"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              aria-label="Proximo cartao"
              onClick={goNext}
              className="btn-neon-circle-red absolute right-4 top-1/2 z-20 -translate-y-1/2"
            >
              <ChevronRight />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeckCard — card unico na pilha
// ---------------------------------------------------------------------------

type DragMV = ReturnType<typeof useMotionValue<number>>;
type DragTransform = ReturnType<typeof useTransform<number, number>>;

type DeckCardProps<T extends CardDeckItem> = {
  item: T;
  stackIdx: number;
  isFront: boolean;
  cardWidth: number;
  cardHeight: number;
  offsetTopPct: number;
  scaleStep: number;
  dimStep: number;
  visibleCount: number;
  swipeThreshold: number;
  springStiffness: number;
  springDamping: number;
  dragY: DragMV;
  dragRotateX: DragTransform;
  dragOpacity: DragTransform;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  children: ReactNode;
};

function DeckCard<T extends CardDeckItem>({
  stackIdx,
  isFront,
  cardWidth,
  cardHeight,
  offsetTopPct,
  scaleStep,
  dimStep,
  visibleCount,
  swipeThreshold,
  springStiffness,
  springDamping,
  dragY,
  dragRotateX,
  dragOpacity,
  onSwipeUp,
  onSwipeDown,
  children,
}: DeckCardProps<T>) {
  // Posicionamento empilhado: cada camada atras sobe um pouco e encolhe.
  // Usamos % da altura pra escalar com cardHeight.
  const topPct = -stackIdx * offsetTopPct;
  const scale = 1 - stackIdx * scaleStep;
  const brightness = Math.max(0.3, 1 - stackIdx * dimStep);
  // zIndex: cartas da frente ficam por cima.
  const zIndex = 100 - stackIdx;
  // Cartas atras nao recebem ponteiro pra nao bloquear o drag do da frente.
  const interactive = isFront;
  // Cartas alem do visibleCount ficam invisiveis (mas ainda no DOM
  // pra animacao de entrada quando viram da frente).
  const opacityForLayer = stackIdx >= visibleCount ? 0 : 1;

  // Handler do drag end: avalia travel + velocity.
  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const travel = info.offset.y;
    const velocity = info.velocity.y;
    const passedThreshold =
      Math.abs(travel) > swipeThreshold || Math.abs(velocity) > 500;
    if (passedThreshold) {
      if (travel < 0 || velocity < -500) {
        // Drag pra cima -> manda o card da frente pro fim do deck.
        onSwipeUp();
      } else {
        // Drag pra baixo -> traz o ultimo do deck pra frente.
        onSwipeDown();
      }
    }
    // Sempre reseta o motion value pra proxima sessao de drag.
    dragY.set(0);
  };

  // Style condicional: o card da frente usa motion values pro tilt + opacity;
  // os de tras ficam estaticos no empilhamento.
  const motionStyle = isFront
    ? {
        position: "absolute" as const,
        top: 0,
        left: "50%",
        marginLeft: -cardWidth / 2,
        width: cardWidth,
        height: cardHeight,
        zIndex,
        y: dragY,
        rotateX: dragRotateX,
        opacity: dragOpacity,
        transformPerspective: 1000,
        transformStyle: "preserve-3d" as const,
        cursor: "grab" as const,
        willChange: "transform, opacity",
        filter: `brightness(${brightness})`,
      }
    : {
        position: "absolute" as const,
        top: 0,
        left: "50%",
        marginLeft: -cardWidth / 2,
        width: cardWidth,
        height: cardHeight,
        zIndex,
        transformPerspective: 1000,
        transformStyle: "preserve-3d" as const,
        pointerEvents: "none" as const,
        willChange: "transform, opacity",
        filter: `brightness(${brightness})`,
      };

  return (
    <motion.div
      initial={{
        opacity: 0,
        top: `${topPct - 4}%`,
        scale: scale * 0.96,
      }}
      animate={{
        opacity: opacityForLayer,
        top: `${topPct}%`,
        scale,
      }}
      exit={{
        opacity: 0,
        scale: scale * 0.92,
      }}
      transition={{
        type: "spring",
        stiffness: springStiffness,
        damping: springDamping,
        mass: 0.9,
      }}
      drag={interactive ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDrag={
        interactive
          ? (_e, info) => {
              dragY.set(info.offset.y);
            }
          : undefined
      }
      onDragEnd={interactive ? handleDragEnd : undefined}
      whileDrag={
        interactive
          ? {
              scale: scale * 1.05,
              zIndex: 200,
              cursor: "grabbing",
            }
          : undefined
      }
      style={motionStyle}
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
