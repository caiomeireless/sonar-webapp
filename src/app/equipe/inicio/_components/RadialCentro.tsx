"use client";

// Radial central do Console — mede o espaço disponível (largura E altura)
// e usa o maior tamanho que couber, sem estourar a tela única. Paleta
// verde neon, letras maiores (escalaFonte) e METAL LÍQUIDO VERDE nos dois
// círculos verdes da roda: anel externo (shader, igual ao Sincronizar) e
// aro do centro (anel CSS girando).
import { useEffect, useRef, useState } from "react";

import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import RadialHub from "@/components/ui/RadialHub";
import { ITENS_RADIAL_EQUIPE } from "@/components/ui/itens-radial-equipe";

const TAM_MAX = 720;

export default function RadialCentro({
  nome,
  fotoUrl,
}: {
  nome: string;
  fotoUrl: string | null;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tam, setTam] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // SEM piso forçado acima do espaço real (o piso antigo fazia a roda
    // vazar por cima da régua de indicadores em telas baixas).
    const medir = () =>
      setTam(
        Math.min(
          TAM_MAX,
          Math.max(200, Math.min(el.clientWidth, el.clientHeight) - 8),
        ),
      );
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Geometria do RadialHub: aro do centro fica em r = raioCentro + 5
  // (raioCentro = raio*0.42 - max(5, size*0.024)).
  const raioCentro =
    tam > 0 ? (tam / 2) * 0.42 - Math.max(5, tam * 0.024) : 0;
  const diamAroCentro = Math.round((raioCentro + 6) * 2);

  return (
    <div
      ref={ref}
      className="flex min-h-0 w-full flex-1 items-center justify-center"
    >
      {tam > 0 && (
        <BordaLiquidaMetal
          cor="signal"
          anel
          radius={(tam + 10) / 2}
          className="block"
        >
          <div className="relative rounded-full p-[2px]">
            <RadialHub
              itens={ITENS_RADIAL_EQUIPE}
              nome={nome}
              fotoUrl={fotoUrl}
              size={tam}
              paleta="verde"
              escalaFonte={1.35}
            />
            {/* Aro do CENTRO em metal líquido (anel CSS girando) — cobre o
                traço verde estático em volta da foto. */}
            <div
              aria-hidden="true"
              className="contorno-liquido contorno-liquido--ativo pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: diamAroCentro,
                height: diamAroCentro,
                ["--ml-c" as string]: "var(--color-signal)",
              }}
            />
          </div>
        </BordaLiquidaMetal>
      )}
    </div>
  );
}
