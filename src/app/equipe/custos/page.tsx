// Monitor de Custos — visão gerencial do escritório (estilo BP CRM).
//
// Painel completo: 4 KPIs no topo, gráfico de linha de 30 dias, dois
// rankings (cliente / advogado), tabela de APIs e tabela das últimas
// consultas pagas. Fonte: obterDashboardCustos() (mock determinístico
// hoje; vai virar leitura real da tabela `custos` quando as APIs pagas
// começarem a registrar consultas no dia-a-dia).
//
// Server Component: redirect quem não é da equipe. Único pedaço client
// é o gráfico Recharts (./_components/GraficoGastosPorDia).

import { redirect } from "next/navigation";
import {
  Building2,
  Clock,
  DollarSign,
  Scale,
  Search,
  TrendingUp,
  User2,
  Users,
} from "lucide-react";

import { obterDashboardCustos } from "@/lib/dashboard-custos";
import { perfilLogado } from "@/lib/perfis-server";
import { ehEquipe } from "@/lib/perfis";
import { formatBRL } from "@/lib/format";

import GraficoGastosPorDia from "./_components/GraficoGastosPorDia";

export const dynamic = "force-dynamic";

// Limites da barra de uso do limite mensal (mesma regra do KPIGastoAPIs
// do Painel da Plataforma — verde abaixo de 70%, gold entre 70-90%,
// vermelho a partir de 90%).
const FAIXA_AVISO = 0.7;
const FAIXA_ALERTA = 0.9;

function corDaFaixa(razao: number): string {
  if (razao >= FAIXA_ALERTA) return "#ff5b5b";
  if (razao >= FAIXA_AVISO) return "var(--color-gold)";
  return "var(--color-signal)";
}

function formatHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

