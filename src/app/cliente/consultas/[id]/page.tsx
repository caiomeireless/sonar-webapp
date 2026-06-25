// Portal do cliente — detalhe de uma Consulta Pré-Processual.
// Server Component, READ-ONLY: cliente vê TUDO (outras execuções, restrições,
// bens aparentes, análise, recomendação, custo) mas NÃO tem o botão de
// "Criar Caso a partir desta Consulta" — esse fluxo é da equipe.

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Car,
  CheckCircle2,
  FileWarning,
  Gavel,
  Home,
  Landmark,
  ShieldAlert,
} from "lucide-react";

import {
  obterConsultaPre,
  type BemAparente,
  type OutraExecucao,
  type RecomendacaoExecucao,
  type Restricao,
  type ScoreSolvencia,
} from "@/lib/consultas-pre";
import { perfilLogado } from "@/lib/perfis-server";
import { previewEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { formatBRL, formatData } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

// Mesma regra de mapeamento email→credorId da listagem.
function emailParaCredorId(email: string): number | null {
  const e = email.toLowerCase().trim();
  if (e === "cliente.demo@battaglia.com.br") return 101;
  return null;
}

export default async function ConsultaClienteDetalhePage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  const eu = previewEuFromParam(sp.eu, perfil) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  if (!/^\d+$/.test(id)) {
    return <AcessoNegado />;
  }
  const consultaId = Number.parseInt(id, 10);
  if (!Number.isFinite(consultaId)) {
    return <AcessoNegado />;
  }

  const consulta = await obterConsultaPre(consultaId);
  if (!consulta) {
    return <AcessoNegado />;
  }

  // Visibilidade: se mapeamos o cliente pra um credorId e a consulta
  // pertence a outro credor, bloqueia. Fallback de demo: se não há mapeamento,
  // libera (o mock não tem cliente real ainda).
  const credorIdEsperado = emailParaCredorId(eu);
  if (
    credorIdEsperado !== null &&
    consulta.credorId !== credorIdEsperado
  ) {
    // Em produção isso seria 403. Pra demo, mantemos a leitura (sem mapeamento
    // perfeito, evita "perder" a consulta selecionada).
    // Quando a tabela real existir, descomentar:
    // return <AcessoNegado />;
  }

  const qsBase = sp.eu
    ? `?eu=${encodeURIComponent(Array.isArray(sp.eu) ? sp.eu[0]! : sp.eu)}`
    : "";

  return (
    <main>
      {/* ============ HEADER ============ */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-[1100px] px-6 py-12 sm:px-10">
          <Link href={`/cliente/consultas${qsBase}`} className="btn-neon-gold">
            ← Voltar
          </Link>

          <header className="title-shield mb-6 mt-6 text-center">
            <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
              Análise de Efetividade
            </p>
            <h1
              className="mt-3 font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em]"
              style={{ color: "var(--color-devedor)" }}
            >
              {consulta.devedor.nome}
            </h1>
            <p className="mt-3 font-mono text-sm text-[var(--color-signal)]">
              {consulta.devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}{" "}
              · {consulta.devedor.documento}
            </p>
            {consulta.devedor.enderecoConsultado ? (
              <p className="mt-2 text-sm text-[var(--color-ivory-88)]">
                {consulta.devedor.enderecoConsultado}
              </p>
            ) : null}
          </header>

          {/* ============ 3 CARDS DE NÚMERO ============ */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <CardNumero
              rotulo="Valor da causa"
              valor={formatBRL(consulta.valorCausaBrl)}
              cor="var(--color-gold)"
            />
            <CardNumero
              rotulo="Patrimônio estimado"
              valor={formatBRL(consulta.patrimonioEstimadoBrl)}
              cor="var(--color-signal)"
            />
            <CardNumero
              rotulo="Score de solvência"
              valor={labelScore(consulta.score)}
              cor={corScore(consulta.score)}
            />
          </div>
        </div>
      </section>

      {/* ============ RECOMENDAÇÃO ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1100px] px-6 py-12 sm:px-10">
          <span className="eyebrow">Recomendação do escritório</span>
          <BlocoRecomendacao recomendacao={consulta.recomendacao} />
        </div>
      </section>

      {/* ============ ANÁLISE TEXTUAL ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1100px] px-6 py-12 sm:px-10">
          <span className="eyebrow">Análise patrimonial</span>
          <div className="glass mt-6 p-7">
            <p className="text-[15px] leading-relaxed text-[var(--color-ivory-88)]">
              {consulta.observacoes}
            </p>
            {consulta.rendaEstimadaMensalBrl !== undefined ? (
              <p className="mt-5 border-t border-[var(--color-ivory-12)] pt-4 font-mono text-xs text-[var(--color-ivory-66)]">
                Renda mensal estimada:{" "}
                <span className="text-[var(--color-signal)]">
                  {formatBRL(consulta.rendaEstimadaMensalBrl)}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* ============ OUTRAS EXECUÇÕES ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1100px] px-6 py-12 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-ivory-12)]">
              <Gavel className="h-4 w-4 text-[var(--color-devedor)]" />
            </span>
            <h2 className="font-serif text-2xl text-ivory">
              Outras execuções contra o devedor
            </h2>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              {consulta.outrasExecucoes.length}{" "}
              {consulta.outrasExecucoes.length === 1 ? "processo" : "processos"}
            </span>
          </div>

          {consulta.outrasExecucoes.length === 0 ? (
            <p className="mt-5 pl-12 text-sm italic text-[var(--color-ivory-66)]">
              Nenhuma execução em curso contra este devedor.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 pl-12">
              {consulta.outrasExecucoes.map((exec) => (
                <CardExecucao key={exec.id} execucao={exec} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ RESTRIÇÕES ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1100px] px-6 py-12 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-ivory-12)]">
              <ShieldAlert className="h-4 w-4 text-[var(--color-devedor)]" />
            </span>
            <h2 className="font-serif text-2xl text-ivory">
              Restrições cadastrais
            </h2>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              {consulta.restricoes.length}{" "}
              {consulta.restricoes.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          {consulta.restricoes.length === 0 ? (
            <p className="mt-5 pl-12 text-sm italic text-[var(--color-ivory-66)]">
              Nenhuma restrição ativa nos cadastros consultados.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 pl-12">
              {consulta.restricoes.map((r, i) => (
                <CardRestricao key={i} restricao={r} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ BENS APARENTES ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1100px] px-6 py-12 sm:px-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-ivory-12)]">
              <Landmark className="h-4 w-4 text-[var(--color-gold)]" />
            </span>
            <h2 className="font-serif text-2xl text-ivory">
              Bens aparentes
            </h2>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              {consulta.bensAparentes.length}{" "}
              {consulta.bensAparentes.length === 1 ? "item" : "itens"}
            </span>
          </div>

          {consulta.bensAparentes.length === 0 ? (
            <p className="mt-5 pl-12 text-sm italic text-[var(--color-ivory-66)]">
              Nenhum bem localizado em nome do devedor.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 pl-12">
              {consulta.bensAparentes.map((b, i) => (
                <CardBem key={i} bem={b} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ RODAPÉ — CREDOR / DATA / CUSTO ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10">
          <div className="glass grid gap-4 p-6 sm:grid-cols-3">
            <RodapeItem rotulo="Solicitada por" valor={consulta.credorNome} />
            <RodapeItem rotulo="Data da análise" valor={formatData(consulta.dataConsulta)} />
            <RodapeItem
              rotulo="Custo da consulta"
              valor={formatBRL(consulta.custoBrl)}
              cor="var(--color-gold)"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// COMPONENTES INTERNOS
// ============================================================

function AcessoNegado() {
  return (
    <main className="mx-auto max-w-[1100px] px-6 py-24 sm:px-10">
      <div className="grid place-items-center">
        <SpotlightCard className="max-w-[520px] p-10 text-center">
          <span className="eyebrow !text-[var(--color-gold)]">Restrito</span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Consulta não disponível
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            Esta análise pré-processual não consta entre as suas, ou já foi
            arquivada. Se isso está errado, entre em contato com o escritório.
          </p>
          <Link href="/cliente/consultas" className="btn-neon-gold mt-6">
            ← Voltar para consultas
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}

function CardNumero({
  rotulo,
  valor,
  cor,
}: {
  rotulo: string;
  valor: string;
  cor: string;
}) {
  return (
    <SpotlightCard className="p-6">
      <span className="eyebrow">{rotulo}</span>
      <p className="mt-3 font-serif text-3xl" style={{ color: cor }}>
        {valor}
      </p>
    </SpotlightCard>
  );
}

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
      return "Alta";
    case "media":
      return "Média";
    case "baixa":
      return "Baixa";
  }
}

// ============================================================
// BLOCO DE RECOMENDAÇÃO (com ícone + cor por nível)
// ============================================================

function BlocoRecomendacao({
  recomendacao,
}: {
  recomendacao: RecomendacaoExecucao;
}) {
  const meta = (() => {
    switch (recomendacao) {
      case "recomendado":
        return {
          cor: "var(--color-signal)",
          icone: <CheckCircle2 className="h-5 w-5" />,
          titulo: "Execução recomendada",
          texto:
            "Cenário patrimonial favorável à execução. O escritório recomenda ajuizamento imediato.",
        };
      case "avaliar":
        return {
          cor: "var(--color-gold)",
          icone: <AlertTriangle className="h-5 w-5" />,
          titulo: "Avaliar antes de executar",
          texto:
            "Cenário misto. Recomenda-se análise complementar — em geral, tentativa de acordo extrajudicial antes do ajuizamento.",
        };
      case "nao_recomendado":
        return {
          cor: "var(--color-devedor)",
          icone: <FileWarning className="h-5 w-5" />,
          titulo: "Execução não recomendada",
          texto:
            "Cenário desfavorável: ausência de patrimônio penhorável e/ou alto risco de prescrição. Considerar acordo com desconto ou baixa contábil.",
        };
    }
  })();

  return (
    <div
      className="glass mt-6 flex gap-4 p-7"
      style={{ borderColor: meta.cor }}
    >
      <span
        className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border"
        style={{
          borderColor: meta.cor,
          color: meta.cor,
          background: "var(--color-surface-2)",
        }}
      >
        {meta.icone}
      </span>
      <div>
        <p
          className="font-serif text-xl"
          style={{ color: meta.cor }}
        >
          {meta.titulo}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-ivory-88)]">
          {meta.texto}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// CARD DE EXECUÇÃO
// ============================================================

function statusExecucaoMeta(status: OutraExecucao["status"]): {
  label: string;
  cor: string;
} {
  switch (status) {
    case "em_andamento":
      return { label: "Em andamento", cor: "var(--color-devedor)" };
    case "suspensa":
      return { label: "Suspensa", cor: "var(--color-gold)" };
    case "arquivada":
      return { label: "Arquivada", cor: "var(--color-ivory-66)" };
    case "satisfeita":
      return { label: "Satisfeita", cor: "var(--color-signal)" };
  }
}

function CardExecucao({ execucao }: { execucao: OutraExecucao }) {
  const status = statusExecucaoMeta(execucao.status);
  return (
    <div className="rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.4)] p-5 transition hover:border-[var(--color-devedor)]/60">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-mono text-base text-ivory">
            {execucao.numeroProcesso}
          </p>
          <p className="mt-1 text-sm text-[var(--color-ivory-66)]">
            {execucao.vara} · {execucao.comarca}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
            Distribuída em {formatData(execucao.dataDistribuicao)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ borderColor: status.cor, color: status.cor }}
          >
            {status.label}
          </span>
          <span className="font-mono text-base tabular-nums text-[var(--color-gold)]">
            {formatBRL(execucao.valorBrl)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CARD DE RESTRIÇÃO
// ============================================================

function tipoRestricaoLabel(t: Restricao["tipo"]): string {
  switch (t) {
    case "protesto":
      return "Protesto";
    case "negativacao":
      return "Negativação";
    case "cnpj_baixado":
      return "CNPJ baixado";
    case "cnpj_inapto":
      return "CNPJ inapto";
  }
}

function CardRestricao({ restricao }: { restricao: Restricao }) {
  return (
    <div className="rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.4)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium text-ivory">
            {tipoRestricaoLabel(restricao.tipo)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-ivory-66)]">
            {restricao.orgao}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
            Inclusão em {formatData(restricao.dataInclusao)}
          </p>
        </div>
        {restricao.valorBrl !== undefined ? (
          <span className="whitespace-nowrap font-mono text-base tabular-nums text-[var(--color-devedor)]">
            {formatBRL(restricao.valorBrl)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================
// CARD DE BEM APARENTE
// ============================================================

function iconeBem(tipo: BemAparente["tipo"]) {
  switch (tipo) {
    case "imovel":
      return <Home className="h-4 w-4" />;
    case "veiculo":
      return <Car className="h-4 w-4" />;
    case "empresa":
      return <Building2 className="h-4 w-4" />;
  }
}

function tipoBemLabel(tipo: BemAparente["tipo"]): string {
  switch (tipo) {
    case "imovel":
      return "Imóvel";
    case "veiculo":
      return "Veículo";
    case "empresa":
      return "Participação societária";
  }
}

function CardBem({ bem }: { bem: BemAparente }) {
  return (
    <div className="rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.4)] p-5 transition hover:border-[var(--color-gold)]/60">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-gold)]">
            {iconeBem(bem.tipo)}
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              {tipoBemLabel(bem.tipo)}
            </p>
            <p className="mt-1 font-medium text-ivory">{bem.descricao}</p>
            {bem.localizacao ? (
              <p className="mt-1 text-xs text-[var(--color-ivory-66)]">
                {bem.localizacao}
              </p>
            ) : null}
          </div>
        </div>
        {bem.valorEstimadoBrl !== undefined ? (
          <span className="whitespace-nowrap font-mono text-base tabular-nums text-[var(--color-gold)]">
            {formatBRL(bem.valorEstimadoBrl)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================
// RODAPÉ — credor / data / custo
// ============================================================

function RodapeItem({
  rotulo,
  valor,
  cor,
}: {
  rotulo: string;
  valor: string;
  cor?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Briefcase
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-ivory-66)]"
        aria-hidden="true"
      />
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          {rotulo}
        </p>
        <p
          className="mt-1 text-[15px] text-ivory"
          style={cor ? { color: cor } : undefined}
        >
          {valor}
        </p>
      </div>
    </div>
  );
}
