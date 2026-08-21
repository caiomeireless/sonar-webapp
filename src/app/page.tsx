// Landing pública do Sonar. Começa limpa, focada em apresentar a plataforma
// e empurrar pro /login. Sem dashboard ainda (próximo dia).
import Image from "next/image";
import Link from "next/link";
import { AssistantBot } from "@/components/AssistantBot";
import { HeaderParticles } from "@/components/HeaderParticles";
import { Logo } from "@/components/Logo";
import { LogoSymbolStatic, STAIRCASE_PATTERN } from "@/components/LogoSvg";
import { SonarScene } from "@/components/SonarScene";
import { CursorGlow } from "@/components/ui/CursorGlow";
import { ImageAutoSlider } from "@/components/ui/ImageAutoSlider";
import { LampLight } from "@/components/ui/LampLight";
import { ShowcaseAction } from "@/components/landing/ShowcaseAction";
import { GridBeam } from "@/components/landing/GridBeam";
import { ScrollReveals } from "@/components/landing/ScrollReveals";
import { SonarParticleText } from "@/components/ui/SonarParticleText";
import { SonarWaveParticles } from "@/components/ui/SonarWaveParticles";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export const dynamic = "force-static";

export default function LandingPage() {
  return (
    <main className="min-h-svh bg-onyx text-ivory">
      <CursorGlow />
      <ScrollReveals />
      {/* Header */}
      <header className="relative h-[170px] overflow-hidden">
        {/* Quadriculado: contorno forte no canto superior-esquerdo, some no inferior-direito */}
        <div
          className="bg-grid-strong animate-grid-pulse absolute inset-0"
          style={{
            maskImage:
              "linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
          }}
          aria-hidden="true"
        />
        {/* Vinheta lateral: escurece o quadriculado nas bordas esquerda e direita */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,12,11,0.85) 0%, transparent 18%, transparent 82%, rgba(10,12,11,0.85) 100%)",
          }}
          aria-hidden="true"
        />
        {/* LOGO no canto superior-esquerdo — arte oficial nova (PNG enviado
            pelo Caio 08/08), no tamanho natural pra não perder nitidez */}
        <div className="absolute bottom-0 left-0 top-0 z-20 flex items-center px-6">
          <Image
            src="/logo-bp-novo.png"
            alt="Battaglia & Pedrosa Advogados"
            width={565}
            height={94}
            priority
          />
        </div>
        {/* Cluster (robô + caption + botões) pinado no canto direito */}
        <div className="absolute right-6 top-1/2 z-20 flex -translate-y-1/2 flex-col items-end gap-2 sm:right-10">
          <div className="flex items-center gap-3">
            <AssistantBot />
          </div>
          <p className="mt-4 whitespace-nowrap text-[8px] font-mono uppercase tracking-[0.22em] text-[var(--color-gold)]">
            Projeto conduzido por Caio Vicentino
          </p>
        </div>
        {/* Divider signal-dash fixado na base do header (acompanha sticky) */}
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <Divider />
        </div>
      </header>

      {/* Hero */}
      <section
        id="hero"
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 90% 12%, rgba(60, 255, 138, 0.14) 0%, transparent 70%), linear-gradient(to right, #000000 0%, #000000 50%, #0a3024 100%)",
        }}
      >
        {/* Globe gigante absoluto no canto direito — metade cortada, rotaciona sozinho */}
        <div className="pointer-events-none absolute top-1/2 right-[-450px] z-20 hidden h-[1200px] w-[1200px] -translate-y-1/2 md:block">
          <SonarScene />
        </div>
        <div className="relative z-10 px-6 py-24 sm:px-10 md:py-32">
          <div className="md:ml-auto md:mr-[420px] md:max-w-[820px]">
            <span className="eyebrow mb-6 block">Busca patrimonial inteligente</span>
            <div>
            <div className="relative inline-block">
              <SonarParticleText className="mt-2 block" aria-label="Sonar" />
              {/* Colchete verde TEMP OCULTO — flip {false &&} pra reativar */}
              {false && (
              <svg
                className="pointer-events-none absolute left-[-200px] top-1/2 mt-[50px] hidden -translate-y-1/2 md:block"
                width="220"
                height="370"
                viewBox="0 0 220 370"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <filter id="bracket-glow" x="-20%" y="-10%" width="140%" height="120%">
                    <feGaussianBlur stdDeviation="1.5" result="g" />
                    <feMerge>
                      <feMergeNode in="g" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M 160 5 Q 175 5 175 20 L 175 213 Q 175 228 195 228 Q 175 228 175 243 L 175 350 Q 175 365 160 365"
                  stroke="#3CFF8A"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#bracket-glow)"
                />
              </svg>
              )}
              {/* Emit dourado + ondas verde signal (arcos SMIL suaves, SEM partículas) */}
              <svg
                className="pointer-events-none absolute left-full top-1/2 ml-[-36px] mt-[93px] hidden -translate-y-1/2 md:block"
                width="260"
                height="340"
                viewBox="0 0 260 340"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <filter id="sonar-wave-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="g" />
                    <feMerge>
                      <feMergeNode in="g" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Emit dourado — alvo dos sticks do globo */}
                <circle data-emit-anchor cx="20" cy="170" r="2.5" fill="#C9A24A" filter="url(#sonar-wave-glow)">
                  <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.55;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
                {/* Ondas verde signal — arcos suaves expandindo à direita */}
                <g transform="translate(40 170)" filter="url(#sonar-wave-glow)">
                  {[0, 0.65, 1.3, 1.95].map((delay, i) => (
                    <path
                      key={`green-hwave-${i}`}
                      d="M 0 -30 A 18 30 0 0 1 0 30"
                      fill="none"
                      stroke="#3CFF8A"
                      strokeWidth="1.8"
                      strokeOpacity="0"
                      transform="scale(0.1)"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="scale"
                        values="0.1;5.2"
                        dur="2.6s"
                        begin={`${delay}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.95;0"
                        dur="2.6s"
                        begin={`${delay}s`}
                        repeatCount="indefinite"
                      />
                    </path>
                  ))}
                </g>
              </svg>
              {/* TEMP OCULTO — escada, ondas, emit, ícones vermelhos */}
              {false && (
              <svg
                className="pointer-events-none absolute left-full top-1/2 ml-[100px] hidden -translate-y-1/2 md:block"
                width="420"
                height="400"
                viewBox="0 0 420 400"
                fill="none"
                style={{ overflow: "visible" }}
                aria-hidden="true"
              >
                <defs>
                  <filter id="band2-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="g" />
                    <feMerge>
                      <feMergeNode in="g" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* Escada halftone (mesmo padrão do logo) */}
                <g transform="translate(0 110) scale(5)" filter="url(#band2-glow)">
                  {STAIRCASE_PATTERN.map((r, i) => (
                    <rect
                      key={`b2-stair-${i}`}
                      x={r.x}
                      y={r.y}
                      width="6"
                      height="6"
                      fill="none"
                      stroke="#3CFF8A"
                      strokeWidth="0.7"
                      strokeOpacity={r.op}
                    />
                  ))}
                </g>
                {/* Ponto emissor pulsando entre a escada e as ondas */}
                <circle data-emit-anchor cx="100" cy="340" r="2.5" fill="#3CFF8A" filter="url(#band2-glow)">
                  <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.55;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
                {/* 4 ícones em neon vermelho abaixo das ondas + legendas */}
                <g
                  stroke="#FF3D5A"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  filter="url(#band2-glow)"
                >
                  {/* Imóveis - casa */}
                  <g transform="translate(5 415)">
                    <g transform="scale(1.4)">
                      <path d="M -10 -2 L 0 -12 L 10 -2 L 10 8 L -10 8 Z" />
                      <path d="M -3 8 L -3 0 L 3 0 L 3 8" />
                    </g>
                    <text
                      x="0"
                      y="22"
                      fontSize="6.5"
                      fontWeight="600"
                      fill="#FF3D5A"
                      stroke="none"
                      textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace"
                      letterSpacing="0.6"
                    >
                      IMÓVEIS
                    </text>
                  </g>
                  {/* Veículos - carro */}
                  <g transform="translate(70 418)">
                    <g transform="scale(1.4)">
                      <path d="M -10 1 L -6 -6 L 6 -6 L 10 1 L 10 6 L -10 6 Z" />
                      <circle cx="-5" cy="6" r="2" fill="#FF3D5A" stroke="none" />
                      <circle cx="5" cy="6" r="2" fill="#FF3D5A" stroke="none" />
                    </g>
                    <text
                      x="0"
                      y="20"
                      fontSize="6.5"
                      fontWeight="600"
                      fill="#FF3D5A"
                      stroke="none"
                      textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace"
                      letterSpacing="0.6"
                    >
                      VEÍCULOS
                    </text>
                  </g>
                  {/* Empresas - prédio */}
                  <g transform="translate(135 415)">
                    <g transform="scale(1.4)">
                      <rect x="-8" y="-12" width="16" height="22" />
                      <line x1="-4" y1="-9" x2="-4" y2="-6" />
                      <line x1="0" y1="-9" x2="0" y2="-6" />
                      <line x1="4" y1="-9" x2="4" y2="-6" />
                      <line x1="-4" y1="-3" x2="-4" y2="0" />
                      <line x1="0" y1="-3" x2="0" y2="0" />
                      <line x1="4" y1="-3" x2="4" y2="0" />
                      <line x1="-2" y1="3" x2="-2" y2="10" />
                      <line x1="2" y1="3" x2="2" y2="10" />
                    </g>
                    <text
                      x="0"
                      y="22"
                      fontSize="6.5"
                      fontWeight="600"
                      fill="#FF3D5A"
                      stroke="none"
                      textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace"
                      letterSpacing="0.6"
                    >
                      EMPRESAS
                    </text>
                  </g>
                  {/* Créditos em processos - documento com $ */}
                  <g transform="translate(200 415)">
                    <g transform="scale(1.4)">
                      <path d="M -8 -12 L 4 -12 L 10 -6 L 10 12 L -8 12 Z" />
                      <path d="M 4 -12 L 4 -6 L 10 -6" />
                      <text
                        x="1"
                        y="6"
                        fontSize="11"
                        fontWeight="700"
                        fill="#FF3D5A"
                        stroke="none"
                        textAnchor="middle"
                      >
                        $
                      </text>
                    </g>
                    <text
                      x="0"
                      y="24"
                      fontSize="6.5"
                      fontWeight="600"
                      fill="#FF3D5A"
                      stroke="none"
                      textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace"
                      letterSpacing="0.6"
                    >
                      CRÉDITOS
                    </text>
                  </g>
                </g>
                {/* Ondas douradas expandindo pra baixo (saindo da base da escada) */}
                <g transform="translate(100 340)" filter="url(#band2-glow)">
                  {[0, 0.6, 1.2, 1.8].map((delay, i) => (
                    <path
                      key={`b2-hwave-${i}`}
                      d="M -22 0 A 22 16 0 0 0 22 0"
                      fill="none"
                      stroke="#C9A24A"
                      strokeWidth="1.6"
                      strokeOpacity="0"
                      transform="scale(0.1)"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="scale"
                        values="0.1;4.5"
                        dur="2.6s"
                        begin={`${delay}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.9;0"
                        dur="2.6s"
                        begin={`${delay}s`}
                        repeatCount="indefinite"
                      />
                    </path>
                  ))}
                </g>
              </svg>
              )}
            </div>
            </div>
            <div className="signal-dash -mt-6 ml-1 w-[min(540px,100%)]" aria-hidden="true" />
            <p className="mt-8 max-w-[520px] text-lg leading-relaxed text-white">
              Plataforma de localização de bens de devedores, integrada ao banco de processos do escritório{" "}
              <span className="font-serif text-2xl font-medium tracking-tight text-[var(--color-gold)]">
                Battaglia <span className="italic text-white">&amp;</span> Pedrosa Advogados.
              </span>
            </p>
            <div className="mt-10 flex flex-col items-start gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/login"
                  className="rounded-lg bg-[var(--color-signal)]/85 px-8 py-4 text-base font-semibold text-onyx shadow-[0_4px_24px_rgba(60,255,138,0.28)] ring-1 ring-[var(--color-signal)]/60 backdrop-blur-md transition hover:bg-[var(--color-tip-glow)]/90"
                >
                  Acessar plataforma →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider reversed />


      <Divider />

      {/* Propósito */}
      <section className="relative overflow-hidden">
        {/* Luz "lamp" dourada descendo do topo */}
        <LampLight />
        <div className="relative mx-auto max-w-[1400px] px-6 py-24 sm:px-10 md:py-32">
          {/* Cabeçalho centralizado: eyebrow + logo BP */}
          <div className="flex flex-col items-center text-center">
            <span className="eyebrow mb-8">Propósito</span>
            <div className="-translate-x-16">
              <BPSignature />
            </div>
          </div>

          {/* Título + história de origem */}
          <div className="reveal mx-auto mt-14 max-w-[780px] text-center">
            <h2 className="font-serif text-[clamp(28px,4vw,46px)] font-medium leading-[1.15] tracking-tight text-ivory">
              Por que o Sonar{" "}
              <em className="text-[var(--color-gold)]">existe</em>.
            </h2>
            <p className="mt-7 leading-relaxed text-[var(--color-ivory-88)]">
              O Sonar nasceu dentro do{" "}
              <strong className="font-medium text-ivory">
                Battaglia &amp; Pedrosa
              </strong>
              , da inquietação de alguns advogados em{" "}
              <strong className="font-medium text-ivory">
                aprimorar a efetividade das execuções
              </strong>{" "}
              e{" "}
              <strong className="font-medium text-ivory">
                reduzir o tempo até a satisfação do crédito
              </strong>{" "}
              do cliente. Não é uma ferramenta importada — é a tradução do método
              que a equipe já praticava em sua rotina, agora ampliada por dados,
              IA e automação.
            </p>
          </div>

          {/* Slider horizontal infinito com fotos do escritório */}
          <div className="reveal mt-20">
            <ImageAutoSlider
              images={[
                {
                  src: "/img/equipe.jpg",
                  alt: "Equipe do escritório Battaglia & Pedrosa Advogados",
                },
                {
                  src: "/img/treinamento.jpg",
                  alt: "Reunião de treinamento no escritório",
                },
                {
                  src: "/img/escritorio-01.jpg",
                  alt: "Bastidores do escritório Battaglia & Pedrosa",
                },
                {
                  src: "/img/escritorio-02.jpg",
                  alt: "Equipe em atividade no escritório",
                },
                {
                  src: "/img/escritorio-03.jpg",
                  alt: "Rotina do escritório Battaglia & Pedrosa",
                },
              ]}
            />
          </div>
        </div>
      </section>

      <Divider reversed />

      {/* ============ SHOWCASE: NOTEBOOK EM ACAO (ShowcaseAction) ============
          Envolto em GridBeam: background quadriculado degrade verde igual a
          faixa 1 (header) + feixes signal->gold animados percorrendo as
          linhas do grid. */}
      <section className="relative overflow-hidden">
        <div className="reveal">
          <GridBeam>
            <ShowcaseAction />
          </GridBeam>
        </div>
      </section>

      <Divider reversed />

      {/* CTA — sem reveal: ficava perto demais do fim da página e o
          observer (folga -80px) nem sempre disparava, sumindo a faixa. */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-24 text-center sm:px-10">
          <h2 className="sonar-wordmark text-[clamp(40px,8vw,96px)]">Entre no Sonar.</h2>
          <p className="mt-6 text-[var(--color-ivory-88)]">
            Equipe ou cliente, informe seu e-mail e receba um código de acesso.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="inline-block rounded-lg bg-[var(--color-signal)]/85 px-8 py-4 text-sm font-semibold text-onyx shadow-[0_4px_24px_rgba(60,255,138,0.28)] ring-1 ring-[var(--color-signal)]/60 backdrop-blur-md transition hover:bg-[var(--color-tip-glow)]/90"
            >
              Acessar plataforma →
            </Link>
          </div>
        </div>
      </section>

      <Divider />

      {/* Footer — mesmo background e ALTURA da faixa 1 (header) */}
      <footer className="relative h-[170px] overflow-hidden">
        {/* Quadriculado: mesmo padrão do header */}
        <div
          className="bg-grid-strong animate-grid-pulse absolute inset-0"
          style={{
            maskImage:
              "linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)",
          }}
          aria-hidden="true"
        />
        {/* Vinheta lateral */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(10,12,11,0.85) 0%, transparent 18%, transparent 82%, rgba(10,12,11,0.85) 100%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] items-center justify-center px-6 sm:px-10">
          <div className="flex flex-col items-center gap-1">
            <div className="translate-x-3">
              <LogoSymbolStatic height={110} />
            </div>
            <p className="mt-1 whitespace-nowrap text-xs font-mono uppercase tracking-[0.22em] text-[var(--color-gold)]">
              Projeto conduzido por Caio Vicentino
            </p>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--color-signal)]">
              (BETA)
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Divider({ reversed = false }: { reversed?: boolean }) {
  return (
    <div
      className={`divider-signal${reversed ? " -scale-x-100" : ""}`}
      aria-hidden="true"
    />
  );
}

