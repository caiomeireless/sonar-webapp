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
