// Placeholder do app autenticado. Será substituído pelo dashboard real
// no próximo dia (depois das integrações Themis + DataJud + busca de bens).
import { perfilLogado } from "@/lib/perfis-server";
import { Logo } from "@/components/Logo";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const eu = await perfilLogado();
  const papel = eu?.papel ?? "funcionario";
  const isCliente = papel === "cliente";

  return (
    <main className="min-h-svh bg-onyx text-ivory">
      <header className="border-b border-[var(--color-ivory-12)]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 sm:px-10">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-ivory-88)]">{eu?.email}</span>
            <span className="rounded border border-[var(--color-ivory-22)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              {papel}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-[var(--color-ivory-22)] px-3 py-1.5 text-xs text-[var(--color-ivory-88)] transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
        <span className="eyebrow">Bem-vindo</span>
        <h1 className="mt-4 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.15] tracking-tight">
          {isCliente
            ? "Acompanhamento dos seus processos"
            : "Painel do Sonar"}
        </h1>
        <p className="mt-4 max-w-[680px] text-[var(--color-ivory-88)]">
          {isCliente
            ? "Aqui você acompanha, em tempo real, o que está sendo encontrado sobre os devedores dos seus processos."
            : "O dashboard com a busca de bens e o mapa de devedores virá na próxima entrega. Por enquanto, login + identidade visual + base de auth estão prontos."}
        </p>

        <div className="mt-12 rounded-xl border border-[var(--color-ivory-12)] bg-[var(--color-carbon)] p-8">
          <span className="eyebrow">Status do scaffold</span>
          <ul className="mt-4 space-y-3 text-sm text-[var(--color-ivory-88)]">
            <Li done>Next.js 16 + React 19 + Supabase + Tailwind v4</Li>
            <Li done>Identidade visual (variante B do logo, tokens, fontes Google)</Li>
            <Li done>Login OTP por e-mail (envio via SMTP configurado no Supabase)</Li>
            <Li done>Perfis com papel <code>cliente</code> (read-only) + middleware</Li>
            <Li done>Landing pública</Li>
            <Li>Migration: rodar manualmente em Supabase &gt; SQL Editor (<code>supabase/migrations/001_perfis.sql</code>)</Li>
            <Li>Configurar SMTP do Resend no Supabase &gt; Authentication &gt; SMTP</Li>
            <Li>Conectar Themis + DataJud (próximo dia)</Li>
            <Li>Dashboard com busca de bens + mapa do Brasil (próximo dia)</Li>
          </ul>
        </div>

        <p className="mt-10 text-xs text-[var(--color-ivory-66)]">
          <Link href="/" className="underline-offset-4 hover:underline">← voltar para a landing</Link>
        </p>
      </section>
    </main>
  );
}

function Li({ children, done }: { children: React.ReactNode; done?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full ${
          done ? "bg-[var(--color-signal)] shadow-[0_0_8px_rgba(60,255,138,0.6)]" : "bg-[var(--color-gold)]"
        }`}
      />
      <span>{children}</span>
    </li>
  );
}
