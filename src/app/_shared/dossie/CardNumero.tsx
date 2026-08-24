// Card de numero grande pra grid de estatisticas.
// v3 (ditado 25/08): rótulo BRANCO, número maior e o mesmo vidro polido
// com brilho da tela de Início.
import { SpotlightCard } from "@/components/ui/SpotlightCard";

const VIDRO_BRILHO = [
  "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03) 38%, transparent 55%)",
  "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.06) 34%, rgba(255,255,255,0.13) 45%, rgba(255,255,255,0.05) 56%, transparent 72%)",
].join(", ");

export function CardNumero({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor: string;
}) {
  return (
    <SpotlightCard
      local
      degrade={VIDRO_BRILHO}
      borda="rgba(232, 228, 214, 0.25)"
      className="overflow-hidden p-8 text-center"
    >
      <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.28em] text-ivory">
        {rotulo}
      </span>
      <p className="mt-3 font-serif text-[clamp(38px,3.2vw,52px)] leading-none text-[var(--color-gold)]">
        {valor}
      </p>
    </SpotlightCard>
  );
}
