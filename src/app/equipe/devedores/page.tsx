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
import { BuscaCarteira } from "./BuscaCarteira";

function normalizar(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\D/g, (c) => c)
    .trim();
}

function soDigitos(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

type Props = {
  searchParams?: Promise<{ eu?: string | string[]; q?: string | string[] }>;
};

export default async function DevedoresEquipePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const eu = devEuFromParam(params.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const todosCredores = await listarCredoresComResumo();
  const q = (Array.isArray(params.q) ? params.q[0] : params.q) ?? "";

  // Filtragem: nome do cliente, documento (CNPJ/CPF) do cliente OU nome
  // dos devedores vinculados. Match case-insensitive sem acentos.
  const qNorm = normalizar(q);
  const qDigitos = soDigitos(q);
  const credores = qNorm
    ? todosCredores.filter((c) => {
        if (normalizar(c.nome).includes(qNorm)) return true;
        if (qDigitos && soDigitos(c.documento).includes(qDigitos)) return true;
        const devs = (c as unknown as { devedores?: { nome?: string; documento?: string }[] }).devedores ?? [];
        for (const d of devs) {
          if (normalizar(d.nome).includes(qNorm)) return true;
          if (qDigitos && soDigitos(d.documento).includes(qDigitos)) return true;
        }
        return false;
      })
    : todosCredores;
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
      <header className="title-shield mb-6 text-center">
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Banco de Devedores Separado por Cliente
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Banco de Devedores
        </p>
        <p className="mt-3 font-mono text-[13px] text-[var(--color-ivory-88)]">
          {credores.length === 0
            ? q
              ? `Nenhum resultado para "${q}".`
              : "Nenhum cliente cadastrado ainda."
            : `${credores.length} ${
                credores.length === 1 ? "Cliente Ativo" : "Clientes Ativos"
              } · ${totalCasos} ${
                totalCasos === 1 ? "Caso" : "Casos"
              } · ${totalBens} ${
                totalBens === 1 ? "Bem Rastreado" : "Bens Rastreados"
              } — ${formatBRL(totalEstimado)} estimado`}
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Busca: nome de devedor, nome de cliente ou CNPJ/CPF */}
        <div className="flex-1">
          <BuscaCarteira />
        </div>

        <Link
          href={novoHref}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[var(--color-signal)]/85 px-6 py-3.5 text-base font-semibold text-onyx shadow-[0_4px_24px_rgba(60,255,138,0.28)] ring-1 ring-[var(--color-signal)]/60 backdrop-blur-md transition hover:bg-[var(--color-tip-glow)]/90"
        >
          + Novo Devedor
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
