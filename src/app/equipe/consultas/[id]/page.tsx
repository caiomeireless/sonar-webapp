// Detalhe de uma Consulta Pré-Processual — reforma 25/08 (ditado):
// MESMO layout da Ficha do Devedor (header com nome CAIXA ALTA vermelho,
// etiquetas, cards de número, setores em vidro claro com borda dourada),
// com a PESQUISA SERASA em destaque nas restrições. Fontes disponíveis
// hoje: Assertiva Localize, Assertiva Veículos, Serasa e as pesquisas
// MANUAIS de matrícula (RI Digital).
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Car,
  Scale,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import {
  obterConsultaPre,
  type ConsultaPreProcessual,
  type ScoreSolvencia,
  type RecomendacaoExecucao,
} from "@/lib/consultas-pre";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import { CardNumero } from "@/app/_shared/dossie/CardNumero";
import {
  SecaoFicha,
  CampoFicha,
  BORDA_CADERNO,
} from "@/app/_shared/dossie/SecaoFicha";
import { formatBRL, formatData } from "@/lib/format";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

const NEON = {
  verde: "#3CFF8A",
  laranja: "#FF9C41",
  ciano: "#38BDF8",
  violeta: "#C084FC",
  amarelo: "#FFD93D",
  rosa: "#FB7185",
};

function corDoScore(score: ScoreSolvencia): string {
  switch (score) {
    case "alta":
      return NEON.verde;
    case "media":
      return NEON.amarelo;
    case "baixa":
      return "#DC2626";
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

function labelRecomendacao(rec: RecomendacaoExecucao): string {
  switch (rec) {
    case "recomendado":
      return "Execução Recomendada";
    case "avaliar":
      return "Avaliar";
    case "nao_recomendado":
      return "Não Recomendado";
  }
}

function corRecomendacao(rec: RecomendacaoExecucao): string {
  switch (rec) {
    case "recomendado":
      return NEON.verde;
    case "avaliar":
      return NEON.amarelo;
    case "nao_recomendado":
      return "#DC2626";
  }
}

function TituloSetor({ texto }: { texto: string }) {
  return (
    <h2
      className="text-center font-serif text-[clamp(24px,2.5vw,38px)] uppercase leading-[1.1] tracking-[0.08em] text-[var(--color-gold)]"
      style={{
        WebkitTextStroke: "1px rgba(255,255,255,0.55)",
        textShadow: "0 0 18px rgba(201,162,74,0.4)",
      }}
    >
      {texto}
    </h2>
  );
}

function Etiqueta({ label, cor, dot = false }: { label: string; cor: string; dot?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[12px] uppercase tracking-[0.22em]"
      style={{
        borderColor: cor,
        color: cor,
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: cor, boxShadow: `0 0 8px ${cor}` }}
        />
      ) : null}
      {label}
    </span>
  );
}

