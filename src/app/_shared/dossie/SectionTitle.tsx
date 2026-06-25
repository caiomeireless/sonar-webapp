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
      <h2 className="mt-2 font-serif text-3xl text-ivory">{texto}</h2>
    </div>
  );
}
