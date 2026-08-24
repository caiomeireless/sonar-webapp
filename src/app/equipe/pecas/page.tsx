// Gerador de Peças — hub de entrada (aba principal, 21/08). O gerador em si
// já existe por devedor em /equipe/devedores/[id]/gerador-peca; aqui o
// advogado escolhe o devedor (busca por nome/documento/processo/pasta) e vê
// o catálogo de peças que o Sonar monta com os bens reais do dossiê.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

import { ehCliente } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";
import { devEuFromParam } from "@/lib/dev-auth";
import { listarDevedoresPaginado } from "@/lib/devedores";
import { TEMPLATES } from "@/lib/pecas-templates";
import { formatarDocumento } from "@/lib/credores-admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ eu?: string | string[]; q?: string | string[] }>;
};

export default async function GeradorPecasHubPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(params.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const euQuery = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  const q = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const resultado = q
    ? await listarDevedoresPaginado({ q, pagina: 1 })
    : null;

  return (
    <main className="relative min-h-svh">
      {/* Fundo: preto puro (padrão da cara nova). */}
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-12 sm:px-10">
      {/* ============ HEADER (padrão Banco de Dossiês) ============ */}
      <header className="mb-8 text-center">
        <h1
          className="font-serif text-[clamp(29px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[#C97B2A]"
          style={{ WebkitTextStroke: "1px rgba(255,255,255,0.65)" }}
        >
          Banco de Peças
        </h1>
        <p className="mt-3 font-mono text-[clamp(13px,1.6vw,20px)] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Peças Montadas com os Bens Reais do Dossiê.
        </p>
        <p className="mx-auto mt-4 max-w-[680px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
          Escolha o devedor e o Sonar redige a minuta com os bens que já
          localizou: matrícula, placa, CNPJ e localização entram no texto
          automaticamente, no timbre do escritório, prontos pra baixar em Word.
        </p>
      </header>

      {/* ============ BUSCA DE DEVEDOR (card de filtro verde) ======== */}
      <SpotlightCard
        local
        degrade="linear-gradient(0deg, rgba(10,48,28,0.7), rgba(10,48,28,0.7))"
        className="mx-auto max-w-[820px] p-6 sm:p-7"
      >
        <h2 className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          Para Qual Devedor?
        </h2>
        <form action="/equipe/pecas" method="get" className="mt-3 flex gap-3">
          {euDev && <input type="hidden" name="eu" value={euDev} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Nome, CPF/CNPJ, número do processo ou pasta"
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3.5 text-base text-ivory placeholder:text-[var(--color-ivory-40)] focus:border-[var(--color-signal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]/30"
          />
          <button type="submit" className="btn-neon-signal shrink-0">
            <Search className="h-4 w-4" aria-hidden="true" />
            Buscar
          </button>
        </form>

        {resultado && (
          <div className="mt-5 flex flex-col gap-2">
            {resultado.devedores.length === 0 ? (
              <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-ivory-66)]">
                Nenhum devedor encontrado para &quot;{q}&quot;.
              </p>
            ) : (
              resultado.devedores.slice(0, 8).map((d) => (
                <Link
                  key={d.id}
                  href={`/equipe/devedores/${d.id}/gerador-peca${euQuery}`}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 transition hover:border-[var(--color-signal-soft-2)]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-ivory">
                      {d.nome}
                    </span>
                    <span className="block font-mono text-[12px] tracking-wide text-[var(--color-ivory-66)]">
                      {d.tipo} · {formatarDocumento(d.tipo, d.documento)} ·{" "}
                      {d.total_bens === 1
                        ? "1 bem localizado"
                        : `${d.total_bens} bens localizados`}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-gold)]">
                    Gerar
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))
            )}
            {resultado.total > 8 && (
              <Link
                href={`/equipe/devedores?q=${encodeURIComponent(q)}${euDev ? `&eu=${encodeURIComponent(euDev)}` : ""}`}
                className="mt-1 text-center font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-gold)] hover:underline"
              >
                Ver os {resultado.total.toLocaleString("pt-BR")} resultados no
                Banco de Dossiês
              </Link>
            )}
          </div>
        )}
      </SpotlightCard>

      {/* ============ CATÁLOGO DE PEÇAS (cards mantidos) ============ */}
      <section className="mt-10">
        <h2
          className="mb-6 text-center font-serif text-[clamp(22px,2.2vw,32px)] uppercase leading-[1.1] tracking-[0.08em] text-[var(--color-gold)]"
          style={{
            WebkitTextStroke: "1px rgba(255,255,255,0.5)",
            textShadow: "0 0 16px rgba(201,162,74,0.35)",
          }}
        >
          Catálogo de Peças Disponíveis
        </h2>
        <p className="mb-5 text-center font-mono text-[13px] uppercase tracking-[0.2em] text-[var(--color-ivory-66)]">
          Clique numa peça para ver a prévia com dados fictícios · baixe em
          PDF ou .docx
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => (
            <SpotlightCard
              key={t.id}
              blur={false}
              local
              claro
              className="transition hover:shadow-[0_0_24px_-10px_rgba(201,162,74,0.4)]"
            >
              {/* Prévia REAL da peça com o dossiê fictício do João —
                  abre em nova aba com Imprimir/PDF e Baixar .docx. */}
              <Link
                href={`/equipe/devedores/demo/peca/${t.id}${euQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col p-6"
              >
                <span className="text-2xl" aria-hidden="true">
                  {t.emoji}
                </span>
                <h3 className="mt-3 font-serif text-xl font-semibold uppercase tracking-[0.02em] text-ivory transition group-hover:text-[var(--color-gold)]">
                  {t.nome}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                  {t.descricao}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-gold)]">
                  Ver Prévia · PDF · .docx
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </Link>
            </SpotlightCard>
          ))}
        </div>
      </section>
      </div>
    </main>
  );
}
