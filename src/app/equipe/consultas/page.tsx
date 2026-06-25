// Aba "Consultas Pré-Processuais" — lista de análises prévias de solvência
// encomendadas pelo cliente antes de abrir caso. Mock por enquanto
// (lib/consultas-pre.ts); vira tabela real na Sem 2.
//
// Visual: mesmo molde da página de devedores — header serif dourado uppercase,
// eyebrow signal, busca/CTA, grid 3-col de cards. Cada card mostra score
// (alta/média/baixa) e recomendação (recomendado/avaliar/não recomendado).
import Link from "next/link";
import { redirect } from "next/navigation";
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
import { formatBRL, formatData } from "@/lib/format";

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
      <header className="title-shield mb-6 text-center">
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
  return (
    <Link
      href={`/equipe/consultas/${consulta.id}${euQuery}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-onyx)]"
    >
      <SpotlightCard className="flex h-full flex-col gap-4 p-6 transition group-hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
            Consulta Pré-Processual
          </span>
          <ChipScore score={consulta.score} />
        </div>

        <h3 className="font-serif text-[22px] leading-[1.15] text-[var(--color-devedor)]">
          {devedor.nome}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <ChipBase
            label={devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
            color="var(--color-gold)"
          />
          <ChipBase label={devedor.documento} color="var(--color-ivory-66)" mono />
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] px-3 py-3">
          <StatMini
            valor={String(consulta.outrasExecucoes.length)}
            label="Execuções"
            color="var(--color-devedor)"
          />
          <StatMini
            valor={String(consulta.restricoes.length)}
            label="Restrições"
            color="var(--color-gold)"
          />
          <StatMini
            valor={String(consulta.bensAparentes.length)}
            label="Bens"
            color="var(--color-signal)"
          />
        </div>

        <PillRecomendacao recomendacao={consulta.recomendacao} />

        <div className="mt-auto flex items-center justify-between border-t border-[var(--color-ivory-12)] pt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          <span>{formatData(consulta.dataConsulta)}</span>
          <span>{formatBRL(consulta.custoBrl)}</span>
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

function labelDoScore(score: ScoreSolvencia): string {
  switch (score) {
    case "alta":
      return "Alta";
    case "media":
      return "Média";
    case "baixa":
      return "Baixa";
  }
}

function ChipScore({ score }: { score: ScoreSolvencia }) {
  const color = corDoScore(score);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em]"
      style={{
        borderColor: color,
        color,
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      Score {labelDoScore(score)}
    </span>
  );
}

function ChipBase({
  label,
  color,
  mono,
}: {
  label: string;
  color: string;
  mono?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${
        mono ? "font-mono" : "font-mono"
      }`}
      style={{
        borderColor: color,
        color,
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      {label}
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
        className="font-serif text-2xl leading-none"
        style={{ color }}
      >
        {valor}
      </span>
      <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
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
      className="inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.22em]"
      style={{
        borderColor: meta.color,
        color: meta.color,
        backgroundColor: meta.bg,
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
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
