// Server Component que envolve o form em Suspense (necessário p/ useSearchParams
// em prerender estático do Next 16). Toda a interatividade fica em LoginForm.
import { Suspense } from "react";
import Link from "next/link";
import { LogoSvg } from "@/components/LogoSvg";
import { LoginRadar } from "@/components/login/LoginRadar";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-onyx p-6">
      {/* Quadriculado verde forte com FADE RADIAL INVERTIDO — dentro do
          circulo do radar fica preto (transparent no mask), forte FORA
          do circulo, depois sumindo nas pontas extremas da tela. */}
      <div
        className="bg-grid-strong animate-grid-pulse absolute inset-0
          [mask-image:radial-gradient(ellipse_42%_50%_at_center,transparent_30%,rgba(0,0,0,0.6)_60%,black_80%,transparent_100%)]
          [-webkit-mask-image:radial-gradient(ellipse_42%_50%_at_center,transparent_30%,rgba(0,0,0,0.6)_60%,black_80%,transparent_100%)]"
        aria-hidden="true"
      />
      {/* Vinheta radial signal pra dar foco visual no centro. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(60,255,138,0.18),transparent_65%)] blur-2xl"
      />

      {/* Radar girando atras do logo + card de login. Fica acima do
          bg-grid mas abaixo do conteudo principal (z-10). */}
      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center">
        <LoginRadar />
      </div>

      <div className="relative z-10 grid w-full max-w-[860px] items-center gap-4 md:grid-cols-[1fr_400px] md:gap-6">
        {/* Esquerda: marca. Logo grande pra preencher o espaco vertical
            criado pelos dois cards empilhados a direita. */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Link
            href="/"
            aria-label="Voltar para a landing"
            className="drop-shadow-[0_0_50px_rgba(60,255,138,0.25)]"
          >
            <LogoSvg height={280} />
          </Link>
        </div>

        {/* Direita: dois cards empilhados — Equipe (signal verde) +
            Cliente (gold). Mesma UX, accents diferentes pra clareza. */}
        <div className="flex flex-col gap-3">
          <Suspense fallback={<div className="glass h-[300px]" />}>
            <LoginForm
              accent="signal"
              titulo="Acesso da Equipe"
              subtitulo="Advogados, sócios e funcionários."
            />
          </Suspense>
          <Suspense fallback={<div className="glass h-[300px]" />}>
            <LoginForm
              accent="gold"
              titulo="Acesso do Cliente"
              subtitulo="Você só visualiza seus próprios casos."
            />
          </Suspense>
        </div>
      </div>

      {/* Assinatura inferior — igual a landing. Centralizada na base. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1">
        <p className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.22em] text-white">
          Projeto conduzido por Caio Vicentino
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-signal)]">
          (BETA)
        </p>
      </div>
    </main>
  );
}
