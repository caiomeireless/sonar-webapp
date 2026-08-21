// Itens da navegação lateral do portal da equipe.
// Importado pelo `app/equipe/layout.tsx` pra alimentar o componente `Sidebar`.
//
// Os ícones são renderizados como JSX (ReactNode) — RSC não aceita
// passar funções de Server -> Client.

import { BarChart3, Briefcase, Home, Search } from "lucide-react";

import type { SidebarItem } from "@/components/Sidebar";

const ICON_CLASS = "h-[18px] w-[18px]";

// Reestruturação 09/08: nav principal com 4 abas — as demais telas viram
// CARDS dentro das centrais (Central de Buscas e Central Administrativa).
// matchPrefixes mantém a central acesa quando o usuário está numa sub-tela.
export const NAV_EQUIPE: SidebarItem[] = [
  { href: "/equipe/inicio", label: "Início", icon: <Home className={ICON_CLASS} /> },
  {
    href: "/equipe/buscas",
    label: "Central de Buscas",
    icon: <Search className={ICON_CLASS} />,
    matchPrefixes: [
      "/equipe/buscas",
      "/equipe/devedores",
      "/equipe/consultas",
      "/equipe/themis",
    ],
  },
  { href: "/equipe", label: "Estatísticas da Plataforma", icon: <BarChart3 className={ICON_CLASS} /> },
  {
    href: "/equipe/administrativa",
    label: "Central Administrativa",
    icon: <Briefcase className={ICON_CLASS} />,
    matchPrefixes: [
      "/equipe/administrativa",
      "/equipe/custos",
      "/equipe/notificacoes",
      "/equipe/bugs",
      "/equipe/ver-como",
      "/equipe/configuracoes",
    ],
  },
];
