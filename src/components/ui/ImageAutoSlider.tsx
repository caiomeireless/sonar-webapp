// Slider horizontal infinito com mascara de fade nas bordas.
// Adaptado pra Sonar: sem bg proprio, anel dourado sutil, sombra profunda
// e legenda monoespacada. Recebe a lista de imagens via prop.
type Image = { src: string; alt: string };

type Props = {
  images: Image[];
  /** Quantas vezes repetir a lista pra evitar carrossel "raso" se houver poucas fotos. */
  repeat?: number;
  className?: string;
};

export function ImageAutoSlider({ images, repeat = 1, className = "" }: Props) {
  // Repete a lista N vezes e depois duplica tudo (pra emendar o loop sem corte).
  const expanded = Array.from({ length: Math.max(1, repeat) }).flatMap(
    () => images,
  );
  const doubled = [...expanded, ...expanded];

  return (
    <div className={`image-strip-mask w-full overflow-hidden ${className}`}>
      {/* Keyframes inline pra escapar de qualquer conflito de layer/cache do Tailwind v4 */}
      <style>{`
        @keyframes sonar-strip-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div
        className="flex w-max gap-8"
        style={{
          animation: "sonar-strip-scroll 30s linear infinite",
          willChange: "transform",
        }}
      >
        {doubled.map((img, i) => (
          <figure
            key={i}
            className="image-slide-card group relative aspect-[3/2] w-[576px] flex-none overflow-hidden rounded-xl md:w-[768px]"
            style={{
              boxShadow:
                "0 18px 50px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(201,162,74,0.14)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
            {/* Tint cinematografico — escurece topo levemente e rodape mais forte */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,12,11,0.18) 0%, rgba(10,12,11,0) 35%, rgba(10,12,11,0) 60%, rgba(10,12,11,0.65) 100%)",
              }}
              aria-hidden="true"
            />
            {/* Anel dourado interno bem sutil */}
            <div
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{ boxShadow: "inset 0 0 28px rgba(201,162,74,0.08)" }}
              aria-hidden="true"
            />
          </figure>
        ))}
      </div>
    </div>
  );
}
