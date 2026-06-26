"use client";

// ShowcaseAction — secao "em acao" da landing.
//
// Ideia: um NOTEBOOK estilizado em CSS no centro da tela; dentro da tela
// do notebook, a imagem do dashboard do cliente (uma captura inteira da
// pagina, alta) rola verticalmente CONFORME o visitante rola a pagina.
// O efeito eh "voce esta vendo o cliente scrollando o painel dele".
//
// Tecnica (motion/react): pin + scrub.
// - Container raiz de altura 300vh marca o "espaco de scroll".
// - Filho sticky 100vh contem o notebook.
// - scrollYProgress vai de 0 a 1 conforme a viewport atravessa o container.
// - A imagem dentro do notebook tem y: useTransform([0,1], [0, -(imgH - telaH)])
//   medindo ALTURA REAL via ResizeObserver no client.
//
// A direita, em desktop, 4 cards laterais com prints menores aparecem com
// fade conforme o scroll progride (cada um em uma faixa de 0..1):
//   - Monitor de Custos
//   - Dossie do Devedor
//   - Mapa Continental
//   - Mapa Estadual
//
// Em mobile, sem sticky: notebook full width seguido dos cards empilhados.

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValue } from "motion/react";

type CardLateral = {
  id: string;
  titulo: string;
  legenda: string;
  imagem: string;
  cor: "signal" | "gold" | "devedor";
  // Faixa de scrollYProgress em que o card fica visivel (fade in/out).
  faixa: [number, number];
};

const COR_TOKEN: Record<CardLateral["cor"], string> = {
  signal: "var(--color-signal)",
  gold: "var(--color-gold)",
  devedor: "var(--color-devedor)",
};

const CARDS: CardLateral[] = [
  {
    id: "custos",
    titulo: "Monitor de Custos",
    legenda: "O cliente acompanha quanto cada caso ja custou.",
    imagem: "/img/showcase/cliente-custos.png",
    cor: "signal",
    faixa: [0, 0.28],
  },
  {
    id: "dossie",
    titulo: "Dossie do Devedor",
    legenda: "A equipe abre o dossie completo da parte contraria.",
    imagem: "/img/showcase/equipe-dossie.png",
    cor: "devedor",
    faixa: [0.22, 0.52],
  },
  {
    id: "mapa-pais",
    titulo: "Mapa Continental",
    legenda: "Onde estao os processos no pais inteiro.",
    imagem: "/img/showcase/mapa-continental.png",
    cor: "gold",
    faixa: [0.46, 0.76],
  },
  {
    id: "mapa-estado",
    titulo: "Mapa Estadual",
    legenda: "Drill-down num estado, cidade a cidade.",
    imagem: "/img/showcase/mapa-estadual.png",
    cor: "gold",
    faixa: [0.7, 1],
  },
];

