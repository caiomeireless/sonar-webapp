// /app — rota intermediária pós-login. Redireciona pro portal correto
// conforme o papel do perfil. Cliente vai pra /cliente/casos; equipe
// (admin/socio/funcionario) vai pra /equipe (Painel da Plataforma).
//
// Sem perfil = volta pro /login.

import { redirect } from "next/navigation";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente, ehEquipe } from "@/lib/perfis";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const perfil = await perfilLogado();
  if (!perfil) redirect("/login");
  if (ehCliente(perfil)) redirect("/cliente/casos");
  if (ehEquipe(perfil)) redirect("/equipe");
  // Papel desconhecido — fallback seguro
  redirect("/login");
}
