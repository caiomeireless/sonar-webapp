// Simbolo do Sonar (radar). Componente puro - sem dependencias de runtime.
// Renderiza o SVG inline para permitir controle fino de tamanho/aria.
// Anatomia documentada no README do handoff.

type Props = {
  size?: number;
  className?: string;
  "aria-label"?: string;
};

export function SonarMark({ size = 100, className, "aria-label": ariaLabel = "Sonar" }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      aria-label={ariaLabel}
      className={className}
    >
      <defs>
        <radialGradient id="sweep" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3CFF8A" stopOpacity="0.42" />
          <stop offset="80%" stopColor="#3CFF8A" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#3CFF8A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="tipGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8FFEE" stopOpacity="1" />
          <stop offset="60%" stopColor="#3CFF8A" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3CFF8A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer ring */}
      <circle cx="50" cy="50" r="46" stroke="#3CFF8A" strokeWidth="0.9" />
      {/* Tick ring */}
      <circle cx="50" cy="50" r="44.5" stroke="#3CFF8A" strokeWidth="3" strokeDasharray="0.45 11.2" strokeOpacity="0.75" />
      {/* Cardinal extensions */}
      <line x1="50" y1="1" x2="50" y2="6" stroke="#3CFF8A" strokeWidth="0.9" />
      <line x1="50" y1="94" x2="50" y2="99" stroke="#3CFF8A" strokeWidth="0.9" />
      <line x1="1" y1="50" x2="6" y2="50" stroke="#3CFF8A" strokeWidth="0.9" />
      <line x1="94" y1="50" x2="99" y2="50" stroke="#3CFF8A" strokeWidth="0.9" />
      {/* Concentric rings */}
      <circle cx="50" cy="50" r="36" stroke="#3CFF8A" strokeWidth="0.4" strokeOpacity="0.5" />
      <circle cx="50" cy="50" r="26" stroke="#3CFF8A" strokeWidth="0.4" strokeOpacity="0.5" />
      <circle cx="50" cy="50" r="16" stroke="#3CFF8A" strokeWidth="0.4" strokeOpacity="0.5" />
      {/* Cardinal cross */}
      <line x1="6" y1="50" x2="94" y2="50" stroke="#3CFF8A" strokeWidth="0.3" strokeOpacity="0.28" />
      <line x1="50" y1="6" x2="50" y2="94" stroke="#3CFF8A" strokeWidth="0.3" strokeOpacity="0.28" />
      {/* Diagonals */}
      <line x1="18" y1="18" x2="82" y2="82" stroke="#3CFF8A" strokeWidth="0.25" strokeOpacity="0.18" />
      <line x1="82" y1="18" x2="18" y2="82" stroke="#3CFF8A" strokeWidth="0.25" strokeOpacity="0.18" />
      {/* Sweep wedge */}
      <path d="M 50 50 L 50 4 A 46 46 0 0 1 92.5 31 Z" fill="url(#sweep)" />
      <line x1="50" y1="50" x2="50" y2="4" stroke="#3CFF8A" strokeWidth="1" />
      {/* Tip glow */}
      <circle cx="50" cy="4" r="3.5" fill="url(#tipGlow)" />
      <circle cx="50" cy="4" r="0.9" fill="#FFFFFF" />
      {/* Blips (alvos dourados) */}
      <circle cx="72" cy="34" r="3.5" fill="#C9A24A" fillOpacity="0.18" />
      <circle cx="72" cy="34" r="1.6" fill="#C9A24A" />
      <circle cx="62" cy="22" r="1" fill="#C9A24A" fillOpacity="0.85" />
      <circle cx="80" cy="44" r="0.85" fill="#C9A24A" fillOpacity="0.7" />
      <circle cx="66" cy="42" r="0.55" fill="#C9A24A" fillOpacity="0.55" />
      {/* Origin */}
      <circle cx="50" cy="50" r="0.6" fill="#3CFF8A" />
    </svg>
  );
}
