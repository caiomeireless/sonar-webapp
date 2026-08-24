// Aba "Consultas Pré-Processuais" — lista de análises prévias de solvência
// encomendadas pelo cliente antes de abrir caso. Mock por enquanto
// (lib/consultas-pre.ts); vira tabela real na Sem 2.
//
// Visual: mesmo molde da página de devedores — header serif dourado uppercase,
// eyebrow signal, busca/CTA, grid 3-col de cards. Cada card mostra score
// (alta/média/baixa) e recomendação (recomendado/avaliar/não recomendado).
import Link from "next/link";
import { redirect } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import { BORDA_CADERNO } from "@/app/_shared/dossie/SecaoFicha";
import {
  listarConsultasPre,
  type ConsultaPreProcessual,
  type ScoreSolvencia,
  type RecomendacaoExecucao,
} from "@/lib/consultas-pre";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { formatBRL, formatTempoRelativo } from "@/lib/format";

type Props = {
  searchParams?: Promise<{ eu?: string | string[]; demo?: string | string[] }>;
};

export default async function ConsultasPreEquipePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const eu = devEuFromParam(params.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const euDev = devEuFromParam(params.eu);
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";
  const novaHref = `/equipe/consultas/nova${linkBase}`;

  // As 3 consultas fictícias só aparecem em MODO DEMONSTRAÇÃO (?demo=1)
  // — senão a aba inteira parece de mentira (feedback do Caio 25/08).
  const demoRaw = Array.isArray(params.demo) ? params.demo[0] : params.demo;
  const mostrarDemo = demoRaw === "1";
  const demoHref = `/equipe/consultas?demo=1${euDev ? `&eu=${encodeURIComponent(euDev)}` : ""}`;

  const consultas = mostrarDemo ? await listarConsultasPre() : [];

  const totalAlta = consultas.filter((c) => c.score === "alta").length;
  const totalMedia = consultas.filter((c) => c.score === "media").length;
  const totalBaixa = consultas.filter((c) => c.score === "baixa").length;
  const custoTotal = consultas.reduce((s, c) => s + c.custoBrl, 0);

  return (
    <main className="relative min-h-svh">
      {/* Fundo: preto puro (padrão da cara nova). */}
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
      {/* ============ HEADER (padrão Banco de Dossiês) ============ */}
      <header className="mb-8 text-center">
        <h1
          className="font-serif text-[clamp(29px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[#C97B2A]"
          style={{ WebkitTextStroke: "1px rgba(255,255,255,0.65)" }}
        >
          Avaliação Pré-Processual
        </h1>
        <p className="mt-3 font-mono text-[clamp(13px,1.6vw,20px)] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Antes de Processar, Descubra se o Devedor É Solvente.
        </p>
        <div className="mt-6 flex justify-center">
          <BordaLiquidaMetal cor="signal" radius={14} className="inline-flex">
            <Link
              href={novaHref}
              className="inline-flex h-full w-full items-center gap-2 rounded-[11px] bg-[var(--color-signal)]/85 px-6 py-3 text-sm font-semibold text-onyx transition hover:bg-[var(--color-tip-glow)]/90"
            >
              + Nova Consulta
            </Link>
          </BordaLiquidaMetal>
        </div>
      </header>

      {/* Card DEMONSTRAÇÃO (roxo): só ao clicar aparecem os 3 cards
          fictícios — a aba abre limpa. */}
      {!mostrarDemo ? (
        <SpotlightCard
          local
          degrade="linear-gradient(0deg, rgba(58,32,88,0.55), rgba(58,32,88,0.55))"
          borda="rgba(192, 132, 252, 0.45)"
          className="mb-4"
        >
          <Link
            href={demoHref}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4"
          >
            <div className="min-w-0">
              <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.26em] text-[#C084FC]">
                Demonstração
              </p>
              <p className="mt-1 text-[15px] leading-snug text-ivory">
                Três avaliações fictícias — João da Silva (solvente), Empresa
                ABC (insolvente) e Jefferson da Silva (intermediário).
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full border border-[#C084FC]/60 bg-[#C084FC]/10 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-[#C084FC]">
              Ver Demonstração
            </span>
          </Link>
        </SpotlightCard>
      ) : (
        <>
          {/* Aviso: os 3 cards são DEMONSTRAÇÃO (dados fictícios). */}
          <div
            className="mb-4 flex flex-wrap items-center justify-center gap-3 rounded-2xl border px-5 py-3.5"
            style={{
              borderColor: "rgba(255,217,61,0.55)",
              backgroundColor: "rgba(255,217,61,0.10)",
            }}
          >
            <TriangleAlert
              className="h-5 w-5 shrink-0 text-[#FFD93D]"
              aria-hidden="true"
            />
            <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.22em] text-[#FFD93D]">
              Demonstração — As Consultas Abaixo Usam Dados Fictícios
            </p>
            <Link
              href={`/equipe/consultas${linkBase}`}
              className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)] underline-offset-2 hover:underline"
            >
              Ocultar
            </Link>
          </div>

          <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-devedor)]">
            {consultas.length}{" "}
            {consultas.length === 1 ? "consulta" : "consultas"} · {totalAlta}{" "}
            alta · {totalMedia} média · {totalBaixa} baixa ·{" "}
            {formatBRL(custoTotal)} em consultas
          </p>
        </>
      )}

      {/* ============ LISTA ============ */}
      {consultas.length === 0 ? (
        <div className="mt-12 grid place-items-center">
          <SpotlightCard local claro className="max-w-[520px] p-10 text-center">
            <h3 className="font-serif text-2xl text-ivory">
              Nenhuma consulta realizada ainda
            </h3>
            <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
              Encomende a primeira análise pré-processual para um devedor.
            </p>
            <Link
              href={novaHref}
              className="mt-6 inline-block rounded-lg border border-[var(--color-signal)]/50 bg-[var(--color-signal)]/10 px-4 py-2 text-xs font-medium text-[var(--color-signal)] transition hover:bg-[var(--color-signal)]/20"
            >
              + Nova consulta
            </Link>
          </SpotlightCard>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {consultas.map((c) => (
            <CardConsulta key={c.id} consulta={c} euQuery={linkBase} />
          ))}
        </div>
      )}
      </div>
    </main>
  );
}

