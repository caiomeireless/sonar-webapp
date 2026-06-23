// Top 5 credores por patrimônio localizado (Dashboard da Plataforma).
// Server component — sem 'use client', sem fetch interno. A page agrega
// e injeta os dados já prontos via `obterDadosDashboardPlataforma`.
import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { formatBRL } from "@/lib/format";
import type { TopClienteItem } from "@/lib/dashboard-plataforma";

type Props = {
  itens: TopClienteItem[];
};

export default function Top5ClientesPorPatrimonio({ itens }: Props) {
  return (
    <DashboardCard
      titulo="Top 5 clientes por patrimônio"
      descricao="Credores com maior patrimônio localizado em rastreio"
      accent="gold"
    >
      {itens.length === 0 ? (
        <p className="text-sm text-[var(--color-ivory-66)]">
          Nenhum credor com patrimônio localizado ainda.
        </p>
      ) : (
        <ol className="flex flex-col gap-1">
          {itens.map((item, idx) => (
            <li key={item.credorId}>
              <Link
                href={`/equipe/devedores/credor/${item.credorId}`}
                className={[
                  "group grid grid-cols-[1.5rem_1fr_auto_auto] items-center gap-3",
                  "rounded-lg px-2 py-2 -mx-2",
                  "transition-colors",
                  "hover:bg-[var(--color-ivory-12)]",
                  "focus-visible:bg-[var(--color-ivory-12)] focus-visible:outline-none",
                ].join(" ")}
              >
                <span
                  aria-hidden
                  className="text-base font-mono tabular-nums text-[var(--color-ivory-66)] group-hover:text-[var(--color-gold)]"
                >
                  {idx + 1}
                </span>
                <span className="truncate text-xl text-[var(--color-ivory)]">
                  {item.credorNome}
                </span>
                <span className="text-xl font-medium tabular-nums text-[var(--color-ivory)]">
                  {formatBRL(item.valorPatrimonioLocalizado)}
                </span>
                <span className="text-base tabular-nums text-[var(--color-ivory-66)] min-w-[4rem] text-right">
                  {item.qtdCasos} {item.qtdCasos === 1 ? "caso" : "casos"}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </DashboardCard>
  );
}
