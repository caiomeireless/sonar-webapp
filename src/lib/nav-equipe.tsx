// Itens da navegação lateral do portal da equipe.
// Importado pelo `app/equipe/layout.tsx` pra alimentar o componente `Sidebar`.
//
// Os ícones são renderizados como JSX (ReactNode) — RSC não aceita
// passar funções de Server -> Client.

import {
  BarChart3,
  Briefcase,
  FileSignature,
  Home,
  Radar,
  Route,
  Search,
  Users,
} from "lucide-react";

import type { SidebarItem } from "@/components/Sidebar";

const ICON_CLASS = "h-[18px] w-[18px]";

// Reestruturação 21/08 (Caio): Central de Buscas DISSOLVIDA — os cards dela
// viraram abas principais (Banco de Dossiês e Avaliação Pré-Processual).
// matchPrefixes mantém a aba acesa quando o usuário está numa sub-tela.
export const NAV_EQUIPE: SidebarItem[] = [
  { href: "/equipe/inicio", label: "Início", icon: <Home className={ICON_CLASS} /> },
  { href: "/equipe/devedores", label: "Banco de Dossiês", icon: <Users className={ICON_CLASS} /> },
  { href: "/equipe/consultas", label: "Avaliação Pré-Processual", icon: <Search className={ICON_CLASS} /> },
  { href: "/equipe/themis", label: "Ficha das Execuções", icon: <Route className={ICON_CLASS} /> },
  // Abas novas 21/08: Radar (andamentos de alto sinal), Banco de Peças
  // (hub do gerador por devedor) e Central de Acordos (remete pra plataforma
  // do Guilherme — ver /equipe/acordos).
  { href: "/equipe/radar", label: "Radar de Movimentações", icon: <Radar className={ICON_CLASS} /> },
  { href: "/equipe", label: "Estatísticas da Plataforma", icon: <BarChart3 className={ICON_CLASS} /> },
  {
    href: "/equipe/pecas",
    label: "Banco de Peças",
    icon: <FileSignature className={ICON_CLASS} />,
    // O gerador em si vive DENTRO do dossiê (/equipe/devedores/[id]/
    // gerador-peca e /peca/[template]) — matchContains rouba o ativo do
    // Banco de Dossiês nesses trechos do fluxo.
    matchContains: ["/gerador-peca", "/peca/"],
  },
  // Central de Acordos REMOVIDA do nav (ditado 25/08) — a rota
  // /equipe/acordos continua existindo caso volte.
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
