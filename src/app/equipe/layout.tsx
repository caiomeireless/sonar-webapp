// Layout do portal da equipe. Server Component — pega perfil logado,
// monta o shell com Sidebar lateral (Painel / Devedores / Themis) e
// passa o conteudo dentro do <main>. Se for cliente, redireciona pra
// /cliente/casos.
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AetherBackground } from "@/components/AetherBackground";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { NAV_EQUIPE } from "@/lib/nav-equipe";
import { ehCliente } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";

// Fallback: extrai "caio@bp..." -> "Caio". Substitui . _ - por espaco e
// title-case-ifica. Usado quando o perfil nao tem nome cadastrado.
function nomeDoEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

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
  const nome = perfil?.nome?.trim() || nomeDoEmail(email);

  return (
    <div className="flex min-h-svh bg-onyx text-ivory">
      <Sidebar
        items={NAV_EQUIPE}
        usuario={{ email, papel, nome }}
        portal="equipe"
      />
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* AetherFlow — partículas signal+gold com conectores, bem discreto. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <AetherBackground intensidade={0.55} />
          {/* Vinheta radial escura ao centro: protege a leitura dos
              títulos/parágrafos que ficam sobre o canvas. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(10,12,11,0.55) 0%, rgba(10,12,11,0.25) 35%, transparent 75%)",
            }}
          />
        </div>
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <TopBar usuario={{ email, papel }} portal="equipe" />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
