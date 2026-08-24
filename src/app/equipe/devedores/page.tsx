// Banco de Devedores — portal da equipe.
//
// Redesign 2026-07-02 (pedido Caio): a tela agora tem DUAS visões:
//   1. "Devedores" (DEFAULT) — busca direta + lista paginada de todos os
//      devedores rastreados. Clique = dossiê em 1 passo. É o caminho
//      rápido de quem sabe QUEM procura.
//   2. "Por Cliente" — a carteira hierárquica (cliente -> casos ->
//      dossiê), pra quem navega pela relação com o credor.
// Toggle no topo troca a visão (?v=); filtros em ?q ?t ?r ?o ?p.
//
// Server Component. Em dev/preview, aceita ?eu=email pra simular login.
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  listarCredoresComResumo,
  listarDevedoresPaginado,
  type DevedorBusca,
  type FiltroRastreio,
  type OrdemDevedores,
} from "@/lib/devedores";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { formatBRL, formatDocumento } from "@/lib/format";
import { Paginacao } from "@/components/ui/Paginacao";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { CarteiraView } from "./CarteiraView";
import { ControlesDevedores, ToggleVisaoBanco } from "./ControlesDevedores";

function normalizar(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function soDigitos(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

type SP = { [k: string]: string | string[] | undefined };
const um = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

type Props = { searchParams?: Promise<SP> };

export default async function DevedoresEquipePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const eu = devEuFromParam(params.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const euDev = devEuFromParam(params.eu);
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  const visao = um(params.v) === "clientes" ? "clientes" : "devedores";

  return (
    <main className="relative min-h-svh">
      {/* Fundo: preto puro cobrindo a página toda (pedido 23/08). */}
      <div aria-hidden="true" className="absolute inset-0 bg-black" />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-12 sm:px-10">
        {/* Cabeçalho SEM painel (ditado 23/08): título solto no preto. */}
        <header className="mb-8 text-center">
          {/* Laranja mais escuro com contorno branco; título e subtítulo
              -15% (ditados 24/08). */}
          <h1
            className="font-serif text-[clamp(29px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[#C97B2A]"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.65)" }}
          >
            Banco de Dossiês
          </h1>
          <p className="mt-3 font-mono text-[clamp(13px,1.6vw,20px)] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
            Ficha das Informações de Todos os Devedores.
          </p>
          {/* Sem botão de cadastro manual (ditado 23/08): devedor entra
              automaticamente pela sync do Themis ou sistemas futuros. */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <ToggleVisaoBanco atual={visao} />
          </div>
        </header>

        {visao === "devedores" ? (
          <VisaoDevedores params={params} linkBase={linkBase} />
        ) : (
          <VisaoClientes params={params} linkBase={linkBase} />
        )}
      </div>
    </main>
  );
}

// ============================================================
// VISÃO 1 — DEVEDORES (busca direta, default)
// ============================================================

async function VisaoDevedores({
  params,
  linkBase,
}: {
  params: SP;
  linkBase: string;
}) {
  const q = um(params.q);
  const tipoRaw = um(params.t);
  const rastreioRaw = um(params.r);
  const ordemRaw = um(params.o);
  const pagina = Math.max(1, Number.parseInt(um(params.p) || "1", 10) || 1);

  const listagem = await listarDevedoresPaginado({
    q,
    tipo: tipoRaw === "PF" || tipoRaw === "PJ" ? tipoRaw : "todos",
    rastreio:
      rastreioRaw === "com-bens" || rastreioRaw === "aguardando"
        ? (rastreioRaw as FiltroRastreio)
        : "todos",
    ordem:
      ordemRaw === "valor" || ordemRaw === "nome"
        ? (ordemRaw as OrdemDevedores)
        : "recentes",
    pagina,
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(listagem.total / listagem.porPagina),
  );

  return (
    <>
      {/* Busca + filtros num card só (pedido 23/08: "não fica tudo
          flutuando"), com a mesma luz de mouse da tela inicial e degradê
          verde escuro → preto (ditado 24/08). */}
      <SpotlightCard local degrade={DEGRADE_FILTRO} className="p-4 sm:p-5">
        <ControlesDevedores />
      </SpotlightCard>

      {/* Card de DEMONSTRAÇÃO (ditado 25/08, pré-reunião): abre a ficha
          FICTÍCIA do João da Silva — recheada, sem dado sigiloso. */}
      <SpotlightCard
        local
        degrade="linear-gradient(0deg, rgba(58,32,88,0.55), rgba(58,32,88,0.55))"
        borda="rgba(192, 132, 252, 0.45)"
        className="mt-4"
      >
        <Link
          href={`/equipe/devedores/demo${linkBase}`}
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4"
        >
          <div className="min-w-0">
            <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.26em] text-[#C084FC]">
              Demonstração
            </p>
            <p className="mt-1 text-[15px] leading-snug text-ivory">
              Ficha completa do devedor fictício{" "}
              <span className="font-semibold uppercase text-[var(--color-devedor)]">
                João da Silva
              </span>{" "}
              — dados de exemplo, sem expor informações sigilosas.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-[#C084FC]/60 bg-[#C084FC]/10 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-[#C084FC]">
            Abrir Ficha Demo
          </span>
        </Link>
      </SpotlightCard>

      <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-devedor)]">
        {listagem.total === 0
          ? q
            ? `Nenhum devedor encontrado para "${q}"`
            : "Nenhum devedor rastreado ainda"
          : `${listagem.total.toLocaleString("pt-BR")} ${
              listagem.total === 1 ? "devedor" : "devedores"
            } · página ${listagem.pagina} de ${totalPaginas}`}
      </p>

      {listagem.devedores.length === 0 ? (
        <SpotlightCard local className="mt-10 p-10 text-center">
          <p className="font-serif text-2xl text-ivory">
            {q ? "Nenhum resultado" : "Nenhum devedor rastreado"}
          </p>
          <p className="mx-auto mt-3 max-w-[480px] text-sm text-[var(--color-ivory-88)]">
            {q
              ? "Confira a grafia ou tente só parte do nome ou do documento."
              : "Os devedores chegam pela sincronização do Themis ou pelo cadastro manual."}
          </p>
        </SpotlightCard>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {listagem.devedores.map((d) => (
            <LinhaDevedor key={d.id} devedor={d} linkBase={linkBase} />
          ))}
        </div>
      )}

      <Paginacao pagina={listagem.pagina} totalPaginas={totalPaginas} />
    </>
  );
}

// Grid único de todas as linhas — é ele que garante o alinhamento
// horizontal pedido: trilho fixo de infos à esquerda, identificação no
// meio, valor da execução na ponta direita.
const GRID_LINHA = "sm:grid-cols-[104px_minmax(0,1fr)_200px]";

// Fundo do card de filtro: verde escuro UNIFORME, tom fechado
// (ditados 24/08 — saiu o degradê, depois escureceu mais um ponto).
const DEGRADE_FILTRO =
  "linear-gradient(0deg, rgba(10,48,28,0.7), rgba(10,48,28,0.7))";

// Linha-card do devedor: 1 clique = dossiê. Layout ditado (23/08):
//   [nº de informações] | NOME EM CAIXA ALTA vermelho + CPF/CNPJ cinza
//                       |   Cliente: … em amarelo                       | valor da execução
// Os dois números são alimentados pelos robôs: infos = bens_encontrados
// (buscas patrimoniais) e execução = débito judicial dos casos (sync
// Themis hoje; robô de análise das planilhas de cálculo atualizará o
// mesmo campo).
function LinhaDevedor({
  devedor: d,
  linkBase,
}: {
  devedor: DevedorBusca;
  linkBase: string;
}) {
  const docLabel = d.tipo === "PF" ? "CPF" : "CNPJ";
  const credoresLabel =
    d.credores.length === 0
      ? null
      : d.credores.length <= 2
        ? d.credores.map((c) => c.nome).join(" · ")
        : `${d.credores[0].nome} + ${d.credores.length - 1} outros`;
  const temExecucao = d.debito_total_brl > 0;

  return (
    <SpotlightCard
      blur={false}
      local
      claro
      className="transition hover:shadow-[0_0_24px_-10px_rgba(60,255,138,0.35)]"
    >
    <Link
      href={`/equipe/devedores/${d.id}${linkBase}`}
      className={`group grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-5 py-4 ${GRID_LINHA} sm:gap-x-6`}
    >
      {/* Trilho esquerdo: nº de informações encontradas pelos robôs */}
      <div className="text-center sm:border-r sm:border-white/10 sm:pr-5">
        <p
          className={`font-mono text-[26px] font-medium leading-none tabular-nums ${
            d.total_bens > 0
              ? "text-[var(--color-signal)]"
              : "text-[var(--color-ivory-40)]"
          }`}
        >
          {d.total_bens}
        </p>
        <p className="mt-1.5 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
          {d.total_bens === 1 ? "Info" : "Infos"}
        </p>
      </div>

      {/* Identificação: nome CAIXA ALTA vermelho + documento cinza; embaixo,
          o cliente (credor) em amarelo. */}
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h3
            className="min-w-0 max-w-full truncate font-serif text-[clamp(18px,1.8vw,24px)] font-semibold uppercase leading-tight tracking-[0.02em] text-[var(--color-devedor)] transition group-hover:underline"
            style={{
              textShadow:
                "0 0 1px rgba(220,38,38,0.6), 0 0 12px rgba(220,38,38,0.16)",
            }}
          >
            {d.nome}
          </h3>
          <span className="shrink-0 font-mono text-[12px] tracking-[0.04em] text-[var(--color-ivory-66)]">
            {docLabel} {formatDocumento(d.tipo, d.documento)}
          </span>
        </div>
        <p className="mt-1 truncate font-mono text-[13px] leading-snug">
          {credoresLabel ? (
            <>
              <span className="text-ivory">Cliente: </span>
              <span className="text-[#FF9C41]">{credoresLabel}</span>
            </>
          ) : (
            <span className="text-[var(--color-ivory-40)]">
              Sem Cliente Vinculado
            </span>
          )}
          {d.casos_count > 0 ? (
            <span className="text-[var(--color-ivory-40)]">
              {" "}
              · {d.casos_count} {d.casos_count === 1 ? "caso" : "casos"}
            </span>
          ) : null}
        </p>
      </div>

      {/* Ponta direita: valor da última atualização da execução */}
      <div className="col-span-2 border-t border-white/10 pt-2 text-left sm:col-span-1 sm:border-t-0 sm:pt-0 sm:text-right">
        <p
          className={`font-mono text-[17px] tabular-nums leading-tight ${
            temExecucao
              ? "text-[var(--color-ivory)]"
              : "text-[var(--color-ivory-40)]"
          }`}
        >
          {temExecucao ? formatBRL(d.debito_total_brl) : "—"}
        </p>
        <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-ivory-66)]">
          {temExecucao ? "Execução Atualizada" : "Aguardando Robôs"}
        </p>
      </div>
    </Link>
    </SpotlightCard>
  );
}

