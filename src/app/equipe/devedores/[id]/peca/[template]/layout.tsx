// Layout de "tela cheia" pra rota da peca processual.
//
// PROBLEMA RESOLVIDO: a rota /equipe/devedores/[id]/peca/[template]
// herda /equipe/layout.tsx (Sidebar + TopBar + AetherBackground). Como
// essa pagina e usada como IFRAME pelo Gerador de Peca (preview ao vivo
// em /equipe/devedores/[id]/gerador-peca), o shell do app aparecia
// duplicado dentro do iframe — Sidebar, TopBar e background visuais
// ocupando o preview antes do timbre da peca.
//
// FIX: este layout filho renderiza um wrapper `fixed inset-0` que cobre
// todo o viewport com fundo onyx solido, sobrepondo o shell pai. Como
// fica ACIMA do Sidebar/TopBar do /equipe/layout.tsx (z-index alto), o
// efeito final e o mesmo de uma rota "sem shell" — tanto no iframe
// quanto na navegacao standalone (a partir do dossie via "Gerar peca",
// que ja tem header proprio com Voltar/Imprimir/Baixar .docx).
//
// Nao da pra usar Route Groups aqui porque a rota precisaria sair do
// segmento /equipe, o que quebraria o auth pattern do dossie e os
// imports relativos de TimbreBP/RodapeBP usados pela rota
// /equipe/devedores/[id]/calculo/imprimir.
import type { ReactNode } from "react";

export default function PecaLayout({ children }: { children: ReactNode }) {
  // `fixed inset-0` cobre Sidebar+TopBar (overlay full-screen).
  // `print:static print:overflow-visible` neutraliza o overlay no print,
  // pra impressao paginar normal sem cortar o documento A4.
  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-onyx text-ivory print:static print:inset-auto print:z-auto print:overflow-visible print:bg-white">
      {children}
    </div>
  );
}
