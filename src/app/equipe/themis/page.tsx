// Tela Themis — fila de processos vindos do sistema interno do escritório.
// No demo (Dia 4) lê os casos do banco (mockados). No real (Sem 2) vira
// chamada ao API Themis preservando a interface ProcessoThemis.
//
// Cada card tem 3 botões de busca (Combo Lead, Combo Documento, Individual)
// via componente <AcoesBuscaCardThemis>. Cada um abre modal de confirmação
// e depois redireciona pra animação adaptada ao modo escolhido.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, FileText, Hash, Scale } from "lucide-react";
import { listarProcessosThemis, type ProcessoThemis } from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { formatBRL, formatStatus, formatTempoRelativo } from "@/lib/format";
import { AcoesBuscaCardThemis } from "./AcoesBuscaCardThemis";
import { FiltroThemis } from "./FiltroThemis";
import { PaginacaoThemis } from "./PaginacaoThemis";
import { ToggleVisao, type VisaoThemis } from "./ToggleVisao";

type Props = {
  searchParams?: Promise<{
    eu?: string | string[];
    q?: string | string[];
    v?: string | string[];
    p?: string | string[];
  }>;
};

function normalizar(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function matchBusca(p: ProcessoThemis, q: string): boolean {
  if (!q) return true;
  const alvo = normalizar(q);
  // Busca por número do processo, pasta do Themis, nome do devedor ou credor.
  const campos = [
    p.numero_processo,
    p.pasta_themis,
    String(p.caso_id),
    p.devedor.nome,
    p.devedor.documento,
    p.credor.nome,
  ].map(normalizar);
  return campos.some((c) => c.includes(alvo));
}

export default async function ThemisPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(params.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const q = (Array.isArray(params.q) ? params.q[0] : params.q) ?? "";
  const pRaw = Array.isArray(params.p) ? params.p[0] : params.p;
  const paginaAtual = Math.max(1, Number.parseInt(pRaw ?? "1", 10) || 1);

  // Busca vai pro banco (numero_processo + id) + paginacao no banco (range).
  // Depois JS refina por nome de devedor/credor DENTRO da pagina atual — se
  // faltar match, o usuario navega as paginas ate achar.
  const listagem = await listarProcessosThemis(q, paginaAtual);
  const preFiltrados = listagem.processos;
  const processos = q
    ? preFiltrados.filter((p) => matchBusca(p, q))
    : preFiltrados;
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";
  const vRaw = Array.isArray(params.v) ? params.v[0] : params.v;
  // Padrao = lista (linhas rapidas). Cards eh opt-in via ?v=cards — 50
  // SpotlightCards com backdrop-filter empilhado ainda deixam scroll pesado
  // em GPU media, entao carrega so quando o usuario escolher.
  const visao: VisaoThemis = vRaw === "cards" ? "cards" : "lista";

  const totalPaginas = Math.max(1, Math.ceil(listagem.total / listagem.porPagina));
  // Somas na pagina atual (nao no total geral — Painel /equipe agrega tudo).
  const totalNaPagina = processos.length;
  const totalRastreados = processos.filter((p) => p.ja_rastreado).length;
  const totalPendentes = totalNaPagina - totalRastreados;

  return (
    <main className="relative min-h-svh">
      {/* Fundo: preto puro (padrão da cara nova). */}
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-12 sm:px-10">
      {/* Cabeçalho (padrão Banco de Dossiês) */}
      <header className="mb-8 text-center">
        <h1
          className="font-serif text-[clamp(29px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[#C97B2A]"
          style={{ WebkitTextStroke: "1px rgba(255,255,255,0.65)" }}
        >
          Ficha das Execuções
        </h1>
        <p className="mt-3 font-mono text-[clamp(13px,1.6vw,20px)] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Uma Ficha para Cada Processo · Via Themis
        </p>
      </header>

      {/* Filtro + toggle num card verde escuro (padrão do Banco). */}
      <SpotlightCard
        local
        degrade="linear-gradient(0deg, rgba(10,48,28,0.7), rgba(10,48,28,0.7))"
        className="p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FiltroThemis />
          <ToggleVisao atual={visao} />
        </div>
      </SpotlightCard>

      {/* Card de DEMONSTRAÇÃO — ficha de processo fictícia pra reunião. */}
      <SpotlightCard
        local
        degrade="linear-gradient(0deg, rgba(58,32,88,0.55), rgba(58,32,88,0.55))"
        borda="rgba(192, 132, 252, 0.45)"
        className="mt-4"
      >
        <Link
          href={`/equipe/themis/processo/demo${linkBase}`}
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4"
        >
          <div className="min-w-0">
            <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.26em] text-[#C084FC]">
              Demonstração
            </p>
            <p className="mt-1 text-[15px] leading-snug text-ivory">
              Ficha completa do processo fictício{" "}
              <span className="font-mono text-[var(--color-gold)]">
                1002345-67.2024.8.26.0602
              </span>{" "}
              — dados de exemplo, sem expor informações sigilosas.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-[#C084FC]/60 bg-[#C084FC]/10 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-[#C084FC]">
            Abrir Ficha Demo
          </span>
        </Link>
      </SpotlightCard>

      {/* Contador vermelho (padrão do Banco). */}
      <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-devedor)]">
        {totalNaPagina === 0
          ? q
            ? `Nenhum processo encontrado para "${q}"`
            : "Nenhum processo recebido do Themis ainda"
          : `${listagem.total.toLocaleString("pt-BR")} ${
              listagem.total === 1 ? "processo" : "processos"
            } · página ${paginaAtual} de ${totalPaginas} · ${totalPendentes} ${
              totalPendentes === 1 ? "pendente" : "pendentes"
            } · ${totalRastreados} rastreados nesta página`}
      </p>

      {/* Lista */}
      {processos.length === 0 ? (
        <div className="relative mt-10 grid place-items-center">
          <SpotlightCard local claro className="max-w-[520px] p-10 text-center">
            <h3 className="font-serif text-2xl text-ivory">
              Nenhum processo recebido
            </h3>
            <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
              O Themis não enviou novos processos. Eles aparecem aqui quando o
              escritório cadastra uma execução ou cumprimento de sentença.
            </p>
          </SpotlightCard>
        </div>
      ) : visao === "lista" ? (
        <div className="mt-4 flex flex-col gap-2">
          {processos.map((p) => (
            <LinhaProcesso key={p.caso_id} processo={p} eu={euDev} linkBase={linkBase} />
          ))}
        </div>
      ) : (
        <div className="relative mt-8 space-y-4">
          {processos.map((p) => (
            <CardProcesso
              key={p.caso_id}
              processo={p}
              eu={euDev}
              linkBase={linkBase}
            />
          ))}
        </div>
      )}

      {/* Paginacao: 50 por pagina. Preserva q/v/eu no URL — a busca ja
          filtra por numero_processo no banco, entao paginar em cima da
          busca navega os hits corretamente. */}
      <PaginacaoThemis pagina={paginaAtual} totalPaginas={totalPaginas} />
      </div>
    </main>
  );
}

