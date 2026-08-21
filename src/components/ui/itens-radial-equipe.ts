// Itens do menu radial da EQUIPE — espelha o NAV_EQUIPE (lib/nav-equipe.tsx).
// Duplicado de propósito: o nav usa ReactNode (server -> client) e o radial
// precisa do COMPONENTE do ícone pra escalar por tamanho. Ao mexer num,
// mexer no outro.
import { BarChart3, Briefcase, Home, Search } from "lucide-react";

import type { ItemRadial } from "./RadialHub";

export const ITENS_RADIAL_EQUIPE: ItemRadial[] = [
  { href: "/equipe/inicio", label: "Início", curto: "Início", icon: Home },
  { href: "/equipe/buscas", label: "Central de Buscas", curto: "Buscas", icon: Search },
  { href: "/equipe", label: "Estatísticas da Plataforma", curto: "Estatísticas", icon: BarChart3 },
  { href: "/equipe/administrativa", label: "Central Administrativa", curto: "Administrativa", icon: Briefcase },
];
