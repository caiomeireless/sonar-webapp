"use client";

// Wrapper CLIENT do menu radial do Início — obrigatório: ITENS_RADIAL_EQUIPE
// carrega COMPONENTES de ícone (funções), e função não pode cruzar a
// fronteira Server -> Client como prop (foi exatamente o 500 de 21/08,
// quando a page server renderizou o RadialHub direto). O import acontece
// AQUI, do lado do cliente, e a page só manda strings.
import RadialHub from "@/components/ui/RadialHub";
import { ITENS_RADIAL_EQUIPE } from "@/components/ui/itens-radial-equipe";

export default function RadialMenor({
  nome,
  fotoUrl,
  size = 300,
}: {
  nome: string;
  fotoUrl: string | null;
  size?: number;
}) {
  return (
    <RadialHub
      itens={ITENS_RADIAL_EQUIPE}
      nome={nome}
      fotoUrl={fotoUrl}
      size={size}
    />
  );
}
