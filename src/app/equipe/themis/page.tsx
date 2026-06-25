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
import { ToggleVisao, type VisaoThemis } from "./ToggleVisao";

type Props = {
  searchParams?: Promise<{
    eu?: string | string[];
    q?: string | string[];
    v?: string | string[];
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
  // Busca por número do processo, pasta (= ID interno), nome do devedor ou credor.
  const campos = [
    p.numero_processo,
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

  const todos = await listarProcessosThemis();
  const q = (Array.isArray(params.q) ? params.q[0] : params.q) ?? "";
  const processos = q ? todos.filter((p) => matchBusca(p, q)) : todos;
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";
  const vRaw = Array.isArray(params.v) ? params.v[0] : params.v;
  const visao: VisaoThemis = vRaw === "lista" ? "lista" : "cards";

  const totalProcessos = processos.length;
  const totalRastreados = processos.filter((p) => p.ja_rastreado).length;
  const totalPendentes = totalProcessos - totalRastreados;

  return (
    <main className="relative mx-auto max-w-[1100px] px-6 py-16 sm:px-10">
      {/* Glow de fundo gold removido — agora o AetherBackground global
          do layout vale pra todas as páginas (uniformidade visual). */}

      {/* Cabeçalho */}
      <header className="title-shield relative mb-6 text-center">
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Processos a Rastrear
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Themis · Fila do Escritório
        </p>
        <p className="mx-auto mt-3 max-w-[680px] font-mono text-[13px] text-[var(--color-signal)]">
          {totalProcessos === 0
            ? q
              ? `Nenhum processo encontrado para "${q}".`
              : "Nenhum processo recebido do Themis ainda."
            : `${totalProcessos} ${
                totalProcessos === 1 ? "processo recebido" : "processos recebidos"
              } do sistema interno · ${totalPendentes} ${
                totalPendentes === 1 ? "pendente" : "pendentes"
              } de busca · ${totalRastreados} já rastreado${
                totalRastreados === 1 ? "" : "s"
              }`}
        </p>

        {/* Filtro + toggle de visualização */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <FiltroThemis />
          <ToggleVisao atual={visao} />
        </div>
      </header>

      {/* Lista */}
      {processos.length === 0 ? (
        <div className="relative mt-12 grid place-items-center">
          <SpotlightCard className="max-w-[520px] p-10 text-center">
            <span className="eyebrow !text-[var(--color-signal)]">Fila vazia</span>
            <h3 className="mt-4 font-serif text-2xl text-ivory">
              Nenhum processo recebido
            </h3>
            <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
              O Themis não enviou novos processos. Eles aparecem aqui quando o
              escritório cadastra uma execução ou cumprimento de sentença.
            </p>
          </SpotlightCard>
        </div>
      ) : visao === "lista" ? (
        <div className="mt-8 flex flex-col gap-3">
          {processos.map((p) => (
            <LinhaProcesso key={p.caso_id} processo={p} eu={euDev} linkBase={linkBase} />
          ))}
        </div>
      ) : (
        <div className="relative mt-12 space-y-4">
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
          {/* Chip PASTA #X — número da pasta interna do Themis */}
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            <Hash className="h-3 w-3" />
            Pasta {processo.caso_id}
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
  const tipoLabel = p.devedor.tipo === "PF" ? "PF" : "PJ";
  const emailLocal = (p.responsavel_email ?? "").split("@")[0] ?? "";
  const dossieHref = `/equipe/devedores/${p.devedor.id}${linkBase}`;

  return (
    <div className="glass group flex flex-col gap-4 p-5 transition hover:bg-[var(--color-surface-2)]/40">
      {/* CABECALHO — 3 colunas: avatar | info do processo | (espaco) */}
      <div className="flex items-start gap-4">
        {/* AVATAR + advogado + Pasta */}
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-signal)]/40 bg-[var(--color-signal-soft)] font-mono text-base font-bold text-[var(--color-signal)]">
            {iniciais(p.responsavel_email ?? undefined)}
          </div>
          <span className="max-w-[100px] truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-advogado)]">
            {emailLocal || "—"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
            <Hash className="h-2.5 w-2.5" />#{p.caso_id}
          </span>
        </div>

        {/* INFO DO PROCESSO — empilhado em linhas claras */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Linha 1: nome devedor (clicavel) */}
          <Link href={dossieHref} className="block min-w-0">
            <h3 className="nome-devedor truncate font-serif text-xl leading-tight text-[var(--color-devedor)] transition group-hover:underline">
              {p.devedor.nome}
            </h3>
          </Link>

          {/* Linha 2: tipo + doc + numero processo */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center rounded-full bg-[var(--color-signal-soft)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
              {tipoLabel}
            </span>
            <span className="font-mono text-[12px] text-[var(--color-ivory-88)]">
              {p.devedor.documento}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[12px] text-[var(--color-gold)]">
              <FileText className="h-3 w-3 text-[var(--color-signal)]/70" />
              {p.numero_processo ?? "Sem número"}
            </span>
          </div>

          {/* Linha 3: credor + credito */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              Credor:
            </span>
            <span className="nome-cliente truncate font-serif text-[15px] text-[var(--color-cliente)]">
              {p.credor.nome}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              Crédito:
            </span>
            <span className="font-mono text-[14px] tabular-nums text-[var(--color-gold)] whitespace-nowrap">
              {p.valor_credito_brl !== null ? formatBRL(p.valor_credito_brl) : "—"}
            </span>
          </div>

          {/* Linha 4: status + bens + tempo */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{
                borderColor: `${status.color}66`,
                backgroundColor: `${status.color}14`,
                color: status.color,
              }}
            >
              {status.label}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--color-ivory-88)]">
              <Scale className="h-3 w-3 text-[var(--color-signal)]/70" />
              {p.ja_rastreado
                ? `${p.total_bens} ${p.total_bens === 1 ? "bem" : "bens"}`
                : "Aguardando busca"}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--color-ivory-66)]">
              <Clock className="h-3 w-3" />
              {formatTempoRelativo(p.recebido_em)}
            </span>
          </div>
        </div>
      </div>

      {/* RODAPE — 3 botoes de busca (AcoesBuscaCardThemis ja' inclui "Ver
          Dossiê Atual →" no proprio rodape, sem duplicar). */}
      <div className="border-t border-[var(--color-ivory-12)] pt-3">
        <AcoesBuscaCardThemis
          devedorId={p.devedor.id}
          eu={eu ?? ""}
          jaRastreado={p.ja_rastreado}
        />
      </div>
    </div>
  );
}
