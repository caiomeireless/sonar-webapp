// Titulo padrao das secoes grandes do dossie: eyebrow (mono signal) + h2 serif.
export function SectionTitle({
  texto,
  eyebrow,
  eyebrowColor = "var(--color-signal)",
}: {
  texto: string;
  eyebrow?: string;
  eyebrowColor?: string;
}) {
  return (
    <div>
      {eyebrow ? (
        <span
          className="font-mono text-[12px] uppercase tracking-[0.32em]"
          style={{ color: eyebrowColor }}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2 className="mt-2 font-serif text-[clamp(26px,2.6vw,40px)] uppercase leading-[1.1] tracking-[0.06em] text-[var(--color-gold)]">
        {texto}
      </h2>
    </div>
  );
}
