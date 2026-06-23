// Luz "lamp" — duas conic gradients formando um V de luz que desce do topo
// do container, com glow focado + linha horizontal brilhante.
// Adaptado de um prompt de hero com framer-motion — aqui usamos CSS keyframes
// (definidas em globals.css) pra evitar uma dependência nova.
//
// Default dourado (signal gold do Sonar). O bgClass das máscaras precisa bater
// com o fundo da section onde o LampLight é colocado, senão o V de luz vaza.
type LampLightProps = {
  /** Cor da luz em "R, G, B" — usada com várias opacidades. */
  color?: string;
  /** Classe Tailwind do fundo da section pai (default bg-onyx). */
  bgClass?: string;
  className?: string;
};

export function LampLight({
  color = "201, 162, 74", // ouro Sonar
  bgClass = "bg-onyx",
  className = "",
}: LampLightProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-0 z-0 h-[28rem] overflow-hidden ${className}`}
    >
      {/* Backdrop blur sutil no topo */}
      <div className="absolute left-0 right-0 top-0 z-10 h-48 opacity-5 backdrop-blur-md" />

      {/* Glow principal — disco grande borrado, levemente abaixo da linha */}
      <div
        className="absolute left-1/2 top-0 z-10 h-36 w-[28rem] -translate-x-1/2 translate-y-2 rounded-full opacity-45 blur-3xl"
        style={{ background: `rgba(${color}, 0.35)` }}
      />

      {/* Glow focal animado crescendo de 8rem -> 16rem (no ponto da "lâmpada") */}
      <div
        className="lamp-anim-glow absolute left-1/2 top-0 z-10 h-36 -translate-x-1/2 -translate-y-2 rounded-full opacity-70 blur-2xl"
        style={{ background: `rgba(${color}, 0.35)` }}
      />

      {/* Linha brilhante horizontal no foco da lâmpada — bem no topo */}
      <div
        className="lamp-anim-line absolute left-1/2 top-0 z-30 h-0.5 -translate-x-1/2"
        style={{ background: `rgba(${color}, 0.55)` }}
      />

      {/* Cone esquerdo — conic gradient virando o vértice pro topo */}
      <div
        className="lamp-anim-cone absolute right-1/2 top-0 h-56"
        style={{
          backgroundImage: `conic-gradient(from 70deg at center top, rgba(${color}, 0.3), transparent 50%, transparent 100%)`,
        }}
      >
        <div
          className={`absolute bottom-0 left-0 z-20 h-40 w-full ${bgClass}`}
          style={{
            maskImage: "linear-gradient(to top, white, transparent)",
            WebkitMaskImage: "linear-gradient(to top, white, transparent)",
          }}
        />
        <div
          className={`absolute bottom-0 left-0 z-20 h-full w-40 ${bgClass}`}
          style={{
            maskImage: "linear-gradient(to right, white, transparent)",
            WebkitMaskImage: "linear-gradient(to right, white, transparent)",
          }}
        />
      </div>

      {/* Cone direito */}
      <div
        className="lamp-anim-cone absolute left-1/2 top-0 h-56"
        style={{
          backgroundImage: `conic-gradient(from 290deg at center top, transparent 0%, transparent 50%, rgba(${color}, 0.3))`,
        }}
      >
        <div
          className={`absolute bottom-0 right-0 z-20 h-40 w-full ${bgClass}`}
          style={{
            maskImage: "linear-gradient(to top, white, transparent)",
            WebkitMaskImage: "linear-gradient(to top, white, transparent)",
          }}
        />
        <div
          className={`absolute bottom-0 right-0 z-20 h-full w-40 ${bgClass}`}
          style={{
            maskImage: "linear-gradient(to left, white, transparent)",
            WebkitMaskImage: "linear-gradient(to left, white, transparent)",
          }}
        />
      </div>
    </div>
  );
}
