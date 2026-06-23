// Layout do portal da equipe. Server Component — pega perfil logado,
// monta o shell com Sidebar lateral (Painel / Devedores / Themis) e
// passa o conteudo dentro do <main>. Se for cliente, redireciona pra
// /cliente/casos.
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/Sidebar";
import { NAV_EQUIPE } from "@/lib/nav-equipe";
import { ehCliente } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";

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
    <div className="flex min-h-svh bg-onyx text-ivory">
      <Sidebar
        items={NAV_EQUIPE}
        usuario={{ email, papel }}
        portal="equipe"
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