// ============================================================
// CardConsulta
// ============================================================

function CardConsulta({
  consulta,
  euQuery,
}: {
  consulta: ConsultaPreProcessual;
  euQuery: string;
}) {
  const { devedor } = consulta;
  const docLabel = devedor.tipo === "PF" ? "CPF" : "CNPJ";
  return (
    <Link
      href={`/equipe/consultas/${consulta.id}${euQuery}`}
      className="group block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-onyx)]"
    >
      <SpotlightCard
        local
        claro
        borda={BORDA_CADERNO}
        className="flex h-full flex-col gap-5 p-7 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_24px_48px_-12px_rgba(60,255,138,0.18)]"
      >
        {/* === EYEBROW + SCORE === */}
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
            Consulta Pré-Processual
          </span>
          <ChipScore score={consulta.score} />
        </div>

        {/* === IDENTIFICAÇÃO DO DEVEDOR === */}
        <header>
          <h3
            className="nome-devedor font-serif text-[24px] uppercase leading-[1.15] tracking-[0.02em] text-[var(--color-devedor)]"
            style={{
              textShadow:
                "0 0 1px rgba(220,38,38,0.6), 0 0 12px rgba(220,38,38,0.16)",
            }}
          >
            {devedor.nome}
          </h3>

          {/* Chip do documento — mesmo padrão do CarteiraView */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-3 py-1.5">
            <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
              {devedor.tipo}
            </span>
            <span className="h-3 w-px bg-[var(--color-ivory-22)]" />
            <span className="font-mono text-[12px] text-ivory">
              {docLabel} {devedor.documento}
            </span>
          </div>
        </header>

        {/* === DIVIDER SUTIL === */}
        <div className="h-px bg-[var(--color-ivory-12)]" />

        {/* === RECOMENDAÇÃO (pill abaixo do score, antes dos stats) === */}
        <PillRecomendacao recomendacao={consulta.recomendacao} />

        {/* === STATS GRID 3-COL === */}
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] px-4 py-4">
          <StatMini
            valor={String(consulta.outrasExecucoes.length)}
            label="Outras Execuções"
            color="var(--color-devedor)"
          />
          <StatMini
            valor={String(consulta.restricoes.length)}
            label="Restrições"
            color="var(--color-gold)"
          />
          <StatMini
            valor={String(consulta.bensAparentes.length)}
            label="Bens Aparentes"
            color="var(--color-signal)"
          />
        </div>

        {/* === DIVIDER SUTIL === */}
        <div className="h-px bg-[var(--color-ivory-12)]" />

        {/* === FOOTER: data + custo + advogado === */}
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            <span>{formatTempoRelativo(consulta.dataConsulta)}</span>
            <span className="tabular-nums text-[var(--color-gold)]">
              {formatBRL(consulta.custoBrl)}
            </span>
          </div>
          <div
            className="break-all font-mono text-[12px]"
            style={{ color: "var(--color-advogado)" }}
          >
            {consulta.advogadoEmail}
          </div>
        </div>
      </SpotlightCard>
    </Link>
  );
}

