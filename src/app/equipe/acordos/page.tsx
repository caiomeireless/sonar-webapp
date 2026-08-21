// Central de Acordos — os acordos vivem na plataforma do Guilherme; esta
// rota só REMETE pra lá (decisão do Caio, 21/08: não atrapalhar o trabalho
// dele, apenas encaminhar). Enquanto a URL não for colada abaixo, a página
// mostra um aviso elegante no lugar de redirecionar.
import { redirect } from "next/navigation";
import { Handshake } from "lucide-react";

import { ehCliente } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";
import { devEuFromParam } from "@/lib/dev-auth";

export const dynamic = "force-dynamic";

// >>> Colar aqui a URL da plataforma de acordos do Guilherme <<<
const URL_PLATAFORMA_ACORDOS = "";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function CentralAcordosPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  // Mesmo padrão das abas irmãs: ?eu= vale como atalho de preview em dev
  // (devEuFromParam retorna undefined em produção).
  const eu = devEuFromParam(params.eu) ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  if (URL_PLATAFORMA_ACORDOS) redirect(URL_PLATAFORMA_ACORDOS);

  return (
    <main className="mx-auto max-w-[720px] px-6 py-16 sm:px-10">
      <div className="glass p-10 text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-gold)]/45 bg-[var(--color-gold)]/10">
          <Handshake className="h-7 w-7 text-[var(--color-gold)]" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-serif text-[clamp(19px,2.75vw,30px)] font-medium uppercase tracking-[0.08em] text-[var(--color-gold)]">
          Central de Acordos
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-ivory-88)]">
          Os acordos são acompanhados na plataforma dedicada criada pelo
          Guilherme. Assim que o endereço dela for configurado aqui, este
          atalho passa a te levar direto pra lá.
        </p>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          Aguardando Endereço da Plataforma
        </p>
      </div>
    </main>
  );
}
