// Itens do menu radial da EQUIPE — espelha o NAV_EQUIPE (lib/nav-equipe.tsx).
// Duplicado de propósito: o nav usa ReactNode (server -> client) e o radial
// precisa do COMPONENTE do ícone pra escalar por tamanho. Ao mexer num,
// mexer no outro.
import {
  BarChart3,
  Briefcase,
  FileSignature,
  Home,
  Radar,
  Route,
  Search,
  Users,
} from "lucide-react";

import type { ItemRadial } from "./RadialHub";

export const ITENS_RADIAL_EQUIPE: ItemRadial[] = [
  { href: "/equipe/inicio", label: "Início", curto: "Início", icon: Home },
  { href: "/equipe/devedores", label: "Banco de Dossiês", curto: "Dossiês", icon: Users },
  { href: "/equipe/consultas", label: "Avaliação Pré-Processual", curto: "Pré-Processual", icon: Search },
  { href: "/equipe/themis", label: "Ficha das Execuções", curto: "Execuções", icon: Route },
  { href: "/equipe/radar", label: "Radar de Movimentações", curto: "Radar", icon: Radar },
  { href: "/equipe", label: "Estatísticas da Plataforma", curto: "Estatísticas", icon: BarChart3 },
  { href: "/equipe/pecas", label: "Banco de Peças", curto: "Peças", icon: FileSignature },
  { href: "/equipe/administrativa", label: "Central Administrativa", curto: "Administrativa", icon: Briefcase },
];
