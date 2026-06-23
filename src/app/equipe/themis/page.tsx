// Tela Themis — fila de processos vindos do sistema interno do escritório.
// No demo (Dia 4) lê os casos do banco (mockados). No real (Sem 2) vira
// chamada ao API Themis preservando a interface ProcessoThemis.
//
// Cada card tem 3 botões de busca (Combo Lead, Combo Documento, Individual)
// via componente <AcoesBuscaCardThemis>. Cada um abre modal de confirmação
// e depois redireciona pra animação adaptada ao modo escolhido.
import { redirect } from "next/navigation";
import { Clock, FileText, Scale } from "lucide-react";
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
        <p className="mx-auto mt-3 max-w-[680px] font-mono text-[13px] text-[var(--color-ivory-66)]">
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
        <div className="relative mt-8 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-1)]">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left font-mono text-[14px] uppercase tracking-[0.18em] text-[var(--color-ivory)]">
                <th className="px-5 py-5">Processo</th>
                <th className="px-5 py-5">Devedor</th>
                <th className="px-5 py-5">Crédito</th>
                <th className="px-5 py-5">Status</th>
                <th className="px-5 py-5">Rastreamento</th>
              </tr>
            </thead>
            <tbody>
              {processos.map((p, i) => {
                const status = formatStatus(p.status);
                return (
                  <tr
                    key={p.caso_id}
                    className={
                      "border-b border-[var(--color-line)] transition hover:bg-[var(--color-surface-2)] " +
                      (i % 2 === 1 ? "bg-[var(--color-surface-2)]/30" : "")
                    }
                  >
                    <td className="px-5 py-5 font-mono text-2xl text-[var(--color-gold)]">
                      {p.numero_processo ?? "—"}
                    </td>
                    <td className="px-5 py-5">
                      <div className="text-lg font-medium text-ivory">{p.devedor.nome}</div>
                      <div className="mt-1 font-mono text-sm text-[var(--color-ivory-88)]">
                        {p.devedor.tipo === "PF" ? "PF" : "PJ"} · {p.devedor.documento}
                      </div>
                    </td>
                    <td className="px-5 py-5 font-mono text-3xl text-[var(--color-gold)]">
                      {p.valor_credito_brl !== null ? formatBRL(p.valor_credito_brl) : "—"}
                    </td>
                    <td className="px-5 py-5">
                      <span
                        className="inline-flex rounded-full border px-3 py-1 font-mono text-[14px] uppercase tracking-[0.14em]"
                        style={{ borderColor: status.color, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-5 font-mono text-lg text-[var(--color-ivory)]">
                      {p.ja_rastreado
                        ? `${p.total_bens} ${p.total_bens === 1 ? "bem" : "bens"}`
                        : "Aguardando"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
        <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
          Processo Themis
        </span>
        <h3 className="mt-3 font-serif text-[24px] leading-[1.15] text-[var(--color-gold)]">
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
          <p className="mt-2 font-medium text-[15px] text-ivory">
            {processo.credor.nome}
          </p>
        </div>
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            <Scale className="h-3 w-3" />
            Advogado responsável
          </p>
          {processo.responsavel_email ? (
            <p className="mt-2 font-mono text-[13px] text-ivory">
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
