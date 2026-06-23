// Layout do portal do cliente. Server Component — pega perfil logado e
// monta o shell com Sidebar lateral (Meus casos / Preferencias). O
// conteudo da pagina vai dentro do <main>.
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/Sidebar";
import { NAV_CLIENTE } from "@/lib/nav-cliente";
import { perfilLogado } from "@/lib/perfis-server";

export default async function ClienteLayout({ children }: { children: ReactNode }) {
  const perfil = await perfilLogado();
  // Em producao, sem perfil = login. Em dev, paginas filhas resolvem via ?eu=.
  if (!perfil && process.env.NODE_ENV === "production") {
    redirect("/login");
  }

  const email = perfil?.email ?? "Cliente Demonstracao";
  const papel = (perfil?.papel ?? "cliente").toUpperCase();

  return (
    <div className="flex min-h-svh bg-onyx text-ivory">
      <Sidebar
        items={NAV_CLIENTE}
        usuario={{ email, papel }}
        portal="cliente"
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
