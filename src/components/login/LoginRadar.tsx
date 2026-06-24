"use client";

import { motion } from "motion/react";

/**
 * LoginRadar — radar decorativo que gira atras do logo + card de login.
 *
 * Estrutura:
 *  - 4 aneis concentricos (raios 380/280/180/80) em verde signal bem suave
 *  - cruz dos eixos (horizontal + vertical) ainda mais suave
 *  - raio + cone de varredura girando 360 graus em 5.5s (linear, infinito)
 *  - 4 bolinhas fixas no canto inferior direito que piscam quando a
 *    linha do radar passa por elas (delay calculado pelo angulo de
 *    cada bolinha em relacao ao centro)
 *
 * Centro do SVG = (0, 0). O viewBox tem -400 a 400 nos dois eixos pra
 * dar folga visual. O parent deve centralizar este componente entre o
 * logo e o card de login pra ficar exatamente "atras dos dois".
 *
 * aria-hidden porque e decorativo puro.
 */
export function LoginRadar() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <svg
        viewBox="-400 -400 800 800"
        className="h-[1120px] w-[1120px] max-w-none"
        aria-hidden="true"
      >
        <defs>
          {/* Gradiente do cone de varredura — forte na borda do raio,
              esmaecendo conforme se afasta. */}
          <linearGradient id="radarCone" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3CFF8A" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#3CFF8A" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3CFF8A" stopOpacity="0" />
          </linearGradient>

          {/* Glow neon — gaussian blur + merge com original pra dar o
              halo verde tipico de UI sci-fi. */}
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Aneis concentricos — externo mais visivel, internos vao
            ficando mais sutis. */}
        <circle
          cx="0"
          cy="0"
          r="380"
          fill="none"
          stroke="#3CFF8A"
          strokeWidth="1"
          strokeOpacity="0.22"
        />
        <circle
          cx="0"
          cy="0"
          r="280"
          fill="none"
          stroke="#3CFF8A"
          strokeWidth="1"
          strokeOpacity="0.18"
        />
        <circle
          cx="0"
          cy="0"
          r="180"
          fill="none"
          stroke="#3CFF8A"
          strokeWidth="1"
          strokeOpacity="0.14"
        />
        <circle
          cx="0"
          cy="0"
          r="80"
          fill="none"
          stroke="#3CFF8A"
          strokeWidth="1"
          strokeOpacity="0.10"
        />

        {/* Cruz dos eixos — bem apagada, so pra dar sensacao de grade. */}
        <line
          x1="-380"
          y1="0"
          x2="380"
          y2="0"
          stroke="#3CFF8A"
          strokeWidth="1"
          strokeOpacity="0.08"
        />
        <line
          x1="0"
          y1="-380"
          x2="0"
          y2="380"
          stroke="#3CFF8A"
          strokeWidth="1"
          strokeOpacity="0.08"
        />

        {/* Raio + cone girando. O grupo inteiro rotaciona 360 em loop.
            transform-box: view-box + 50% 50% faz o pivot ser o CENTRO
            do viewBox (0,0 no SVG) e nao o canto sup-esq do bounding
            box do <g> (que ficava deslocado por nao conter o ponto 0,0). */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
          style={{ transformBox: "view-box", transformOrigin: "50% 50%" }}
        >
          {/* Cone de ~30 graus: do centro vai ate (380, 0) e fecha em
              (329.1, -190) — ou seja, abre pra "cima" do raio (sentido
              anti-horario em coords SVG), criando o efeito de rastro
              que o raio deixa enquanto gira no sentido horario. */}
          <path
            d="M 0 0 L 380 0 A 380 380 0 0 1 329.1 -190 Z"
            fill="url(#radarCone)"
            opacity="0.7"
            filter="url(#neonGlow)"
          />

          {/* Raio principal — linha brilhante do centro ate a borda. */}
          <line
            x1="0"
            y1="0"
            x2="380"
            y2="0"
            stroke="#3CFF8A"
            strokeWidth="1.8"
            strokeLinecap="round"
            filter="url(#neonGlow)"
            style={{ filter: "drop-shadow(0 0 6px #3CFF8A)" }}
          />

          {/* Ponta brilhante na borda do raio. */}
          <circle
            cx="380"
            cy="0"
            r="4"
            fill="#3CFF8A"
            filter="url(#neonGlow)"
          />
        </motion.g>

        {/* Bolinhas (alvos) no canto inferior direito. Cada uma pisca
            quando o raio passa por cima — delay = (angulo / 360) * 5.5.
            Angulos calculados com atan2(cy, cx) em coords SVG (Y+ pra
            baixo, ja batendo com o sentido horario de rotacao). */}
        <motion.circle
          cx="240"
          cy="120"
          r="4"
          fill="#3CFF8A"
          filter="url(#neonGlow)"
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.8, 1] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatDelay: 4.7,
            delay: 0.4,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "240px 120px" }}
        />
        <motion.circle
          cx="180"
          cy="200"
          r="3"
          fill="#3CFF8A"
          filter="url(#neonGlow)"
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.8, 1] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatDelay: 4.7,
            delay: 0.73,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "180px 200px" }}
        />
        <motion.circle
          cx="300"
          cy="180"
          r="3"
          fill="#3CFF8A"
          filter="url(#neonGlow)"
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.8, 1] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatDelay: 4.7,
            delay: 0.47,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "300px 180px" }}
        />
        <motion.circle
          cx="220"
          cy="260"
          r="3.5"
          fill="#3CFF8A"
          filter="url(#neonGlow)"
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.8, 1] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatDelay: 4.7,
            delay: 0.76,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "220px 260px" }}
        />
      </svg>
    </div>
  );
}
