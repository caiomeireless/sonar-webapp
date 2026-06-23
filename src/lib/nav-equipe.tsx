// Itens da navegação lateral do portal da equipe.
// Importado pelo `app/equipe/layout.tsx` pra alimentar o componente `Sidebar`.
//
// Os ícones são renderizados como JSX (ReactNode) — RSC não aceita
// passar funções de Server -> Client.

import { LayoutDashboard, Search, Users } from "lucide-react";

import type { SidebarItem } from "@/components/Sidebar";

const ICON_CLASS = "h-[18px] w-[18px]";

export const NAV_EQUIPE: SidebarItem[] = [
  { href: "/equipe", label: "Painel", icon: <LayoutDashboard className={ICON_CLASS} /> },
  { href: "/equipe/devedores", label: "Devedores", icon: <Users className={ICON_CLASS} /> },
  { href: "/equipe/themis", label: "Themis", icon: <Search className={ICON_CLASS} /> },
];
