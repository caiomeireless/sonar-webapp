// Análise de Autos — o advogado joga o capa a capa e o Sonar monta a ficha.
//
// Esta aba é a nova porta de entrada de dados do sistema. Com a saída do
// Themis, é daqui que passam a vir processo, devedor, medidas e débito.
//
// `?analise=ID` reabre uma ficha já salva: a análise sobrevive ao recarregar
// da página e ao fechar do navegador.
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, FileSearch } from "lucide-react";

import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import { ehCliente } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";
import { devEuFromParam } from "@/lib/dev-auth";
import { temChaveAnthropic } from "@/lib/autos/claude";
import { listarAnalises, obterAnalise } from "@/lib/autos/analises";
import { fichaVigente } from "@/lib/autos/tipos";
import { formatBRL, formatTempoRelativo } from "@/lib/format";

import { Analisador } from "./_components/Analisador";
import { BotaoRetomar } from "./_components/BotaoRetomar";
import { FichaResultado } from "./_components/FichaResultado";
import { listarCredoresParaVinculo } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    eu?: string | string[];
    analise?: string | string[];
  }>;
};

const STATUS_LABEL: Record<string, { texto: string; cor: string }> = {
  extraindo: { texto: "Lendo", cor: "var(--color-ivory-66)" },
  triando: { texto: "Triando", cor: "var(--color-ivory-66)" },
  analisando: { texto: "Lendo lotes", cor: "#9ED8FF" },
  consolidando: { texto: "Consolidando", cor: "#9ED8FF" },
  revisao: { texto: "Aguardando conferência", cor: "#F4C542" },
  confirmada: { texto: "Na biblioteca", cor: "var(--color-signal)" },
  erro: { texto: "Interrompida", cor: "#FF5B5B" },
  cancelada: { texto: "Cancelada", cor: "var(--color-ivory-40)" },
};

/** Uma análise parada pode ser retomada do banco (consolidação) ou pelo PDF. */
const RETOMAVEIS = new Set(["analisando", "consolidando", "erro"]);

function primeiro(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AnaliseAutosPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(params.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const euQuery = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";
  const comEu = (extra: string) =>
    euDev ? `?${extra}&eu=${encodeURIComponent(euDev)}` : `?${extra}`;

  const idSalva = Number.parseInt(primeiro(params.analise) ?? "", 10);
  const [credores, anteriores, salva] = await Promise.all([
    listarCredoresParaVinculo(),
    listarAnalises(12),
    Number.isFinite(idSalva) ? obterAnalise(idSalva) : Promise.resolve(null),
  ]);
  const semChave = !temChaveAnthropic();
  const fichaSalva =
    salva && (salva.status === "revisao" || salva.status === "confirmada")
      ? fichaVigente(salva)
      : null;

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
          {!salva && (
            <p className="mx-auto mt-4 max-w-[700px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
              Jogue o PDF integral dos autos de uma execução em que o escritório
              representa o credor. O Sonar lê peça por peça, separa o que já foi
              feito de busca e constrição, apura quanto disso virou dinheiro,
              atualiza o débito e diz qual é a próxima movimentação.
            </p>
          )}
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
                A leitura dos autos usa o modelo Claude Opus 5.5. Defina a
                variável{" "}
                <code className="font-mono text-[var(--color-gold)]">
                  ANTHROPIC_API_KEY
                </code>{" "}
                no ambiente (local e na Vercel) para a análise funcionar.
              </p>
            </div>
          </SpotlightCard>
        )}

        {/* ============ FICHA SALVA (reaberta) ============ */}
        {salva ? (
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <BordaLiquidaMetal cor="laranja" radius={14} className="inline-flex">
                <Link
                  href={`/equipe/autos${euQuery}`}
                  className="inline-flex h-full w-full items-center gap-2.5 rounded-[11px] bg-[rgba(255,156,65,0.10)] px-5 py-3 text-sm font-medium text-[#FF9C41] transition hover:bg-[rgba(255,156,65,0.18)]"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  Voltar
                </Link>
              </BordaLiquidaMetal>
              <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-[var(--color-ivory-66)]">
                Análise #{salva.id} · {salva.arquivo_nome} ·{" "}
                {salva.total_paginas.toLocaleString("pt-BR")} páginas
                {salva.custo_brl !== null ? ` · custo ${formatBRL(salva.custo_brl)}` : ""}
              </p>
            </div>

            {fichaSalva ? (
              <FichaResultado
                ficha={fichaSalva}
                analiseId={salva.id}
                credores={credores}
              />
            ) : (
              <SpotlightCard local claro className="p-8 text-center">
                <p className="font-mono text-[13px] uppercase tracking-[0.28em] text-[#F4C542]">
                  {(STATUS_LABEL[salva.status] ?? { texto: salva.status }).texto}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                  {salva.etapa_atual ?? "Esta análise ainda não chegou à ficha."}
                  {salva.erro ? ` — ${salva.erro}` : ""}
                </p>
                {RETOMAVEIS.has(salva.status) && (
                  <div className="mt-5 flex justify-center">
                    <BotaoRetomar analiseId={salva.id} euDev={euDev ?? null} />
                  </div>
                )}
              </SpotlightCard>
            )}
          </div>
        ) : (
          <Analisador credores={credores} />
        )}

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
                const temFicha =
                  a.status === "revisao" || a.status === "confirmada";

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
                        {!temFicha && a.etapa_atual ? ` · ${a.etapa_atual}` : ""}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-4">
                      <span className="text-right">
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
                      {!temFicha && RETOMAVEIS.has(a.status) && (
                        <BotaoRetomar analiseId={a.id} euDev={euDev ?? null} />
                      )}
                    </span>
                  </>
                );

                return (
                  <SpotlightCard key={a.id} blur={false} local className="p-0">
                    {temFicha ? (
                      <Link
                        href={`/equipe/autos${comEu(`analise=${a.id}`)}`}
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
