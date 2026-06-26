"use client";

// Showcase em duas partes:
// 1) Hero notebook com efeito "container scroll" (rotateX 20->0 + scale,
//    inspirado em Aceternity ContainerScroll). Dentro da tela do notebook,
//    a imagem do dashboard do cliente rola translateY conforme o scroll
//    avanca, depois que o notebook ja esta plano.
// 2) FeatureRows zigzag: alternando imagem-esquerda/texto-direita e
//    vice-versa. Foco TOTAL na versao CLIENTE (esse Showcase eh pra
//    cliente entender o Sonar, nao pra venda B2B do escritorio).
//    Existe um unico bloco discreto no final mostrando que existe uma
//    visao espelhada pra equipe — so pra contextualizar.

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import ApiPesquisaAnimacao from "./ApiPesquisaAnimacao";

// ==================================================================
// HERO NOTEBOOK
// ==================================================================

function HeroNotebook() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fase 1 (0 -> 0.4): notebook se levanta (rotateX 20deg -> 0deg) +
  //   scale (1.05 -> 1) + cabecalho sobe (translateY 0 -> -100).
  // Fase 2 (0.4 -> 1): imagem rola dentro do notebook (translateY 0 -> -72%).
  const rotate = useTransform(scrollYProgress, [0, 0.4, 1], [20, 0, 0]);
  const scale = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    isMobile ? [0.7, 0.9, 0.9] : [1.05, 1, 1],
  );
  const headerTranslate = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    [0, -100, -100],
  );
  const imageY = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    ["0%", "0%", "-72%"],
  );

  return (
    <div
      ref={containerRef}
      className="relative flex h-[60rem] items-center justify-center p-2 md:h-[80rem] md:p-20"
    >
      <div
        className="relative w-full py-10 md:py-32"
        style={{ perspective: "1000px" }}
      >
        {/* Cabecalho */}
        <motion.div
          style={{ translateY: headerTranslate }}
          className="mx-auto max-w-5xl px-6 text-center"
        >
          <span className="eyebrow mb-6 inline-block">Em ação</span>
          <h2 className="font-serif text-[clamp(28px,4vw,46px)] font-medium leading-[1.15] tracking-tight text-ivory">
            Veja o Sonar funcionando.
          </h2>
          <p className="mx-auto mt-5 max-w-[640px] text-base leading-relaxed text-[var(--color-ivory-88)]">
            Rolando esta página, o dashboard do cliente se anima como
            se ele estivesse acessando a plataforma agora.
          </p>
        </motion.div>

        {/* Notebook */}
        <motion.div
          style={{
            rotateX: rotate,
            scale,
            boxShadow:
              "0 0 0 1px rgba(60,255,138,0.12), 0 9px 20px rgba(0,0,0,0.45), 0 37px 37px rgba(0,0,0,0.40), 0 84px 50px rgba(0,0,0,0.30), 0 149px 60px rgba(0,0,0,0.10)",
          }}
          className="mt-16 mx-auto h-[30rem] w-full max-w-5xl rounded-[30px] border-4 border-[var(--color-ivory-22)] bg-[var(--color-onyx-soft)] p-2 shadow-2xl md:mt-20 md:h-[40rem] md:p-6"
        >
          {/* Notch sutil no topo */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 inline-block h-1.5 w-20 rounded-full bg-[var(--color-line)]"
          />

          <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[var(--color-onyx)]">
            <motion.div style={{ y: imageY }} className="relative w-full">
              <Image
                src="/img/showcase/cliente-painel-full.png"
                alt="Dashboard do Cliente"
                width={1280}
                height={3500}
                priority
                className="block w-full"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ==================================================================
// ACCENT TOKENS
// ==================================================================

type Accent = "signal" | "gold" | "devedor";

const ACCENT_CSS: Record<Accent, string> = {
  signal: "var(--color-signal)",
  gold: "var(--color-gold)",
  devedor: "var(--color-devedor)",
};

const ACCENT_GLOW: Record<Accent, string> = {
  signal:
    "0 0 0 1px rgba(60,255,138,0.30), 0 24px 60px -20px rgba(60,255,138,0.18)",
  gold: "0 0 0 1px rgba(201,162,74,0.30), 0 24px 60px -20px rgba(201,162,74,0.18)",
  devedor:
    "0 0 0 1px rgba(220,38,38,0.30), 0 24px 60px -20px rgba(220,38,38,0.18)",
};

// ==================================================================
// SCROLL WINDOW
// ==================================================================
// Janela com altura fixa onde a imagem (provavelmente full-page do
// dashboard) rola translateY conforme o usuario rola a pagina. Sem
// efeito 3D — so um container rounded com border + glow do accent.
// Usado nos blocos 3 (dossie) e 5 (custos).

function ScrollWindow({
  src,
  alt,
  accent = "signal",
  imageHeight = 2400,
  aspect = "16/10",
  scrollEnd = "-65%",
}: {
  src: string;
  alt: string;
  accent?: Accent;
  imageHeight?: number;
  aspect?: string;
  /** Ate onde a imagem rola (em %). Default -65% (mostra topo + metade
   * inferior). Use -95% pra scroll COMPLETO (revela imagem inteira). */
  scrollEnd?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    // Offset mais conservador: progresso 0 só começa quando o elemento
    // já está 25% dentro do viewport (pelo topo) e termina quando ele
    // está 25% do bottom — assim o usuário vê o topo da imagem antes
    // de qualquer rolagem acontecer.
    offset: ["start 25%", "end 75%"],
  });

  // Pausa inicial: nos primeiros 18% do progresso a imagem fica parada
  // no topo, depois rola até `scrollEnd`. Isso dá tempo do usuário ver
  // o cabeçalho/topo da tela antes de qualquer movimento.
  const y = useTransform(scrollYProgress, [0, 0.18, 1], ["0%", "0%", scrollEnd]);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-onyx)]"
      style={{
        aspectRatio: aspect,
        boxShadow: ACCENT_GLOW[accent],
      }}
    >
      <motion.div style={{ y }} className="relative w-full will-change-transform">
        <Image
          src={src}
          alt={alt}
          width={1280}
          height={imageHeight}
          className="block w-full"
        />
      </motion.div>

      {/* Veu sutil no rodape, pra dar a sensacao de "continua rolando" */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--color-onyx)] to-transparent"
      />
    </div>
  );
}