function CardProcesso({
  processo,
  eu,
}: {
  processo: ProcessoThemis;
  eu?: string;
  linkBase: string;
}) {
  const status = formatStatus(processo.status);
  const tipoLabel = processo.devedor.tipo === "PF" ? "PF" : "PJ";
  const docLabel = processo.devedor.tipo === "PF" ? "CPF" : "CNPJ";

  return (
    <SpotlightCard className="p-7">
      {/* === BLOCO 1: IDENTIFICAÇÃO DO DEVEDOR === */}
      <header>
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
            Processo Themis
          </span>
          {/* Chip PASTA — a pasta REAL do Themis (mig 022). Fallback pro
              id interno soh enquanto o backfill nao roda. */}
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            <Hash className="h-3 w-3" />
            {processo.pasta_themis
              ? `Pasta ${processo.pasta_themis}`
              : `Caso #${processo.caso_id}`}
          </span>
        </div>
        <h3 className="nome-devedor mt-3 font-serif text-[24px] leading-[1.15] text-[var(--color-devedor)]">
          {processo.devedor.nome}
        </h3>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
            {tipoLabel}
          </span>
          <span className="h-3 w-px bg-[var(--color-ivory-22)]" />
          <span className="font-mono text-[12px] text-ivory">
            {docLabel} {processo.devedor.documento}
          </span>
        </div>
      </header>

      {/* === DIVIDER === */}
      <div className="my-6 h-px bg-[var(--color-ivory-12)]" />

      {/* === BLOCO 2: PROCESSO + CRÉDITO === */}
      <div>
        <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          <FileText className="h-3 w-3" />
          Processo
        </p>
        <p className="mt-2 break-all font-mono text-[15px] text-[var(--color-gold)]">
          {processo.numero_processo ?? "Sem número de processo"}
        </p>
        <p className="mt-3 font-mono text-[13px] text-ivory">
          <span className="text-[var(--color-ivory-66)]">Crédito:</span>{" "}
          <span className="tabular-nums">
            {processo.valor_credito_brl !== null
              ? formatBRL(processo.valor_credito_brl)
              : "—"}
          </span>
        </p>
      </div>

      {/* === DIVIDER === */}
      <div className="my-6 h-px bg-[var(--color-ivory-12)]" />

      {/* === BLOCO 3: CREDOR + ADVOGADO === */}
      <div className="space-y-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Credor
          </p>
          <p className="nome-cliente mt-2 font-medium text-[15px] text-[var(--color-cliente)]">
            {processo.credor.nome}
          </p>
        </div>
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            <Scale className="h-3 w-3" />
            Advogado responsável
          </p>
          {processo.responsavel_email ? (
            <p className="mt-2 font-mono text-[13px] text-[var(--color-advogado)]">
              {processo.responsavel_email}
            </p>
          ) : (
            <p className="mt-2 font-mono text-[13px] italic text-[var(--color-ivory-66)]">
              Sem responsável atribuído
            </p>
          )}
        </div>
      </div>

      {/* === DIVIDER === */}
      <div className="my-6 h-px bg-[var(--color-ivory-12)]" />

      {/* === BLOCO 4: STATS DE RASTREAMENTO === */}
      <div className="flex items-end justify-between gap-4">
        {processo.ja_rastreado ? (
          <>
            <div>
              <p className="font-serif text-4xl leading-none text-[var(--color-gold)]">
                {processo.total_bens}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                {processo.total_bens === 1 ? "Bem Encontrado" : "Bens Encontrados"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                Rastreamento
              </p>
              <p className="mt-1 font-mono text-[14px] text-[var(--color-signal)]">
                Concluído
              </p>
            </div>
          </>
        ) : (
          <div>
            <p className="font-serif text-2xl leading-none text-[var(--color-ivory-88)]">
              Aguardando Busca
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Pendente · Nenhum Bem Localizado
            </p>
          </div>
        )}
      </div>

      {processo.observacoes ? (
        <p className="mt-6 border-l-2 border-[var(--color-ivory-22)] pl-3 font-mono text-[13px] italic text-[var(--color-ivory-88)]">
          {processo.observacoes}
        </p>
      ) : null}

      {/* === BLOCO 5: FOOTER (status + tempo) === */}
      <div className="mt-6 space-y-3 border-t border-[var(--color-ivory-12)] pt-4">
        <div className="flex items-center justify-between">
          <span
            className="inline-flex rounded-full border px-3 py-1 font-mono text-[12px] uppercase tracking-[0.18em]"
            style={{
              borderColor: `${status.color}66`,
              backgroundColor: `${status.color}14`,
              color: status.color,
            }}
          >
            {status.label}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--color-ivory-66)]">
            <Clock className="h-3 w-3" />
            Recebido {formatTempoRelativo(processo.recebido_em)}
          </span>
        </div>

        {/* Ações: 3 modos (Combo Lead, Combo Doc, Individual) — preservado */}
        <div className="-mx-1 pt-1">
          <AcoesBuscaCardThemis
            devedorId={processo.devedor.id}
            eu={eu ?? ""}
            jaRastreado={processo.ja_rastreado}
          />
        </div>
      </div>
    </SpotlightCard>
  );
}

