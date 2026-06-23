// Tela Themis — fila de processos vindos do sistema interno do escritório.
// No demo (Dia 4) lê os casos do banco (mockados). No real (Sem 2) vira
// chamada ao API Themis preservando a interface ProcessoThemis.
//
// Cada card tem 3 botões de busca (Combo Lead, Combo Documento, Individual)
// via componente <AcoesBuscaCardThemis>. Cada um abre modal de confirmação
// e depois redireciona pra animação adaptada ao modo escolhido.
import { redirect } from "next/navigation";
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
      <header className="title-shield relative">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-fg-muted)]">
            Themis
          </span>
          <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
            Fila do Escritório
          </span>
        </div>
        <h1 className="mt-4 font-serif text-[clamp(34px,5vw,52px)] font-medium leading-[1.1] tracking-tight text-ivory">
          Processos a Rastrear
        </h1>
        <p className="mt-6 max-w-[680px] font-mono text-base text-[var(--color-ivory-66)]">
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                <th className="px-4 py-3">Processo</th>
                <th className="px-4 py-3">Devedor</th>
                <th className="px-4 py-3">Crédito</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rastreamento</th>
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
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-gold)]">
                      {p.numero_processo ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-ivory">{p.devedor.nome}</div>
                      <div className="font-mono text-[10px] text-[var(--color-ivory-66)]">
                        {p.devedor.tipo === "PF" ? "PF" : "PJ"} · {p.devedor.documento}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-gold)]">
                      {p.valor_credito_brl !== null ? formatBRL(p.valor_credito_brl) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]"
                        style={{ borderColor: status.color, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-ivory-88)]">
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

  return (
    <SpotlightCard className="p-7">
      {/* Top bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
          Recebido {formatTempoRelativo(processo.recebido_em)} ·{" "}
          <span className="text-ivory">{processo.credor.nome}</span>
        </span>
        <span
          className="self-start rounded-full border px-3 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ borderColor: status.color, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      {/* Número processo */}
      <p className="mt-4 font-mono text-sm text-[var(--color-gold)]">
        {processo.numero_processo ?? "Sem número de processo"}
      </p>

      {/* Devedor */}
      <h3 className="mt-2 font-serif text-2xl leading-tight text-ivory">
        {processo.devedor.nome}
      </h3>
      <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
        {processo.devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}{" "}
        · {processo.devedor.documento}
      </p>

      {/* Valor + status do rastreamento */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
            Crédito
          </span>
          <p className="mt-1 font-serif text-xl text-[var(--color-gold)]">
            {processo.valor_credito_brl !== null
              ? formatBRL(processo.valor_credito_brl)
              : "—"}
          </p>
        </div>
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
            Rastreamento
          </span>
          <p className="mt-1 font-mono text-sm text-ivory">
            {processo.ja_rastreado
              ? `${processo.total_bens} ${
                  processo.total_bens === 1
                    ? "bem já localizado"
                    : "bens já localizados"
                }`
              : "Aguardando primeira busca"}
          </p>
        </div>
      </div>

      {processo.observacoes ? (
        <p className="mt-4 border-l-2 border-[var(--color-ivory-22)] pl-3 font-mono text-xs italic text-[var(--color-ivory-66)]">
          {processo.observacoes}
        </p>
      ) : null}

      {/* Advogado responsável */}
      <div className="mt-5 border-t border-[var(--color-ivory-12)] pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
          Adv. responsável:{" "}
          {processo.responsavel_email ? (
            <span className="text-[var(--color-ivory-88)] normal-case tracking-normal">
              {processo.responsavel_email}
            </span>
          ) : (
            <span className="text-[var(--color-ivory-66)] italic normal-case tracking-normal">
              sem responsável atribuído
            </span>
          )}
        </span>
      </div>

      {/* Ações: 3 modos (Combo Lead, Combo Doc, Individual) */}
      <AcoesBuscaCardThemis
        devedorId={processo.devedor.id}
        eu={eu ?? ""}
        jaRastreado={processo.ja_rastreado}
      />
    </SpotlightCard>
  );
}
