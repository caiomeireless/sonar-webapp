"use client";

// Radial central do Console — mede o espaço disponível (largura E altura)
// e usa o maior tamanho que couber, sem estourar a tela única. Paleta
// verde neon; SEM moldura (v9: página descarregada de efeitos — o radial
// é o herói sozinho).
import { useEffect, useRef, useState } from "react";

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
    // SEM piso forçado acima do espaço real: o piso antigo (260) fazia a
    // roda vazar por cima da régua de indicadores em telas baixas.
    const medir = () =>
      setTam(
        Math.min(TAM_MAX, Math.max(200, Math.min(el.clientWidth, el.clientHeight) - 8)),
      );
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="flex min-h-0 w-full flex-1 items-center justify-center"
    >
      {tam > 0 && (
        <RadialHub
          itens={ITENS_RADIAL_EQUIPE}
          nome={nome}
          fotoUrl={fotoUrl}
          size={tam}
          paleta="verde"
        />
      )}
    </div>
  );
}
