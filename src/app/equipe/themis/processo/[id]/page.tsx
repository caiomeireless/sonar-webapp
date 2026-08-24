// FICHA DO PROCESSO — Rota das Execuções (ditados 25/08).
// Mesma arte da Ficha do Devedor (vidro claro + borda dourada, títulos
// dourados de contorno branco). Além da identificação, recebeu o que
// SAIU da ficha do devedor: Próxima Ação, Cronologia do Caso, Próximos
// Atos, Sazonalidade e as MEDIDAS tomadas neste processo. Os andamentos
// capturados pelos robôs chegam na próxima etapa.
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { formatBRL, formatData } from "@/lib/format";
import { listarMedidasPorDevedor } from "@/lib/medidas";
import { obterDadosDashboardCasoV2 } from "@/lib/dashboard-caso";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import { BORDA_CADERNO } from "@/app/_shared/dossie/SecaoFicha";

import ProximaAcao from "@/app/equipe/devedores/[id]/dashboard/_components/ProximaAcao";
import CronologiaCaso from "@/app/equipe/devedores/[id]/dashboard/_components/CronologiaCaso";
import ProximosAtosProcessuais from "@/app/equipe/devedores/[id]/dashboard/_components/ProximosAtosProcessuais";
import SazonalidadeAtividade from "@/app/equipe/devedores/[id]/dashboard/_components/SazonalidadeAtividade";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

type CasoFicha = {
  id: number;
  numero_processo: string | null;
  pasta_themis: string | null;
  valor_credito_brl: number | null;
  status: string;
  responsavel_email: string | null;
  devedor: { id: number; nome: string; tipo: "PF" | "PJ" } | null;
  credor: { id: number; nome: string } | null;
};

async function obterCasoFicha(casoId: number): Promise<CasoFicha | null> {
  const sb = createAdminClient();
  const { data } = await sb
    .from("casos")
    .select(
      `id, numero_processo, pasta_themis, valor_credito_brl, status,
       responsavel_email,
       devedor:devedores(id, nome, tipo),
       credor:credores(id, nome)`,
    )
    .eq("id", casoId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as number,
    numero_processo: (data.numero_processo as string | null) ?? null,
    pasta_themis: (data.pasta_themis as string | null) ?? null,
    valor_credito_brl: (data.valor_credito_brl as number | null) ?? null,
    status: (data.status as string) ?? "ativo",
    responsavel_email: (data.responsavel_email as string | null) ?? null,
    devedor: (data.devedor as unknown as CasoFicha["devedor"]) ?? null,
    credor: (data.credor as unknown as CasoFicha["credor"]) ?? null,
  };
}

function TituloSetor({ texto }: { texto: string }) {
  return (
    <h2
      className="text-center font-serif text-[clamp(24px,2.5vw,38px)] uppercase leading-[1.1] tracking-[0.08em] text-[var(--color-gold)]"
      style={{
        WebkitTextStroke: "1px rgba(255,255,255,0.55)",
        textShadow: "0 0 18px rgba(201,162,74,0.4)",
      }}
    >
      {texto}
    </h2>
  );
}

