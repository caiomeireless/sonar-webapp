"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    particlesJS?: (id: string, config: Record<string, unknown>) => void;
    pJSDom?: Array<{ pJS: { fn: { vendors: { destroypJS: () => void } } } }>;
  }
}

const SCRIPT_SRC = "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
const CONTAINER_ID = "sonar-header-particles";

export function HeaderParticles() {
  useEffect(() => {
    const init = () => {
      if (!window.particlesJS) return;
      window.particlesJS(CONTAINER_ID, {
        particles: {
          number: { value: 175, density: { enable: true, value_area: 650 } },
          color: { value: "#C9A24A" },
          shape: { type: "circle", stroke: { width: 0.5, color: "#C9A24A" } },
          opacity: {
            value: 0.8,
            random: true,
            anim: { enable: true, speed: 1, opacity_min: 0.35 },
          },
          size: {
            value: 3,
            random: true,
            anim: { enable: true, speed: 2, size_min: 1 },
          },
          line_linked: {
            enable: true,
            distance: 180,
            color: "#3CFF8A",
            opacity: 0.55,
            width: 1.2,
          },
          move: { enable: true, speed: 2, random: true, out_mode: "bounce" },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: { enable: true, mode: "grab" },
            onclick: { enable: true, mode: "push" },
            resize: true,
          },
          modes: {
            grab: { distance: 220, line_linked: { opacity: 0.9 } },
            push: { particles_nb: 4 },
            repulse: { distance: 180, duration: 0.4 },
          },
        },
        retina_detect: true,
      });
    };

    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (window.particlesJS) {
      init();
    } else if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = init;
      document.body.appendChild(script);
    } else {
      script.addEventListener("load", init);
    }

    return () => {
      if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom.forEach((p) => {
          try {
            p.pJS.fn.vendors.destroypJS();
          } catch {
            /* ignore */
          }
        });
        window.pJSDom = [];
      }
    };
  }, []);

  return (
    <div
      id={CONTAINER_ID}
      className="absolute inset-0"
      aria-hidden="true"
    />
  );
}
