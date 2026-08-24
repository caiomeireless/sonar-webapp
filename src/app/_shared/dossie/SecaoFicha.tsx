// Card glass de bloco de ficha + CampoFicha + ChipOrigem.
// CampoFicha aceita `mostrarChipOrigem` (default true) — cliente passa false
// pra esconder a mecanica das APIs.
// Reforma 25/08: estilo FOLHA DE CADERNO pautada — vidro preto com linhas
// horizontais douradas + borda dourada (constantes exportadas pra reuso
// nas outras seções da ficha).
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export type OrigemFicha = "VIA THEMIS" | "VIA ASSERTIVA" | "MANUAL";

/** Linhas de caderno: pauta dourada sutil a cada 28px. */
export const LINHAS_CADERNO =
  "repeating-linear-gradient(180deg, transparent 0px, transparent 27px, rgba(201,162,74,0.14) 27px, rgba(201,162,74,0.14) 28px)";
/** Borda dourada de descanso dos cards pautados. */
export const BORDA_CADERNO = "rgba(201, 162, 74, 0.30)";

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
    <SpotlightCard
      local
      degrade={LINHAS_CADERNO}
      borda={BORDA_CADERNO}
      className="p-6 sm:p-7"
    >
      <div className="relative pl-4">
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-6 w-1 rounded-full"
          style={{ backgroundColor: eyebrowColor }}
        />
        <h3
          className="font-mono text-[13px] uppercase tracking-[0.32em]"
          style={{ color: eyebrowColor }}
        >
          {titulo}
        </h3>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
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
  return (
    <div>
      <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
        {rotulo}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={
            valorFinal
              ? `text-lg ${valorClassName ?? "text-ivory"}`
              : "text-lg text-[var(--color-ivory-66)]"
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
