// Vínculos Patrimoniais — lista de pessoas ligadas ao devedor (cônjuge, sócio,
// filho etc.) com badge sugerindo investigar o patrimônio de cada um.
//
// Por enquanto cada item entra com temPatrimonio=false (placeholder na
// agregação). O cruzamento real — rodar SISBAJUD/Receita/Junta sobre cada
// vínculo pra descobrir se ele tem bens — virá no futuro, quando o pipeline
// de consultas externas estender pros vínculos. Quando isso chegar, o badge
// passa a refletir o estado real e o CTA muda pra "Ver patrimônio".
//
// Server component: somente leitura, sem estado nem gráfico.

import type { VinculoPatrimonial } from "@/lib/dashboard-caso";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

// ============================================================
// CATÁLOGO de relações — rótulo + cor
// ============================================================
// A relação vem livre de calcularVinculosPatrimoniais() (lê detalhes.tipo /
// .relacao). Padronizamos rótulo + cor por chave conhecida; fallback usa a
// string crua capitalizada com tom neutro.

type RelacaoMeta = {
  rotulo: string;
  cor: string;
};

const RELACAO_CATALOGO: Record<string, RelacaoMeta> = {
  conjuge: { rotulo: "Cônjuge", cor: "var(--color-gold)" },
  socio: { rotulo: "Sócio", cor: "var(--color-signal)" },
  filho: { rotulo: "Filho(a)", cor: "var(--color-ivory-66)" },
  filha: { rotulo: "Filho(a)", cor: "var(--color-ivory-66)" },
  pai: { rotulo: "Pai/Mãe", cor: "var(--color-ivory-66)" },
  mae: { rotulo: "Pai/Mãe", cor: "var(--color-ivory-66)" },
  irmao: { rotulo: "Irmão(ã)", cor: "var(--color-ivory-66)" },
  irma: { rotulo: "Irmão(ã)", cor: "var(--color-ivory-66)" },
};

function metaRelacao(relacao: string): RelacaoMeta {
  const chave = relacao.trim().toLowerCase();
  const hit = RELACAO_CATALOGO[chave];
  if (hit) return hit;
  // Fallback: capitaliza primeira letra, mantém o resto.
  const rotulo =
    chave.length === 0
      ? "Vínculo"
      : chave.charAt(0).toUpperCase() + chave.slice(1);
  return { rotulo, cor: "var(--color-ivory-66)" };
}

// ============================================================
// HELPERS de exibição
// ============================================================

// Formata CPF/CNPJ sem assumir comprimento exato — se não bate em nenhum
// padrão conhecido, devolve cru. Strip de tudo que não for dígito antes.
function formatarDocumento(documento: string): string {
  const limpo = documento.replace(/\D/g, "");
  if (limpo.length === 11) {
    return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9)}`;
  }
  if (limpo.length === 14) {
    return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8, 12)}-${limpo.slice(12)}`;
  }
  return documento;
}

// ============================================================
// COMPONENTE
// ============================================================

type Props = {
  vinculos: VinculoPatrimonial[];
};

export default function VinculosPatrimoniais({ vinculos }: Props) {
  const total = vinculos.length;
  const descricao =
    total === 0
      ? "Pessoas ligadas ao devedor — alvos secundários de investigação"
      : `${total} ${total === 1 ? "pessoa ligada" : "pessoas ligadas"} ao devedor`;

  return (
    <DashboardCard
      titulo="Vínculos patrimoniais"
      descricao={descricao}
      accent="gold"
      info={
        "Cada vínculo (cônjuge, sócio, filho) é um possível alvo " +
        "secundário. O badge 'Investigar patrimônio' vira clicável " +
        "quando o pipeline de consultas externas rodar sobre os " +
        "vínculos — hoje todos saem como 'a investigar'."
      }
    >
      {total === 0 ? (
        <div className="flex items-center justify-center py-8 text-xs text-[var(--color-ivory-66)]">
          Nenhum vínculo identificado pra este devedor.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-ivory-12)]">
          {vinculos.map((v, i) => {
            const meta = metaRelacao(v.relacao);
            const documentoFormatado = formatarDocumento(v.documento);
            const temDocumento = documentoFormatado.trim().length > 0;
            return (
              <li
                key={`${v.documento || "sem-doc"}-${v.nome}-${i}`}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: meta.cor }}
                    />
                    <span className="truncate text-sm font-medium text-[var(--color-ivory)]">
                      {v.nome}
                    </span>
                    <span
                      className="eyebrow shrink-0 rounded-full border px-1.5 py-0.5 text-[10px]"
                      style={{
                        color: meta.cor,
                        borderColor: "var(--color-ivory-12)",
                      }}
                    >
                      {meta.rotulo}
                    </span>
                  </div>
                  {temDocumento ? (
                    <p className="mt-1 truncate font-mono text-[11px] text-[var(--color-ivory-66)]">
                      {documentoFormatado}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] italic text-[var(--color-ivory-66)]">
                      Sem documento informado
                    </p>
                  )}
                </div>

                {/* Badge "Investigar patrimônio".
                    temPatrimonio sempre false hoje -> sempre o estado "a
                    investigar". Quando o cruzamento real chegar, o ramo
                    `v.temPatrimonio` aqui devolve o badge verde "Tem
                    patrimônio" linkando pra um sub-dossiê. */}
                <span
                  className="shrink-0 rounded-md border px-2.5 py-1 text-[11px] text-[var(--color-ivory)]"
                  style={{
                    borderColor: v.temPatrimonio
                      ? "var(--color-signal)"
                      : "var(--color-ivory-22)",
                    color: v.temPatrimonio
                      ? "var(--color-signal)"
                      : "var(--color-ivory-66)",
                    background: v.temPatrimonio
                      ? "rgba(60, 255, 138, 0.06)"
                      : "transparent",
                  }}
                >
                  {v.temPatrimonio ? "Tem patrimônio" : "Investigar patrimônio"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
