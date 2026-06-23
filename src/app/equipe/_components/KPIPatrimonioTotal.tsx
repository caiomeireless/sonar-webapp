// KPI hero do Dashboard da Plataforma — patrimonio localizado total em R$.
// O col-span fica a cargo do grid pai (page.tsx) — assim a layout decide
// como distribuir as 12 colunas sem o componente ditar tamanho. Sem delta:
// e cumulativo, nao faz sentido comparar com mes anterior.

import { KPIHero } from "@/components/dashboard/KPIHero";
import { formatBRL } from "@/lib/format";

type Props = {
  valorBrl: number;
};

export default function KPIPatrimonioTotal({ valorBrl }: Props) {
  return (
    <KPIHero
      titulo="Patrimonio localizado"
      valor={formatBRL(valorBrl)}
      subtitulo="Valor estimado dos bens identificados"
      accent="green"
    />
  );
}
