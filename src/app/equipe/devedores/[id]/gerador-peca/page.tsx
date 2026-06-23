// Pagina dedicada do Gerador de Peca (Dia 6 — substitui o modal pequeno
// do dossie como CTA principal). Layout full-width: configurador a esquerda
// + preview ao vivo em iframe a direita. O modal antigo (BotaoGerarPeca)
// continua vivo como atalho rapido no dossie.
//
// Auth: mesmo padrao das outras rotas /equipe/* — perfilLogado(),
// redireciona cliente pra /cliente/casos, aceita ?eu= em dev (devEuFromParam).
import Link from "next/link";
import { redirect } from "next/navigation";
import { obterDossie } from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { templatesSugeridos } from "@/lib/pecas-templates";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { GeradorPecaApp } from "./GeradorPecaApp";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function GeradorPecaPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(sp.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const euQuery = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  if (!/^\d+$/.test(id)) {
    return <AcessoNegado voltarHref={`/equipe/devedores${euQuery}`} />;
  }
  const devedorId = Number.parseInt(id, 10);
  if (!Number.isFinite(devedorId)) {
    return <AcessoNegado voltarHref={`/equipe/devedores${euQuery}`} />;
  }

  const dossie = await obterDossie(devedorId);
  if (!dossie) {
    return <AcessoNegado voltarHref={`/equipe/devedores${euQuery}`} />;
  }

  const sugeridos = templatesSugeridos(dossie);

  return (
    <main className="min-h-svh bg-onyx text-ivory">
      {/* Header simples — link de voltar + titulo. Sem hero grande
          pra deixar o configurador + preview ocuparem o maximo. */}
      <header className="border-b border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.85)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div className="flex flex-col gap-1">
            <Link
              href={`/equipe/devedores/${devedorId}${euQuery}`}
              className="btn-neon-gold self-start"
            >
              ← Voltar ao dossiê
            </Link>
            <h1 className="font-serif text-xl text-ivory sm:text-2xl">
              Gerador de Peca ·{" "}
              <span className="text-[var(--color-gold)]">
                {dossie.devedor.nome}
              </span>
            </h1>
          </div>
          <p className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)] sm:block">
            Configurador & preview ao vivo
          </p>
        </div>
      </header>

      {/* App client-side (estado + preview iframe) */}
      <GeradorPecaApp
        dossie={dossie}
        devedorId={devedorId}
        euQuery={euQuery}
        sugeridos={sugeridos}
      />
    </main>
  );
}

function AcessoNegado({ voltarHref }: { voltarHref: string }) {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
      <div className="grid place-items-center">
        <SpotlightCard className="max-w-[520px] p-10 text-center">
          <span className="eyebrow !text-[var(--color-gold)]">Nao encontrado</span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Devedor nao localizado
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            O identificador informado nao corresponde a nenhum devedor
            cadastrado.
          </p>
          <Link href={voltarHref} className="btn-neon-gold mt-6">
            ← Voltar para devedores
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}
