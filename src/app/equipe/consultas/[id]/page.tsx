// Detalhe de uma Consulta Pré-Processual.
// Mostra score + recomendação no topo, blocos de execuções, restrições,
// bens, análise narrativa e metadados da consulta.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, User } from "lucide-react";
import {
  obterConsultaPre,
  type ConsultaPreProcessual,
  type ConsultaApi,
  type OutraExecucao,
  type Restricao,
  type BemAparente,
  type ScoreSolvencia,
  type RecomendacaoExecucao,
} from "@/lib/consultas-pre";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { formatBRL, formatData } from "@/lib/format";
import { BuscarMaisConsulta } from "./BuscarMaisConsulta";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

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
  const voltarHref = `/equipe/consultas${linkBase}`;

  if (!/^\d+$/.test(id)) {
    return <NaoEncontrado voltarHref={voltarHref} />;
  }
  const consultaId = Number.parseInt(id, 10);
  if (!Number.isFinite(consultaId)) {
    return <NaoEncontrado voltarHref={voltarHref} />;
  }

  const consulta = await obterConsultaPre(consultaId);
  if (!consulta) {
    return <NaoEncontrado voltarHref={voltarHref} />;
  }

  return (
    <main>
      {/* ============ HEADER ============ */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-[1400px] px-6 py-14 sm:px-10">
          <Link
            href={voltarHref}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:text-[var(--color-tip-glow)]"
          >
            ← Voltar à Lista
          </Link>

          <HeaderConsulta consulta={consulta} />

          {/* ============ ESTATÍSTICAS ============ */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <CardEstatistica
              valor={String(consulta.outrasExecucoes.length)}
              rotulo="Outras Execuções"
              color="var(--color-devedor)"
            />
            <CardEstatistica
              valor={String(consulta.restricoes.length)}
              rotulo="Restrições"
              color="var(--color-gold)"
            />
            <CardEstatistica
              valor={String(consulta.bensAparentes.length)}
              rotulo="Bens Aparentes"
              color="var(--color-signal)"
            />
          </div>
        </div>
      </section>

      {/* ============ BUSCAS REALIZADAS ============ */}
      {consulta.buscasRealizadas && consulta.buscasRealizadas.length > 0 ? (
        <section className="border-t border-[var(--color-ivory-12)]">
          <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
            <SectionTitle
              texto="Buscas Realizadas Nesta Consulta"
              eyebrow={`${consulta.buscasRealizadas.length} ${
                consulta.buscasRealizadas.length === 1 ? "fonte cruzada" : "fontes cruzadas"
              } · ${formatBRL(
                consulta.buscasRealizadas.reduce((s, b) => s + b.custoBrl, 0),
              )}`}
            />
            <div className="mt-6">
              <GridBuscas buscas={consulta.buscasRealizadas} />
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ OUTRAS EXECUÇÕES ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
          <SectionTitle
            texto="Outras Execuções"
            eyebrow={`${consulta.outrasExecucoes.length} processo(s) localizado(s)`}
            eyebrowColor="var(--color-devedor)"
          />
          <div className="mt-6">
            {consulta.outrasExecucoes.length === 0 ? (
              <p className="rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] px-5 py-4 text-sm italic text-[var(--color-ivory-66)]">
                Nenhuma execução em andamento contra este devedor.
              </p>
            ) : (
              <TabelaExecucoes execucoes={consulta.outrasExecucoes} />
            )}
          </div>
        </div>
      </section>

      {/* ============ RESTRIÇÕES ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
          <SectionTitle
            texto="Restrições"
            eyebrow={`${consulta.restricoes.length} restrição(ões) ativa(s)`}
            eyebrowColor="var(--color-gold)"
          />
          <div className="mt-6">
            {consulta.restricoes.length === 0 ? (
              <p className="rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] px-5 py-4 text-sm italic text-[var(--color-ivory-66)]">
                Nenhuma restrição cadastral em Serasa, SPC, Boa Vista ou
                tabelionatos de protesto.
              </p>
            ) : (
              <ListaRestricoes restricoes={consulta.restricoes} />
            )}
          </div>
        </div>
      </section>

      {/* ============ BENS APARENTES ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
          <SectionTitle
            texto="Bens Aparentes"
            eyebrow={`Patrimônio estimado ${formatBRL(consulta.patrimonioEstimadoBrl)}`}
            eyebrowColor="var(--color-signal)"
          />
          <div className="mt-6">
            {consulta.bensAparentes.length === 0 ? (
              <p className="rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] px-5 py-4 text-sm italic text-[var(--color-ivory-66)]">
                Nenhum bem localizado em nome do devedor.
              </p>
            ) : (
              <GridBens bens={consulta.bensAparentes} />
            )}
          </div>
        </div>
      </section>

      {/* ============ ANÁLISE & RECOMENDAÇÃO ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
          <SectionTitle
            texto="Análise & Recomendação"
            eyebrow="Conclusão da consulta"
          />
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.6)] p-7">
              <p className="text-base leading-relaxed text-[var(--color-ivory-88)]">
                {consulta.observacoes}
              </p>
            </div>
            <CardRecomendacao recomendacao={consulta.recomendacao} />
          </div>
        </div>
      </section>

      {/* ============ DETALHES DA CONSULTA ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
          <SectionTitle
            texto="Detalhes da Consulta"
            eyebrow="Metadados"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CampoDetalhe rotulo="Credor" valor={consulta.credorNome} />
            <CampoDetalhe
              rotulo="Advogado responsável"
              valor={consulta.advogadoEmail}
              valorClassName="text-[var(--color-advogado)]"
            />
            <CampoDetalhe
              rotulo="Data da consulta"
              valor={formatData(consulta.dataConsulta)}
            />
            <CampoDetalhe
              rotulo="Custo da consulta"
              valor={formatBRL(consulta.custoBrl)}
            />
            <CampoDetalhe
              rotulo="Valor da causa"
              valor={formatBRL(consulta.valorCausaBrl)}
            />
            {consulta.rendaEstimadaMensalBrl !== undefined ? (
              <CampoDetalhe
                rotulo="Renda mensal estimada"
                valor={formatBRL(consulta.rendaEstimadaMensalBrl)}
              />
            ) : null}
          </div>
        </div>
      </section>

      {/* ============ BUSCAR MAIS (enriquecer consulta) ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
          <SectionTitle
            texto="Buscar Mais"
            eyebrow="Enriquecer esta consulta com APIs adicionais"
          />
          <div className="mt-6">
            <BuscarMaisConsulta
              consultaId={consulta.id}
              devedorNome={consulta.devedor.nome}
              advogadoEmail={consulta.advogadoEmail}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

// ============================================================
// HeaderConsulta
// ============================================================

function HeaderConsulta({ consulta }: { consulta: ConsultaPreProcessual }) {
  const { devedor } = consulta;
  return (
    <header className="mt-10 flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-block h-px w-10 bg-[var(--color-signal)] opacity-70"
        />
        <span className="font-mono text-[14px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
          Consulta Pré-Processual
        </span>
        <span
          aria-hidden="true"
          className="inline-block h-px w-10 bg-[var(--color-signal)] opacity-70"
        />
      </div>

      <div className="mt-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--color-gold)]/35 bg-gradient-to-br from-[rgba(201,162,74,0.18)] to-[rgba(201,162,74,0.04)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        {devedor.tipo === "PJ" ? (
          <Building2 className="h-6 w-6 text-[var(--color-gold)]" />
        ) : (
          <User className="h-6 w-6 text-[var(--color-gold)]" />
        )}
      </div>

      <h1 className="nome-devedor mt-5 break-words font-serif text-[clamp(28px,4vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.06em] text-[var(--color-devedor)]">
        {devedor.nome}
      </h1>

      <p className="mt-3 font-mono text-[13px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
        {devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"} ·{" "}
        {devedor.documento}
      </p>
      {devedor.enderecoConsultado ? (
        <p className="mt-2 max-w-[640px] text-sm text-[var(--color-ivory-88)]">
          {devedor.enderecoConsultado}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <ChipScoreGrande score={consulta.score} />
        <ChipRecomendacaoGrande recomendacao={consulta.recomendacao} />
      </div>
    </header>
  );
}

// ============================================================
// Score & Recomendação
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

function metaRecomendacao(rec: RecomendacaoExecucao): {
  label: string;
  color: string;
  bg: string;
  texto: string;
} {
  switch (rec) {
    case "recomendado":
      return {
        label: "Recomendado",
        color: "var(--color-signal)",
        bg: "rgba(60,255,138,0.10)",
        texto:
          "O perfil patrimonial e cadastral indica alta probabilidade de satisfação do crédito. Recomenda-se ajuizamento imediato.",
      };
    case "avaliar":
      return {
        label: "Avaliar",
        color: "var(--color-gold)",
        bg: "rgba(201,162,74,0.10)",
        texto:
          "Existe patrimônio penhorável, mas há sinais de aperto financeiro. Avalie tentativa prévia de acordo antes de executar.",
      };
    case "nao_recomendado":
      return {
        label: "Não Recomendado",
        color: "var(--color-devedor)",
        bg: "rgba(220,80,80,0.10)",
        texto:
          "Devedor sem patrimônio aparente e com histórico de inadimplência. Risco elevado de prescrição intercorrente.",
      };
  }
}

function ChipScoreGrande({ score }: { score: ScoreSolvencia }) {
  const color = corDoScore(score);
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[13px] uppercase tracking-[0.28em]"
      style={{
        borderColor: color,
        color,
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
      />
      Score {labelDoScore(score)}
    </span>
  );
}

function ChipRecomendacaoGrande({
  recomendacao,
}: {
  recomendacao: RecomendacaoExecucao;
}) {
  const meta = metaRecomendacao(recomendacao);
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[13px] uppercase tracking-[0.28em]"
      style={{
        borderColor: meta.color,
        color: meta.color,
        backgroundColor: meta.bg,
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}

function CardRecomendacao({
  recomendacao,
}: {
  recomendacao: RecomendacaoExecucao;
}) {
  const meta = metaRecomendacao(recomendacao);
  return (
    <div
      className="rounded-2xl border p-7"
      style={{
        borderColor: meta.color,
        backgroundColor: meta.bg,
      }}
    >
      <span
        className="font-mono text-[11px] uppercase tracking-[0.32em]"
        style={{ color: meta.color }}
      >
        Recomendação
      </span>
      <p
        className="mt-3 font-serif text-3xl leading-tight"
        style={{ color: meta.color }}
      >
        {meta.label}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-[var(--color-ivory-88)]">
        {meta.texto}
      </p>
    </div>
  );
}

// ============================================================
// Cards & blocos
// ============================================================

function CardEstatistica({
  valor,
  rotulo,
  color,
}: {
  valor: string;
  rotulo: string;
  color: string;
}) {
  return (
    <SpotlightCard className="p-8 text-center">
      <p className="font-serif text-5xl leading-none" style={{ color }}>
        {valor}
      </p>
      <span className="mt-3 inline-block font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-ivory-66)]">
        {rotulo}
      </span>
    </SpotlightCard>
  );
}

function SectionTitle({
  texto,
  eyebrow,
  eyebrowColor = "var(--color-signal)",
}: {
  texto: string;
  eyebrow?: string;
  eyebrowColor?: string;
}) {
  return (
    <div>
      {eyebrow ? (
        <span
          className="font-mono text-[12px] uppercase tracking-[0.32em]"
          style={{ color: eyebrowColor }}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2 className="mt-2 font-serif text-3xl text-ivory">{texto}</h2>
    </div>
  );
}

// ----- Outras execuções (tabela) -----

function labelStatusExecucao(status: OutraExecucao["status"]): {
  label: string;
  color: string;
} {
  switch (status) {
    case "em_andamento":
      return { label: "Em andamento", color: "var(--color-signal)" };
    case "suspensa":
      return { label: "Suspensa", color: "var(--color-gold)" };
    case "arquivada":
      return { label: "Arquivada", color: "var(--color-ivory-66)" };
    case "satisfeita":
      return { label: "Satisfeita", color: "var(--color-gold)" };
  }
}

function TabelaExecucoes({ execucoes }: { execucoes: OutraExecucao[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-devedor)]/30 bg-[rgba(220,80,80,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-ivory-12)] bg-[rgba(220,80,80,0.08)]">
              <Th>Número do processo</Th>
              <Th>Vara</Th>
              <Th>Comarca</Th>
              <Th className="text-right">Valor</Th>
              <Th>Status</Th>
              <Th>Distribuição</Th>
            </tr>
          </thead>
          <tbody>
            {execucoes.map((e) => {
              const s = labelStatusExecucao(e.status);
              return (
                <tr
                  key={e.id}
                  className="border-b border-[var(--color-ivory-12)]/60 last:border-0"
                >
                  <Td>
                    <span className="font-mono text-[13px] text-ivory">
                      {e.numeroProcesso}
                    </span>
                  </Td>
                  <Td>{e.vara}</Td>
                  <Td>{e.comarca}</Td>
                  <Td className="text-right font-mono text-[var(--color-gold)]">
                    {formatBRL(e.valorBrl)}
                  </Td>
                  <Td>
                    <span
                      className="inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
                      style={{ borderColor: s.color, color: s.color }}
                    >
                      {s.label}
                    </span>
                  </Td>
                  <Td className="font-mono text-[12px] text-[var(--color-ivory-66)]">
                    {formatData(e.dataDistribuicao)}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)] ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-[var(--color-ivory-88)] ${className}`}>{children}</td>;
}

// ----- Restrições -----

function labelTipoRestricao(tipo: Restricao["tipo"]): string {
  switch (tipo) {
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

function ListaRestricoes({ restricoes }: { restricoes: Restricao[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {restricoes.map((r, idx) => (
        <div
          key={idx}
          className="flex items-start justify-between gap-4 rounded-xl border border-[var(--color-gold)]/30 bg-[rgba(201,162,74,0.05)] p-5"
        >
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-gold)]">
              {labelTipoRestricao(r.tipo)}
            </span>
            <p className="mt-3 text-base text-ivory">{r.orgao}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              Inclusão {formatData(r.dataInclusao)}
            </p>
          </div>
          {r.valorBrl !== undefined ? (
            <span className="whitespace-nowrap font-mono text-lg text-[var(--color-gold)]">
              {formatBRL(r.valorBrl)}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ----- Bens aparentes -----

function labelTipoBem(tipo: BemAparente["tipo"]): string {
  switch (tipo) {
    case "imovel":
      return "Imóvel";
    case "veiculo":
      return "Veículo";
    case "empresa":
      return "Participação Societária";
  }
}

function GridBens({ bens }: { bens: BemAparente[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {bens.map((b, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-[var(--color-signal)]/30 bg-[rgba(60,255,138,0.04)] p-5 transition hover:border-[var(--color-signal)]/60"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center rounded-full border border-[var(--color-signal)]/50 bg-[var(--color-signal)]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
                {labelTipoBem(b.tipo)}
              </span>
              <p className="mt-3 text-base text-ivory">{b.descricao}</p>
              {b.localizacao ? (
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                  {b.localizacao}
                </p>
              ) : null}
            </div>
            {b.valorEstimadoBrl !== undefined ? (
              <span className="whitespace-nowrap font-mono text-lg text-[var(--color-gold)]">
                {formatBRL(b.valorEstimadoBrl)}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

// ----- Buscas realizadas (APIs já cruzadas) -----

function labelStatusBusca(status: ConsultaApi["status"]): {
  label: string;
  color: string;
  bg: string;
} {
  switch (status) {
    case "ok":
      return {
        label: "OK",
        color: "var(--color-signal)",
        bg: "rgba(60,255,138,0.10)",
      };
    case "sem_dados":
      return {
        label: "Sem Dados",
        color: "var(--color-ivory-66)",
        bg: "rgba(255,255,255,0.04)",
      };
    case "falhou":
      return {
        label: "Falhou",
        color: "var(--color-devedor)",
        bg: "rgba(220,80,80,0.10)",
      };
  }
}

function GridBuscas({ buscas }: { buscas: ConsultaApi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {buscas.map((b, idx) => {
        const s = labelStatusBusca(b.status);
        return (
          <div
            key={idx}
            className="flex flex-col gap-3 rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.55)] p-5 transition hover:border-[var(--color-signal)]/40"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[12px] uppercase tracking-[0.22em]"
                style={{
                  borderColor: s.color,
                  color: s.color,
                  backgroundColor: s.bg,
                }}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </span>
              <span
                className="whitespace-nowrap font-mono text-xs"
                style={{
                  color:
                    b.custoBrl === 0
                      ? "var(--color-signal)"
                      : "var(--color-gold)",
                }}
              >
                {b.custoBrl === 0 ? "grátis" : formatBRL(b.custoBrl)}
              </span>
            </div>
            <p className="text-sm text-ivory">{b.rotulo}</p>
            <p className="mt-auto font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              {formatData(b.dataConsulta)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ----- Campo de detalhe (footer da consulta) -----

function CampoDetalhe({
  rotulo,
  valor,
  valorClassName,
}: {
  rotulo: string;
  valor: string;
  valorClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.5)] p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
        {rotulo}
      </p>
      <p className={`mt-2 text-base ${valorClassName ?? "text-ivory"}`}>
        {valor}
      </p>
    </div>
  );
}

// ----- Estado vazio -----

function NaoEncontrado({ voltarHref }: { voltarHref: string }) {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
      <div className="grid place-items-center">
        <SpotlightCard className="max-w-[520px] p-10 text-center">
          <span className="eyebrow !text-[var(--color-gold)]">Não encontrada</span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Consulta não localizada
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            O identificador informado não corresponde a nenhuma consulta
            pré-processual realizada.
          </p>
          <Link
            href={voltarHref}
            className="mt-6 inline-block rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            ← Voltar para consultas
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}
