// GERADOR DE PEÇA DE DEMONSTRAÇÃO — João da Silva (DADOS 100% FICTÍCIOS).
// Mesma experiência do gerador real (/equipe/devedores/[id]/gerador-peca):
// reusa o componente REAL <GeradorPecaApp> (presets, seleção de bens,
// opções de pedidos/redação e preview ao vivo em iframe), alimentado pelo
// DOSSIE_DEMO — nada aqui toca o banco nem expõe cliente. O preview aponta
// pra rota demo /equipe/devedores/demo/peca/[template]; o download .docx
// fica desabilitado (exige devedor real), o Imprimir/PDF funciona.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { templatesSugeridos } from "@/lib/pecas-templates";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import { GeradorPecaApp } from "@/app/equipe/devedores/[id]/gerador-peca/GeradorPecaApp";
import { DEVEDOR_DEMO_ID, DOSSIE_DEMO } from "../dossie-ficticio";

type Props = { searchParams?: Promise<{ eu?: string | string[] }> };

const AMARELO = "#FFD93D";

// Duplicado local do AvisoFicticio da ficha demo (demo/page.tsx) —
// texto ajustado pra "Peça".
function AvisoFicticio() {
  return (
    <div
      className="flex items-center justify-center gap-3 rounded-2xl border px-5 py-3.5"
      style={{
        borderColor: "rgba(255,217,61,0.55)",
        backgroundColor: "rgba(255,217,61,0.10)",
      }}
    >
      <TriangleAlert
        className="h-5 w-5 shrink-0"
        style={{ color: AMARELO }}
        aria-hidden="true"
      />
      <p
        className="font-mono text-[13px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: AMARELO }}
      >
        Demonstração — Todos os Dados Desta Peça São Fictícios
      </p>
    </div>
  );
}

export default async function GeradorPecaDemoPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(sp.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const euQuery = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  // Sugestões calculadas pela função REAL a partir do dossiê fictício
  // (imóveis + veículos + quotas + crédito ⇒ consolidada sugerida primeiro).
  const sugeridos = templatesSugeridos(DOSSIE_DEMO);

  return (
    <main className="min-h-svh bg-onyx text-ivory">
      {/* Header: Voltar (metal laranja) + aviso amarelo + título */}
      <header className="border-b border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.85)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-6 py-5 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <BordaLiquidaMetal cor="laranja" radius={14} className="inline-flex">
              <Link
                href={`/equipe/devedores/demo${euQuery}`}
                className="inline-flex h-full w-full items-center gap-2.5 rounded-[11px] bg-[rgba(255,156,65,0.10)] px-5 py-3 text-sm font-medium text-[#FF9C41] transition hover:bg-[rgba(255,156,65,0.18)]"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                Voltar à Ficha Demo
              </Link>
            </BordaLiquidaMetal>
            <div className="min-w-0 flex-1">
              <AvisoFicticio />
            </div>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="font-serif text-xl text-ivory sm:text-2xl">
              Gerador de Peça ·{" "}
              <span className="text-[var(--color-gold)]">João da Silva</span>
            </h1>
            <p className="hidden font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)] sm:block">
              Configurador & preview ao vivo — dados fictícios
            </p>
          </div>
        </div>
      </header>

      {/* Componente REAL do gerador, em modo demonstração:
          preview vem de /equipe/devedores/demo/peca/[template] e o
          download .docx fica desabilitado graciosamente. */}
      <GeradorPecaApp
        dossie={DOSSIE_DEMO}
        devedorId={DEVEDOR_DEMO_ID}
        euQuery={euQuery}
        sugeridos={sugeridos}
        demoBasePeca="/equipe/devedores/demo/peca"
      />
    </main>
  );
}
