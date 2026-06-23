// Itens da navegação lateral do portal do cliente.
// Importado pelo `app/cliente/layout.tsx` pra alimentar o componente `Sidebar`.

import { FileText, Settings } from "lucide-react";

import type { SidebarItem } from "@/components/Sidebar";

const ICON_CLASS = "h-[18px] w-[18px]";

export const NAV_CLIENTE: SidebarItem[] = [
  { href: "/cliente/casos", label: "Meus casos", icon: <FileText className={ICON_CLASS} /> },
  { href: "/cliente/preferencias", label: "Preferências", icon: <Settings className={ICON_CLASS} /> },
];
