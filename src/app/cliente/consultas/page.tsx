// Portal do cliente — listagem de Consultas Pré-Processuais.
// Server Component, READ-ONLY: cliente não cria consulta, só visualiza
// o que o escritório já analisou pra ele. Mostra um overview por devedor
// consultado com score, recomendação e custo.
//
// Regra de visibilidade: filtra pelo credor_id correspondente ao email do
// usuário logado. Pro demo (cliente.demo@battaglia.com.br) o mock usa
// credorId=101 ("Comercial Vértice"), então mapeamos o email→101.
// Se não encontrar nada pelo credorId mapeado, cai num fallback que
// mostra todas as consultas do mock (preserva a demo).

import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";

import {
  listarConsultasDoCliente,
  listarConsultasPre,
  type ConsultaPreProcessual,
  type ScoreSolvencia,
} from "@/lib/consultas-pre";
import { perfilLogado } from "@/lib/perfis-server";
import { previewEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { formatBRL, formatTempoRelativo } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

// Mapeia email do cliente → credorId no mock de consultas.
// Pra demo, qualquer credor da fixture (CREDOR_DEMO id=1) com email
// cliente.demo@battaglia.com.br vê as consultas do credorId=101
// ("Comercial Vértice") — narrativa coerente da apresentação.
function emailParaCredorId(email: string): number | null {
  const e = email.toLowerCase().trim();
  if (e === "cliente.demo@battaglia.com.br") return 101;
  return null;
}

export default async function ConsultasClientePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  const eu = previewEuFromParam(params.eu, perfil) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const credorId = emailParaCredorId(eu);
  let consultas: ConsultaPreProcessual[] = credorId
    ? await listarConsultasDoCliente(credorId)
    : [];

  // Fallback de demo: se o email não mapeia ou não tem consultas atribuídas,
  // mostra todas as do mock pra preservar a narrativa da apresentação.
  if (consultas.length === 0) {
    consultas = await listarConsultasPre();
  }

  const qsBase = params.eu
    ? `?eu=${encodeURIComponent(Array.isArray(params.eu) ? params.eu[0]! : params.eu)}`
    : "";

  return (
    <main className="relative mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
      {/* ============ HEADER CENTRALIZADO ============ */}
      <header className="title-shield mb-10 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <Search className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Análise de Efetividade
        </p>
        <h1 className="mt-3 font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Consultas Pré-Processuais
        </h1>
        <p className="mx-auto mt-4 max-w-[680px] text-base leading-relaxed text-[var(--color-signal)]">
          Consultas realizadas pelo escritório antes de processar.
        </p>
        <p className="mx-auto mt-2 max-w-[640px] text-sm text-[var(--color-ivory-66)]">
          {consultas.length === 0
            ? "Nenhuma consulta concluída até o momento."
            : `${consultas.length} ${
                consultas.length === 1
                  ? "análise patrimonial concluída"
                  : "análises patrimoniais concluídas"
              } sobre devedores em potencial.`}
        </p>
      </header>

      {/* ============ LISTA ============ */}
      {consultas.length === 0 ? (
        <div className="mt-12 grid place-items-center">
          <SpotlightCard className="max-w-[520px] p-10 text-center">
            <span className="eyebrow !text-[var(--color-signal)]">Aguardando</span>
            <h3 className="mt-4 font-serif text-2xl text-ivory">
              Nenhuma análise pré-processual vinculada ao seu cadastro
            </h3>
            <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
              Assim que o escritório concluir uma análise patrimonial em seu
              nome, ela aparecerá aqui.
            </p>
          </SpotlightCard>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {consultas.map((c) => (
            <CardConsulta key={c.id} consulta={c} qsBase={qsBase} />
          ))}
        </div>
      )}
    </main>
  );
}

// ============================================================
// CARD DE CONSULTA (cliente — sem badge de recomendação destacada)
// ============================================================

function corScore(score: ScoreSolvencia): string {
  switch (score) {
    case "alta":
      return "var(--color-signal)";
    case "media":
      return "var(--color-gold)";
    case "baixa":
      return "var(--color-devedor)";
  }
}

