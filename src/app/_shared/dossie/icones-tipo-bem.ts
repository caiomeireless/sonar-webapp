// Mapa centralizado de icones/labels/ordem por TipoBem.
// Importado pelo dossie do advogado e pelo dossie do cliente.
import type { ComponentType } from "react";
import {
  Building2,
  Briefcase,
  Car,
  MapPin,
  Scale,
  Users2,
  type LucideIcon,
} from "lucide-react";
import type { TipoBem } from "@/lib/mock-fixtures";

export const TIPO_META: Record<TipoBem, { label: string; Icon: LucideIcon }> = {
  veiculo: { label: "Veículos", Icon: Car },
  imovel: { label: "Imóveis", Icon: Building2 },
  empresa: { label: "Participações Societárias", Icon: Briefcase },
  processo_credito: { label: "Processos Onde é Credor", Icon: Scale },
  endereco: { label: "Endereços Confirmados", Icon: MapPin },
  vinculo: { label: "Vínculos Familiares", Icon: Users2 },
};

export const ICONES_TIPO_BEM: Record<
  TipoBem,
  ComponentType<{ className?: string }>
> = {
  veiculo: Car,
  imovel: Building2,
  empresa: Briefcase,
  processo_credito: Scale,
  endereco: MapPin,
  vinculo: Users2,
};

export const ORDEM: TipoBem[] = [
  "veiculo",
  "imovel",
  "empresa",
  "processo_credito",
  "endereco",
  "vinculo",
];

// Rotulos curtos de contagem pros mapas ("1 Veículo", "2 Imóveis") — os
// labels de TIPO_META sao titulos de secao, longos demais pra caber ao
// lado do valor numa linha de localizacao.
const TIPO_CONTAGEM: Record<TipoBem, { singular: string; plural: string }> = {
  veiculo: { singular: "Veículo", plural: "Veículos" },
  imovel: { singular: "Imóvel", plural: "Imóveis" },
  empresa: { singular: "Participação Societária", plural: "Participações Societárias" },
  processo_credito: { singular: "Crédito Judicial", plural: "Créditos Judiciais" },
  endereco: { singular: "Endereço", plural: "Endereços" },
  vinculo: { singular: "Vínculo", plural: "Vínculos" },
};

export function rotuloContagemTipoBem(tipo: string, qtd: number): string {
  const meta = TIPO_CONTAGEM[tipo as TipoBem];
  if (!meta) return `${qtd} ${qtd === 1 ? "outro bem" : "outros bens"}`;
  return `${qtd} ${qtd === 1 ? meta.singular : meta.plural}`;
}
