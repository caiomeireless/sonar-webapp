// Entry point do portal da equipe — manda direto pra lista de devedores.
// Em dev, suporta ?eu=email pra simular login (gating em lib/dev-auth).
import { redirect } from "next/navigation";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function EquipeIndexPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const eu = devEuFromParam(params.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const qs = devEuFromParam(params.eu)
    ? `?eu=${encodeURIComponent(devEuFromParam(params.eu)!)}`
    : "";
  redirect(`/equipe/devedores${qs}`);
}
