// Aba Início — por enquanto SÓ o fundo padrão do portal (Aether do layout)
// com o menu radial GRANDE no centro, todas as abas em volta da foto do
// usuário. O conteúdo da tela vem nas próximas reformas (aba por aba).
import { redirect } from "next/navigation";

import { perfilLogado } from "@/lib/perfis-server";
import InicioRadial from "./_components/InicioRadial";

export const dynamic = "force-dynamic";

export default async function InicioPage() {
  const perfil = await perfilLogado();
  if (!perfil && process.env.NODE_ENV === "production") redirect("/login");

  const nome = perfil?.nome?.trim() || perfil?.email || "Equipe";

  return (
    <main className="flex min-h-[calc(100svh-200px)] items-center justify-center px-6 py-10">
      <InicioRadial nome={nome} fotoUrl={perfil?.fotoUrl ?? null} />
    </main>
  );
}
