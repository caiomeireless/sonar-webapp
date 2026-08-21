"use client";

// Metade de cima do globo, com a ESFERA medindo exatamente a largura do
// conteúdo do painel (pedido do Caio: "do diamante até o símbolo de
// capturas"). Mede o próprio wrapper (ResizeObserver) e dimensiona o
// canvas: raio interno do WireframeGlobe = min(l,a)/2.4, então lado do
// canvas = 1.2·D garante diâmetro = D.
import { useEffect, useRef, useState } from "react";

import { WireframeGlobe } from "@/components/ui/WireframeGlobe";

export default function GloboMeio() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [d, setD] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setD(Math.round(el.clientWidth));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lado = Math.round(d * 1.2);
  // Topo da esfera fica a 0.1·D do topo do canvas — puxa pra cima pra
  // encostar no wrapper; o corte (equador) cai exatamente na base.
  const alturaVisivel = Math.round(d / 2);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative w-full overflow-hidden"
      style={{ height: alturaVisivel }}
    >
      {d > 0 && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{ top: -Math.round(d * 0.1), width: lado, height: lado }}
        >
          <WireframeGlobe
            width={lado}
            height={lado}
            globeCenterX={Math.round(lado / 2)}
            globeCenterY={Math.round(lado / 2)}
            corContinentes="rgba(60, 255, 138, 0.65)"
          />
        </div>
      )}
    </div>
  );
}
