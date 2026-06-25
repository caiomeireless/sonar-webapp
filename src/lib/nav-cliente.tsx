// Itens da navegação lateral do portal do cliente.
// Importado pelo `app/cliente/layout.tsx` pra alimentar o componente `Sidebar`.

import {
  Bell,
  Clock,
  DollarSign,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Settings,
} from "lucide-react";

import type { SidebarItem } from "@/components/Sidebar";

const ICON_CLASS = "h-[18px] w-[18px]";

export const NAV_CLIENTE: SidebarItem[] = [
  { href: "/cliente", label: "Dashboard", icon: <LayoutDashboard className={ICON_CLASS} /> },
  { href: "/cliente/casos", label: "Meus casos", icon: <FileText className={ICON_CLASS} /> },
  { href: "/cliente/consultas", label: "Consultas Pre-Processuais", icon: <Clock className={ICON_CLASS} /> },
  { href: "/cliente/custos", label: "Monitor de custos", icon: <DollarSign className={ICON_CLASS} /> },
  { href: "/cliente/notificacoes", label: "Notificações", icon: <Bell className={ICON_CLASS} /> },
  { href: "/cliente/sugestoes", label: "Sugestões e Dúvidas", icon: <MessageCircle className={ICON_CLASS} /> },
  { href: "/cliente/preferencias", label: "Preferências", icon: <Settings className={ICON_CLASS} /> },
];
