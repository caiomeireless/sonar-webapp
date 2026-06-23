// Itens da navegacao lateral do portal da equipe.
// Importado pelo `app/equipe/layout.tsx` pra alimentar o componente `Sidebar`.

import { LayoutDashboard, Search, Users } from "lucide-react";

import type { SidebarItem } from "@/components/Sidebar";

export const NAV_EQUIPE: SidebarItem[] = [
  { href: "/equipe", label: "Painel", icon: LayoutDashboard },
  { href: "/equipe/devedores", label: "Devedores", icon: Users },
  { href: "/equipe/themis", label: "Themis", icon: Search },
];
