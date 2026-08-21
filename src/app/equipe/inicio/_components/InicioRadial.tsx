"use client";

// Roda radial GRANDE da aba Início — fixa (não arrastável), centrada,
// escala com a janela até 520px.
import { useEffect, useState } from "react";

import RadialHub from "@/components/ui/RadialHub";
import { ITENS_RADIAL_EQUIPE } from "@/components/ui/itens-radial-equipe";

export default function InicioRadial({
  nome,
  fotoUrl,
}: {
  nome: string;
  fotoUrl: string | null;
}) {
  const [tam, setTam] = useState(520);

  useEffect(() => {
    const ajustar = () =>
      setTam(Math.max(320, Math.min(520, window.innerWidth - 48, window.innerHeight - 260)));
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  return <RadialHub itens={ITENS_RADIAL_EQUIPE} nome={nome} fotoUrl={fotoUrl} size={tam} />;
}
