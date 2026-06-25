// Card de numero grande pra grid de estatisticas.
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export function CardNumero({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor: string;
}) {
  return (
    <SpotlightCard className="p-8">
      <span className="font-mono text-[13px] uppercase tracking-[0.28em] text-[var(--color-ivory-66)]">
        {rotulo}
      </span>
      <p className="mt-3 font-serif text-4xl text-[var(--color-gold)]">{valor}</p>
    </SpotlightCard>
  );
}