// ==================================================================
// MONITOR VERTICAL (formato 9:16, scroll mais suave)
// ==================================================================
// Tela vertical estilo "monitor em pe" pro dashboard analitico do
// devedor. Scroll lento (range 0 a -55%) e moldura sutil que lembra
// um monitor.

function VerticalMonitor({
  src,
  alt,
  accent = "gold",
  imageHeight = 2400,
}: {
  src: string;
  alt: string;
  accent?: Accent;
  imageHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    // Mesmo offset conservador do ScrollWindow: dá tempo de ver o topo
    // do monitor vertical antes da rolagem começar.
    offset: ["start 25%", "end 75%"],
  });

  // Pausa inicial um pouco maior (20%) e amplitude menor (-50%) porque
  // o monitor vertical é mais alto e o movimento precisa ser mais suave.
  const y = useTransform(scrollYProgress, [0, 0.2, 1], ["0%", "0%", "-50%"]);
  // Pequeno fade-in no comeco, sem grandes transformacoes.
  const opacity = useTransform(scrollYProgress, [0, 0.1, 1], [0.6, 1, 1]);

  return (
    <div className="relative mx-auto flex w-full max-w-[420px] flex-col items-center">
      {/* moldura externa estilo monitor */}
      <div
        className="relative w-full rounded-[28px] border border-[var(--color-ivory-22)] bg-[var(--color-onyx-soft)] p-3 shadow-2xl"
        style={{ boxShadow: ACCENT_GLOW[accent] }}
      >
        {/* webcam/notch sutil */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-2 inline-block h-1 w-10 -translate-x-1/2 rounded-full bg-[var(--color-line)]"
        />

        <motion.div
          ref={ref}
          style={{ opacity, aspectRatio: "9/16" }}
          className="relative w-full overflow-hidden rounded-2xl bg-[var(--color-onyx)]"
        >
          <motion.div
            style={{ y }}
            className="relative w-full will-change-transform"
          >
            <Image
              src={src}
              alt={alt}
              width={720}
              height={imageHeight}
              className="block w-full"
            />
          </motion.div>

          {/* gradient sutil no rodape */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--color-onyx)] to-transparent"
          />
        </motion.div>
      </div>

      {/* base/pedestal do monitor */}
      <div className="mt-1 h-1.5 w-24 rounded-b-md bg-[var(--color-ivory-22)]" />
      <div className="h-2 w-40 rounded-b-xl bg-[var(--color-line)]" />
    </div>
  );
}