function Card({ titulo, descricao, fonte }: { titulo: string; descricao: string; fonte: React.ReactNode }) {
  return (
    <SpotlightCard className="p-6">
      <h3 className="font-medium text-ivory">{titulo}</h3>
      <p className="mt-2 text-sm text-[var(--color-ivory-88)]">{descricao}</p>
      <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-[var(--color-gold)]">{fonte}</p>
    </SpotlightCard>
  );
}

// Assinatura BP usada na faixa PROPÓSITO — escada dourada + "Battaglia & Pedrosa"
// + "ADVOGADOS" (mesmo padrão do Logo.tsx, isolado pra não puxar o wordmark Sonar).
function BPSignature() {
  const cells: { x: number; y: number; o: number }[] = [
    { x: 0, y: -5.4, o: 1.0 },
    { x: 3.4, y: -5.4, o: 0.45 }, { x: 3.4, y: -8.8, o: 1.0 },
    { x: 6.8, y: -5.4, o: 0.45 }, { x: 6.8, y: -8.8, o: 0.72 }, { x: 6.8, y: -12.2, o: 1.0 },
    { x: 10.2, y: -5.4, o: 0.45 }, { x: 10.2, y: -8.8, o: 0.63 }, { x: 10.2, y: -12.2, o: 0.82 }, { x: 10.2, y: -15.6, o: 1.0 },
    { x: 13.6, y: -5.4, o: 0.45 }, { x: 13.6, y: -8.8, o: 0.59 }, { x: 13.6, y: -12.2, o: 0.72 }, { x: 13.6, y: -15.6, o: 0.86 }, { x: 13.6, y: -19, o: 1.0 },
    { x: 17, y: -5.4, o: 0.45 }, { x: 17, y: -8.8, o: 0.56 }, { x: 17, y: -12.2, o: 0.67 }, { x: 17, y: -15.6, o: 0.78 }, { x: 17, y: -19, o: 0.89 }, { x: 17, y: -22.4, o: 1.0 },
  ];
  return (
    <div className="flex items-end gap-9">
      <svg
        width="128"
        height="150"
        viewBox="-1 -23 22 26"
        aria-label="Battaglia & Pedrosa Advogados"
        className="flex-none"
      >
        {cells.map((c, i) => (
          <rect
            key={i}
            x={c.x}
            y={c.y}
            width="3"
            height="3"
            fill="#C9A24A"
            fillOpacity={c.o}
          />
        ))}
      </svg>
      <div className="flex flex-col items-center pb-2">
        <span className="firm-name whitespace-nowrap text-[62px] leading-none">
          Battaglia <em>&amp;</em> Pedrosa
        </span>
        <span className="mt-5 h-px w-full bg-[var(--color-gold)] opacity-60" />
        <span className="firm-suffix mt-3 text-[20px]">ADVOGADOS</span>
      </div>
    </div>
  );
}

