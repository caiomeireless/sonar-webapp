// Dashboard analítico do Caso — visão da EQUIPE.
// Server Component: carrega dossiê (cabeçalho) + dados agregados (cards).
// Layout 12-col responsivo; mobile cai pra 1 coluna.
import Link from "next/link";
import { redirect } from "next/navigation";

import { obterDossie } from "@/lib/casos";
import { obterDadosDashboardCasoV2 } from "@/lib/dashboard-caso";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

import { DashboardCasoGrid } from "./_components/DashboardCasoGrid";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function DashboardCasoPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const eu = devEuFromParam(sp.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const euDev = devEuFromParam(sp.eu);
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  if (!/^\d+$/.test(id)) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }
  const devedorId = Number.parseInt(id, 10);
  if (!Number.isFinite(devedorId)) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }

  const [dossie, dados] = await Promise.all([
    obterDossie(devedorId),
    obterDadosDashboardCasoV2(devedorId),
  ]);

  if (!dossie || !dados) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }

  const { devedor, casos } = dossie;
  const dossieHref = `/equipe/devedores/${devedorId}${linkBase}`;

  return (
    <main>
      {/* ============ BARRA DE TOPO ============ */}
      <section className="relative border-b border-[var(--color-ivory-12)]">
        <Link
          href={dossieHref}
          className="btn-neon-gold absolute right-6 top-10 z-10 sm:right-10"
        >
          ← Voltar ao dossiê
        </Link>
        <div className="mx-auto max-w-[1400px] px-6 py-10 text-center sm:px-10">
          <div className="flex items-center justify-center gap-3">
            <span className="eyebrow">Dashboard analítico</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
              Visão da equipe
            </span>
          </div>
          <h1 className="nome-devedor mx-auto mt-4 font-serif text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-tight text-[var(--color-devedor)]">
            {devedor.nome}
          </h1>
          <p className="mt-3 font-mono text-xs text-[var(--color-ivory-66)]">
            {casos.length} {casos.length === 1 ? "caso vinculado" : "casos vinculados"}
            {" · "}
            {devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
            {" · "}
            {devedor.documento}
          </p>
        </div>
      </section>

      {/* ============ GRID DE CARDS (compartilhado com a ficha) ============ */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
          <DashboardCasoGrid dados={dados} />
        </div>
      </section>
    </main>
  );
}

// ============================================================
// Estado vazio — devedor não encontrado / id inválido
// ============================================================

function NaoEncontrado({ voltarHref }: { voltarHref: string }) {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
      <div className="grid place-items-center">
        <SpotlightCard className="max-w-[520px] p-10 text-center">
          <span className="eyebrow !text-[var(--color-gold)]">Não encontrado</span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Devedor não localizado
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            O identificador informado não corresponde a nenhum devedor
            cadastrado.
          </p>
          <Link href={voltarHref} className="btn-neon-gold mt-6">
            ← Voltar para devedores
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}