// ==================================================================
// FEATURE ROW (zigzag esquerda/direita) — versao generica que aceita
// qualquer "media" (imagem estatica, ScrollWindow, VerticalMonitor,
// animacao, etc).
// ==================================================================

function FeatureRow({
  reverse = false,
  eyebrow,
  title,
  description,
  destaques,
  media,
  accent = "signal",
  imageWide = false,
}: {
  reverse?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  destaques?: string[];
  media: React.ReactNode;
  accent?: Accent;
  /** Quando true, a imagem ocupa proporcao maior (1.6fr vs texto 1fr). */
  imageWide?: boolean;
}) {
  const cor = ACCENT_CSS[accent];
  const gridCols = imageWide
    ? "md:grid-cols-[1fr_1.6fr]"
    : "md:grid-cols-2";

  return (
    <div
      className={`grid items-center gap-10 md:gap-16 ${gridCols} ${
        reverse ? "md:[direction:rtl]" : ""
      }`}
    >
      {/* Texto */}
      <div className="[direction:ltr]">
        <span
          className="font-mono text-[12px] uppercase tracking-[0.32em]"
          style={{ color: cor }}
        >
          {eyebrow}
        </span>
        <h3 className="mt-3 font-serif text-[clamp(24px,3vw,36px)] font-medium leading-[1.2] text-ivory">
          {title}
        </h3>
        <p className="mt-5 text-base leading-relaxed text-[var(--color-ivory-88)]">
          {description}
        </p>
        {destaques && destaques.length > 0 ? (
          <ul className="mt-6 flex flex-col gap-3">
            {destaques.map((d) => (
              <li
                key={d}
                className="flex items-start gap-3 text-[15px] leading-relaxed text-[var(--color-ivory-88)]"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background: cor,
                    boxShadow: `0 0 8px ${cor}`,
                  }}
                />
                {d}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Media */}
      <div className="[direction:ltr]">{media}</div>
    </div>
  );
}

// Helper: imagem estatica padrao (caso o bloco nao precise de scroll).
function ImagemEstatica({
  src,
  alt,
  accent = "signal",
}: {
  src: string;
  alt: string;
  accent?: Accent;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-[var(--color-line)]"
      style={{ boxShadow: ACCENT_GLOW[accent] }}
    >
      <Image
        src={src}
        alt={alt}
        width={1280}
        height={800}
        className="block h-auto w-full"
      />
    </div>
  );
}

// ==================================================================
// SHOWCASE PRINCIPAL
// ==================================================================

export function ShowcaseAction() {
  return (
    <div className="relative">
      <HeroNotebook />

      {/* Feature rows — TODAS focadas no CLIENTE.
          O ultimo bloco discreto explica que existe uma versao espelhada
          pra equipe; nao eh venda B2B. */}
      <div className="mx-auto max-w-[1200px] space-y-32 px-6 pb-24 pt-4 sm:px-10 md:pb-32 md:pt-8">
        {/* 01 — Visão geral (graficos do painel) */}
        <FeatureRow
          eyebrow="01 · Visão Geral"
          title="A sua carteira em um só olhar."
          description="No painel principal, o cliente lê os números que importam em segundos — KPIs no topo, gráfico de evolução mensal das penhoras e composição patrimonial por tipo de bem."
          destaques={[
            "KPIs em destaque: patrimônio total, penhoras do mês e casos ativos.",
            "Evolução mensal das penhoras em série de 12 meses.",
            "Mix de bens por categoria: imóveis, veículos, participações e mais.",
            "Tudo atualizado conforme o escritório consulta novas fontes.",
          ]}
          media={
            <ImagemEstatica
              src="/img/showcase/cliente-painel-graficos.png"
              alt="Painel do Cliente — gráficos de evolução e mix de bens"
              accent="signal"
            />
          }
          accent="signal"
          imageWide
        />

        {/* 02 — Mapa do Brasil com drill-down (UNIDO) */}
        <div>
          <div className="mb-8 max-w-3xl">
            <span
              className="font-mono text-[12px] uppercase tracking-[0.32em]"
              style={{ color: ACCENT_CSS.signal }}
            >
              02 · Onde estão os bens
            </span>
            <h3 className="mt-3 font-serif text-[clamp(24px,3vw,36px)] font-medium leading-[1.2] text-ivory">
              Mapa do Brasil com Drill-Down por Estado.
            </h3>
            <p className="mt-5 text-base leading-relaxed text-[var(--color-ivory-88)]">
              Distribuição patrimonial em escala continental. Um clique
              em qualquer UF abre o mapa estadual com as cidades onde
              estão os bens rastreados — geografia e patrimônio juntos,
              sem precisar abrir relatório.
            </p>
          </div>

          <div className="grid items-stretch gap-6 md:grid-cols-2">
            {/* Mapa continental */}
            <div className="flex flex-col gap-3">
              <span
                className="font-mono text-[11px] uppercase tracking-[0.28em]"
                style={{ color: "var(--color-ivory-66)" }}
              >
                Visão continental
              </span>
              <div
                className="overflow-hidden rounded-2xl border border-[var(--color-line)]"
                style={{ boxShadow: ACCENT_GLOW.signal }}
              >
                <Image
                  src="/img/showcase/mapa-continental.png"
                  alt="Mapa do Brasil — bolhas dimensionadas por estado"
                  width={1280}
                  height={800}
                  className="block h-auto w-full"
                />
              </div>
            </div>

            {/* Drill-down em SP */}
            <div className="flex flex-col gap-3">
              <span
                className="font-mono text-[11px] uppercase tracking-[0.28em]"
                style={{ color: "var(--color-ivory-66)" }}
              >
                Drill-down em São Paulo
              </span>
              <div
                className="overflow-hidden rounded-2xl border border-[var(--color-line)]"
                style={{ boxShadow: ACCENT_GLOW.signal }}
              >
                <Image
                  src="/img/showcase/mapa-estadual.png"
                  alt="Drill-down em São Paulo — cidades e pinos por bem"
                  width={1280}
                  height={800}
                  className="block h-auto w-full"
                />
              </div>
            </div>
          </div>

          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Bolhas dimensionadas pelo valor estimado em cada estado.",
              "Drill-down por UF: cidades + pinos individuais por bem.",
              "Top 5 UFs com maior concentração patrimonial.",
            ].map((d) => (
              <li
                key={d}
                className="flex items-start gap-3 text-[15px] leading-relaxed text-[var(--color-ivory-88)]"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background: ACCENT_CSS.signal,
                    boxShadow: `0 0 8px ${ACCENT_CSS.signal}`,
                  }}
                />
                {d}
              </li>
            ))}
          </ul>
        </div>

        {/* 03 — Dossie do devedor (ScrollWindow) */}
        <FeatureRow
          reverse
          eyebrow="03 · Patrimônio Localizado"
          title="Dossiê Completo do Devedor."
          description="Quando o cliente clica em um devedor, vê tudo o que foi localizado: veículos, imóveis, participações societárias, processos e endereços — organizados por categoria, com fonte e data."
          destaques={[
            "Bens encontrados separados por tipo, com ícones e contadores.",
            "Timeline cronológica das medidas tomadas no processo.",
            "Documentos disponíveis para consulta sob demanda.",
            "Sem expor advogado responsável ou custos internos.",
          ]}
          media={
            <ScrollWindow
              src="/img/showcase/cliente-dossie-full.png"
              alt="Dossiê do Devedor — visão do cliente, página completa"
              accent="devedor"
              imageHeight={2400}
              aspect="4/5"
            />
          }
          accent="devedor"
        />

        {/* 04 — Dashboard analitico do devedor (imagem estatica focada
            nos graficos, sem scroll). */}
        <FeatureRow
          eyebrow="04 · Análise Profunda"
          title="Dashboard Analítico do Devedor."
          description="Cada devedor tem seu próprio painel analítico — uma leitura visual da concentração patrimonial, do histórico de medidas e da chance de recuperação. O cliente acompanha a estratégia sem precisar abrir o processo."
          destaques={[
            "Concentração patrimonial por categoria em gráfico de pizza.",
            "Linha do tempo das medidas com marcos do processo.",
            "Indicador de chance de recuperação calculado pela equipe.",
            "Comparativo entre devedores da mesma carteira.",
          ]}
          media={
            <ImagemEstatica
              src="/img/showcase/equipe-dashboard-analitico-full.png"
              alt="Dashboard analítico do devedor — gráficos de recuperabilidade, funil e patrimônio"
              accent="gold"
            />
          }
          accent="gold"
          imageWide
        />

        {/* 05 — Monitor de custos (ScrollWindow accent gold) */}
        <FeatureRow
          reverse
          eyebrow="05 · Transparência Financeira"
          title="Onde Cada Real do Orçamento Foi Investido."
          description="O cliente acompanha em tempo real quanto está sendo gasto em consultas pagas — por devedor, por fonte de dados e por período."
          destaques={[
            "Total do mês versus limite contratado, com barra de progresso.",
            "Investimento por devedor com breakdown por API consultada.",
            "Filtro de período: 7 dias, 30 dias, 90 dias, mês ou ano.",
            "Preferências de limite global, por modo e por API específica.",
          ]}
          media={
            <ScrollWindow
              src="/img/showcase/cliente-custos-full.png"
              alt="Monitor de Custos — página completa rolando"
              accent="gold"
              imageHeight={2400}
              aspect="4/5"
              scrollEnd="-95%"
            />
          }
          accent="gold"
        />

        {/* 06 — Por tras do dia a dia (animacao) */}
        <div className="relative rounded-3xl border border-[var(--color-ivory-12)] bg-[var(--color-onyx-soft)]/40 p-8 md:p-12">
          <span className="absolute -top-3 left-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-onyx)] px-3 py-1 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-gold)]">
            Por trás do dia a dia
          </span>

          <FeatureRow
            reverse
            eyebrow="A Engrenagem"
            title="O Escritório Roda Dezenas de APIs nos Bastidores."
            description="Tudo o que o cliente vê é alimentado pelo trabalho silencioso da equipe — o Sonar dispara uma sequência automática de consultas em fontes públicas e privadas a cada novo devedor, em segundo plano. Você só vê o resultado; nós cuidamos do processo."
            destaques={[
              "Sequência automática de consultas a cada novo devedor.",
              "Resultados consolidados no dossiê em minutos.",
              "Cada bem encontrado vai direto para o painel do cliente.",
            ]}
            media={<ApiPesquisaAnimacao />}
            accent="gold"
          />
        </div>
      </div>
    </div>
  );
}
