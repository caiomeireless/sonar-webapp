// Card glass de bloco de ficha + CampoFicha + ChipOrigem.
// CampoFicha aceita `mostrarChipOrigem` (default true) — cliente passa false
// pra esconder a mecanica das APIs.

export type OrigemFicha = "VIA THEMIS" | "VIA ASSERTIVA" | "MANUAL";

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
    <div className="rounded-2xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.6)] p-6 sm:p-7">
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
    </div>
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

export function ChipOrigem({ origem }: { origem: OrigemFicha }) {
  const map: Record<
    OrigemFicha,
    { color: string; bg: string; border: string }
  > = {
    "VIA THEMIS": {
      color: "rgb(244,197,66)",
      bg: "rgba(244,197,66,0.15)",
      border: "rgba(244,197,66,0.45)",
    },
    "VIA ASSERTIVA": {
      color: "var(--color-signal)",
      bg: "rgba(60,255,138,0.10)",
      border: "rgba(60,255,138,0.45)",
    },
    MANUAL: {
      color: "var(--color-gold)",
      bg: "rgba(201,162,74,0.10)",
      border: "rgba(201,162,74,0.45)",
    },
  };
  const { color, bg, border } = map[origem];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em]"
      style={{ borderColor: border, color, backgroundColor: bg }}
    >
      {origem}
    </span>
  );
}
