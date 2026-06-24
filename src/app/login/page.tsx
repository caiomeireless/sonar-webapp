// Server Component que envolve o form em Suspense (necessário p/ useSearchParams
// em prerender estático do Next 16). Toda a interatividade fica em LoginForm.
import { Suspense } from "react";
import Link from "next/link";
import { LogoSvg } from "@/components/LogoSvg";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-onyx p-6">
      {/* Quadriculado verde forte com FADE RADIAL — forte no centro
          (atras do logo + form), apagando suavemente em todas as bordas
          via mask-image. Mesma textura da faixa 1 da plataforma. */}
      <div
        className="bg-grid-strong animate-grid-pulse absolute inset-0
          [mask-image:radial-gradient(ellipse_60%_70%_at_center,black_15%,rgba(0,0,0,0.6)_55%,transparent_92%)]
          [-webkit-mask-image:radial-gradient(ellipse_60%_70%_at_center,black_15%,rgba(0,0,0,0.6)_55%,transparent_92%)]"
        aria-hidden="true"
      />
      {/* Vinheta radial signal pra dar foco visual no centro. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(60,255,138,0.18),transparent_65%)] blur-2xl"
      />

      <div className="relative z-10 grid w-full max-w-[960px] items-center gap-16 md:grid-cols-[1fr_400px]">
        {/* Esquerda: marca (sem subtitulo — pedido do Caio) */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Link
            href="/"
            aria-label="Voltar para a landing"
            className="drop-shadow-[0_0_50px_rgba(60,255,138,0.25)]"
          >
            <LogoSvg height={140} />
          </Link>
        </div>

        {/* Direita: caixa de acesso */}
        <Suspense fallback={<div className="h-[380px] rounded-xl border border-[var(--color-ivory-12)] bg-[var(--color-carbon)]" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
