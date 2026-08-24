// Layout de "tela cheia" pra rota DEMO da peça processual — mesmo fix da
// rota real /equipe/devedores/[id]/peca/[template]/layout.tsx: a página é
// usada como IFRAME pelo Gerador de Peça de demonstração e herdaria o
// shell do /equipe/layout.tsx (Sidebar + TopBar) dentro do preview.
// O wrapper `fixed inset-0` com z-index alto cobre o shell; no print,
// `print:static` neutraliza o overlay pra paginação normal do A4.
import type { ReactNode } from "react";

export default function PecaDemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-onyx text-ivory print:static print:inset-auto print:z-auto print:overflow-visible print:bg-white">
      {children}
    </div>
  );
}
