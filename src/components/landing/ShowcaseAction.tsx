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
          className="-mt-12 mx-auto h-[30rem] w-full max-w-5xl rounded-[30px] border-4 border-[var(--color-ivory-22)] bg-[var(--color-onyx-soft)] p-2 shadow-2xl md:h-[40rem] md:p-6"
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
// FEATURE ROW (zigzag esquerda/direita)
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

function FeatureRow({
  reverse = false,
  eyebrow,
  title,
  description,
  destaques,
  image,
  imageAlt,
  accent = "signal",
}: {
  reverse?: boolean;
  eyebrow: string;
  title: string;
  description: string;
  destaques?: string[];
  image: string;
  imageAlt: string;
  accent?: Accent;
}) {
  const cor = ACCENT_CSS[accent];

  return (
    <div
      className={`grid items-center gap-10 md:gap-16 md:grid-cols-2 ${
        reverse ? "md:[direction:rtl]" : ""
      }`}
    >
      {/* Texto */}
      <div className="[direction:ltr]">
        <span
          className="font-mono text-[11px] uppercase tracking-[0.32em]"
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

      {/* Imagem */}
      <div className="[direction:ltr]">
        <div
          className="overflow-hidden rounded-2xl border border-[var(--color-line)]"
          style={{ boxShadow: ACCENT_GLOW[accent] }}
        >
          <Image
            src={image}
            alt={imageAlt}
            width={1280}
            height={800}
            className="block h-auto w-full"
          />
        </div>
      </div>
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
      <div className="mx-auto max-w-[1200px] space-y-32 px-6 py-24 sm:px-10 md:py-32">
        <FeatureRow
          eyebrow="01 · Visão Geral"
          title="A sua carteira em um só olhar."
          description="No painel principal, o cliente vê o resumo do que o escritório está rastreando para ele — sem precisar pedir relatório, sem precisar marcar reunião."
          destaques={[
            "Total de patrimônio identificado nos processos onde é credor.",
            "Penhoras efetivadas no mês e evolução em série de 12 meses.",
            "Casos ativos, pausados e encerrados separados.",
            "Limite mensal de pesquisa contratado e quanto já foi usado.",
          ]}
          image="/img/showcase/cliente-painel.png"
          imageAlt="Painel do Cliente — visão geral"
          accent="signal"
        />

        <FeatureRow
          reverse
          eyebrow="02 · Onde estão os bens"
          title="Mapa do Brasil com drill-down por estado."
          description="A distribuição patrimonial em escala continental, com clique em qualquer UF para abrir o mapa estadual e ver as cidades onde estão os bens rastreados."
          destaques={[
            "Bolhas dimensionadas pelo valor estimado em cada estado.",
            "Drill-down para o estado: cidades + pinos individuais por bem.",
            "Top 5 UFs com maior concentração patrimonial.",
          ]}
          image="/img/showcase/mapa-continental.png"
          imageAlt="Mapa do Brasil — visão continental"
          accent="signal"
        />

        <FeatureRow
          eyebrow="03 · Detalhe geográfico"
          title="Cada bem no lugar exato."
          description="O drill-down estadual abre as cidades onde o escritório localizou patrimônio. O cliente acompanha geograficamente o trabalho que está sendo feito."
          image="/img/showcase/mapa-estadual.png"
          imageAlt="Mapa estadual com drill-down em SP"
          accent="signal"
        />

        <FeatureRow
          reverse
          eyebrow="04 · Patrimônio localizado"
          title="Dossiê completo do devedor."
          description="Quando o cliente clica em um devedor, vê tudo o que foi localizado: veículos, imóveis, participações societárias, processos e endereços — organizados por categoria, com fonte e data."
          destaques={[
            "Bens encontrados separados por tipo, com ícones e contadores.",
            "Timeline cronológica das medidas tomadas no processo.",
            "Documentos disponíveis para consulta sob demanda.",
            "Sem expor advogado responsável ou custos internos.",
          ]}
          image="/img/showcase/cliente-dossie.png"
          imageAlt="Dossiê Patrimonial do Devedor"
          accent="devedor"
        />

        <FeatureRow
          eyebrow="05 · Transparência financeira"
          title="Onde cada real do orçamento foi investido."
          description="O cliente acompanha em tempo real quanto está sendo gasto em consultas pagas — por devedor, por fonte de dados e por período."
          destaques={[
            "Total do mês versus limite contratado, com barra de progresso.",
            "Investimento por devedor com breakdown por API consultada.",
            "Filtro de período: 7 dias, 30 dias, 90 dias, mês ou ano.",
            "Preferências de limite global, por modo e por API específica.",
          ]}
          image="/img/showcase/cliente-custos.png"
          imageAlt="Monitor de Custos"
          accent="gold"
        />

        {/* Bloco final: equipe — discreto, contexto e nao venda */}
        <div className="relative rounded-3xl border border-[var(--color-ivory-12)] bg-[var(--color-onyx-soft)]/40 p-8 md:p-12">
          <span className="absolute -top-3 left-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-onyx)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-gold)]">
            Por trás do dia a dia
          </span>

          <FeatureRow
            reverse
            eyebrow="A engrenagem"
            title="O escritório enxerga ainda mais."
            description="Tudo o que o cliente vê é alimentado pela visão da equipe — onde o escritório consulta APIs, registra medidas, monta dossiês e gera as peças. Você só vê o resultado; nós cuidamos do processo."
            image="/img/showcase/equipe-dossie.png"
            imageAlt="Dossiê do Devedor visto pela equipe"
            accent="gold"
          />
        </div>
      </div>
    </div>
  );
}
