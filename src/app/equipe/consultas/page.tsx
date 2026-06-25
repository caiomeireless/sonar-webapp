// Aba "Consultas Pré-Processuais" — lista de análises prévias de solvência
// encomendadas pelo cliente antes de abrir caso. Mock por enquanto
// (lib/consultas-pre.ts); vira tabela real na Sem 2.
//
// Visual: mesmo molde da página de devedores — header serif dourado uppercase,
// eyebrow signal, busca/CTA, grid 3-col de cards. Cada card mostra score
// (alta/média/baixa) e recomendação (recomendado/avaliar/não recomendado).
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
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
  searchParams?: Promise<{ eu?: string | string[] }>;
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

  const consultas = await listarConsultasPre();

  const totalAlta = consultas.filter((c) => c.score === "alta").length;
  const totalMedia = consultas.filter((c) => c.score === "media").length;
  const totalBaixa = consultas.filter((c) => c.score === "baixa").length;
  const custoTotal = consultas.reduce((s, c) => s + c.custoBrl, 0);

  return (
    <main className="relative mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
      {/* ============ HEADER CENTRALIZADO ============ */}
      <header className="title-shield mb-6 flex flex-col items-center text-center">
        {/* Icone Relogio dourado acima do titulo. */}
        <div
          className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-gold)]/45 bg-[var(--color-gold)]/10"
          style={{
            boxShadow:
              "0 0 20px rgba(201,162,74,0.30), inset 0 0 12px rgba(201,162,74,0.10)",
          }}
        >
          <Clock
            className="h-7 w-7 text-[var(--color-gold)]"
            style={{ filter: "drop-shadow(0 0 8px rgba(201,162,74,0.7))" }}
            aria-hidden="true"
          />
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
          Equipe · Análise de Efetividade
        </p>
        <h1 className="mt-3 font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Consultas Pré-Processuais
        </h1>
        <p className="mt-3 font-mono text-[13px] text-[var(--color-signal)]">
          Antes de processar, descubra se o devedor é solvente.
        </p>
        {consultas.length > 0 ? (
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            {consultas.length}{" "}
            {consultas.length === 1 ? "Consulta" : "Consultas"} ·{" "}
            <span className="text-[var(--color-signal)]">{totalAlta} Alta</span> ·{" "}
            <span className="text-[var(--color-gold)]">{totalMedia} Média</span> ·{" "}
            <span className="text-[var(--color-devedor)]">{totalBaixa} Baixa</span>{" "}
            · {formatBRL(custoTotal)} em consultas
          </p>
        ) : null}
      </header>

      {/* ============ AÇÃO PRINCIPAL ============ */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href={novaHref}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[var(--color-signal)]/85 px-6 py-3.5 text-base font-semibold text-onyx shadow-[0_4px_24px_rgba(60,255,138,0.28)] ring-1 ring-[var(--color-signal)]/60 backdrop-blur-md transition hover:bg-[var(--color-tip-glow)]/90"
        >
          + Nova Consulta
        </Link>
      </div>

      {/* ============ LISTA ============ */}
      {consultas.length === 0 ? (
        <div className="mt-12 grid place-items-center">
          <SpotlightCard className="max-w-[520px] p-10 text-center">
            <span className="eyebrow !text-[var(--color-signal)]">Vazio</span>
            <h3 className="mt-4 font-serif text-2xl text-ivory">
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
      <div className="glass flex h-full flex-col gap-5 p-7 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_24px_48px_-12px_rgba(60,255,138,0.18)]">
        {/* === EYEBROW + SCORE === */}
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
            Consulta Pré-Processual
          </span>
          <ChipScore score={consulta.score} />
        </div>

        {/* === IDENTIFICAÇÃO DO DEVEDOR === */}
        <header>
          <h3 className="font-serif text-[26px] leading-[1.15] text-[var(--color-devedor)]">
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
      </div>
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
      className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.20em]"
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
