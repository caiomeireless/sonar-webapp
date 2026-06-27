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
  LayoutDashboard,
  Mail,
  Search,
  Settings,
  Users,
} from "lucide-react";

import type { SidebarItem } from "@/components/Sidebar";

const ICON_CLASS = "h-[18px] w-[18px]";

export const NAV_EQUIPE: SidebarItem[] = [
  { href: "/equipe", label: "Painel", icon: <LayoutDashboard className={ICON_CLASS} /> },
  { href: "/equipe/devedores", label: "Banco de devedores", icon: <Users className={ICON_CLASS} /> },
  { href: "/equipe/consultas", label: "Consultas Pre-Processuais", icon: <Clock className={ICON_CLASS} /> },
  { href: "/equipe/themis", label: "Fila Themis · Execuções", icon: <Search className={ICON_CLASS} /> },
  { href: "/equipe/custos", label: "Monitor de custos", icon: <DollarSign className={ICON_CLASS} /> },
  { href: "/equipe/bugs", label: "Comunicação de Bugs", icon: <Bug className={ICON_CLASS} /> },
  { href: "/equipe/notificacoes", label: "Notificações", icon: <Bell className={ICON_CLASS} /> },
  // Pedidos de demo da landing — visivel pra todos, mas o redirect na page.tsx
  // garante que so admin/socio entram. SidebarItem nao tem campo de papel
  // hoje; controle de acesso fica na propria pagina.
  { href: "/equipe/demos", label: "Pedidos de Demo", icon: <Mail className={ICON_CLASS} /> },
  { href: "/equipe/configuracoes", label: "Configurações", icon: <Settings className={ICON_CLASS} /> },
];