// ============================================================
// Helpers do modo Lista — linhas inspiradas no painel real do Themis
// (avatar do responsável à esquerda, dados ao centro, ações à direita).
// Reaproveita <AcoesBuscaCardThemis> pra manter os 3 botões de busca.
// ============================================================
function iniciais(email?: string): string {
  const local = (email ?? "").split("@")[0] ?? "";
  const partes = local.split(/[._-]/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase() || "?";
}

// "caio.vicentino@bpadvogados.com.br" -> "Caio Vicentino". Fallback pra
// email inteiro se nao der pra derivar um nome legivel.
function nomeAdvogado(email: string | null | undefined): string {
  if (!email) return "Sem responsavel";
  const local = email.split("@")[0] ?? email;
  const partes = local.split(/[._-]/).filter(Boolean);
  if (partes.length === 0) return email;
  return partes.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function LinhaProcesso({
  processo: p,
  eu,
  linkBase,
}: {
  processo: ProcessoThemis;
  eu?: string;
  linkBase: string;
}) {
  const status = formatStatus(p.status);
  const docLabel = p.devedor.tipo === "PF" ? "CPF" : "CNPJ";
  const advogado = nomeAdvogado(p.responsavel_email);
  const fichaHref = `/equipe/themis/processo/${p.caso_id}${linkBase}`;

  // Livro-razão (padrão Banco de Dossiês, reforma 25/08): trilho de infos
  // alinhado, PROCESSO + DEVEDOR CAIXA ALTA no centro, execução na ponta.
  // A área principal clica pra FICHA DO PROCESSO; os botões de busca
  // continuam no rodapé da linha.
  return (
    <SpotlightCard
      blur={false}
      local
      claro
      className="transition hover:shadow-[0_0_24px_-10px_rgba(60,255,138,0.35)]"
    >
      <Link
        href={fichaHref}
        className="group grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-5 pt-4 sm:grid-cols-[104px_minmax(0,1fr)_200px] sm:gap-x-6"
      >
        {/* Trilho esquerdo: bens encontrados */}
        <div className="text-center sm:border-r sm:border-white/10 sm:pr-5">
          <p
            className={`font-mono text-[26px] font-medium leading-none tabular-nums ${
              p.total_bens > 0
                ? "text-[var(--color-signal)]"
                : "text-[var(--color-ivory-40)]"
            }`}
          >
            {p.total_bens}
          </p>
          <p className="mt-1.5 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
            {p.total_bens === 1 ? "Info" : "Infos"}
          </p>
        </div>

        {/* Identificação: processo em destaque + devedor CAIXA ALTA */}
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="break-all font-mono text-[15px] text-[var(--color-gold)]">
              {p.numero_processo ?? "Sem número de processo"}
            </span>
            <span className="shrink-0 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--color-ivory-66)]">
              {p.pasta_themis ? `Pasta ${p.pasta_themis}` : `Caso #${p.caso_id}`}
            </span>
            <span
              className="inline-flex shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.16em]"
              style={{
                borderColor: `${status.color}66`,
                backgroundColor: `${status.color}14`,
                color: status.color,
              }}
            >
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h3
              className="min-w-0 max-w-full truncate font-serif text-[clamp(17px,1.6vw,22px)] font-semibold uppercase leading-tight tracking-[0.02em] text-[var(--color-devedor)] transition group-hover:underline"
              style={{
                textShadow:
                  "0 0 1px rgba(220,38,38,0.6), 0 0 12px rgba(220,38,38,0.16)",
              }}
            >
              {p.devedor.nome}
            </h3>
            <span className="shrink-0 font-mono text-[12px] tracking-[0.04em] text-[var(--color-ivory-66)]">
              {docLabel} {p.devedor.documento}
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-[13px] leading-snug">
            <span className="text-[#FF9C41]">{p.credor.nome}</span>
            <span className="text-[var(--color-ivory-66)]">
              {" "}
              · {advogado} · Recebido {formatTempoRelativo(p.recebido_em)}
            </span>
          </p>
        </div>

        {/* Ponta direita: valor da execução */}
        <div className="col-span-2 border-t border-white/10 pt-2 text-left sm:col-span-1 sm:border-t-0 sm:pt-0 sm:text-right">
          <p
            className={`font-mono text-[17px] tabular-nums leading-tight ${
              p.valor_credito_brl && p.valor_credito_brl > 0
                ? "text-[var(--color-ivory)]"
                : "text-[var(--color-ivory-40)]"
            }`}
          >
            {p.valor_credito_brl && p.valor_credito_brl > 0
              ? formatBRL(p.valor_credito_brl)
              : "—"}
          </p>
          <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-ivory-66)]">
            {p.valor_credito_brl && p.valor_credito_brl > 0
              ? "Execução Atualizada"
              : "Aguardando Robôs"}
          </p>
        </div>
      </Link>

      {/* Rodapé: botões de busca preservados (fora do Link). */}
      <div className="mt-2 border-t border-white/10 px-5 pb-4 pt-3">
        <AcoesBuscaCardThemis
          devedorId={p.devedor.id}
          eu={eu ?? ""}
          jaRastreado={p.ja_rastreado}
        />
      </div>
    </SpotlightCard>
  );
}
