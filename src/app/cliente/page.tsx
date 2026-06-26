// Dashboard do cliente — visao agregada da carteira dele (todos os
// processos onde ele eh credor). Espelha o painel da equipe filtrado
// pelos credor_id(s) que tem email_contato = email do cliente logado.
//
// Reusa os mesmos componentes do /equipe (KPI*, MixBensPorTipo,
// CustosPorAPIDonut, AtividadeEquipe7Dias, Top5DevedoresRastreio,
// EvolucaoPatrimonioMensal, FeedMedidasRecentes, MapaDistribuicaoBens).
// Esconde: Top5ClientesPorPatrimonio (so ele mesmo), CarteiraPorAdvogado
// (info interna do escritorio).

import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, ArrowRight, Activity, Coins, Layers, Clock } from "lucide-react";

import { obterDadosDashboardCliente } from "@/lib/dashboard-cliente";
import { listarCasosDoCliente } from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { previewEuFromParam } from "@/lib/dev-auth";
import { formatBRL, formatStatus, formatTempoRelativo } from "@/lib/format";

import KPIPatrimonioTotal from "@/app/equipe/_components/KPIPatrimonioTotal";
import KPIPenhorasEfetivadasMes from "@/app/equipe/_components/KPIPenhorasEfetivadasMes";
import KPICasosAtivos from "@/app/equipe/_components/KPICasosAtivos";
import KPIGastoAPIs from "@/app/equipe/_components/KPIGastoAPIs";
import EvolucaoPatrimonioMensal from "@/app/equipe/_components/EvolucaoPatrimonioMensal";
import MixBensPorTipo from "@/app/equipe/_components/MixBensPorTipo";
import AtividadePorProcesso7Dias from "@/app/equipe/_components/AtividadePorProcesso7Dias";
import CustosPorAPIDonut from "@/app/equipe/_components/CustosPorAPIDonut";
import Top5DevedoresRastreio from "@/app/equipe/_components/Top5DevedoresRastreio";
import FeedMedidasRecentes from "@/app/equipe/_components/FeedMedidasRecentes";
import MapaDistribuicaoBens from "@/app/equipe/devedores/[id]/dashboard/_components/MapaDistribuicaoBens";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function DashboardClientePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  const eu = previewEuFromParam(params.eu, perfil) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  // Carrega tudo em paralelo: dashboard agregado + lista de casos
  // (a lista alimenta os cards do rodape).
  const [dados, casos] = await Promise.all([
    obterDadosDashboardCliente(eu),
    listarCasosDoCliente(eu),
  ]);

  const qsBase = params.eu
    ? `?eu=${encodeURIComponent(Array.isArray(params.eu) ? params.eu[0]! : params.eu)}`
    : "";

  // Penhoras do mes anterior — penultimo bucket da serie (mesma logica do /equipe)
  const evol = dados.evolucaoMensal;
  const penhorasMesAnterior =
    evol.length >= 2 ? evol[evol.length - 2].penhorasEfetivadas : 0;

  if (dados.ehVazio) {
    return (
      <main className="mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
        <header className="title-shield mb-6 text-center">
          <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
            Vis&atilde;o Geral dos Seus Processos
          </h1>
        </header>
        <div className="glass mx-auto max-w-[640px] p-10 text-center">
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Nenhum processo em rastreamento
          </p>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            Seus processos aparecer&atilde;o aqui assim que o escrit&oacute;rio
            vincular um caso ao seu e-mail.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="py-10">
      {/* Cabecalho centralizado */}
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <header className="title-shield mb-6 flex flex-col items-center text-center">
          <div
            className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-gold)]/45 bg-[var(--color-gold)]/10"
            style={{
              boxShadow:
                "0 0 20px rgba(201,162,74,0.30), inset 0 0 12px rgba(201,162,74,0.10)",
            }}
          >
            <Eye
              className="h-7 w-7 text-[var(--color-gold)]"
              style={{
                filter: "drop-shadow(0 0 8px rgba(201,162,74,0.7))",
              }}
              aria-hidden="true"
            />
          </div>
          <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
            Vis&atilde;o Geral dos Seus Processos
          </h1>
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
            Painel do Cliente
          </p>
          <p className="mx-auto mt-3 max-w-[680px] text-base text-[var(--color-signal)]">
            Acompanhamento patrimonial dos devedores nos processos em que voc&ecirc; &eacute;
            credor.
          </p>
        </header>
      </div>

      {/* Grid principal centralizado */}
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-6 sm:px-10 md:grid-cols-12">
        {/* L1 — KPIs (3 + 3 + 3 + 3): patrimonio, penhoras mes, casos, gasto APIs */}
        <div className="md:col-span-3">
          <KPIPatrimonioTotal
            valorBrl={dados.kpisGerais.patrimonioLocalizadoTotalBrl}
          />
        </div>
        <div className="md:col-span-3">
          <KPIPenhorasEfetivadasMes
            mesAtual={dados.kpisGerais.penhorasEfetivadasMes}
            mesAnterior={penhorasMesAnterior}
          />
        </div>
        <div className="md:col-span-3">
          <KPICasosAtivos
            ativos={dados.kpisGerais.casosBreakdown.ativos}
            pausados={dados.kpisGerais.casosBreakdown.pausados}
            encerrados={dados.kpisGerais.casosBreakdown.encerrados}
          />
        </div>
        <div className="md:col-span-3">
          <KPIGastoAPIs
            gastoMes={dados.kpisGerais.gastoApisMes}
            limite={dados.kpisGerais.gastoApisLimite}
          />
        </div>

        {/* L2 — Evolucao mensal (full width) */}
        <div className="md:col-span-12">
          <EvolucaoPatrimonioMensal dados={dados.evolucaoMensal} />
        </div>

        {/* L3 — Mix (6) + Custos (6); Atividade (12) full */}
        <div className="md:col-span-6">
          <MixBensPorTipo dados={dados.mixBensPorTipo} />
        </div>
        <div className="md:col-span-6">
          <CustosPorAPIDonut dados={dados.custosPorAPI} />
        </div>
        <div className="md:col-span-12">
          <AtividadePorProcesso7Dias dados={dados.atividadePorProcesso7Dias} />
        </div>

        {/* L4 — Top 5 devedores (full) */}
        <div className="md:col-span-12">
          <Top5DevedoresRastreio dados={dados.top5DevedoresRastreio} />
        </div>

        {/* L5 — Mapa do Brasil (full) */}
        <div className="md:col-span-12">
          <MapaDistribuicaoBens
            distribuicao={dados.bensPorLocalizacao}
            titulo="Onde Est&atilde;o Seus Bens Rastreados"
            descricao="Distribui&ccedil;&atilde;o geogr&aacute;fica dos bens identificados nos seus processos."
          />
        </div>

        {/* L6 — Feed de medidas recentes (full) */}
        <div className="md:col-span-12">
          <FeedMedidasRecentes dados={dados.feedMedidasRecentes} />
        </div>
      </div>

      {/* Lista resumida dos casos — abaixo do grid de KPIs */}
      <section className="mx-auto mt-12 max-w-[1400px] px-6 sm:px-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-serif text-2xl text-ivory">
            Processos em rastreamento
          </h2>
          <Link
            href={`/cliente/casos${qsBase}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-signal)] hover:underline"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {casos.length === 0 ? (
          <div className="glass p-8 text-center text-sm text-[var(--color-ivory-66)]">
            Nenhum processo em rastreamento.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {casos.slice(0, 6).map((c) => {
              const status = formatStatus(c.status);
              const valor = c.valor_estimado_total_brl ?? 0;
              const semBens = c.total_bens === 0;
              return (
              <Link
                key={c.caso_id}
                href={`/cliente/casos/${c.caso_id}${qsBase}`}
                className="glass-2 group relative block overflow-hidden p-6 transition hover:border-[var(--color-signal-soft-2)] hover:shadow-[0_0_24px_-8px_rgba(60,255,138,0.45)]"
              >
                {/* Faixa lateral dourada — sinaliza acesso ao dossie */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[var(--color-gold)]/60 via-[var(--color-gold)]/20 to-transparent"
                />

                {/* === Header: Pasta + Status + Processo === */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-gold)]">
                    Pasta #{c.caso_id}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em]"
                    style={{
                      color: status.color,
                      borderColor: `color-mix(in srgb, ${status.color} 45%, transparent)`,
                      backgroundColor: `color-mix(in srgb, ${status.color} 12%, transparent)`,
                    }}
                  >
                    <Activity className="h-2.5 w-2.5" aria-hidden="true" />
                    {status.label}
                  </span>
                  <p className="ml-auto break-all font-mono text-[11px] text-[var(--color-ivory-66)]">
                    {c.numero_processo ?? "Sem número"}
                  </p>
                </div>

                {/* === Nome devedor === */}
                <h3 className="nome-devedor mt-4 font-serif text-xl leading-tight text-[var(--color-devedor)]">
                  {c.devedor.nome}
                </h3>

                <div className="my-4 h-px bg-[var(--color-ivory-12)]" />

                {/* === Metricas em grid === */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                      <Layers className="h-3 w-3" aria-hidden="true" />
                      Bens
                    </span>
                    <span className="font-serif text-2xl leading-none tabular-nums text-[var(--color-gold)]">
                      {c.total_bens}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                      <Coins className="h-3 w-3" aria-hidden="true" />
                      Estimado
                    </span>
                    <span
                      className={
                        "font-mono text-[15px] leading-none tabular-nums " +
                        (semBens ? "text-[var(--color-ivory-40)] italic" : "text-[var(--color-gold)]")
                      }
                    >
                      {semBens ? "aguardando" : formatBRL(valor)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Atualizado
                    </span>
                    <span className="font-mono text-[13px] leading-none text-[var(--color-ivory-88)]">
                      {formatTempoRelativo(c.ultima_consulta_em)}
                    </span>
                  </div>
                </div>

                {/* === Footer hint === */}
                <div className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)] opacity-0 transition-opacity group-hover:opacity-100">
                  Abrir dossê
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
