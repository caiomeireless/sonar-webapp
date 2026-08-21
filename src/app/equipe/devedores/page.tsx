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
import { Clock, FileText, Landmark, Plus, Users } from "lucide-react";
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
import { formatBRL, formatTempoRelativo } from "@/lib/format";
import { Paginacao } from "@/components/ui/Paginacao";
import { CarteiraView } from "./CarteiraView";
import { BuscaCarteira } from "./BuscaCarteira";
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
  const novoHref = `/equipe/devedores/novo${linkBase}`;

  const visao = um(params.v) === "clientes" ? "clientes" : "devedores";

  return (
    <main className="relative mx-auto max-w-[1200px] px-6 py-12 sm:px-10">
      {/* Cabeçalho enxuto: título + toggle de visão + ação primária */}
      <header className="title-shield mb-8 text-center">
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Banco de Dossiês
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          {visao === "devedores"
            ? "Busca Direta · Todos os Rastreados"
            : "Carteira Hierárquica · Por Cliente"}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <ToggleVisaoBanco atual={visao} />
          <Link
            href={novoHref}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-signal)]/85 px-5 py-3 text-sm font-semibold text-onyx shadow-[0_4px_24px_rgba(60,255,138,0.28)] ring-1 ring-[var(--color-signal)]/60 transition hover:bg-[var(--color-tip-glow)]/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo Devedor
          </Link>
        </div>
      </header>

      {visao === "devedores" ? (
        <VisaoDevedores params={params} linkBase={linkBase} />
      ) : (
        <VisaoClientes params={params} linkBase={linkBase} />
      )}
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
      <ControlesDevedores />

      <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
        {listagem.total === 0
          ? q
            ? `Nenhum devedor encontrado para "${q}"`
            : "Nenhum devedor rastreado ainda"
          : `${listagem.total.toLocaleString("pt-BR")} ${
              listagem.total === 1 ? "devedor" : "devedores"
            } · página ${listagem.pagina} de ${totalPaginas}`}
      </p>

      {listagem.devedores.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] p-10 text-center">
          <p className="font-serif text-2xl text-ivory">
            {q ? "Nenhum resultado" : "Nenhum devedor rastreado"}
          </p>
          <p className="mx-auto mt-3 max-w-[480px] text-sm text-[var(--color-ivory-88)]">
            {q
              ? "Confira a grafia ou tente só parte do nome ou do documento."
              : "Os devedores chegam pela sincronização do Themis ou pelo cadastro manual."}
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {listagem.devedores.map((d) => (
            <LinhaDevedor key={d.id} devedor={d} linkBase={linkBase} />
          ))}
        </div>
      )}

      <Paginacao pagina={listagem.pagina} totalPaginas={totalPaginas} />
    </>
  );
}

// Linha-card do devedor: 1 clique = dossiê. Hierarquia de leitura:
// nome (grande, cor devedor) -> credor(es) -> agregados à direita.
function LinhaDevedor({
  devedor: d,
  linkBase,
}: {
  devedor: DevedorBusca;
  linkBase: string;
}) {
  const docLabel = d.tipo === "PF" ? "CPF" : "CNPJ";
  const rastreado = d.total_bens > 0;
  const credoresLabel =
    d.credores.length === 0
      ? null
      : d.credores.length <= 2
        ? d.credores.map((c) => c.nome).join(" · ")
        : `${d.credores[0].nome} + ${d.credores.length - 1} outros`;

  return (
    <Link
      href={`/equipe/devedores/${d.id}${linkBase}`}
      className="glass-flat group flex flex-col gap-3 p-5 transition
                 hover:border-[var(--color-signal-soft-2)]
                 hover:shadow-[0_0_24px_-10px_rgba(60,255,138,0.4)]
                 sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Identificação */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="nome-devedor truncate font-serif text-xl leading-tight text-[var(--color-devedor)] transition group-hover:underline">
            {d.nome}
          </h3>
          <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.20em] text-[var(--color-ivory-66)]">
            {d.tipo}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-[var(--color-ivory-66)]">
          <span>
            {docLabel} {d.documento}
          </span>
          {credoresLabel ? (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Users className="h-3 w-3 shrink-0 text-[var(--color-cliente)]/70" aria-hidden="true" />
              <span className="nome-cliente truncate text-[var(--color-cliente)]">
                {credoresLabel}
              </span>
            </span>
          ) : null}
          {d.casos_count > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-[var(--color-signal)]/70" aria-hidden="true" />
              {d.casos_count} {d.casos_count === 1 ? "caso" : "casos"}
            </span>
          ) : null}
        </div>
      </div>

      {/* Agregados — coluna direita */}
      <div className="flex shrink-0 items-center gap-5">
        {d.debito_total_brl > 0 ? (
          <div className="text-right">
            <p className="font-mono text-[15px] tabular-nums text-[var(--color-ivory-88)]">
              {formatBRL(d.debito_total_brl)}
            </p>
            <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
              Débito Judicial
            </p>
          </div>
        ) : null}
        {rastreado ? (
          <div className="text-right">
            <p className="font-mono text-[15px] tabular-nums text-[var(--color-gold)]">
              {d.valor_estimado_total_brl > 0
                ? formatBRL(d.valor_estimado_total_brl)
                : "—"}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-signal)]">
              <Landmark className="h-3 w-3" aria-hidden="true" />
              {d.total_bens} {d.total_bens === 1 ? "bem" : "bens"}
            </p>
          </div>
        ) : (
          <span className="inline-flex items-center rounded-full border border-[var(--color-ivory-22)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
            Aguardando busca
          </span>
        )}
        <span className="hidden items-center gap-1.5 font-mono text-[11px] text-[var(--color-ivory-40)] md:inline-flex">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatTempoRelativo(d.ultima_consulta_em)}
        </span>
      </div>
    </Link>
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

  const qNorm = normalizar(q);
  const qDigitos = soDigitos(q);
  const credores = qNorm
    ? todosCredores.filter((c) => {
        if (normalizar(c.nome).includes(qNorm)) return true;
        if (qDigitos && soDigitos(c.documento).includes(qDigitos)) return true;
        return false;
      })
    : todosCredores;

  const totalCasos = credores.reduce((s, c) => s + c.total_casos, 0);
  const totalBens = credores.reduce((s, c) => s + c.total_bens, 0);
  const totalEstimado = credores.reduce(
    (s, c) => s + (c.valor_estimado_total_brl || 0),
    0,
  );

  return (
    <>
      <p className="mb-4 text-center font-mono text-[13px] text-[var(--color-signal)]">
        {credores.length === 0
          ? q
            ? `Nenhum cliente encontrado para "${q}".`
            : "Nenhum cliente cadastrado ainda."
          : `${credores.length} ${
              credores.length === 1 ? "Cliente Ativo" : "Clientes Ativos"
            } · ${totalCasos} ${totalCasos === 1 ? "Caso" : "Casos"} · ${totalBens} ${
              totalBens === 1 ? "Bem Rastreado" : "Bens Rastreados"
            } — ${formatBRL(totalEstimado)} estimado`}
      </p>

      <div className="mb-6">
        <BuscaCarteira />
      </div>

      {credores.length > 0 ? (
        <CarteiraView credores={credores} euQuery={linkBase} />
      ) : null}
    </>
  );
}
