// Grid de 3 cards de numero — Total de Bens / Valor Estimado / Casos.
import { formatBRL } from "@/lib/format";
import { CardNumero } from "./CardNumero";

export function EstatisticasGrid({
  totalBens,
  valorEstimado,
  casosVinculados,
}: {
  totalBens: number;
  valorEstimado: number;
  casosVinculados: number;
}) {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      <CardNumero rotulo="Total de Bens" valor={String(totalBens)} />
      <CardNumero
        rotulo="Valor Estimado Total"
        valor={formatBRL(valorEstimado)}
      />
      <CardNumero rotulo="Casos Vinculados" valor={String(casosVinculados)} />
    </div>
  );
}
