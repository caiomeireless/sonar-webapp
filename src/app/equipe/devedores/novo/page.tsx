// Cadastrar novo devedor (Server Component que renderiza um Client form).
// Carrega lista de credores no server pra popular o select.
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { NovoDevedorForm } from "./NovoDevedorForm";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function NovoDevedorPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const eu = devEuFromParam(params.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const sb = createAdminClient();
  const { data: credoresRaw } = await sb
    .from("credores")
    .select("id, nome, documento")
    .order("nome");

  const credores = (credoresRaw ?? []).map((c) => ({
    id: c.id as number,
    nome: (c.nome as string) ?? "",
    documento: (c.documento as string) ?? "",
  }));

  const euDev = devEuFromParam(params.eu);
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  return (
    <main className="mx-auto max-w-[820px] px-6 py-16 sm:px-10">
      <Link href={`/equipe/devedores${linkBase}`} className="btn-neon-gold">
        ← Voltar
      </Link>

      <span className="eyebrow mt-6 block">Novo registro</span>
      <h1 className="mt-4 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.15] tracking-tight text-ivory">
        Cadastrar novo devedor
      </h1>
      <p className="mt-4 max-w-[600px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
        Adicione o CPF/CNPJ do devedor e vincule a um credor existente.
      </p>

      <div className="mt-10">
        <NovoDevedorForm credores={credores} euQuery={linkBase} />
      </div>
    </main>
  );
}
