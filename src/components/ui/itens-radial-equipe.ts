// Itens do menu radial da EQUIPE — espelha o NAV_EQUIPE (lib/nav-equipe.tsx).
// Duplicado de propósito: o nav usa ReactNode (server -> client) e o radial
// precisa do COMPONENTE do ícone pra escalar por tamanho. Ao mexer num,
// mexer no outro.
import {
  Bell,
  Bug,
  Clock,
  DollarSign,
  Eye,
  Home,
  LayoutDashboard,
  Search,
  Settings,
  Users,
} from "lucide-react";

import type { ItemRadial } from "./RadialHub";

export const ITENS_RADIAL_EQUIPE: ItemRadial[] = [
  { href: "/equipe/inicio", label: "Início", curto: "Início", icon: Home },
  { href: "/equipe", label: "Painel", curto: "Painel", icon: LayoutDashboard },
  { href: "/equipe/devedores", label: "Banco de Devedores", curto: "Devedores", icon: Users },
  { href: "/equipe/consultas", label: "Consultas Pré-Processuais", curto: "Consultas", icon: Clock },
  { href: "/equipe/themis", label: "Fila Themis · Execuções", curto: "Themis", icon: Search },
  { href: "/equipe/custos", label: "Monitor de Custos", curto: "Custos", icon: DollarSign },
  { href: "/equipe/bugs", label: "Comunicação de Bugs", curto: "Bugs", icon: Bug },
  { href: "/equipe/notificacoes", label: "Notificações", curto: "Avisos", icon: Bell },
  { href: "/equipe/ver-como", label: "Ver Como Cliente", curto: "Ver Como", icon: Eye },
  { href: "/equipe/configuracoes", label: "Configurações", curto: "Config", icon: Settings },
];
