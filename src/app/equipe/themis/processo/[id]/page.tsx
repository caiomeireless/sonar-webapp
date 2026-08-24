// FICHA DO PROCESSO — Rota das Execuções (fundação, ditado 25/08).
// Mesma arte da Ficha do Devedor (caderno pautado). Aqui vão morar os
// andamentos processuais e a linha do tempo que saíram da ficha do
// devedor; por ora traz a identificação completa do processo.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { formatBRL } from "@/lib/format";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import {
  LINHAS_CADERNO,
  BORDA_CADERNO,
} from "@/app/_shared/dossie/SecaoFicha";

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
            degrade={LINHAS_CADERNO}
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
                <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                  Pasta {caso.pasta_themis}
                </p>
              ) : null}
            </header>

            <SpotlightCard
              local
              degrade={LINHAS_CADERNO}
              borda={BORDA_CADERNO}
              className="mt-8 p-6 sm:p-7"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                    Devedor
                  </p>
                  {caso.devedor ? (
                    <Link
                      href={`/equipe/devedores/${caso.devedor.id}${linkBase}`}
                      className="mt-1 block truncate text-lg font-semibold uppercase text-[var(--color-devedor)] hover:underline"
                    >
                      {caso.devedor.nome}
                    </Link>
                  ) : (
                    <p className="mt-1 text-lg text-[var(--color-ivory-66)]">—</p>
                  )}
                </div>
                <div>
                  <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                    Cliente (Credor)
                  </p>
                  <p className="mt-1 truncate text-lg font-semibold uppercase text-[#FF9C41]">
                    {caso.credor?.nome ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                    Valor da Execução
                  </p>
                  <p className="mt-1 font-mono text-lg tabular-nums text-ivory">
                    {caso.valor_credito_brl && caso.valor_credito_brl > 0
                      ? formatBRL(caso.valor_credito_brl)
                      : "Aguardando Robôs"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                    Status · Responsável
                  </p>
                  <p className="mt-1 text-lg text-ivory">
                    <span className="uppercase">{caso.status}</span>
                    <span className="text-[var(--color-ivory-66)]">
                      {" "}
                      · {caso.responsavel_email ?? "sem responsável"}
                    </span>
                  </p>
                </div>
              </div>
            </SpotlightCard>

            <SpotlightCard
              local
              degrade={LINHAS_CADERNO}
              borda={BORDA_CADERNO}
              className="mt-5 p-6 text-center sm:p-7"
            >
              <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
                Em Construção
              </p>
              <p className="mx-auto mt-3 max-w-[560px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
                Os andamentos processuais capturados pelos robôs e a linha do
                tempo de medidas deste processo vão morar aqui, na Rota das
                Execuções.
              </p>
            </SpotlightCard>
          </>
        )}
      </div>
    </main>
  );
}
