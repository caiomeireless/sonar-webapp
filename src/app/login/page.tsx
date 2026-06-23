// Server Component que envolve o form em Suspense (necessário p/ useSearchParams
// em prerender estático do Next 16). Toda a interatividade fica em LoginForm.
import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SonarMark } from "@/components/SonarMark";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-onyx p-6">
      <div className="bg-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(60,255,138,0.10),transparent_60%)] blur-2xl"
      />

      <div className="relative z-10 grid w-full max-w-[960px] items-center gap-16 md:grid-cols-[1fr_400px]">
        {/* Esquerda: marca */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Link href="/" aria-label="Voltar para a landing">
            <SonarMark size={160} className="drop-shadow-[0_0_50px_rgba(60,255,138,0.3)]" />
          </Link>
          <div className="mt-8">
            <Logo size="md" />
          </div>
          <p className="mt-6 max-w-[360px] text-sm text-[var(--color-ivory-88)]">
            Acesso por código no e-mail. Sem senha, sem fricção.
          </p>
        </div>

        {/* Direita: caixa de acesso */}
        <Suspense fallback={<div className="h-[380px] rounded-xl border border-[var(--color-ivory-12)] bg-[var(--color-carbon)]" />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
