// Layout do portal do cliente. Server Component — pega perfil logado pra
// mostrar email + badge "CLIENTE" + botão Sair no header sticky.
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { perfilLogado } from "@/lib/perfis-server";

export default async function ClienteLayout({ children }: { children: ReactNode }) {
  const perfil = await perfilLogado();
  // Em produção, sem perfil = login. Em dev, páginas filhas resolvem via ?eu=.
  if (!perfil && process.env.NODE_ENV === "production") {
    redirect("/login");
  }
  const email = perfil?.email ?? "Cliente Demonstração";

  return (
    <div className="min-h-svh bg-onyx text-ivory">
      <header className="sticky top-0 z-30 border-b border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.85)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4 sm:px-10">
          <Logo size="sm" />

          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-[var(--color-ivory-88)] sm:inline">
              {email}
            </span>
            <span className="rounded-full border border-[var(--color-gold)]/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-gold)]">
              Cliente
            </span>
            <Link
              href="/cliente/preferencias"
              className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:text-ivory"
            >
              Preferências
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-3 py-1.5 text-xs font-medium text-ivory backdrop-blur-md transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