// Hex + RGB triple por score — pro chip preenchido neon (igual + Nova Consulta).
function corScoreNeon(score: ScoreSolvencia): { solid: string; rgb: string } {
  switch (score) {
    case "alta":
      return { solid: "#3CFF8A", rgb: "60, 255, 138" };
    case "media":
      return { solid: "#FFD93D", rgb: "255, 217, 61" };
    case "baixa":
      return { solid: "#DC2626", rgb: "220, 38, 38" };
  }
}

function labelScore(score: ScoreSolvencia): string {
  switch (score) {
    case "alta":
      return "Solvência alta";
    case "media":
      return "Solvência média";
    case "baixa":
      return "Solvência baixa";
  }
}

function CardConsulta({
  consulta,
  qsBase,
}: {
  consulta: ConsultaPreProcessual;
  qsBase: string;
}) {
  const score = corScore(consulta.score);
  const docLabel = consulta.devedor.tipo === "PF" ? "CPF" : "CNPJ";
  return (
    <Link
      href={`/cliente/consultas/${consulta.id}${qsBase}`}
      className="group block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-onyx)]"
    >
      <div className="glass flex h-full flex-col gap-5 p-7 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_24px_48px_-12px_rgba(60,255,138,0.18)]">
        {/* === EYEBROW + SCORE === */}
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
            Consulta Pré-Processual
          </span>
          {(() => {
            const { solid, rgb } = corScoreNeon(consulta.score);
            return (
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.20em]"
                style={{
                  backgroundColor: solid,
                  borderColor: solid,
                  color: "var(--color-onyx)",
                  boxShadow: `0 4px 18px rgba(${rgb}, 0.45), 0 0 8px rgba(${rgb}, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.28)`,
                }}
              >
                {labelScore(consulta.score)}
              </span>
            );
          })()}
        </div>

        {/* === IDENTIFICAÇÃO DO DEVEDOR === */}
        <header>
          <h3 className="nome-devedor font-serif text-[26px] leading-[1.15] text-[var(--color-devedor)]">
            {consulta.devedor.nome}
          </h3>

          {/* Chip do documento — mesmo padrão do CarteiraView */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-3 py-1.5">
            <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
              {consulta.devedor.tipo}
            </span>
            <span className="h-3 w-px bg-[var(--color-ivory-22)]" />
            <span className="font-mono text-[12px] text-ivory">
              {docLabel} {consulta.devedor.documento}
            </span>
          </div>
        </header>

        {/* === DIVIDER SUTIL === */}
        <div className="h-px bg-[var(--color-ivory-12)]" />

        {/* === VALORES (cliente: causa + patrimônio) === */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] px-4 py-4">
          <div className="flex flex-col items-center text-center">
            <span className="font-serif text-[22px] leading-none tabular-nums text-[var(--color-gold)]">
              {formatBRL(consulta.valorCausaBrl)}
            </span>
            <span className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Valor da Causa
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-serif text-[22px] leading-none tabular-nums text-[var(--color-signal)]">
              {formatBRL(consulta.patrimonioEstimadoBrl)}
            </span>
            <span className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Patrimônio Estimado
            </span>
          </div>
        </div>

        {/* === STATS GRID 3-COL === */}
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] px-4 py-4">
          <div className="flex flex-col items-center text-center">
            <span className="font-serif text-4xl leading-none tabular-nums text-[var(--color-devedor)]">
              {consulta.outrasExecucoes.length}
            </span>
            <span className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Outras Execuções
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-serif text-4xl leading-none tabular-nums text-[var(--color-gold)]">
              {consulta.restricoes.length}
            </span>
            <span className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Restrições
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-serif text-4xl leading-none tabular-nums text-[var(--color-signal)]">
              {consulta.bensAparentes.length}
            </span>
            <span className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Bens Aparentes
            </span>
          </div>
        </div>

        {/* === DIVIDER SUTIL === */}
        <div className="h-px bg-[var(--color-ivory-12)]" />

        {/* === FOOTER: data da análise === */}
        <div className="mt-auto font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          Análise concluída {formatTempoRelativo(consulta.dataConsulta)}
        </div>
      </div>
    </Link>
  );
}
