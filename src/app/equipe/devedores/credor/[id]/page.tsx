// Drill-down da carteira — NÍVEL 2: casos de UM cliente (credor).
// Header com dados do cliente + 3 cards de número + lista de casos.
// Cada caso = 1 devedor + 1 processo; click leva ao dossiê em
// /equipe/devedores/{devedor_id} (nível 3, já existente).
import Link from "next/link";
import { redirect } from "next/navigation";
import { obterCredorComCasos } from "@/lib/devedores";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { formatBRL } from "@/lib/format";
import { CasosCredorView } from "./CasosCredorView";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function CredorDrilldownPage({
  params,
  searchParams,
}: Props) {
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
  const credorId = Number.parseInt(id, 10);
  if (!Number.isFinite(credorId)) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }

  const data = await obterCredorComCasos(credorId);
  if (!data) {
    return <NaoEncontrado voltarHref={`/equipe/devedores${linkBase}`} />;
  }

  const { credor, casos, totalCasos, totalDevedores, valorEstimadoTotal } =
    data;
  const docLabel = credor.tipo === "PF" ? "CPF" : "CNPJ";

  return (
    <main>
      {/* ============ HEADER ============ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[900px] -translate-x-1/2 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(201,162,74,0.16), transparent 65%)",
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
          <Link
            href={`/equipe/devedores${linkBase}`}
            className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:text-[var(--color-tip-glow)]"
          >
            ← Carteira do escritório
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <span className="eyebrow">Cliente</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
              Visão da equipe
            </span>
          </div>

          <h1 className="mt-4 font-serif text-[clamp(28px,4vw,46px)] font-medium leading-[1.1] tracking-tight text-[var(--color-gold)]">
            {credor.nome}
          </h1>
          <p className="mt-3 font-mono text-sm text-[var(--color-ivory-66)]">
            {credor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"} ·{" "}
            {docLabel} {credor.documento}
          </p>

          {credor.email_contato || credor.telefone ? (
            <p className="mt-2 font-mono text-xs leading-snug text-[var(--color-ivory-88)]">
              {credor.email_contato ? (
                <span className="mr-3">{credor.email_contato}</span>
              ) : null}
              {credor.telefone ? <span>{credor.telefone}</span> : null}
            </p>
          ) : null}

          {credor.observacoes ? (
            <p className="mt-4 max-w-[720px] text-sm italic text-[var(--color-ivory-88)]">
              {credor.observacoes}
            </p>
          ) : null}

          {/* 3 cards de número grande */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <CardNumero
              rotulo={totalCasos === 1 ? "Caso" : "Casos"}
              valor={String(totalCasos)}
            />
            <CardNumero
              rotulo={
                totalDevedores === 1
                  ? "Devedor rastreado"
                  : "Devedores rastreados"
              }
              valor={String(totalDevedores)}
            />
            <CardNumero
              rotulo="Valor estimado total"
              valor={formatBRL(valorEstimadoTotal)}
            />
          </div>
        </div>
      </section>

      {/* ============ CASOS ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
          <span className="eyebrow">Casos deste cliente</span>
          <h2 className="mt-4 font-serif text-3xl text-ivory">
            {casos.length === 0
              ? "Nenhum caso vinculado"
              : `${casos.length} ${
                  casos.length === 1 ? "caso" : "casos"
                } na carteira`}
          </h2>

          {casos.length === 0 ? (
            <p className="mt-6 text-sm italic text-[var(--color-ivory-66)]">
              Este cliente ainda não tem casos cadastrados.
            </p>
          ) : (
            <CasosCredorView casos={casos} euQuery={linkBase} />
          )}
        </div>
      </section>
    </main>
  );
}

function CardNumero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <SpotlightCard className="p-6">
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
        {rotulo}
      </span>
      <p className="mt-2 font-serif text-3xl text-[var(--color-gold)]">
        {valor}
      </p>
    </SpotlightCard>
  );
}

function NaoEncontrado({ voltarHref }: { voltarHref: string }) {
  return (
    <main className="relative mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
      <SpotlightCard className="mx-auto max-w-[520px] p-10 text-center">
        <span className="eyebrow !text-[var(--color-gold)]">Não encontrado</span>
        <h3 className="mt-4 font-serif text-2xl text-ivory">
          Cliente não encontrado
        </h3>
        <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
          O cliente solicitado não existe ou foi removido da carteira.
        </p>
        <Link
          href={voltarHref}
          className="mt-6 inline-block rounded-lg border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/10 px-4 py-2 text-xs font-medium text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/20"
        >
          ← Voltar para a carteira
        </Link>
      </SpotlightCard>
    </main>
  );
}
