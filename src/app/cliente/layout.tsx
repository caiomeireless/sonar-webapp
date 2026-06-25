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
import { perfilAtual } from "@/lib/perfis";
import { previewEuFromParam } from "@/lib/dev-auth";
import { DEMO_CLIENTE_EMAIL } from "@/lib/mock-fixtures";

export default async function ClienteLayout({
  children,
  searchParams,
}: {
  children: ReactNode;
  searchParams?: Promise<{ eu?: string | string[] }>;
}) {
  const params = (await searchParams) ?? {};
  const perfilSessao = await perfilLogado();
  // Em producao, sem perfil = login. Em dev, paginas filhas resolvem via ?eu=.
  if (!perfilSessao && process.env.NODE_ENV === "production") {
    redirect("/login");
  }

  // Admin/sócio que entrou no portal cliente está em modo visualização.
  const ehVisualizacao =
    perfilSessao?.papel === "admin" || perfilSessao?.papel === "socio";

  // Resolve o email "efetivo" do portal:
  // - se admin/sócio passou ?eu=, usa esse;
  // - se admin/sócio entrou em /cliente direto (sem ?eu=), auto-injeta o
  //   cliente demo pra todos os links/queries baterem nele;
  // - senão, cai no email da sessão (cliente real).
  const euParam = previewEuFromParam(params.eu, perfilSessao);
  const emailEfetivo =
    euParam ?? (ehVisualizacao ? DEMO_CLIENTE_EMAIL : perfilSessao?.email ?? null);

  // Em modo visualização, carrega o perfil do cliente que está sendo
  // simulado (pra Sidebar/TopBar mostrarem nome/email DELE, não do admin).
  const perfilExibicao =
    emailEfetivo && emailEfetivo !== perfilSessao?.email
      ? await perfilAtual(emailEfetivo)
      : perfilSessao;

  const email = perfilExibicao?.email ?? emailEfetivo ?? "Cliente Demonstração";

  // No portal do cliente, o footer da sidebar sempre mostra "CLIENTE" como
  // papel (mesmo quando admin/socio entra em modo visualizacao). O sentido
  // do papel ali eh "voce esta vendo a tela como X", nao "voce eh X".
  const papel = ehVisualizacao ? "CLIENTE" : (perfilExibicao?.papel ?? "cliente").toUpperCase();
  const nome =
    perfilExibicao?.nome?.trim() ||
    (() => {
      // Em modo visualização sem perfil cadastrado, mostra rótulo amigável.
      if (ehVisualizacao) return "Cliente Demonstração";
      const local = email.split("@")[0] ?? email;
      return local
        .split(/[._-]/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
    })();

  // Em modo visualização, propaga ?eu= em TODOS os links da Sidebar pra
  // que navegar entre Dashboard/Casos/Custos/Preferências não perca o
  // email efetivo. Cliente real navega sem o param (comportamento atual).
  const qsEu =
    ehVisualizacao && emailEfetivo
      ? "?eu=" + encodeURIComponent(emailEfetivo)
      : "";
  const itemsComEu = qsEu
    ? NAV_CLIENTE.map((it) => ({ ...it, href: it.href + qsEu }))
    : NAV_CLIENTE;

  return (
    <div className="flex min-h-svh bg-onyx text-ivory">
      <Sidebar
        items={itemsComEu}
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
