// Top 5 devedores por valor estimado de bens em rastreio — card do
// Dashboard da Plataforma (/equipe). Tabela compacta, linha clicável leva
// a /equipe/devedores/[id]. Server Component: lista + Link, sem Recharts.
//
// Recebe dados já agregados (TopDevedorItem[]) — a page chama
// obterDadosDashboardPlataforma.

import Link from "next/link";
import type { TopDevedorItem } from "@/lib/dashboard-plataforma";
import { formatBRL } from "@/lib/format";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

type Props = {
  dados: TopDevedorItem[];
};

export default function Top5DevedoresRastreio({ dados }: Props) {
  return (
    <DashboardCard
      titulo="Top 5 devedores em rastreio"
      descricao="Maior patrimônio estimado localizado"
      accent="gold"
    >
      {dados.length === 0 ? (
        <p className="text-sm text-[var(--color-ivory-66)]">
          Nenhum devedor com bens em rastreio.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--color-ivory-12)] text-[var(--color-ivory-66)]">
                <Th>#</Th>
                <Th>Devedor</Th>
                <Th align="right">Valor estimado</Th>
                <Th align="right">Casos</Th>
                <Th align="right">Medidas</Th>
              </tr>
            </thead>
            <tbody>
              {dados.map((item, idx) => {
                const rank = idx + 1;
                return (
                  <tr
                    key={item.devedorId}
                    className="group border-b border-[var(--color-ivory-12)] last:border-b-0 transition hover:bg-[var(--color-ivory-12)]/20"
                  >
                    <Td>
                      <span className="font-mono text-[16px] text-[var(--color-ivory-66)] tabular-nums">
                        {rank}
                      </span>
                    </Td>
                    <Td>
                      <Link
                        href={`/equipe/devedores/${item.devedorId}`}
                        className="block truncate font-serif text-[21px] leading-tight text-[var(--color-gold)] transition group-hover:underline"
                        title={item.devedorNome}
                      >
                        {item.devedorNome}
                      </Link>
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-[18px] tabular-nums text-ivory">
                        {formatBRL(item.valorEstimadoBens)}
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-[18px] tabular-nums text-[var(--color-ivory-88)]">
                        {item.qtdCasos}
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-[18px] tabular-nums text-[var(--color-ivory-88)]">
                        {item.qtdMedidas}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={
        "px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] font-normal " +
        (align === "right" ? "text-right" : "text-left")
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
        "px-3 py-2.5 align-middle " + (align === "right" ? "text-right" : "")
      }
    >
      {children}
    </td>
  );
}
