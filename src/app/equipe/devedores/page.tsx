// Portal da equipe — CARTEIRA hierárquica do escritório.
// NÍVEL 1: lista de CLIENTES (credores) com agregados.
// Click num cliente abre /equipe/devedores/credor/{id} (nível 2 = casos do cliente).
// Click num caso abre /equipe/devedores/{devedor_id} (nível 3 = dossiê).
//
// Server Component. Em dev/preview, aceita ?eu=email pra simular login.
import Link from "next/link";
import { redirect } from "next/navigation";
import { listarCredoresComResumo } from "@/lib/devedores";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { formatBRL } from "@/lib/format";
import { CarteiraView } from "./CarteiraView";

type Props = {
  searchParams?: Promise<{ eu?: string | string[]; q?: string | string[] }>;
};

export default async function DevedoresEquipePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const eu = devEuFromParam(params.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const credores = await listarCredoresComResumo();
  const totalCasos = credores.reduce((s, c) => s + c.total_casos, 0);
  const totalBens = credores.reduce((s, c) => s + c.total_bens, 0);
  const totalEstimado = credores.reduce(
    (s, c) => s + (c.valor_estimado_total_brl || 0),
    0,
  );

  const linkBase = eu ? `?eu=${encodeURIComponent(eu)}` : "";
  const novoHref = `/equipe/devedores/novo${linkBase}`;

  return (
    <main className="relative mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow">Clientes do escritório</span>
          <h1 className="mt-4 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.15] tracking-tight text-ivory">
            Carteira do escritório
          </h1>
          <p className="mt-6 max-w-[640px] font-mono text-sm text-[var(--color-ivory-66)]">
            {credores.length === 0
              ? "Nenhum cliente cadastrado ainda."
              : `${credores.length} ${
                  credores.length === 1 ? "cliente ativo" : "clientes ativos"
                } · ${totalCasos} ${
                  totalCasos === 1 ? "caso" : "casos"
                } · ${totalBens} ${
                  totalBens === 1 ? "bem rastreado" : "bens rastreados"
                } — ${formatBRL(totalEstimado)} estimado`}
          </p>
        </div>

        <Link
          href={novoHref}
          className="inline-flex items-center gap-2 self-start rounded-lg bg-[var(--color-signal)]/85 px-6 py-3 text-sm font-semibold text-onyx shadow-[0_4px_24px_rgba(60,255,138,0.28)] ring-1 ring-[var(--color-signal)]/60 backdrop-blur-md transition hover:bg-[var(--color-tip-glow)]/90"
        >
          + Novo devedor
        </Link>
      </div>

      {credores.length === 0 ? (
        <div className="mt-12 grid place-items-center">
          <SpotlightCard className="max-w-[520px] p-10 text-center">
            <span className="eyebrow !text-[var(--color-signal)]">Vazio</span>
            <h3 className="mt-4 font-serif text-2xl text-ivory">
              Nenhum cliente na carteira ainda
            </h3>
            <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
              Cadastre o primeiro devedor e vincule a um credor (cliente).

            </p>
            <Link
              href={novoHref}
              className="mt-6 inline-block rounded-lg border border-[var(--color-signal)]/50 bg-[var(--color-signal)]/10 px-4 py-2 text-xs font-medium text-[var(--color-signal)] transition hover:bg-[var(--color-signal)]/20"
            >
              + Cadastrar devedor
            </Link>
          </SpotlightCard>
        </div>
      ) : (
        <CarteiraView credores={credores} euQuery={linkBase} />
      )}
    </main>
  );
}