export function ShowcaseAction() {
  const containerRef = useRef<HTMLDivElement>(null);
  const telaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // scroll do container alto (300vh): 0 quando entra, 1 quando sai
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Alturas reais medidas no client (a imagem nao tem altura fixa — width 100%, height auto)
  const [alturaTela, setAlturaTela] = useState(0);
  const [alturaImg, setAlturaImg] = useState(0);

  useEffect(() => {
    if (!telaRef.current || !imgRef.current) return;

    const tela = telaRef.current;
    const img = imgRef.current;

    const medir = () => {
      setAlturaTela(tela.clientHeight);
      // naturalHeight * (largura renderizada / naturalWidth) = altura renderizada
      const w = img.clientWidth;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      if (nw > 0) {
        setAlturaImg((nh * w) / nw);
      } else {
        setAlturaImg(img.clientHeight);
      }
    };

    // Mede assim que monta
    medir();

    // Se a imagem ainda esta carregando, mede depois do onload
    if (!img.complete) {
      img.addEventListener("load", medir);
    }

    const obs = new ResizeObserver(medir);
    obs.observe(tela);
    obs.observe(img);

    window.addEventListener("resize", medir);
    return () => {
      obs.disconnect();
      window.removeEventListener("resize", medir);
      img.removeEventListener("load", medir);
    };
  }, []);

  // Quanto a imagem precisa subir: (alturaImg - alturaTela). Se imagem menor
  // que a tela, nao desloca (deslocamento = 0).
  const deslocamento = Math.max(0, alturaImg - alturaTela);
  const y = useTransform(scrollYProgress, [0, 1], [0, -deslocamento]);

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: "300vh" }}
      aria-label="Sonar em acao"
    >
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-10">
          {/* Cabecalho */}
          <div className="mb-10 text-center md:mb-12">
            <span className="eyebrow">Em acao</span>
            <h2 className="mt-5 font-serif text-[clamp(28px,4vw,46px)] font-medium leading-[1.15] tracking-tight text-ivory">
              Veja o Sonar funcionando.
            </h2>
            <p className="mx-auto mt-4 max-w-[640px] text-base leading-relaxed text-[var(--color-ivory-88)]">
              Rolando essa pagina, voce ve o painel do cliente passando dentro
              do notebook — como se estivesse olhando por cima do ombro dele.
            </p>
          </div>

          {/* Layout: notebook + cards */}
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1.6fr_1fr]">
            {/* Notebook */}
            <NotebookFrame
              telaRef={telaRef}
              imgRef={imgRef}
              y={y}
            />

            {/* Cards laterais — desktop only, com fade por faixa */}
            <div className="hidden flex-col gap-4 md:flex">
              {CARDS.map((card) => (
                <CardComFade
                  key={card.id}
                  card={card}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: cards empilhados ABAIXO do sticky (fora do flex sticky).
          Como a section tem 300vh, o final dela coincide com saida do sticky;
          colocamos os cards num bloco absoluto no fim. */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-10 md:hidden">
        <div className="mx-auto flex max-w-[640px] flex-col gap-4">
          {CARDS.map((card) => (
            <CardEstatico key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Notebook ----------

function NotebookFrame({
  telaRef,
  imgRef,
  y,
}: {
  telaRef: React.RefObject<HTMLDivElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  y: ReturnType<typeof useMotionValue<number>> | ReturnType<typeof useTransform<number, number>>;
}) {
  return (
    <div className="mx-auto w-full max-w-[900px]">
      {/* Corpo do notebook */}
      <div
        className="relative rounded-3xl border-2 border-[var(--color-ivory-12)] bg-[var(--color-onyx-soft)] p-3 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.85),0_0_0_1px_rgba(212,175,55,0.08)] sm:p-4"
      >
        {/* Notch (camera) */}
        <div className="mx-auto mb-2 flex items-center justify-center gap-1.5">
          <span className="block h-1.5 w-1.5 rounded-full bg-[var(--color-ivory-22)]" />
          <span className="block h-1 w-10 rounded-full bg-[var(--color-onyx)]" />
          <span className="block h-1.5 w-1.5 rounded-full bg-[var(--color-ivory-22)]" />
        </div>

        {/* Tela */}
        <div
          ref={telaRef}
          className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-[var(--color-ivory-12)] bg-[var(--color-onyx)]"
        >
          {/* A imagem do painel inteiro do cliente; sobe com o scroll */}
          <motion.img
            ref={imgRef}
            src="/img/showcase/cliente-painel-full.png"
            alt="Painel do cliente do Sonar — visao completa rolando dentro do notebook."
            style={{ y, width: "100%", height: "auto" }}
            className="block select-none"
            draggable={false}
          />

          {/* Reflexo sutil */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/20"
          />
        </div>
      </div>

      {/* Stand (base trapezoidal) */}
      <div
        aria-hidden="true"
        className="relative mx-auto h-3 w-[88%] bg-[var(--color-onyx-soft)] border-x-2 border-b-2 border-[var(--color-ivory-12)]"
        style={{ clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0 100%)" }}
      />
      <div
        aria-hidden="true"
        className="mx-auto h-1 w-[40%] rounded-b-full bg-[var(--color-onyx)]"
      />
    </div>
  );
}

// ---------- Cards laterais ----------

function CardComFade({
  card,
  scrollYProgress,
}: {
  card: CardLateral;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  // Faixa [a, b] -> opacity 0..1..0 com leve fade in/out (0.08 nas pontas)
  const [a, b] = card.faixa;
  const margem = Math.min(0.08, (b - a) / 4);
  const opacity = useTransform(
    scrollYProgress,
    [a, a + margem, b - margem, b],
    [0.25, 1, 1, 0.25],
  );
  const scale = useTransform(
    scrollYProgress,
    [a, a + margem, b - margem, b],
    [0.96, 1, 1, 0.96],
  );

  return (
    <motion.div
      style={{ opacity, scale }}
      className="relative overflow-hidden rounded-xl border bg-[var(--color-onyx-soft)] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]"
    >
      {/* Glow sutil colorido na borda */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          borderColor: `color-mix(in srgb, ${COR_TOKEN[card.cor]} 35%, transparent)`,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${COR_TOKEN[card.cor]} 28%, transparent), 0 0 24px -6px color-mix(in srgb, ${COR_TOKEN[card.cor]} 40%, transparent)`,
        }}
      />

      <div className="aspect-[4/3] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.imagem}
          alt={card.titulo}
          className="h-full w-full object-cover object-top"
        />
      </div>

      <div className="px-4 py-3">
        <span
          className="font-mono text-[12px] uppercase tracking-[0.22em]"
          style={{ color: COR_TOKEN[card.cor] }}
        >
          {card.titulo}
        </span>
        <p className="mt-1 text-[13px] leading-snug text-[var(--color-ivory-88)]">
          {card.legenda}
        </p>
      </div>
    </motion.div>
  );
}

function CardEstatico({ card }: { card: CardLateral }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[var(--color-ivory-12)] bg-[var(--color-onyx-soft)]"
      style={{
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${COR_TOKEN[card.cor]} 22%, transparent)`,
      }}
    >
      <div className="aspect-[4/3] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.imagem}
          alt={card.titulo}
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div className="px-4 py-3">
        <span
          className="font-mono text-[12px] uppercase tracking-[0.22em]"
          style={{ color: COR_TOKEN[card.cor] }}
        >
          {card.titulo}
        </span>
        <p className="mt-1 text-[13px] leading-snug text-[var(--color-ivory-88)]">
          {card.legenda}
        </p>
      </div>
    </div>
  );
}
