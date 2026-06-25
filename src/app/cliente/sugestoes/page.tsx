// Sugestoes e Duvidas do cliente — espelha visual de /equipe/bugs:
// form em cima + lista das proprias sugestoes embaixo. Envia email
// pro Caio via Resend e persiste em memoria (demo).

import { redirect } from "next/navigation";
import { MessageCircle, CheckCircle2 } from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import {
  listarSugestoesDoUsuario,
  rotuloStatusSugestao,
  rotuloTipoSugestao,
} from "@/lib/sugestoes";
import { formatTempoRelativo } from "@/lib/format";

import { enviarSugestao } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ ok?: string }>;
};

export default async function SugestoesPage({ searchParams }: Props) {
  const perfil = await perfilLogado();
  if (!perfil) redirect("/login");
  const params = (await searchParams) ?? {};
  const sucesso = params.ok === "1";

  const minhas = await listarSugestoesDoUsuario(perfil.email);

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10">
      {/* HEADER */}
      <header className="title-shield mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <MessageCircle className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
          Fale com o Escrit&oacute;rio
        </p>
        <h1 className="mt-3 font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Sugest&otilde;es e D&uacute;vidas
        </h1>
        <p className="mx-auto mt-3 max-w-[640px] font-mono text-[13px] text-[var(--color-ivory-88)]">
          Tem uma ideia pra melhorar a plataforma ou uma d&uacute;vida sobre algum
          caso? Escreva aqui e um de nossos especialistas recebe direto no e-mail.
        </p>
      </header>

      {/* SUCESSO */}
      {sucesso ? (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-[var(--color-signal)]/45 bg-[var(--color-signal-soft)] px-5 py-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-signal)]" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
              Enviado
            </p>
            <p className="text-sm text-[var(--color-ivory-88)]">
              Um de nossos especialistas receber&aacute; por e-mail e dar&aacute;
              retorno no acompanhamento abaixo.
            </p>
          </div>
        </div>
      ) : null}

      {/* FORMULARIO */}
      <form action={enviarSugestao} className="glass p-7">
        <h2 className="font-serif text-xl text-ivory">Enviar nova mensagem</h2>
        <p className="mt-1 text-sm text-[var(--color-ivory-66)]">
          Quanto mais detalhe (em qual tela, qual processo, o que esperava),
          mais r&aacute;pido a resposta.
        </p>

        <div className="mt-6 grid gap-5">
          {/* Tipo */}
          <div>
            <label className="block font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Tipo
            </label>
            <div className="mt-2 inline-flex gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-1">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value="sugestao"
                  defaultChecked
                  className="peer sr-only"
                />
                <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)] transition peer-checked:bg-[var(--color-gold)]/15 peer-checked:text-[var(--color-gold)] peer-checked:ring-1 peer-checked:ring-[var(--color-gold)]/40">
                  Sugest&atilde;o
                </span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value="duvida"
                  className="peer sr-only"
                />
                <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)] transition peer-checked:bg-[var(--color-signal)]/15 peer-checked:text-[var(--color-signal)] peer-checked:ring-1 peer-checked:ring-[var(--color-signal)]/40">
                  D&uacute;vida
                </span>
              </label>
            </div>
          </div>

          {/* Titulo */}
          <div>
            <label
              htmlFor="titulo"
              className="block font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]"
            >
              Assunto
            </label>
            <input
              id="titulo"
              name="titulo"
              type="text"
              required
              maxLength={140}
              placeholder="Ex.: Exportar relatório mensal em PDF"
              className="mt-2 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3.5 text-base text-ivory placeholder:text-[var(--color-ivory-40)] focus:border-[var(--color-signal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]/30"
            />
          </div>

          {/* Descricao */}
          <div>
            <label
              htmlFor="descricao"
              className="block font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]"
            >
              Mensagem
            </label>
            <textarea
              id="descricao"
              name="descricao"
              required
              rows={6}
              placeholder="Descreva sua sugestão ou dúvida com o máximo de detalhe possível."
              className="mt-2 w-full resize-y rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3.5 text-base text-ivory placeholder:text-[var(--color-ivory-40)] focus:border-[var(--color-signal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]/30"
            />
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
            Enviado como{" "}
            <span className="text-[var(--color-ivory-66)]">
              {perfil.nome || perfil.email}
            </span>
          </p>
          <button type="submit" className="btn-neon-signal">
            <MessageCircle className="h-4 w-4" />
            Enviar
          </button>
        </div>
      </form>

      {/* MINHAS SUGESTOES */}
      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-xl text-ivory">Hist&oacute;rico</h2>
          {minhas.length > 0 ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              {minhas.length} {minhas.length === 1 ? "registro" : "registros"}
            </span>
          ) : null}
        </div>

        {minhas.length === 0 ? (
          <div className="glass p-8 text-center">
            <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
              Nenhuma mensagem enviada ainda
            </p>
            <p className="mt-2 text-sm text-[var(--color-ivory-66)]">
              Quando voc&ecirc; enviar uma sugest&atilde;o ou d&uacute;vida, ela aparece aqui
              com o status do retorno.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {minhas.map((s) => {
              const r = rotuloStatusSugestao(s.status);
              return (
                <article key={s.id} className="glass p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span
                          className="font-mono text-[10px] uppercase tracking-[0.22em]"
                          style={{
                            color:
                              s.tipo === "duvida"
                                ? "var(--color-signal)"
                                : "var(--color-gold)",
                          }}
                        >
                          {rotuloTipoSugestao(s.tipo)}
                        </span>
                        <h3 className="font-serif text-base text-ivory">
                          {s.titulo}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                        {s.descricao}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.20em] text-[var(--color-ivory-40)]">
                        <span>{formatTempoRelativo(s.criadoEm)}</span>
                      </div>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em]"
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
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
