"use client";

// NÍVEL 2 da carteira — casos de um cliente específico, no MESMO
// livro-razão da lista de devedores (reforma 25/08): trilho de infos,
// DEVEDOR EM CAIXA ALTA vermelho + documento cinza, processo/pasta na
// sub-linha e valor da execução na ponta. Click SEMPRE leva à ficha do
// devedor (/equipe/devedores/{devedor_id}). O baralho CardDeck e o
// seletor Cards|Lista foram aposentados.
import Link from "next/link";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BORDA_CADERNO } from "@/app/_shared/dossie/SecaoFicha";
import { formatBRL, formatTempoRelativo } from "@/lib/format";
import type { CredorComCasos } from "@/lib/devedores";

type CasoRow = CredorComCasos["casos"][number];

const GRID_LINHA = "sm:grid-cols-[104px_minmax(0,1fr)_200px]";

export function CasosCredorView({
  casos,
  euQuery,
}: {
  casos: CasoRow[];
  euQuery: string;
}) {
  return (
    <div className="mt-6 flex flex-col gap-2">
      {casos.map((c) => (
        <LinhaCaso key={c.caso_id} caso={c} euQuery={euQuery} />
      ))}
    </div>
  );
}

function LinhaCaso({ caso: c, euQuery }: { caso: CasoRow; euQuery: string }) {
  const docLabel = c.devedor.tipo === "PF" ? "CPF" : "CNPJ";
  const temExecucao = (c.valor_credito_brl ?? 0) > 0;
  return (
    <SpotlightCard
      blur={false}
      local
      claro
      borda={BORDA_CADERNO}
      className="transition hover:shadow-[0_0_24px_-10px_rgba(220,38,38,0.35)]"
    >
      <Link
        href={`/equipe/devedores/${c.devedor.id}${euQuery}`}
        className={`group grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-5 py-4 ${GRID_LINHA} sm:gap-x-6`}
      >
        {/* Trilho esquerdo: informações encontradas neste devedor */}
        <div className="text-center sm:border-r sm:border-white/10 sm:pr-5">
          <p
            className={`font-mono text-[26px] font-medium leading-none tabular-nums ${
              c.total_bens > 0
                ? "text-[var(--color-signal)]"
                : "text-[var(--color-ivory-40)]"
            }`}
          >
            {c.total_bens}
          </p>
          <p className="mt-1.5 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
            {c.total_bens === 1 ? "Info" : "Infos"}
          </p>
        </div>

        {/* Identificação: DEVEDOR em caixa alta vermelho + documento */}
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h3
              className="min-w-0 max-w-full truncate font-serif text-[clamp(18px,1.8vw,24px)] font-semibold uppercase leading-tight tracking-[0.02em] text-[var(--color-devedor)] transition group-hover:underline"
              style={{
                textShadow:
                  "0 0 1px rgba(220,38,38,0.6), 0 0 12px rgba(220,38,38,0.16)",
              }}
            >
              {c.devedor.nome}
            </h3>
            <span className="shrink-0 font-mono text-[12px] tracking-[0.04em] text-[var(--color-ivory-66)]">
              {docLabel} {c.devedor.documento}
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-[13px] leading-snug text-ivory">
            {c.numero_processo ?? "Sem processo cadastrado"}
            <span className="text-[var(--color-ivory-66)]">
              {c.pasta_themis ? ` · Pasta ${c.pasta_themis}` : ""} ·{" "}
              {formatTempoRelativo(c.ultima_consulta_em)}
            </span>
          </p>
        </div>

        {/* Ponta direita: valor da execução */}
        <div className="col-span-2 border-t border-white/10 pt-2 text-left sm:col-span-1 sm:border-t-0 sm:pt-0 sm:text-right">
          <p
            className={`font-mono text-[17px] tabular-nums leading-tight ${
              temExecucao
                ? "text-[var(--color-ivory)]"
                : "text-[var(--color-ivory-40)]"
            }`}
          >
            {temExecucao ? formatBRL(c.valor_credito_brl ?? 0) : "—"}
          </p>
          <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-ivory-66)]">
            {temExecucao ? "Execução Atualizada" : "Aguardando Robôs"}
          </p>
        </div>
      </Link>
    </SpotlightCard>
  );
}
