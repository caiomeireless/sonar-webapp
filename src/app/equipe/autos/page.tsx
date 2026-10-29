// Análise de Autos — o advogado joga o capa a capa e o Sonar monta a ficha.
//
// Esta aba é a nova porta de entrada de dados do sistema. Com a saída do
// Themis, é daqui que passam a vir processo, devedor, medidas e débito.
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, FileSearch } from "lucide-react";

import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { ehCliente } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";
import { devEuFromParam } from "@/lib/dev-auth";
import { temChaveAnthropic } from "@/lib/autos/claude";
import { listarAnalises } from "@/lib/autos/analises";
import { formatBRL, formatTempoRelativo } from "@/lib/format";

import { Analisador } from "./_components/Analisador";
import { listarCredoresParaVinculo } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

const STATUS_LABEL: Record<string, { texto: string; cor: string }> = {
  extraindo: { texto: "Lendo", cor: "var(--color-ivory-66)" },
  triando: { texto: "Triando", cor: "var(--color-ivory-66)" },
  analisando: { texto: "Analisando", cor: "#9ED8FF" },
  consolidando: { texto: "Consolidando", cor: "#9ED8FF" },
  revisao: { texto: "Aguardando conferência", cor: "#F4C542" },
  confirmada: { texto: "Na biblioteca", cor: "var(--color-signal)" },
  erro: { texto: "Interrompida", cor: "#FF5B5B" },
  cancelada: { texto: "Cancelada", cor: "var(--color-ivory-40)" },
};

export default async function AnaliseAutosPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(params.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const euQuery = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  const [credores, anteriores] = await Promise.all([
    listarCredoresParaVinculo(),
    listarAnalises(12),
  ]);
  const semChave = !temChaveAnthropic();

  return (
    <main className="relative min-h-svh">
      {/* Fundo preto puro, padrão da cara nova. */}
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-12 sm:px-10">
        {/* ============ HEADER ============ */}
        <header className="mb-10 text-center">
          <h1
            className="font-serif text-[clamp(29px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[#C97B2A]"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.65)" }}
          >
            Análise de Autos
          </h1>
          <p className="mt-3 font-mono text-[clamp(13px,1.6vw,20px)] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
            O Capa a Capa Vira Ficha.
          </p>
          <p className="mx-auto mt-4 max-w-[700px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
            Jogue o PDF integral dos autos de uma execução em que o escritório
            representa o credor. O Sonar lê peça por peça, separa o que já foi
            feito de busca e constrição, apura quanto disso virou dinheiro,
            atualiza o débito e diz qual é a próxima movimentação.
          </p>
        </header>

        {/* ============ AVISO: FALTA A CHAVE ============ */}
        {semChave && (
          <SpotlightCard
            local
            borda="rgba(244,197,66,0.4)"
            className="mb-8 flex items-start gap-4 p-6"
          >
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-[#F4C542]"
              aria-hidden="true"
            />
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-[#F4C542]">
                Falta a chave da API
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                A leitura dos autos usa o modelo Claude Opus 5.5 no esforço
                máximo. Defina a variável{" "}
                <code className="font-mono text-[var(--color-gold)]">
                  ANTHROPIC_API_KEY
                </code>{" "}
                no ambiente (local e na Vercel) para a análise funcionar. Toda
                a tela abaixo já está montada e o arquivo continua sendo lido no
                navegador, mas a análise em si vai falhar sem a chave.
              </p>
            </div>
          </SpotlightCard>
        )}

        {/* ============ O QUADRO ============ */}
        <Analisador credores={credores} />

        {/* ============ ANÁLISES ANTERIORES ============ */}
        {anteriores.length > 0 && (
          <section className="mt-16">
            <h2
              className="mb-6 text-center font-serif text-[clamp(22px,2.2vw,32px)] uppercase leading-[1.1] tracking-[0.08em] text-[var(--color-gold)]"
              style={{
                WebkitTextStroke: "1px rgba(255,255,255,0.5)",
                textShadow: "0 0 16px rgba(201,162,74,0.35)",
              }}
            >
              Autos Já Analisados
            </h2>

            <div className="flex flex-col gap-2">
              {anteriores.map((a) => {
                const meta = STATUS_LABEL[a.status] ?? {
                  texto: a.status,
                  cor: "var(--color-ivory-66)",
                };
                const corpo = (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 truncate text-sm text-ivory">
                        <FileSearch
                          className="h-4 w-4 shrink-0 text-[var(--color-ivory-40)]"
                          aria-hidden="true"
                        />
                        {a.arquivo_nome}
                      </span>
                      <span className="mt-1 block font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-40)]">
                        {a.numero_processo ?? "Processo não identificado"} ·{" "}
                        {a.total_paginas.toLocaleString("pt-BR")} páginas ·{" "}
                        {formatTempoRelativo(a.criado_em)}
                      </span>
                    </span>

                    <span className="shrink-0 text-right">
                      <span
                        className="block font-mono text-[12px] uppercase tracking-[0.18em]"
                        style={{ color: meta.cor }}
                      >
                        {meta.texto}
                      </span>
                      {a.custo_brl !== null && (
                        <span className="mt-1 block font-mono text-[12px] text-[var(--color-ivory-40)]">
                          {formatBRL(a.custo_brl)}
                        </span>
                      )}
                    </span>
                  </>
                );

                return (
                  <SpotlightCard key={a.id} blur={false} local className="p-0">
                    {a.devedor_id ? (
                      <Link
                        href={`/equipe/devedores/${a.devedor_id}${euQuery}`}
                        className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[var(--color-signal-06)]"
                      >
                        {corpo}
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        {corpo}
                      </div>
                    )}
                  </SpotlightCard>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
