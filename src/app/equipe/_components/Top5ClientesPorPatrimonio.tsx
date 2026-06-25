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
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[var(--color-ivory-12)] text-[var(--color-ivory-66)]">
              <Th className="w-[36px]">#</Th>
              <Th className="text-[var(--color-cliente)]">Cliente</Th>
              <Th align="right" className="w-[140px]">Valor</Th>
              <Th align="right" className="w-[80px]">Casos</Th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, idx) => {
              const rank = idx + 1;
              return (
                <tr
                  key={item.credorId}
                  className="group border-b border-[var(--color-ivory-12)] last:border-b-0 transition hover:bg-[var(--color-ivory-12)]/20"
                >
                  <Td>
                    <span className="font-mono text-[15px] text-[var(--color-ivory-66)] tabular-nums">
                      {rank}
                    </span>
                  </Td>
                  <Td>
                    <Link
                      href={`/equipe/devedores/credor/${item.credorId}`}
                      className="nome-cliente block font-serif text-[17px] leading-[1.2] text-[var(--color-cliente)] break-words transition group-hover:underline"
                      title={item.credorNome}
                    >
                      {item.credorNome}
                    </Link>
                  </Td>
                  <Td align="right">
                    <span className="font-mono text-[14px] tabular-nums text-ivory whitespace-nowrap">
                      {formatBRL(item.valorPatrimonioLocalizado)}
                    </span>
                  </Td>
                  <Td align="right">
                    <span className="font-mono text-[15px] tabular-nums text-[var(--color-ivory-88)]">
                      {item.qtdCasos}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </DashboardCard>
  );
}

function Th({
  children,
  align,
  className,
}: {
  children: React.ReactNode;
  align?: "right";
  className?: string;
}) {
  return (
    <th
      className={
        "px-2 py-2 font-mono text-[10px] uppercase tracking-[0.22em] font-normal " +
        (align === "right" ? "text-right " : "text-left ") +
        (className ?? "")
      }
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <td
      className={
        "px-2 py-3 align-top " + (align === "right" ? "text-right" : "")
      }
    >
      {children}
    </td>
  );
}
