// KPI hero do Dashboard da Plataforma — patrimônio localizado total em R$.
// O col-span fica a cargo do grid pai (page.tsx) — assim a layout decide
// como distribuir as 12 colunas sem o componente ditar tamanho. Sem delta:
// é cumulativo, não faz sentido comparar com mês anterior.

import { KPIHero } from "@/components/dashboard/KPIHero";
import { formatBRL } from "@/lib/format";

type Props = {
  valorBrl: number;
};

export default function KPIPatrimonioTotal({ valorBrl }: Props) {
  return (
    <KPIHero
      titulo="Patrimônio localizado"
      valor={formatBRL(valorBrl)}
      subtitulo="Valor estimado dos bens identificados"
      accent="green"
    />
  );
}