export default async function CustosPage() {
  const perfil = await perfilLogado();
  if (!ehEquipe(perfil)) redirect("/login");

  const dados = await obterDashboardCustos();

  const razaoLimite =
    dados.limiteMesBrl > 0 ? dados.totalMesBrl / dados.limiteMesBrl : 0;
  const larguraPct = Math.min(100, Math.max(0, razaoLimite * 100));
  const corBarra = corDaFaixa(razaoLimite);
  const pctLabel = `${Math.round(razaoLimite * 100)}%`;

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
      {/* Cabeçalho centralizado — padrão title-shield do portal */}
      <header className="title-shield mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <DollarSign className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Gastos com APIs
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Monitor de Custos
        </p>
      </header>

      {/* ============================================================
          A) KPIs no topo (4 cards)
          ============================================================ */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {/* KPI 1 — Total do mês + barra de progresso vs limite */}
        <div className="glass flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
              Total do Mês
            </span>
            <DollarSign className="h-4 w-4 text-[var(--color-signal)]" />
          </div>
          <div
            className="font-serif text-3xl font-medium leading-none tabular-nums tracking-tight"
            style={{ color: "var(--color-signal)" }}
          >
            {formatBRL(dados.totalMesBrl)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--color-fg-muted)]">
            <span>
              de{" "}
              <span className="text-[var(--color-fg)]">
                {formatBRL(dados.limiteMesBrl)}
              </span>
            </span>
            <span className="font-medium" style={{ color: corBarra }}>
              {pctLabel}
            </span>
          </div>
          {/* eslint-disable-next-line jsx-a11y/aria-proptypes */}
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-ivory-12)]"
            role="progressbar"
            aria-label="Uso do limite mensal de APIs"
            aria-valuenow={Math.round(razaoLimite * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${larguraPct}%`,
                background: corBarra,
                boxShadow: `0 0 8px ${corBarra}`,
              }}
            />
          </div>
        </div>

        {/* KPI 2 — Total de Consultas (30 dias) */}
        <div className="glass flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
              Total Consultas
            </span>
            <Search className="h-4 w-4 text-[var(--color-gold)]" />
          </div>
          <div
            className="font-serif text-3xl font-medium leading-none tabular-nums tracking-tight"
            style={{ color: "var(--color-gold)" }}
          >
            {new Intl.NumberFormat("pt-BR").format(dados.totalConsultas)}
          </div>
          <p className="text-[11px] text-[var(--color-fg-muted)]">
            em 30 dias
          </p>
        </div>

        {/* KPI 3 — Advogados Ativos */}
        <div className="glass flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
              Advogados Ativos
            </span>
            <Users className="h-4 w-4 text-[var(--color-signal)]" />
          </div>
          <div
            className="font-serif text-3xl font-medium leading-none tabular-nums tracking-tight"
            style={{ color: "var(--color-signal)" }}
          >
            {dados.totalAdvogados}
          </div>
          <p className="text-[11px] text-[var(--color-fg-muted)]">
            consultando no período
          </p>
        </div>

        {/* KPI 4 — API mais usada */}
        <div className="glass flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
              API Mais Usada
            </span>
            <TrendingUp className="h-4 w-4 text-[var(--color-gold)]" />
          </div>
          <div
            className="font-serif text-2xl font-medium leading-tight tracking-tight"
            style={{ color: "var(--color-gold)" }}
          >
            {dados.apiMaisUsada}
          </div>
          <p className="text-[11px] text-[var(--color-fg-muted)]">
            por número de consultas
          </p>
        </div>
      </section>

      {/* ============================================================
          C) Gráfico de Gastos por Dia (últimos 30 dias) — full width
          ============================================================ */}
      <section className="glass mb-6 p-6">
        <header className="mb-4">
          <h2 className="font-serif text-xl font-medium uppercase tracking-[0.04em] text-[var(--color-gold)]">
            Gastos por Dia
          </h2>
          <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.20em] text-[var(--color-fg-muted)]">
            Evolução diária — últimos 30 dias
          </p>
        </header>
        <GraficoGastosPorDia dados={dados.gastosPorDia} />
      </section>

      {/* ============================================================
          D) Rankings por Cliente e por Advogado (2 colunas)
          ============================================================ */}
      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* D1 — Ranking por Cliente */}
        <div className="glass p-6">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-medium uppercase tracking-[0.04em] text-[var(--color-gold)]">
                Ranking por Cliente
              </h2>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.20em] text-[var(--color-fg-muted)]">
                Quem está consumindo mais consultas
              </p>
            </div>
            <Building2 className="h-5 w-5 text-[var(--color-cliente)]" />
          </header>
          {dados.porCliente.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-fg-muted)]">
              Sem consultas registradas no período.
            </p>
          ) : (
            <ol className="flex flex-col divide-y divide-[var(--color-line)]">
              {dados.porCliente.map((item, idx) => (
                <li
                  key={String(item.id)}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[12px] tabular-nums text-[var(--color-fg-faint)] w-5 shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="nome-cliente truncate font-serif text-base text-[var(--color-cliente)]">
                      {item.nome}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-3">
                    <span className="font-mono text-[11px] text-[var(--color-fg-muted)]">
                      {item.consultas} consultas
                    </span>
                    <span className="font-serif text-base tabular-nums text-[var(--color-gold)]">
                      {formatBRL(item.totalBrl)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* D2 — Ranking por Advogado */}
        <div className="glass p-6">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-medium uppercase tracking-[0.04em] text-[var(--color-gold)]">
                Ranking por Advogado
              </h2>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.20em] text-[var(--color-fg-muted)]">
                Quem está disparando mais consultas
              </p>
            </div>
            <Users className="h-5 w-5 text-[var(--color-advogado)]" />
          </header>
          {dados.porAdvogado.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-fg-muted)]">
              Sem consultas registradas no período.
            </p>
          ) : (
            <ol className="flex flex-col divide-y divide-[var(--color-line)]">
              {dados.porAdvogado.map((item, idx) => (
                <li
                  key={String(item.id)}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[12px] tabular-nums text-[var(--color-fg-faint)] w-5 shrink-0">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate text-base font-medium text-[var(--color-advogado)]">
                      {item.nome}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-3">
                    <span className="font-mono text-[11px] text-[var(--color-fg-muted)]">
                      {item.consultas} consultas
                    </span>
                    <span className="font-serif text-base tabular-nums text-[var(--color-gold)]">
                      {formatBRL(item.totalBrl)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ============================================================
          E) Ranking por API — full width
          ============================================================ */}
      <section className="glass mb-6 p-6">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-medium uppercase tracking-[0.04em] text-[var(--color-gold)]">
              Ranking por API
            </h2>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.20em] text-[var(--color-fg-muted)]">
              Onde o orçamento está sendo gasto
            </p>
          </div>
          <TrendingUp className="h-5 w-5 text-[var(--color-signal)]" />
        </header>

        {dados.porAPI.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--color-fg-muted)]">
            Sem consultas registradas no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left font-mono text-[11px] uppercase tracking-[0.20em] text-[var(--color-fg-muted)]">
                  <th className="py-3 pr-4">API</th>
                  <th className="py-3 pr-4 text-right">Consultas</th>
                  <th className="py-3 pr-4 text-right">Total</th>
                  <th className="py-3 text-right">% do total</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const totalGeral = dados.porAPI.reduce(
                    (s, a) => s + a.totalBrl,
                    0,
                  );
                  return dados.porAPI.map((api, idx) => {
                    const pct =
                      totalGeral > 0 ? (api.totalBrl / totalGeral) * 100 : 0;
                    return (
                      <tr
                        key={String(api.id)}
                        className={[
                          "border-b border-[var(--color-line)] transition-colors hover:bg-[var(--color-surface-2)]",
                          idx % 2 === 1 ? "bg-[var(--color-surface-1)]" : "",
                        ].join(" ")}
                      >
                        <td className="py-3 pr-4 font-mono text-sm uppercase tracking-[0.06em] text-[var(--color-fg)]">
                          {api.nome}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono tabular-nums text-[var(--color-fg-muted)]">
                          {api.consultas}
                        </td>
                        <td className="py-3 pr-4 text-right font-serif tabular-nums text-[var(--color-gold)]">
                          {formatBRL(api.totalBrl)}
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div
                              className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--color-ivory-12)]"
                              aria-hidden
                            >
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, pct)}%`,
                                  background: "var(--color-signal)",
                                }}
                              />
                            </div>
                            <span className="w-12 text-right font-mono text-[11px] tabular-nums text-[var(--color-fg-muted)]">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ============================================================
          F) Últimas Consultas — full width
          ============================================================ */}
      <section className="glass p-6">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-medium uppercase tracking-[0.04em] text-[var(--color-gold)]">
              Últimas Consultas
            </h2>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.20em] text-[var(--color-fg-muted)]">
              Histórico recente — 50 consultas mais novas
            </p>
          </div>
          <Clock className="h-5 w-5 text-[var(--color-fg-muted)]" />
        </header>

        {dados.consultas.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--color-fg-muted)]">
            Nenhuma consulta paga registrada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left font-mono text-[11px] uppercase tracking-[0.20em] text-[var(--color-fg-muted)]">
                  <th className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Data
                    </span>
                  </th>
                  <th className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <Scale className="h-3.5 w-3.5" />
                      Advogado
                    </span>
                  </th>
                  <th className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5" />
                      Cliente
                    </span>
                  </th>
                  <th className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <User2 className="h-3.5 w-3.5" />
                      Devedor
                    </span>
                  </th>
                  <th className="py-3 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <Search className="h-3.5 w-3.5" />
                      API
                    </span>
                  </th>
                  <th className="py-3 text-right">
                    <span className="inline-flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" />
                      Custo
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {dados.consultas.map((c, idx) => (
                  <tr
                    key={c.id}
                    className={[
                      "border-b border-[var(--color-line)] transition-colors hover:bg-[var(--color-surface-2)]",
                      idx % 2 === 1 ? "bg-[var(--color-surface-1)]" : "",
                    ].join(" ")}
                  >
                    <td className="py-3 pr-4 font-mono text-sm tabular-nums text-[var(--color-fg-muted)]">
                      {formatHora(c.data)}
                    </td>
                    <td className="py-3 pr-4 text-[var(--color-advogado)]">
                      {c.advogadoNome}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="nome-cliente font-serif text-[var(--color-cliente)]">
                        {c.credorNome}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="nome-devedor font-serif text-[var(--color-devedor)]">
                        {c.devedorNome}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm uppercase tracking-[0.06em] text-[var(--color-fg)]">
                      {c.apiRotulo}
                    </td>
                    <td className="py-3 text-right font-serif tabular-nums text-[var(--color-gold)]">
                      {c.custoBrl > 0 ? formatBRL(c.custoBrl) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
