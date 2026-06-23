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

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function ThemisPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(params.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const processos = await listarProcessosThemis();
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  const totalProcessos = processos.length;
  const totalRastreados = processos.filter((p) => p.ja_rastreado).length;
  const totalPendentes = totalProcessos - totalRastreados;

  return (
    <main className="relative mx-auto max-w-[1100px] px-6 py-16 sm:px-10">
      {/* Glow de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[900px] -translate-x-1/2 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(201,162,74,0.14), transparent 65%)",
        }}
      />

      {/* Cabeçalho */}
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="eyebrow">Themis</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
            Fila do escritório
          </span>
        </div>
        <h1 className="mt-4 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.15] tracking-tight text-ivory">
          Processos a rastrear
        </h1>
        <p className="mt-6 max-w-[680px] font-mono text-sm text-[var(--color-ivory-66)]">
          {totalProcessos === 0
            ? "Nenhum processo recebido do Themis ainda."
            : `${totalProcessos} ${
                totalProcessos === 1 ? "processo recebido" : "processos recebidos"
              } do sistema interno · ${totalPendentes} ${
                totalPendentes === 1 ? "pendente" : "pendentes"
              } de busca · ${totalRastreados} já rastreado${
                totalRastreados === 1 ? "" : "s"
              }`}
        </p>
      </div>

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
