// Card glass de bloco de ficha + CampoFicha + ChipOrigem.
// CampoFicha aceita `mostrarChipOrigem` (default true) — cliente passa false
// pra esconder a mecanica das APIs.
// Reforma 25/08 v2: a pauta de caderno SAIU (ditado do Caio — "ficou
// muito ruim"). O estilo de FICHA agora vem dos próprios campos: vidro
// claro com borda dourada, rótulos maiores e cada campo sobre a sua
// linha (border-b), com valores grandes.
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export type OrigemFicha = "VIA THEMIS" | "VIA ASSERTIVA" | "MANUAL";

/** Borda dourada de descanso dos cards da ficha. */
export const BORDA_CADERNO = "rgba(201, 162, 74, 0.28)";

export function SecaoFicha({
  titulo,
  children,
  eyebrowColor = "var(--color-signal)",
}: {
  titulo: string;
  children: React.ReactNode;
  eyebrowColor?: string;
}) {
  return (
    <SpotlightCard local claro borda={BORDA_CADERNO} className="p-6 sm:p-8">
      <div className="relative pl-4">
        <span
          aria-hidden="true"
          className="absolute left-0 top-0.5 h-6 w-1 rounded-full"
          style={{ backgroundColor: eyebrowColor }}
        />
        <h3
          className="font-mono text-[15px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: eyebrowColor }}
        >
          {titulo}
        </h3>
      </div>
      <div className="mt-6">{children}</div>
    </SpotlightCard>
  );
}

export function CampoFicha({
  rotulo,
  valor,
  origem,
  valorClassName,
  mostrarChipOrigem = true,
}: {
  rotulo: string;
  valor: string | null | undefined;
  origem?: OrigemFicha;
  valorClassName?: string;
  mostrarChipOrigem?: boolean;
}) {
  const valorFinal = valor && valor.trim() !== "" ? valor : null;
  // Cada campo é uma LINHA de ficha: rótulo maior, valor grande e a
  // linha de preenchimento embaixo (a "pauta" agora acompanha o campo).
  return (
    <div className="border-b border-[rgba(201,162,74,0.16)] pb-4 last:border-b-0 last:pb-0 [&:not(:first-child)]:pt-4">
      <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
        {rotulo}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
        <span
          className={
            valorFinal
              ? `text-xl leading-snug ${valorClassName ?? "text-ivory"}`
              : "text-xl leading-snug text-[var(--color-ivory-40)]"
          }
        >
          {valorFinal ?? "—"}
        </span>
        {valorFinal && origem && mostrarChipOrigem ? (
          <ChipOrigem origem={origem} />
        ) : null}
      </div>
    </div>
  );
}

// Paleta de origem (padrao Caio 2026-07-02):
//   THEMIS             -> verde signal
//   ASSERTIVA LOCALIZE -> roxo neon (campos da ficha preenchidos pelo Localize)
//   ASSERTIVA VEICULOS -> laranja neon (bens de frota, ver CardBem)
//   MANUAL             -> dourado
export function ChipOrigem({ origem }: { origem: OrigemFicha }) {
  const map: Record<
    OrigemFicha,
    { label: string; color: string; bg: string; border: string }
  > = {
    "VIA THEMIS": {
      label: "VIA THEMIS",
      color: "var(--color-signal)",
      bg: "rgba(60,255,138,0.10)",
      border: "rgba(60,255,138,0.45)",
    },
    "VIA ASSERTIVA": {
      label: "ASSERTIVA LOCALIZE",
      color: "#C084FC",
      bg: "rgba(192,132,252,0.12)",
      border: "rgba(192,132,252,0.50)",
    },
    MANUAL: {
      label: "MANUAL",
      color: "var(--color-gold)",
      bg: "rgba(201,162,74,0.10)",
      border: "rgba(201,162,74,0.45)",
    },
  };
  const { label, color, bg, border } = map[origem];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em]"
      style={{ borderColor: border, color, backgroundColor: bg }}
    >
      {label}
    </span>
  );
}