// Análise processual (streaming): os 4 cards que saíram do dashboard da
// ficha do devedor moram aqui, calculados pro devedor deste processo.
async function AnaliseProcessual({ devedorId }: { devedorId: number }) {
  const dados = await obterDadosDashboardCasoV2(devedorId);
  if (!dados) {
    return (
      <p className="text-center text-sm text-[var(--color-ivory-66)]">
        Dados analíticos indisponíveis no momento.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
      <div className="col-span-1 md:col-span-12">
        <div className="rounded-xl bg-gradient-to-br from-[rgba(60,255,138,0.04)] to-transparent p-px">
          <ProximaAcao proximaAcao={dados.proximaAcaoSugerida} />
        </div>
      </div>
      <div className="col-span-1 md:col-span-6">
        <CronologiaCaso cronologia={dados.cronologiaCaso} />
      </div>
      <div className="col-span-1 md:col-span-6">
        <ProximosAtosProcessuais atos={dados.proximosAtosProcessuais} />
      </div>
      <div className="col-span-1 md:col-span-12">
        <SazonalidadeAtividade sazonalidade={dados.sazonalidadeAtividade} />
      </div>
    </div>
  );
}

export default async function FichaProcessoPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(sp.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  const casoId = /^\d+$/.test(id) ? Number.parseInt(id, 10) : Number.NaN;
  const caso = Number.isFinite(casoId) ? await obterCasoFicha(casoId) : null;

  // Medidas SÓ deste processo (o advogado volta a enxergar a lista que
  // saiu da ficha do devedor — achado da revisão 25/08).
  const medidasCaso = caso?.devedor
    ? (await listarMedidasPorDevedor(caso.devedor.id)).filter(
        (m) => m.caso_id === caso.id,
      )
    : [];

  return (
    <main className="relative min-h-svh">
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1100px] px-6 py-12 sm:px-10">
        <BordaLiquidaMetal cor="laranja" radius={14} className="inline-flex">
          <Link
            href={`/equipe/themis${linkBase}`}
            className="inline-flex h-full w-full items-center gap-2.5 rounded-[11px] bg-[rgba(255,156,65,0.10)] px-5 py-3 text-sm font-medium text-[#FF9C41] transition hover:bg-[rgba(255,156,65,0.18)]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            Voltar às Rotas
          </Link>
        </BordaLiquidaMetal>

        {!caso ? (
          <SpotlightCard
            local
            claro
            borda={BORDA_CADERNO}
            className="mt-10 p-10 text-center"
          >
            <p className="font-serif text-2xl text-ivory">
              Processo não localizado
            </p>
            <p className="mx-auto mt-3 max-w-[480px] text-sm text-[var(--color-ivory-88)]">
              O identificador informado não corresponde a nenhum caso
              cadastrado.
            </p>
          </SpotlightCard>
        ) : (
          <>
            <header className="mt-10 text-center">
              <div className="inline-flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="inline-block h-px w-10 bg-[var(--color-signal)] opacity-60 sm:w-14"
                />
                <span className="font-mono font-medium uppercase tracking-[0.34em] text-[14px] text-[var(--color-signal)]">
                  Ficha do Processo
                </span>
                <span
                  aria-hidden="true"
                  className="inline-block h-px w-10 bg-[var(--color-signal)] opacity-60 sm:w-14"
                />
              </div>
              <h1
                className="mt-4 break-words font-serif text-[clamp(22px,3vw,40px)] font-medium leading-[1.1] tracking-[0.04em] text-[var(--color-gold)]"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.5)" }}
              >
                {caso.numero_processo ?? `Caso Interno #${caso.id}`}
              </h1>
              {caso.pasta_themis ? (
                <p className="mt-2 font-mono text-[13px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                  Pasta {caso.pasta_themis}
                </p>
              ) : null}
            </header>

            <SpotlightCard
              local
              claro
              borda={BORDA_CADERNO}
              className="mt-8 p-6 sm:p-8"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="border-b border-[rgba(201,162,74,0.16)] pb-4 sm:border-b-0 sm:pb-0">
                  <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                    Devedor
                  </p>
                  {caso.devedor ? (
                    <Link
                      href={`/equipe/devedores/${caso.devedor.id}${linkBase}`}
                      className="mt-1.5 block truncate text-xl font-semibold uppercase text-[var(--color-devedor)] hover:underline"
                    >
                      {caso.devedor.nome}
                    </Link>
                  ) : (
                    <p className="mt-1.5 text-xl text-[var(--color-ivory-40)]">—</p>
                  )}
                </div>
                <div>
                  <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                    Cliente (Credor)
                  </p>
                  <p className="mt-1.5 truncate text-xl font-semibold uppercase text-[#FF9C41]">
                    {caso.credor?.nome ?? "—"}
                  </p>
                </div>
                <div className="border-b border-[rgba(201,162,74,0.16)] pb-4 sm:border-b-0 sm:pb-0">
                  <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                    Valor da Execução
                  </p>
                  <p className="mt-1.5 font-mono text-xl tabular-nums text-ivory">
                    {caso.valor_credito_brl && caso.valor_credito_brl > 0
                      ? formatBRL(caso.valor_credito_brl)
                      : "Aguardando Robôs"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                    Status · Responsável
                  </p>
                  <p className="mt-1.5 text-xl text-ivory">
                    <span className="uppercase">{caso.status}</span>
                    <span className="text-[var(--color-ivory-66)]">
                      {" "}
                      · {caso.responsavel_email ?? "sem responsável"}
                    </span>
                  </p>
                </div>
              </div>
            </SpotlightCard>

            {/* ============ MEDIDAS DESTE PROCESSO ============ */}
            <div className="mt-12">
              <TituloSetor texto="Medidas Tomadas" />
              <SpotlightCard
                local
                claro
                borda={BORDA_CADERNO}
                className="mt-6 p-6 sm:p-8"
              >
                {medidasCaso.length === 0 ? (
                  <p className="text-center text-sm text-[var(--color-ivory-66)]">
                    Nenhuma medida registrada neste processo ainda.
                  </p>
                ) : (
                  <ul className="sem-scrollbar max-h-[420px] divide-y divide-[rgba(201,162,74,0.14)] overflow-y-auto">
                    {medidasCaso.map((m) => (
                      <li key={m.id} className="py-4 first:pt-0 last:pb-0">
                        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="font-mono text-[13px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
                            {formatData(m.data)}
                          </span>
                          <span className="text-lg font-medium text-ivory">
                            {m.titulo}
                          </span>
                          <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
                            {m.resultado}
                          </span>
                        </p>
                        {m.detalhes ? (
                          <p className="mt-1 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                            {m.detalhes}
                          </p>
                        ) : null}
                        {m.advogado_email ? (
                          <p className="mt-1 font-mono text-[12px] text-[var(--color-ivory-66)]">
                            {m.advogado_email}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </SpotlightCard>
            </div>

            {/* ============ ANÁLISE PROCESSUAL (ex-dashboard) ============ */}
            {caso.devedor ? (
              <div className="mt-12">
                <TituloSetor texto="Análise Processual" />
                <div className="mt-6">
                  <Suspense
                    fallback={
                      <p className="animate-pulse text-center font-mono text-[13px] uppercase tracking-[0.28em] text-[var(--color-ivory-66)]">
                        Calculando indicadores…
                      </p>
                    }
                  >
                    <AnaliseProcessual devedorId={caso.devedor.id} />
                  </Suspense>
                </div>
              </div>
            ) : null}

            <SpotlightCard
              local
              claro
              borda={BORDA_CADERNO}
              className="mt-12 p-6 text-center sm:p-7"
            >
              <p className="font-mono text-[13px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
                Em Construção
              </p>
              <p className="mx-auto mt-3 max-w-[560px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
                Os andamentos processuais capturados pelos robôs chegam aqui
                na próxima etapa da Rota das Execuções.
              </p>
            </SpotlightCard>
          </>
        )}
      </div>
    </main>
  );
}
