// Editor de calculo do debito judicial — pagina propria (Dia 5+).
// Foi extraido do dossie pra dar espaco visual ao editor completo
// (parametros + linhas + opcoes + impressao). Auth identica as
// outras paginas de equipe.
import Link from "next/link";
import { redirect } from "next/navigation";
import { obterDossie } from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { EditorCalculo } from "./EditorCalculo";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function CalculoPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(sp.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");

  const euQuery = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";
  const voltarHref = `/equipe/devedores/${id}${euQuery}`;

  if (!/^\d+$/.test(id)) return <NaoEncontrado voltarHref={voltarHref} />;
  const devedorId = Number.parseInt(id, 10);
  if (!Number.isFinite(devedorId))
    return <NaoEncontrado voltarHref={voltarHref} />;

  const dossie = await obterDossie(devedorId);
  if (!dossie) return <NaoEncontrado voltarHref={voltarHref} />;

  const { devedor, casos } = dossie;
  const caso = casos[0] ?? null;
  const imprimirHref = `/equipe/devedores/${devedorId}/calculo/imprimir${euQuery}`;

  return (
    <main>
      {/* ============ HEADER ============ */}
      <section className="relative overflow-hidden">
        {/* Glow gold removido — fundo unico (AetherBackground do layout). */}
        <div className="relative mx-auto max-w-[1100px] px-6 py-12 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={voltarHref}
              className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:text-[var(--color-tip-glow)]"
            >
              ← Voltar ao dossie
            </Link>
            <Link
              href={imprimirHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/10 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/20"
            >
              🖨 Imprimir PDF
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="eyebrow">Editor de calculo</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
              Visao da equipe
            </span>
          </div>

          <h1 className="mt-3 font-serif text-[clamp(26px,3.4vw,40px)] font-medium leading-[1.1] tracking-tight text-ivory">
            Editor de calculo · {devedor.nome}
          </h1>
          {caso ? (
            <p className="mt-3 font-mono text-sm text-[var(--color-ivory-66)]">
              {caso.numero_processo ?? "Sem processo cadastrado"} ·{" "}
              <span className="text-[var(--color-gold)]">
                {caso.credor.nome}
              </span>{" "}
              × <span className="text-ivory">{devedor.nome}</span>
            </p>
          ) : (
            <p className="mt-3 font-mono text-sm text-[var(--color-ivory-66)]">
              Sem caso vinculado a este devedor
            </p>
          )}
        </div>
      </section>

      {/* ============ EDITOR ============ */}
      <section className="border-t border-[var(--color-ivory-12)]">
        <div className="mx-auto max-w-[1100px] px-6 py-12 sm:px-10">
          <EditorCalculo
            devedorId={devedorId}
            imprimirHref={imprimirHref}
          />
        </div>
      </section>
    </main>
  );
}

// ============================================================
// COMPONENTES INTERNOS
// ============================================================

function NaoEncontrado({ voltarHref }: { voltarHref: string }) {
  return (
    <main className="mx-auto max-w-[1100px] px-6 py-24 sm:px-10">
      <div className="grid place-items-center">
        <SpotlightCard className="max-w-[520px] p-10 text-center">
          <span className="eyebrow !text-[var(--color-gold)]">
            Nao encontrado
          </span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Devedor nao localizado
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            O identificador informado nao corresponde a nenhum devedor
            cadastrado.
          </p>
          <Link
            href={voltarHref}
            className="mt-6 inline-block rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            ← Voltar
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}
