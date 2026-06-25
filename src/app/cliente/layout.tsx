// Layout do portal do cliente. Server Component — pega perfil logado e
// monta o shell com Sidebar lateral (Meus casos / Preferencias). O
// conteudo da pagina vai dentro do <main>.
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye } from "lucide-react";

import { AetherBackground } from "@/components/AetherBackground";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { NAV_CLIENTE } from "@/lib/nav-cliente";
import { perfilLogado } from "@/lib/perfis-server";

export default async function ClienteLayout({ children }: { children: ReactNode }) {
  const perfil = await perfilLogado();
  // Em producao, sem perfil = login. Em dev, paginas filhas resolvem via ?eu=.
  if (!perfil && process.env.NODE_ENV === "production") {
    redirect("/login");
  }

  const email = perfil?.email ?? "Cliente Demonstração";
  const papel = (perfil?.papel ?? "cliente").toUpperCase();
  const nome =
    perfil?.nome?.trim() ||
    (() => {
      const local = email.split("@")[0] ?? email;
      return local
        .split(/[._-]/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
    })();

  // Admin/sócio que entrou no portal cliente está em modo visualização.
  const ehVisualizacao = perfil?.papel === "admin" || perfil?.papel === "socio";

  return (
    <div className="flex min-h-svh bg-onyx text-ivory">
      <Sidebar
        items={NAV_CLIENTE}
        usuario={{ email, papel, nome }}
        portal="cliente"
      />
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* AetherFlow — partículas signal+gold com conectores, bem discreto. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <AetherBackground intensidade={0.55} />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(10,12,11,0.55) 0%, rgba(10,12,11,0.25) 35%, transparent 75%)",
            }}
          />
        </div>
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {ehVisualizacao && (
          <div
            className="
              flex items-center justify-between gap-3 border-b border-[var(--color-gold)]/40
              bg-[var(--color-gold)]/10 px-6 py-2 text-xs text-[var(--color-gold)] sm:px-10
            "
          >
            <span className="inline-flex items-center gap-2">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <strong className="font-medium">Modo visualização —</strong>
              você está vendo a plataforma como o cliente vê.
            </span>
            <Link href="/equipe" className="btn-neon-gold">
              ← Voltar para a equipe
            </Link>
          </div>
        )}
        <TopBar usuario={{ email, papel }} portal="cliente" />
        <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
