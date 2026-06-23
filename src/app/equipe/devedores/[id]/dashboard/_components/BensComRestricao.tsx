// Lista compacta dos bens com restricao_suspeita (impenhorabilidade
// provavel: Lei 8.009, CPC 833 IV, bem de familia, etc).
//
// Cada item: badge do tipo + titulo + chip do motivo + valor estimado.
// Estado vazio = bom: "Sem alertas".
//
// Recebe dados ja agregados (page chama obterDadosDashboardCasoV2).
// Server Component — sem Recharts, sem interatividade.

import type { TipoBem } from "@/lib/mock-fixtures";
import type { BemComRestricao } from "@/lib/dashboard-caso";
import { formatBRL } from "@/lib/format";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

// Meta dos tipos de bem — espelha DonutBensPorValor. Nao ha export
// centralizado em @/lib/devedores, entao inline pra manter consistencia
// visual com os outros cards do dashboard.
const TIPO_META: Record<TipoBem, { label: string; icone: string }> = {
  veiculo: { label: "Veiculo", icone: "V" },
  imovel: { label: "Imovel", icone: "I" },
  empresa: { label: "Participacao", icone: "E" },
  processo_credito: { label: "Credito", icone: "P" },
  endereco: { label: "Endereco", icone: "A" },
  vinculo: { label: "Vinculo", icone: "F" },
};

// Mapa de codigos canonicos de motivo -> rotulo curto pro chip.
// Quando vier um motivo fora do dicionario, mostra o proprio texto.
const MOTIVO_ROTULO: Record<string, string> = {
  lei_8009: "Lei 8.009 — bem de familia",
  bem_de_familia: "Lei 8.009 — bem de familia",
  cpc_833_iv: "CPC 833 IV — verba salarial",
  cpc_833: "CPC 833 — impenhoravel",
  salario: "CPC 833 IV — verba salarial",
  unico_imovel: "Lei 8.009 — unico imovel",
  ferramenta_trabalho: "CPC 833 V — ferramenta de trabalho",
  restricao_nao_especificada: "Restricao nao especificada",
};

function rotularMotivo(motivo: string): string {
  return MOTIVO_ROTULO[motivo] ?? motivo;
}

type Props = {
  dados: BemComRestricao[];
};

export default function BensComRestricao({ dados }: Props) {
  if (dados.length === 0) {
    return (
      <DashboardCard
        titulo="Bens com restricao"
        descricao="Bens sob suspeita de impenhorabilidade"
        accent="green"
      >
        <div className="flex items-center gap-3 rounded-md border border-[var(--color-ivory-12)] bg-[var(--color-onyx)] px-4 py-3">
          <span
            aria-hidden
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "rgba(60, 255, 138, 0.12)",
              color: "var(--color-signal)",
              border: "1px solid rgba(60, 255, 138, 0.35)",
            }}
          >
            {/* check sutil em texto pra nao depender de icon lib */}
            <span className="text-xs font-semibold">OK</span>
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[var(--color-ivory)]">
              Sem alertas
            </span>
            <span className="text-xs text-[var(--color-ivory-66)]">
              Nenhum bem deste devedor levanta suspeita de impenhorabilidade.
            </span>
          </div>
        </div>
      </DashboardCard>
    );
  }

  const totalValor = dados.reduce((s, d) => s + d.valorBrl, 0);

  return (
    <DashboardCard
      titulo="Bens com restricao"
      descricao={`${dados.length} ${
        dados.length === 1 ? "bem" : "bens"
      } sob suspeita de impenhorabilidade`}
      accent="gold"
      info={
        "Bens com possivel protecao legal (Lei 8.009, CPC 833 etc).\n" +
        "Verifique penhorabilidade antes de redigir peticao."
      }
    >
      <ul className="flex flex-col gap-2">
        {dados.map((b) => {
          const meta = TIPO_META[b.tipo];
          return (
            <li
              key={b.bemId}
              className="flex items-start gap-3 rounded-md border border-[var(--color-ivory-12)] bg-[var(--color-onyx)] px-3 py-2.5"
            >
              {/* Badge do tipo */}
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-semibold"
                style={{
                  background: "rgba(201, 162, 74, 0.12)",
                  color: "var(--color-gold)",
                  border: "1px solid rgba(201, 162, 74, 0.35)",
                }}
                title={meta?.label ?? b.tipo}
              >
                {meta?.icone ?? "?"}
              </span>

              {/* Conteudo principal */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium text-[var(--color-ivory)]">
                    {b.titulo}
                  </span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-[var(--color-ivory)]">
                    {formatBRL(b.valorBrl)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Chip do motivo */}
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] text-[var(--color-ivory-66)]"
                    style={{
                      background: "rgba(232, 228, 214, 0.05)",
                      border: "1px solid var(--color-ivory-12)",
                    }}
                  >
                    {rotularMotivo(b.motivo)}
                  </span>

                  {/* Badge amber "Verificar penhorabilidade" */}
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: "rgba(244, 197, 66, 0.12)",
                      color: "#f4c542",
                      border: "1px solid rgba(244, 197, 66, 0.35)",
                    }}
                  >
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: "#f4c542" }}
                    />
                    Verificar penhorabilidade
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="mt-4 flex items-baseline justify-between border-t border-[var(--color-ivory-12)] pt-3">
        <span className="eyebrow text-[var(--color-ivory-66)]">
          Valor em risco
        </span>
        <span className="font-mono text-lg font-medium tabular-nums text-[var(--color-gold)]">
          {formatBRL(totalValor)}
        </span>
      </footer>
    </DashboardCard>
  );
}
