// Timeline vertical das medidas tomadas nos casos do devedor — linha verde
// signal com pontos coloridos por resultado a esquerda, card glass a direita.
// Server Component (puro markup) — recebe `medidas` e `casos` como prop,
// sem fetch interno. A parte interativa (estado local, modal de adicionar)
// vive no client component AdicionarMedidaForm, que também renderiza os
// cards (pra refletir adições locais sem persistir no DB).
//
// `somenteLeitura` (default false) — quando true, renderiza so a visualizacao
// (sem botao + modal). Usado pela visao do cliente.

import {
  AdicionarMedidaForm,
  TimelineMedidasVisual,
} from "./AdicionarMedidaForm";
import type { Medida } from "@/lib/medidas";
import type { CasoResumo } from "@/lib/casos";

type Props = {
  medidas: Medida[];
  casos: CasoResumo[];
  advogadoEmail: string | null;
  somenteLeitura?: boolean;
};

export function TimelineMedidas({
  medidas,
  casos,
  advogadoEmail,
  somenteLeitura = false,
}: Props) {
  // Mapa caso_id -> número_processo pra cada card mostrar de qual caso veio.
  const casoNumeroPorId: Record<number, string | null> = {};
  for (const c of casos) {
    casoNumeroPorId[c.id] = c.numero_processo;
  }

  return (
    <section className="border-t border-[var(--color-ivory-12)]">
      <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
        {somenteLeitura ? (
          <>
            <div>
              <span className="eyebrow">Histórico de medidas tomadas</span>
              <p className="mt-2 font-mono text-xs text-[var(--color-ivory-66)]">
                {medidas.length}{" "}
                {medidas.length === 1
                  ? "medida registrada"
                  : "medidas registradas"}
              </p>
            </div>
            <TimelineMedidasVisual
              medidas={[...medidas].sort((a, b) =>
                a.data > b.data ? -1 : a.data < b.data ? 1 : 0,
              )}
              casoNumeroPorId={casoNumeroPorId}
              emptyHint="Nenhuma medida registrada ainda."
            />
          </>
        ) : (
          <AdicionarMedidaForm
            casos={casos.map((c) => ({
              id: c.id,
              numero_processo: c.numero_processo,
              credor_nome: c.credor.nome,
            }))}
            casoNumeroPorId={casoNumeroPorId}
            advogadoEmail={advogadoEmail}
            medidasIniciais={medidas}
          />
        )}
      </div>
    </section>
  );
}
