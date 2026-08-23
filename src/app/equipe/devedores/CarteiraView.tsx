"use client";

// Carteira do escritório — visão "Por Cliente" do Banco de Dossiês.
// Ditado 24/08: o seletor Cards | Lista SAIU (o baralho CardStack foi
// aposentado) — a visão é SEMPRE a lista, no MESMO livro-razão da visão
// Devedores: trilho de infos alinhado à esquerda, NOME DO CLIENTE EM
// CAIXA ALTA laranja + documento cinza + resumo embaixo, valor estimado
// na ponta direita. Click -> /equipe/devedores/credor/{id} (nível 2).
import Link from "next/link";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { formatBRL, formatTempoRelativo } from "@/lib/format";
import type { CredorListagem } from "@/lib/devedores";

export function CarteiraView({
  credores,
  euQuery,
}: {
  credores: CredorListagem[];
  euQuery: string;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {credores.map((c) => (
        <LinhaCredor key={c.id} credor={c} euQuery={euQuery} />
      ))}
    </div>
  );
}

const GRID_LINHA_CREDOR = "sm:grid-cols-[104px_minmax(0,1fr)_200px]";

function LinhaCredor({
  credor: c,
  euQuery,
}: {
  credor: CredorListagem;
  euQuery: string;
}) {
  const docLabel = c.tipo === "PF" ? "CPF" : "CNPJ";
  const temValor = c.valor_estimado_total_brl > 0;
  return (
    <SpotlightCard
      blur={false}
      local
      claro
      className="transition hover:shadow-[0_0_24px_-10px_rgba(255,156,65,0.35)]"
    >
      <Link
        href={`/equipe/devedores/credor/${c.id}${euQuery}`}
        className={`group grid grid-cols-[72px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-5 py-4 ${GRID_LINHA_CREDOR} sm:gap-x-6`}
      >
        {/* Trilho esquerdo: nº de informações encontradas (bens dos
            devedores deste cliente) */}
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

        {/* Identificação: nome do CLIENTE em caixa alta laranja + doc cinza */}
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h3
              className="min-w-0 max-w-full truncate font-serif text-[clamp(18px,1.8vw,24px)] font-semibold uppercase leading-tight tracking-[0.02em] text-[#FF9C41] transition group-hover:underline"
              style={{
                textShadow:
                  "0 0 1px rgba(255,156,65,0.6), 0 0 14px rgba(255,156,65,0.18)",
              }}
            >
              {c.nome}
            </h3>
            <span className="shrink-0 font-mono text-[12px] tracking-[0.04em] text-[var(--color-ivory-66)]">
              {docLabel} {c.documento}
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-[13px] leading-snug text-ivory">
            {c.total_casos} {c.total_casos === 1 ? "caso" : "casos"}
            <span className="text-[var(--color-ivory-66)]">
              {" "}
              · {c.total_devedores}{" "}
              {c.total_devedores === 1 ? "devedor" : "devedores"} ·{" "}
              {formatTempoRelativo(c.ultima_consulta_em)}
            </span>
          </p>
        </div>

        {/* Ponta direita: valor estimado dos bens rastreados */}
        <div className="col-span-2 border-t border-white/10 pt-2 text-left sm:col-span-1 sm:border-t-0 sm:pt-0 sm:text-right">
          <p
            className={`font-mono text-[17px] tabular-nums leading-tight ${
              temValor ? "text-[var(--color-ivory)]" : "text-[var(--color-ivory-40)]"
            }`}
          >
            {temValor ? formatBRL(c.valor_estimado_total_brl) : "—"}
          </p>
          <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-ivory-66)]">
            {temValor ? "Valor Estimado" : "Aguardando Robôs"}
          </p>
        </div>
      </Link>
    </SpotlightCard>
  );
}
