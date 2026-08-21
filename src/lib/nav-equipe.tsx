// Itens da navegação lateral do portal da equipe.
// Importado pelo `app/equipe/layout.tsx` pra alimentar o componente `Sidebar`.
//
// Os ícones são renderizados como JSX (ReactNode) — RSC não aceita
// passar funções de Server -> Client.

import {
  Bell,
  Bug,
  Clock,
  DollarSign,
  Eye,
  LayoutDashboard,
  Search,
  Settings,
  Users,
} from "lucide-react";

import type { SidebarItem } from "@/components/Sidebar";

const ICON_CLASS = "h-[18px] w-[18px]";

export const NAV_EQUIPE: SidebarItem[] = [
  { href: "/equipe", label: "Painel", icon: <LayoutDashboard className={ICON_CLASS} /> },
  { href: "/equipe/devedores", label: "Banco de Devedores", icon: <Users className={ICON_CLASS} /> },
  { href: "/equipe/consultas", label: "Consultas Pré-Processuais", icon: <Clock className={ICON_CLASS} /> },
  { href: "/equipe/themis", label: "Fila Themis · Execuções", icon: <Search className={ICON_CLASS} /> },
  { href: "/equipe/custos", label: "Monitor de Custos", icon: <DollarSign className={ICON_CLASS} /> },
  { href: "/equipe/bugs", label: "Comunicação de Bugs", icon: <Bug className={ICON_CLASS} /> },
  { href: "/equipe/notificacoes", label: "Notificações", icon: <Bell className={ICON_CLASS} /> },
  // Janela de seleção: escolhe QUAL cliente simular (cada um vê um portal
  // diferente) antes de entrar no /cliente em modo visualização.
  { href: "/equipe/ver-como", label: "Ver Como Cliente", icon: <Eye className={ICON_CLASS} /> },
  { href: "/equipe/configuracoes", label: "Configurações", icon: <Settings className={ICON_CLASS} /> },
];
