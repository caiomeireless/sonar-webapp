"use client";

// Radial central do Console — 2x maior (até 660px), mas SEM estourar a
// tela única: mede o espaço disponível (largura E altura da própria área)
// e usa o maior tamanho que couber. Anel de metal líquido verde em volta
// (mesmo shader do Sincronizar), roda na paleta verde neon.
import { useEffect, useRef, useState } from "react";

import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import RadialHub from "@/components/ui/RadialHub";
import { ITENS_RADIAL_EQUIPE } from "@/components/ui/itens-radial-equipe";

const TAM_MAX = 660; // 2x o tamanho anterior (330)

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
    const medir = () =>
      setTam(
        Math.max(
          260,
          Math.min(TAM_MAX, el.clientWidth - 16, el.clientHeight - 16),
        ),
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
        <BordaLiquidaMetal
          cor="signal"
          anel
          radius={(tam + 12) / 2}
          className="block"
        >
          <div className="rounded-full p-[3px]">
            <RadialHub
              itens={ITENS_RADIAL_EQUIPE}
              nome={nome}
              fotoUrl={fotoUrl}
              size={tam}
              paleta="verde"
            />
          </div>
        </BordaLiquidaMetal>
      )}
    </div>
  );
}
