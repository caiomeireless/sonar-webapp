// Configurações da plataforma — placeholder. Vai abrigar gestão de
// usuários, papéis, integrações (Themis/Assertiva), aparência e
// auditoria. Acesso restrito a admin/sócio.
import { redirect } from "next/navigation";
import { Bug, Settings, Users, Plug, Eye, ShieldCheck } from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { ehAdmin, ehSocio } from "@/lib/perfis";
import { DONO_EMAIL } from "@/lib/config";
import { listarBugs, rotuloStatusBug } from "@/lib/bugs";
import { formatTempoRelativo } from "@/lib/format";

import SelectStatusBug from "./_components/SelectStatusBug";

export const dynamic = "force-dynamic";

const SECOES = [
  { icon: Users, titulo: "Usuários e papéis", descricao: "Convidar equipe, definir admin/sócio/funcionário, vincular clientes." },
  { icon: Plug, titulo: "Integrações", descricao: "Themis, Assertiva, BigDataCorp, ARISP, Resend. Tokens e limites." },
  { icon: Eye, titulo: "Aparência", descricao: "Tema padrão da equipe, logos do escritório, cores institucionais." },
  { icon: ShieldCheck, titulo: "Segurança e auditoria", descricao: "Logs de consultas pagas, downloads de peça, sessões ativas." },
];

export default async function ConfiguracoesPage() {
  const perfil = await perfilLogado();
  if (!ehAdmin(perfil) && !ehSocio(perfil)) redirect("/equipe");

  // Bloco "Bugs Reportados" é EXCLUSIVO do Caio (DONO_EMAIL). Nem outros
  // admins/sócios veem essa seção — fila pessoal de triagem.
  const ehDono = (perfil?.email ?? "").toLowerCase() === DONO_EMAIL.toLowerCase();
  const bugs = ehDono ? await listarBugs() : [];

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
      <header className="title-shield mb-6 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <Settings className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Administração da Plataforma
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Configurações
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {SECOES.map((s) => (
          <article key={s.titulo} className="glass p-6">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-signal-soft)]">
              <s.icon className="h-5 w-5 text-[var(--color-signal)]" />
            </div>
            <h2 className="font-serif text-xl text-ivory">{s.titulo}</h2>
            <p className="mt-1.5 text-sm text-[var(--color-ivory-66)]">
              {s.descricao}
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
              Em construção
            </p>
          </article>
        ))}
      </section>

      {/* ============ BUGS REPORTADOS · ADMIN-ONLY (DONO_EMAIL) ============ */}
      {ehDono ? (
        <section className="mt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-signal-soft)]">
                <Bug className="h-5 w-5 text-[var(--color-signal)]" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-ivory">Bugs Reportados</h2>
                <p className="text-sm text-[var(--color-ivory-66)]">
                  Fila de triagem — todos os bugs da equipe, em ordem cronológica.
                </p>
              </div>
            </div>
            {bugs.length > 0 ? (
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                {bugs.length} {bugs.length === 1 ? "registro" : "registros"}
              </span>
            ) : null}
          </div>

          {bugs.length === 0 ? (
            <div className="glass p-8 text-center">
              <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
                Nenhum bug reportado ainda
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {bugs.map((b) => {
                const r = rotuloStatusBug(b.status);
                return (
                  <article key={b.id} className="glass p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <h3 className="font-serif text-base text-ivory">
                            {b.titulo}
                          </h3>
                          <span
                            className="shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em]"
                            style={{
                              color: r.color,
                              backgroundColor:
                                "color-mix(in srgb, " + r.color + " 14%, transparent)",
                              border:
                                "1px solid color-mix(in srgb, " + r.color + " 45%, transparent)",
                            }}
                          >
                            {r.label}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                          {b.descricao}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.20em] text-[var(--color-ivory-40)]">
                          <span>
                            <span className="text-[var(--color-ivory-66)]">
                              {b.reportadoPorNome}
                            </span>{" "}
                            · {b.reportadoPorEmail}
                          </span>
                          <span>{formatTempoRelativo(b.criadoEm)}</span>
                          {b.screenshots.length > 0 ? (
                            <span>
                              {b.screenshots.length}{" "}
                              {b.screenshots.length === 1 ? "anexo" : "anexos"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <SelectStatusBug id={b.id} atual={b.status} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
