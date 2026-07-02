"use client";

// Ativador do reveal-on-scroll da landing — porte do mecanismo do
// bp-saude-evento (aprovado visualmente lá):
//   - Marca <html class="js"> no mount (gate de progressive enhancement:
//     sem JS, o CSS deixa tudo visível — nada some pra sempre).
//   - IntersectionObserver adiciona .shown quando o alvo cruza a viewport
//     (threshold 8%, com folga de -80px na base) e para de observar.
// Renderiza null — só efeito colateral. As classes .reveal / .stagger /
// .reveal-curtain ficam no markup das seções (server components).
import { useEffect } from "react";

export function ScrollReveals() {
  useEffect(() => {
    document.documentElement.classList.add("js");

    const targets = document.querySelectorAll(".reveal, .reveal-curtain");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("shown"));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("shown");
            obs.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0.08 },
    );
    targets.forEach((el) => obs.observe(el));

    return () => obs.disconnect();
  }, []);

  return null;
}
