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
  return (
    <Link
      href={`/cliente/consultas/${consulta.id}${qsBase}`}
      className="glass-2 group block rounded-xl p-6 transition hover:border-[var(--color-signal-soft-2)]"
    >
      {/* Tipo do devedor + documento */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          {consulta.devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
        </span>
        <span
          className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ borderColor: score, color: score }}
        >
          {labelScore(consulta.score)}
        </span>
      </div>

      {/* Nome do devedor */}
      <h3
        className="mt-3 font-serif text-xl leading-tight text-ivory"
        style={{ color: "var(--color-devedor)" }}
      >
        {consulta.devedor.nome}
      </h3>
      <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
        {consulta.devedor.documento}
      </p>

      {/* Métricas principais */}
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--color-ivory-12)] pt-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Valor da causa
          </p>
          <p className="mt-1 font-mono tabular-nums text-[var(--color-gold)]">
            {formatBRL(consulta.valorCausaBrl)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Patrimônio estimado
          </p>
          <p className="mt-1 font-mono tabular-nums text-[var(--color-signal)]">
            {formatBRL(consulta.patrimonioEstimadoBrl)}
          </p>
        </div>
      </div>

      {/* Resumo de evidências */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ivory-88)]">
        <span>
          {consulta.outrasExecucoes.length}{" "}
          {consulta.outrasExecucoes.length === 1 ? "execução" : "execuções"}
        </span>
        <span aria-hidden="true" className="text-[var(--color-ivory-12)]">
          ·
        </span>
        <span>
          {consulta.restricoes.length}{" "}
          {consulta.restricoes.length === 1 ? "restrição" : "restrições"}
        </span>
        <span aria-hidden="true" className="text-[var(--color-ivory-12)]">
          ·
        </span>
        <span>
          {consulta.bensAparentes.length}{" "}
          {consulta.bensAparentes.length === 1 ? "bem" : "bens"} aparentes
        </span>
      </div>

      {/* Rodapé: data da consulta */}
      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
        Análise concluída {formatTempoRelativo(consulta.dataConsulta)}
      </p>
    </Link>
  );
}
