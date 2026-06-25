// Monitor de custos — portal do cliente. Painel read-only com OS DADOS DO
// CLIENTE LOGADO (gastos do escritório a serviço do portfólio dele).
//
// REGRA DE PRIVACIDADE (decisão Caio): o cliente NUNCA vê advogados nem
// outros clientes. Aqui só aparecem TOTAIS e séries agregadas do próprio
// portfólio. Detalhamento por consulta fica restrito à equipe — aviso no
// rodapé reforça isso. Devedor também não aparece neste painel (o cliente
// já tem essa informação em /cliente/casos).
//
// Resolução de credor:
//   1. `previewEuFromParam` continua valendo (admin/sócio "visualizar como").
//   2. O e-mail logado vira credor via `credores.email_contato`.
//   3. Fallback `cliente.demo@battaglia.com.br` -> credorId=1 (CREDOR_DEMO),
//      garante que a demo sempre renderiza algo mesmo sem seed específico.

import { redirect } from "next/navigation";
import Link from "next/link";
import { DollarSign, ArrowRight, TrendingUp, Activity } from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { previewEuFromParam } from "@/lib/dev-auth";
import { formatBRL } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { obterDashboardCustos } from "@/lib/dashboard-custos";
import { DEMO_CLIENTE_EMAIL } from "@/lib/mock-fixtures";

import GastosPorDiaChart from "./GastosPorDiaChart";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

// Acha o credor pelo email_contato. Devolve null se não encontrar — quem
// chama decide o fallback. Resiliente a tabela ausente (devolve null).
async function credorIdPorEmail(email: string): Promise<number | null> {
  try {
    const sb = createAdminClient();
    const { data, error } = await sb
      .from("credores")
      .select("id")
      .eq("email_contato", email.toLowerCase().trim())
      .maybeSingle();
    if (error || !data) return null;
    return (data.id as number) ?? null;
  } catch {
    return null;
  }
}

export default async function CustosClientePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  const eu = previewEuFromParam(params.eu, perfil) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  // Resolve credorId: e-mail -> credor; demo cai no CREDOR_DEMO (id=1).
  let credorId = await credorIdPorEmail(eu);
  if (credorId === null && eu.toLowerCase() === DEMO_CLIENTE_EMAIL) {
    credorId = 1;
  }
  // Sem credor vinculado: ainda renderiza a página, mas com dashboard vazio.
  // Usar id=-1 garante que `obterDashboardCustos` devolve zerado (não casa
  // com nenhum devedor) em vez de quebrar.
  const dashboard = await obterDashboardCustos({
    credorId: credorId ?? -1,
  });

  const { totalMesBrl, limiteMesBrl, totalConsultas, apiMaisUsada, gastosPorDia, porAPI } =
    dashboard;
  const pct = limiteMesBrl > 0
    ? Math.min(100, Math.round((totalMesBrl / limiteMesBrl) * 100))
    : 0;

  const qsBase = params.eu
    ? `?eu=${encodeURIComponent(Array.isArray(params.eu) ? params.eu[0]! : params.eu)}`
    : "";

  // Total acumulado entre todas as APIs — usado pra calcular a barra de
  // participação % no ranking (cliente entende "Assertiva é XX% do que
  // gasto" mais facilmente do que números absolutos sozinhos).
  const totalAcumuladoApis = porAPI.reduce((s, a) => s + a.totalBrl, 0);

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10">
      {/* CABEÇALHO */}
      <header className="title-shield mb-6 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <DollarSign className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Quanto Está Sendo Investido no Seu Portfólio
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Monitor de Custos
        </p>
      </header>

      {/* KPIs — três cards lado a lado (Total do Mês, Total Consultas, Top API) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* KPI 1 — Total do mês vs limite + barra */}
        <div className="glass p-6">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[var(--color-signal)]" />
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Total do mês
            </p>
          </div>
          <p className="mt-3 text-3xl font-medium tabular-nums text-[var(--color-signal)]">
            {formatBRL(totalMesBrl)}
          </p>
          <p className="mt-1 font-mono text-[12px] text-[var(--color-ivory-66)]">
            de {formatBRL(limiteMesBrl)} contratado
          </p>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--color-signal)] shadow-[0_0_14px_rgba(60,255,138,0.45)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            {pct}% utilizado
          </p>

          <Link
            href={`/cliente/preferencias${qsBase}`}
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-signal)] hover:underline"
          >
            Ajustar limites <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* KPI 2 — Total de consultas */}
        <div className="glass p-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--color-gold)]" />
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Total de consultas
            </p>
          </div>
          <p className="mt-3 text-3xl font-medium tabular-nums text-[var(--color-ivory)]">
            {totalConsultas.toLocaleString("pt-BR")}
          </p>
          <p className="mt-1 font-mono text-[12px] text-[var(--color-ivory-66)]">
            consultas pagas a serviço do seu portfólio
          </p>
        </div>

        {/* KPI 3 — Top API */}
        <div className="glass p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--color-gold)]" />
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              API mais usada
            </p>
          </div>
          <p className="mt-3 text-xl font-medium leading-tight text-[var(--color-ivory)]">
            {apiMaisUsada || "—"}
          </p>
          <p className="mt-1 font-mono text-[12px] text-[var(--color-ivory-66)]">
            fonte de dados mais acionada no período
          </p>
        </div>
      </section>

      {/* GRÁFICO — gastos por dia (últimos 30 dias) */}
      <section className="glass mt-6 p-6">
        <header className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
              Gastos por dia
            </p>
            <p className="mt-1 text-xs text-[var(--color-ivory-66)]">
              Investimento diário em pesquisas pagas nos últimos 30 dias.
            </p>
          </div>
        </header>
        <GastosPorDiaChart dados={gastosPorDia} />
      </section>

      {/* RANKING POR API — sem mostrar advogados */}
      <section className="glass mt-6 p-6">
        <header className="mb-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-gold)]">
            Onde Cada Real Foi Aplicado
          </p>
          <p className="mt-1 text-xs text-[var(--color-ivory-66)]">
            Ranking por fonte de dados — total acumulado e número de consultas.
          </p>
        </header>

        {porAPI.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-[var(--color-ivory-66)]">
            Nenhuma consulta paga registrada para este portfólio.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {porAPI.map((api) => {
              const participacao =
                totalAcumuladoApis > 0
                  ? (api.totalBrl / totalAcumuladoApis) * 100
                  : 0;
              return (
                <li
                  key={api.id}
                  className="rounded-md border border-[var(--color-ivory-12)] px-4 py-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--color-ivory)]">
                      {api.nome}
                    </span>
                    <div className="flex shrink-0 items-baseline gap-3">
                      <span className="font-mono text-[12px] text-[var(--color-ivory-66)]">
                        {api.consultas.toLocaleString("pt-BR")}{" "}
                        {api.consultas === 1 ? "consulta" : "consultas"}
                      </span>
                      <span className="text-sm tabular-nums text-[var(--color-signal)]">
                        {formatBRL(api.totalBrl)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-gold)] transition-all"
                      style={{ width: `${participacao}%` }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[12px] text-[var(--color-ivory-66)]">
                    {participacao.toFixed(1)}% do investimento total
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* AVISO — detalhamento por consulta restrito à equipe */}
      <p className="mt-6 max-w-[720px] text-xs text-[var(--color-ivory-66)]">
        Para preservar a estratégia do escritório, o detalhamento por consulta
        é restrito à equipe. Você acompanha o valor agregado, com transparência
        sobre o teto contratado e onde cada real está sendo aplicado.
      </p>
    </main>
  );
}
