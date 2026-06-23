// Itens da navegacao lateral do portal do cliente.
// Importado pelo `app/cliente/layout.tsx` pra alimentar o componente `Sidebar`.

import { FileText, Settings } from "lucide-react";

import type { SidebarItem } from "@/components/Sidebar";

export const NAV_CLIENTE: SidebarItem[] = [
  { href: "/cliente/casos", label: "Meus casos", icon: FileText },
  { href: "/cliente/preferencias", label: "Preferencias", icon: Settings },
];
