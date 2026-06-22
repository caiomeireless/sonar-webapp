// Layout do portal da equipe. Server Component — pega perfil logado,
// mostra email + papel + badge "EQUIPE" (verde signal) e botao Sair.
// Se for cliente, redireciona pra /cliente/casos.
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";

export default async function EquipeLayout({ children }: { children: ReactNode }) {
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) {
    redirect("/cliente/casos");
  }
  // Em producao, sem perfil = fora. Em dev, paginas podem usar ?eu= e perfil
  // sera null aqui — chrome mostra placeholder mas pagina filha verifica.
  if (!perfil && process.env.NODE_ENV === "production") {
    redirect("/login");
  }

  const email = perfil?.email ?? "Equipe";
  const papel = (perfil?.papel ?? "funcionario").toUpperCase();

  return (
    <div className="min-h-svh bg-onyx text-ivory">
      <header className="sticky top-0 z-30 border-b border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.85)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4 sm:px-10">
          <Logo size="sm" />

          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-[var(--color-ivory-88)] sm:inline">
              {email}
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)] sm:inline">
              {papel}
            </span>
            <span className="rounded-full border border-[var(--color-signal)]/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
              Equipe
            </span>
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
