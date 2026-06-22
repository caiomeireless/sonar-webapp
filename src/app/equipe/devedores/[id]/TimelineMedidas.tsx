// Timeline horizontal das medidas tomadas nos casos do devedor.
// Server Component (puro markup) — recebe `medidas` e `casos` como prop,
// sem fetch interno. A parte interativa (estado local, modal de adicionar)
// vive no client component AdicionarMedidaForm, que tambem renderiza os
// cards (pra refletir adicoes locais sem persistir no DB).

import { AdicionarMedidaForm } from "./AdicionarMedidaForm";
import type { Medida } from "@/lib/medidas";
import type { CasoResumo } from "@/lib/casos";

type Props = {
  medidas: Medida[];
  casos: CasoResumo[];
  advogadoEmail: string | null;
};

export function TimelineMedidas({ medidas, casos, advogadoEmail }: Props) {
  // Mapa caso_id -> numero_processo pra cada card mostrar de qual caso veio.
  const casoNumeroPorId: Record<number, string | null> = {};
  for (const c of casos) {
    casoNumeroPorId[c.id] = c.numero_processo;
  }

  return (
    <section className="border-t border-[var(--color-ivory-12)]">
      <div className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
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
      </div>
    </section>
  );
}