// ============================================================
// VISÃO 2 — POR CLIENTE (carteira hierárquica, preservada)
// ============================================================

async function VisaoClientes({
  params,
  linkBase,
}: {
  params: SP;
  linkBase: string;
}) {
  const todosCredores = await listarCredoresComResumo();
  const q = um(params.q);
  const tipoRaw = um(params.t);
  const rastreioRaw = um(params.r);
  const ordemRaw = um(params.o);

  const qNorm = normalizar(q);
  const qDigitos = soDigitos(q);
  let credores = qNorm
    ? todosCredores.filter((c) => {
        if (normalizar(c.nome).includes(qNorm)) return true;
        if (qDigitos && soDigitos(c.documento).includes(qDigitos)) return true;
        return false;
      })
    : todosCredores;

  // Mesmos filtros da visão Devedores (ditado 24/08), aplicados aqui
  // sobre os clientes: tipo PF/PJ, rastreio por bens e ordenação.
  if (tipoRaw === "PF" || tipoRaw === "PJ") {
    credores = credores.filter((c) => c.tipo === tipoRaw);
  }
  if (rastreioRaw === "com-bens") {
    credores = credores.filter((c) => c.total_bens > 0);
  } else if (rastreioRaw === "aguardando") {
    credores = credores.filter((c) => c.total_bens === 0);
  }
  credores = [...credores];
  if (ordemRaw === "nome") {
    credores.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  } else if (ordemRaw === "valor") {
    credores.sort(
      (a, b) => b.valor_estimado_total_brl - a.valor_estimado_total_brl,
    );
  } else {
    // "Mais Recentes" = última consulta mais nova primeiro (nulls no fim).
    credores.sort((a, b) =>
      (b.ultima_consulta_em ?? "").localeCompare(a.ultima_consulta_em ?? ""),
    );
  }

  const totalCasos = credores.reduce((s, c) => s + c.total_casos, 0);
  const totalBens = credores.reduce((s, c) => s + c.total_bens, 0);
  const totalEstimado = credores.reduce(
    (s, c) => s + (c.valor_estimado_total_brl || 0),
    0,
  );

  return (
    <>
      {/* Mesmo card de filtro da visão Devedores (ditado 24/08). */}
      <SpotlightCard local degrade={DEGRADE_FILTRO} className="p-4 sm:p-5">
        <ControlesDevedores />
      </SpotlightCard>

      {/* Contador no MESMO lugar e tipografia da visão Devedores. */}
      <p className="mb-2 mt-4 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-devedor)]">
        {credores.length === 0
          ? q
            ? `Nenhum cliente encontrado para "${q}"`
            : "Nenhum cliente cadastrado ainda"
          : `${credores.length} ${
              credores.length === 1 ? "cliente" : "clientes"
            } · ${totalCasos} ${totalCasos === 1 ? "caso" : "casos"} · ${totalBens} ${
              totalBens === 1 ? "bem" : "bens"
            } — ${formatBRL(totalEstimado)} estimado`}
      </p>

      {credores.length > 0 ? (
        <CarteiraView credores={credores} euQuery={linkBase} />
      ) : null}
    </>
  );
}
