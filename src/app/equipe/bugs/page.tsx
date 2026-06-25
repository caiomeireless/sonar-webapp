// Comunicação de Bugs — tela onde a equipe reporta problemas pra Caio.
// Server Component: formulário + lista dos próprios bugs reportados.
// Caio vê TODOS os bugs em /equipe/configuracoes (bloco admin-only).
import { redirect } from "next/navigation";
import { Bug, CheckCircle2 } from "lucide-react";

import { ehEquipe } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";
import { listarBugsDoUsuario, rotuloStatusBug } from "@/lib/bugs";
import { formatTempoRelativo } from "@/lib/format";

import { enviarBug } from "./actions";
import DropzoneScreenshots from "./_components/DropzoneScreenshots";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ ok?: string }>;
};

export default async function BugsPage({ searchParams }: Props) {
  const perfil = await perfilLogado();
  if (!ehEquipe(perfil)) redirect("/login");
  const params = (await searchParams) ?? {};
  const sucesso = params.ok === "1";

  const meusBugs = await listarBugsDoUsuario(perfil?.email ?? "");

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10">
      {/* ============ HEADER ============ */}
      <header className="title-shield mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <Bug className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
          Reportar e Acompanhar
        </p>
        <h1 className="mt-3 font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Comunicação de Bugs
        </h1>
        <p className="mx-auto mt-3 max-w-[640px] font-mono text-[13px] text-[var(--color-ivory-88)]">
          Encontrou algo estranho? Descreva o problema, anexe a captura de tela
          e o Caio recebe direto no e-mail.
        </p>
      </header>

      {/* ============ BANNER DE SUCESSO ============ */}
      {sucesso ? (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-[var(--color-signal)]/45 bg-[var(--color-signal-soft)] px-5 py-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-signal)]" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
              Bug enviado
            </p>
            <p className="text-sm text-[var(--color-ivory-88)]">
              O Caio receberá por e-mail e dará retorno no acompanhamento abaixo.
            </p>
          </div>
        </div>
      ) : null}

      {/* ============ FORMULÁRIO ============ */}
      <form action={enviarBug} className="glass p-7">
        <h2 className="font-serif text-xl text-ivory">Reportar um novo bug</h2>
        <p className="mt-1 text-sm text-[var(--color-ivory-66)]">
          Quanto mais detalhe (passos pra reproduzir, tela, devedor), mais rápido
          a correção sai.
        </p>

        <div className="mt-6 grid gap-5">
          {/* Título */}
          <div>
            <label
              htmlFor="titulo"
              className="block font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]"
            >
              Título do bug
            </label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              required
              maxLength={140}
              placeholder="Ex.: Cálculo judicial não atualiza ao trocar índice"
              className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3.5 text-base text-ivory placeholder:text-[var(--color-ivory-40)] focus:border-[var(--color-signal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]/30"
            />
          </div>

          {/* Descrição */}
          <div>
            <label
              htmlFor="descricao"
              className="block font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]"
            >
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              required
              rows={6}
              placeholder="O que aconteceu? O que era pra acontecer? Em qual tela? Reproduzível?"
              className="mt-2 w-full resize-y rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3.5 text-base text-ivory placeholder:text-[var(--color-ivory-40)] focus:border-[var(--color-signal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]/30"
            />
          </div>

          {/* Screenshots */}
          <div>
            <label className="block font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Capturas de tela (opcional)
            </label>
            <div className="mt-2">
              <DropzoneScreenshots />
            </div>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
            Enviado como{" "}
            <span className="text-[var(--color-ivory-66)]">
              {perfil?.nome || perfil?.email}
            </span>
          </p>
          <button type="submit" className="btn-neon-signal">
            <Bug className="h-4 w-4" />
            Enviar Bug
          </button>
        </div>
      </form>

      {/* ============ MEUS BUGS REPORTADOS ============ */}
      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-xl text-ivory">Meus bugs reportados</h2>
          {meusBugs.length > 0 ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              {meusBugs.length}{" "}
              {meusBugs.length === 1 ? "registro" : "registros"}
            </span>
          ) : null}
        </div>

        {meusBugs.length === 0 ? (
          <div className="glass p-8 text-center">
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
              Nenhum bug reportado ainda
            </p>
            <p className="mt-2 text-sm text-[var(--color-ivory-66)]">
              Quando você reportar, o histórico aparece aqui com o status de
              cada um.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {meusBugs.map((b) => {
              const r = rotuloStatusBug(b.status);
              return (
                <article key={b.id} className="glass p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-base text-ivory">
                        {b.titulo}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                        {b.descricao}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.20em] text-[var(--color-ivory-40)]">
                        <span>{formatTempoRelativo(b.criadoEm)}</span>
                        {b.screenshots.length > 0 ? (
                          <span>
                            {b.screenshots.length}{" "}
                            {b.screenshots.length === 1 ? "anexo" : "anexos"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em]"
                      style={{
                        color: r.color,
                        backgroundColor: "color-mix(in srgb, " + r.color + " 14%, transparent)",
                        border: "1px solid color-mix(in srgb, " + r.color + " 45%, transparent)",
                      }}
                    >
                      {r.label}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