export default async function DetalheConsultaPage({
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
  const voltarHref = `/equipe/consultas?demo=1${euDev ? `&eu=${encodeURIComponent(euDev)}` : ""}`;

  if (!/^\d+$/.test(id)) {
    return <NaoEncontrado voltarHref={voltarHref} />;
  }
  const consultaId = Number.parseInt(id, 10);
  const consulta = Number.isFinite(consultaId)
    ? await obterConsultaPre(consultaId)
    : null;
  if (!consulta) {
    return <NaoEncontrado voltarHref={voltarHref} />;
  }

  const { devedor } = consulta;
  const docLabel = devedor.tipo === "PF" ? "CPF" : "CNPJ";
  const corScore = corDoScore(consulta.score);
  const restricoesSerasa = consulta.restricoes;
  const totalRestricoesBrl = restricoesSerasa.reduce(
    (s, r) => s + (r.valorBrl ?? 0),
    0,
  );

  const bensPorTipo = {
    imovel: consulta.bensAparentes.filter((b) => b.tipo === "imovel"),
    veiculo: consulta.bensAparentes.filter((b) => b.tipo === "veiculo"),
    empresa: consulta.bensAparentes.filter((b) => b.tipo === "empresa"),
  };

  return (
    <main className="relative min-h-svh">
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BordaLiquidaMetal cor="laranja" radius={14} className="inline-flex">
            <Link
              href={voltarHref}
              className="inline-flex h-full w-full items-center gap-2.5 rounded-[11px] bg-[rgba(255,156,65,0.10)] px-5 py-3 text-sm font-medium text-[#FF9C41] transition hover:bg-[rgba(255,156,65,0.18)]"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              Voltar à Lista
            </Link>
          </BordaLiquidaMetal>
          {/* Hoje todas as consultas são de demonstração (dados fictícios). */}
          <div
            className="flex min-w-0 flex-1 items-center justify-center gap-3 rounded-2xl border px-5 py-3.5"
            style={{
              borderColor: "rgba(255,217,61,0.55)",
              backgroundColor: "rgba(255,217,61,0.10)",
            }}
          >
            <TriangleAlert
              className="h-5 w-5 shrink-0"
              style={{ color: NEON.amarelo }}
              aria-hidden="true"
            />
            <p
              className="font-mono text-[13px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: NEON.amarelo }}
            >
              Demonstração — Dados Fictícios
            </p>
          </div>
        </div>

        {/* ============ HEADER (padrão Ficha do Devedor) ============ */}
        <header className="mt-10 text-center">
          <div className="inline-flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block h-px w-10 bg-[var(--color-signal)] opacity-60 sm:w-14"
            />
            <span className="font-mono font-medium uppercase tracking-[0.34em] text-[14px] text-[var(--color-signal)]">
              Avaliação Pré-Processual
            </span>
            <span
              aria-hidden="true"
              className="inline-block h-px w-10 bg-[var(--color-signal)] opacity-60 sm:w-14"
            />
          </div>
          <h1
            className="nome-devedor mt-4 break-words font-serif text-[clamp(28px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.06em] text-[var(--color-devedor)]"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.6)" }}
          >
            {devedor.nome}
          </h1>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Etiqueta
              label={devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
              cor="var(--color-gold)"
            />
            <Etiqueta
              label={`Aparece em ${consulta.outrasExecucoes.length} ${
                consulta.outrasExecucoes.length === 1 ? "Execução" : "Execuções"
              }`}
              cor="var(--color-ivory-88)"
            />
            <Etiqueta label={labelDoScore(consulta.score)} cor={corScore} dot />
            <Etiqueta
              label={labelRecomendacao(consulta.recomendacao)}
              cor={corRecomendacao(consulta.recomendacao)}
              dot
            />
          </div>
        </header>

        {/* ============ CARDS DE NÚMERO ============ */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CardNumero
            rotulo="Patrimônio Estimado"
            valor={formatBRL(consulta.patrimonioEstimadoBrl)}
          />
          <CardNumero
            rotulo="Valor da Causa"
            valor={formatBRL(consulta.valorCausaBrl)}
          />
          <CardNumero
            rotulo="Bens Aparentes"
            valor={String(consulta.bensAparentes.length)}
          />
          <CardNumero
            rotulo="Restrições Serasa"
            valor={String(restricoesSerasa.length)}
          />
        </div>

        {/* ============ CENTRAL DE PESQUISAS ============ */}
        <SpotlightCard
          local
          claro
          degrade="linear-gradient(0deg, rgba(10,48,28,0.7), rgba(10,48,28,0.7))"
          className="mt-8 p-6 sm:p-7"
        >
          <div className="relative pl-4">
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-6 w-1 rounded-full bg-[var(--color-signal)]"
            />
            <h3 className="font-mono text-[13px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
              Central de Pesquisas
            </h3>
          </div>
          <div className="mt-5 flex flex-col gap-3 lg:flex-row">
            {[
              { rotulo: "Enriquecer Dados", sub: "Assertiva Localize", cor: NEON.violeta, tinta: "violeta" as const },
              { rotulo: "Buscar Veículos", sub: "Assertiva Veículos", cor: NEON.laranja, tinta: "laranja" as const },
              { rotulo: "Pesquisa Serasa", sub: "Restrições · Negativações", cor: NEON.rosa, tinta: "prata" as const },
              { rotulo: "Matrículas (Manual)", sub: "RI Digital · Sem API", cor: NEON.ciano, tinta: "gold" as const },
            ].map((b) => (
              <BordaLiquidaMetal
                key={b.rotulo}
                cor={b.tinta}
                radius={14}
                className="flex flex-1"
              >
                <span
                  className="flex h-full w-full cursor-default flex-col justify-center gap-0.5 rounded-[11px] px-5 py-4"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${b.cor} 10%, transparent)`,
                  }}
                >
                  <span className="text-sm font-semibold" style={{ color: b.cor }}>
                    {b.rotulo}
                  </span>
                  <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
                    {b.sub}
                  </span>
                </span>
              </BordaLiquidaMetal>
            ))}
          </div>
        </SpotlightCard>

        {/* ============ SETOR: DADOS PARA LOCALIZAÇÃO ============ */}
        <div className="mt-12">
          <TituloSetor texto="Dados para Localização" />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <SecaoFicha titulo="Identificação">
              <CampoFicha rotulo={docLabel} valor={devedor.documento} origem="MANUAL" />
              <CampoFicha
                rotulo="Endereço Consultado"
                valor={devedor.enderecoConsultado ?? null}
                origem="VIA ASSERTIVA"
              />
              <CampoFicha
                rotulo="Telefone"
                valor={devedor.telefone ?? null}
                origem="VIA ASSERTIVA"
              />
            </SecaoFicha>
            <SecaoFicha titulo="Perfil Financeiro">
              <CampoFicha
                rotulo="Renda Estimada Mensal"
                valor={
                  consulta.rendaEstimadaMensalBrl
                    ? formatBRL(consulta.rendaEstimadaMensalBrl)
                    : null
                }
                origem="VIA ASSERTIVA"
              />
              <CampoFicha
                rotulo="Patrimônio Estimado"
                valor={formatBRL(consulta.patrimonioEstimadoBrl)}
                origem="VIA ASSERTIVA"
              />
              <CampoFicha
                rotulo="Cliente Solicitante"
                valor={consulta.credorNome}
                origem="MANUAL"
              />
            </SecaoFicha>
          </div>
        </div>

        {/* ============ SETOR: DADOS PROCESSUAIS ============ */}
        <div className="mt-12">
          <TituloSetor texto="Dados Processuais" />

          {/* Outras execuções em que o devedor aparece */}
          <SpotlightCard
            local
            claro
            borda={BORDA_CADERNO}
            className="mt-6 p-6 sm:p-8"
          >
            <h3 className="flex items-center gap-2.5 font-mono text-[15px] font-semibold uppercase tracking-[0.28em] text-[var(--color-gold)]">
              <Scale className="h-4.5 w-4.5" aria-hidden="true" />
              Outras Execuções · {consulta.outrasExecucoes.length}
            </h3>
            {consulta.outrasExecucoes.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--color-ivory-66)]">
                Nenhuma outra execução localizada contra o devedor — sinal
                positivo de solvência.
              </p>
            ) : (
              <div className="sem-scrollbar mt-5 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {consulta.outrasExecucoes.map((e) => (
                  <div
                    key={e.id}
                    className="grid items-center gap-x-6 gap-y-2 rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.75)] px-5 py-4 sm:grid-cols-[minmax(0,1fr)_160px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[15px] text-ivory">
                        {e.numeroProcesso}
                      </p>
                      <p className="mt-1 truncate font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--color-ivory-66)]">
                        {e.vara} · {e.comarca} · distribuído{" "}
                        {formatData(e.dataDistribuicao)} ·{" "}
                        <span className="uppercase">{e.status.replace("_", " ")}</span>
                      </p>
                    </div>
                    <p className="font-mono text-[16px] tabular-nums text-ivory sm:text-right">
                      {formatBRL(e.valorBrl)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SpotlightCard>

          {/* PESQUISA SERASA — restrições e negativações */}
          <SpotlightCard
            local
            claro
            borda="rgba(251, 113, 133, 0.35)"
            className="mt-5 p-6 sm:p-8"
          >
            <h3
              className="flex items-center gap-2.5 font-mono text-[15px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: NEON.rosa }}
            >
              <ShieldAlert className="h-4.5 w-4.5" aria-hidden="true" />
              Pesquisa Serasa · {restricoesSerasa.length}{" "}
              {restricoesSerasa.length === 1 ? "Restrição" : "Restrições"}
              {totalRestricoesBrl > 0 ? ` · ${formatBRL(totalRestricoesBrl)}` : ""}
            </h3>
            {restricoesSerasa.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--color-ivory-66)]">
                Nada consta — sem protestos, negativações ou pendências de
                CNPJ nos birôs consultados.
              </p>
            ) : (
              <div className="sem-scrollbar mt-5 max-h-[300px] space-y-2.5 overflow-y-auto pr-1">
                {restricoesSerasa.map((r, i) => (
                  <div
                    key={`${r.orgao}-${i}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-xl border border-[rgba(251,113,133,0.2)] bg-[rgba(10,12,11,0.75)] px-5 py-3.5"
                  >
                    <p className="min-w-0 text-[15px] text-ivory">
                      <span className="font-mono text-[12px] uppercase tracking-[0.12em]" style={{ color: NEON.rosa }}>
                        {r.tipo.replace("_", " ")}
                      </span>{" "}
                      · {r.orgao}
                      <span className="text-[var(--color-ivory-66)]">
                        {" "}
                        · incluída {formatData(r.dataInclusao)}
                      </span>
                    </p>
                    {r.valorBrl ? (
                      <p className="font-mono text-[15px] tabular-nums text-ivory">
                        {formatBRL(r.valorBrl)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </SpotlightCard>
        </div>

        {/* ============ SETOR: BENS APARENTES ============ */}
        <div className="mt-12">
          <TituloSetor texto="Bens Aparentes" />
          <div className="mt-6 space-y-5">
            {(
              [
                { tipo: "veiculo" as const, Icone: Car, cor: NEON.laranja, titulo: "Veículos" },
                { tipo: "imovel" as const, Icone: Building2, cor: NEON.ciano, titulo: "Imóveis" },
                { tipo: "empresa" as const, Icone: Briefcase, cor: NEON.violeta, titulo: "Participações Societárias" },
              ]
            ).map(({ tipo, Icone, cor, titulo }) => {
              const bens = bensPorTipo[tipo];
              return (
                <SpotlightCard
                  key={tipo}
                  local
                  claro
                  borda={BORDA_CADERNO}
                  className="p-6 sm:p-8"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl border"
                      style={{
                        color: cor,
                        borderColor: `color-mix(in srgb, ${cor} 45%, transparent)`,
                        backgroundColor: `color-mix(in srgb, ${cor} 10%, transparent)`,
                      }}
                    >
                      <Icone className="h-6 w-6" />
                    </div>
                    <div>
                      <h3
                        className="font-serif text-2xl uppercase tracking-[0.08em]"
                        style={{ color: cor }}
                      >
                        {titulo}
                      </h3>
                      <p className="font-mono text-[13px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                        {bens.length > 0
                          ? `${bens.length} ${bens.length === 1 ? "item aparente" : "itens aparentes"}`
                          : "Sem registros até agora"}
                      </p>
                    </div>
                  </div>
                  {bens.length > 0 ? (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {bens.map((b, i) => (
                        <div
                          key={`${b.descricao}-${i}`}
                          className="rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.75)] p-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-lg font-medium leading-snug text-ivory">
                              {b.descricao}
                            </p>
                            {b.valorEstimadoBrl ? (
                              <p
                                className="shrink-0 font-mono text-lg tabular-nums"
                                style={{ color: NEON.verde }}
                              >
                                {formatBRL(b.valorEstimadoBrl)}
                              </p>
                            ) : null}
                          </div>
                          {b.localizacao ? (
                            <p className="mt-1.5 text-sm text-[var(--color-ivory-66)]">
                              {b.localizacao}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </SpotlightCard>
              );
            })}
          </div>
        </div>

        {/* ============ PARECER + FONTES ============ */}
        <div className="mt-12">
          <TituloSetor texto="Parecer da Avaliação" />
          <SpotlightCard
            local
            claro
            borda={BORDA_CADERNO}
            className="mt-6 p-6 sm:p-8"
          >
            <p className="max-w-[900px] text-[15px] leading-relaxed text-[var(--color-ivory-88)]">
              {consulta.observacoes}
            </p>
            <div className="mt-6 border-t border-[rgba(201,162,74,0.16)] pt-5">
              <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                Fontes Cruzadas · {formatBRL(consulta.custoBrl)} ·{" "}
                {formatData(consulta.dataConsulta)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(consulta.buscasRealizadas ?? []).map((b) => (
                  <span
                    key={b.api}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-ivory-22)] px-3 py-1.5 font-mono text-[12px] text-[var(--color-ivory-88)]"
                  >
                    {b.rotulo}
                    <span className="text-[var(--color-ivory-66)]">
                      {b.custoBrl > 0 ? formatBRL(b.custoBrl) : "Grátis"}
                    </span>
                  </span>
                ))}
              </div>
              <p className="mt-3 font-mono text-[12px] text-[var(--color-advogado)]">
                {consulta.advogadoEmail}
              </p>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </main>
  );
}

function NaoEncontrado({ voltarHref }: { voltarHref: string }) {
  return (
    <main className="relative min-h-svh">
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
        <SpotlightCard
          local
          claro
          borda={BORDA_CADERNO}
          className="mx-auto max-w-[520px] p-10 text-center"
        >
          <h3 className="font-serif text-2xl text-ivory">
            Consulta não encontrada
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            A consulta solicitada não existe ou foi removida.
          </p>
          <Link href={voltarHref} className="btn-neon-gold mt-6">
            ← Voltar à Lista
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}