// ============================================================
// Subcomponentes visuais
// ============================================================

function corDoScore(score: ScoreSolvencia): string {
  switch (score) {
    case "alta":
      return "var(--color-signal)";
    case "media":
      return "var(--color-gold)";
    case "baixa":
      return "var(--color-devedor)";
  }
}

// Hex + RGB triple por score — pro chip preenchido neon (precisamos
// montar rgba() em runtime pro glow).
function corDoScoreNeon(score: ScoreSolvencia): { solid: string; rgb: string } {
  switch (score) {
    case "alta":
      return { solid: "#3CFF8A", rgb: "60, 255, 138" };
    case "media":
      return { solid: "#FFD93D", rgb: "255, 217, 61" };
    case "baixa":
      return { solid: "#DC2626", rgb: "220, 38, 38" };
  }
}

function labelDoScore(score: ScoreSolvencia): string {
  switch (score) {
    case "alta":
      return "Solvência Alta";
    case "media":
      return "Solvência Média";
    case "baixa":
      return "Solvência Baixa";
  }
}

function ChipScore({ score }: { score: ScoreSolvencia }) {
  const { solid, rgb } = corDoScoreNeon(score);
  return (
    <span
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 py-1.5 text-center font-mono text-[12px] font-bold uppercase tracking-[0.20em]"
      style={{
        backgroundColor: solid,
        borderColor: solid,
        color: "var(--color-onyx)",
        boxShadow: `0 4px 18px rgba(${rgb}, 0.45), 0 0 8px rgba(${rgb}, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.28)`,
      }}
    >
      {labelDoScore(score)}
    </span>
  );
}

function StatMini({
  valor,
  label,
  color,
}: {
  valor: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span
        className="font-serif text-4xl leading-none tabular-nums"
        style={{ color }}
      >
        {valor}
      </span>
      <span className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
        {label}
      </span>
    </div>
  );
}

function PillRecomendacao({
  recomendacao,
}: {
  recomendacao: RecomendacaoExecucao;
}) {
  const meta = metaRecomendacao(recomendacao);
  return (
    <div
      className="inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.22em]"
      style={{
        borderColor: meta.color,
        color: meta.color,
        backgroundColor: meta.bg,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
      />
      {meta.label}
    </div>
  );
}

function metaRecomendacao(rec: RecomendacaoExecucao): {
  label: string;
  color: string;
  bg: string;
} {
  switch (rec) {
    case "recomendado":
      return {
        label: "Recomendado",
        color: "var(--color-signal)",
        bg: "rgba(60,255,138,0.10)",
      };
    case "avaliar":
      return {
        label: "Avaliar",
        color: "var(--color-gold)",
        bg: "rgba(201,162,74,0.10)",
      };
    case "nao_recomendado":
      return {
        label: "Não Recomendado",
        color: "var(--color-devedor)",
        bg: "rgba(220,80,80,0.10)",
      };
  }
}
