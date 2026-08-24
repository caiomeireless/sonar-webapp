// FICHA DO PROCESSO — DEMONSTRAÇÃO (dados 100% fictícios, ditado 25/08).
// Espelha a arte da ficha real de processo pra apresentar a Ficha das
// Execuções sem expor dado sigiloso. Nada aqui toca o banco.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import { BORDA_CADERNO } from "@/app/_shared/dossie/SecaoFicha";

type Props = { searchParams?: Promise<{ eu?: string | string[] }> };

const NEON = {
  verde: "#3CFF8A",
  laranja: "#FF9C41",
  ciano: "#38BDF8",
  amarelo: "#FFD93D",
  rosa: "#FB7185",
};

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

function ChipDemo({ label, cor }: { label: string; cor: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[12px] uppercase tracking-[0.16em]"
      style={{
        color: cor,
        borderColor: `color-mix(in srgb, ${cor} 50%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${cor} 10%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}

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
        style={{ color: NEON.amarelo }}
        aria-hidden="true"
      />
      <p
        className="font-mono text-[13px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: NEON.amarelo }}
      >
        Demonstração — Todos os Dados Desta Ficha São Fictícios
      </p>
    </div>
  );
}

export default async function FichaProcessoDemoPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(sp.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const linkBase = euDev ? `?eu=${encodeURIComponent(euDev)}` : "";

  return (
    <main className="relative min-h-svh">
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1100px] px-6 py-12 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BordaLiquidaMetal cor="laranja" radius={14} className="inline-flex">
            <Link
              href={`/equipe/themis${linkBase}`}
              className="inline-flex h-full w-full items-center gap-2.5 rounded-[11px] bg-[rgba(255,156,65,0.10)] px-5 py-3 text-sm font-medium text-[#FF9C41] transition hover:bg-[rgba(255,156,65,0.18)]"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              Voltar às Execuções
            </Link>
          </BordaLiquidaMetal>
          <div className="min-w-0 flex-1">
            <AvisoFicticio />
          </div>
        </div>

        {/* ============ HEADER ============ */}
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
            1002345-67.2024.8.26.0602
          </h1>
          <p className="mt-2 font-mono text-[13px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Pasta 0042B - 137 · Cumprimento de Sentença · 3ª Vara Cível de
            Sorocaba
          </p>
        </header>

        {/* ============ IDENTIFICAÇÃO ============ */}
        <SpotlightCard
          local
          claro
          borda={BORDA_CADERNO}
          className="mt-8 p-6 sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                Devedor
              </p>
              <Link
                href={`/equipe/devedores/demo${linkBase}`}
                className="mt-1.5 block truncate text-xl font-semibold uppercase text-[var(--color-devedor)] hover:underline"
              >
                João da Silva
              </Link>
            </div>
            <div>
              <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                Cliente (Credor)
              </p>
              <p className="mt-1.5 truncate text-xl font-semibold uppercase text-[#FF9C41]">
                Distribuidora Modelo Ltda.
              </p>
            </div>
            <div>
              <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                Valor da Execução
              </p>
              <p className="mt-1.5 font-mono text-xl tabular-nums text-ivory">
                R$ 984.310,20
              </p>
            </div>
            <div>
              <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                Status · Responsável
              </p>
              <p className="mt-1.5 text-xl text-ivory">
                <span className="uppercase">Ativo</span>
                <span className="text-[var(--color-ivory-66)]">
                  {" "}
                  · Dra. Ana Beatriz Campos
                </span>
              </p>
            </div>
          </div>
        </SpotlightCard>

        {/* ============ MEDIDAS TOMADAS ============ */}
        <div className="mt-12">
          <TituloSetor texto="Medidas Tomadas" />
          <SpotlightCard
            local
            claro
            borda={BORDA_CADERNO}
            className="mt-6 p-6 sm:p-8"
          >
            <ul className="divide-y divide-[rgba(201,162,74,0.14)]">
              {[
                { data: "05/04/2025", titulo: "SISBAJUD — bloqueio de R$ 42.318,90", chip: "Positivo", cor: NEON.verde },
                { data: "18/06/2025", titulo: "RENAJUD — restrição na Hilux e no Civic", chip: "Positivo", cor: NEON.verde },
                { data: "02/09/2025", titulo: "INFOJUD — últimas declarações obtidas", chip: "Positivo", cor: NEON.verde },
                { data: "11/02/2026", titulo: "Penhora do apartamento (matrícula 45.678)", chip: "Efetivada", cor: NEON.amarelo },
                { data: "14/08/2026", titulo: "Avaliação do imóvel pelo oficial de justiça", chip: "Aguardando", cor: NEON.ciano },
              ].map((m) => (
                <li
                  key={m.data}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5 first:pt-0 last:pb-0"
                >
                  <span
                    className="font-mono text-[13px] uppercase tracking-[0.16em]"
                    style={{ color: NEON.verde }}
                  >
                    {m.data}
                  </span>
                  <span className="min-w-0 flex-1 text-lg text-ivory">
                    {m.titulo}
                  </span>
                  <ChipDemo label={m.chip} cor={m.cor} />
                </li>
              ))}
            </ul>
          </SpotlightCard>
        </div>

        {/* ============ ANDAMENTOS CAPTURADOS ============ */}
        <div className="mt-12">
          <TituloSetor texto="Andamentos Capturados" />
          <SpotlightCard
            local
            claro
            borda={BORDA_CADERNO}
            className="mt-6 p-6 sm:p-8"
          >
            <ul className="divide-y divide-white/5">
              {[
                { data: "21/08/2026", cat: "Bloqueio", cor: NEON.verde, txt: "Vistos. Defiro a expedição de ofício ao SISBAJUD para nova tentativa de bloqueio sobre ativos do executado, no valor atualizado do débito." },
                { data: "14/08/2026", cat: "Penhora", cor: NEON.amarelo, txt: "Mandado de avaliação distribuído ao oficial de justiça da 2ª circunscrição — imóvel da matrícula 45.678 do 2º CRI de Sorocaba." },
                { data: "30/07/2026", cat: "Defesa", cor: NEON.rosa, txt: "Embargos à penhora opostos pelo executado. Vista à exequente para impugnação no prazo legal de 15 dias." },
                { data: "11/02/2026", cat: "Penhora", cor: NEON.amarelo, txt: "Termo de penhora lavrado e assinado. Intime-se o executado na pessoa de seu advogado, nos termos do art. 841 do CPC." },
              ].map((a) => (
                <li key={a.data + a.cat} className="py-3.5 first:pt-0 last:pb-0">
                  <p className="flex flex-wrap items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em]">
                    <ChipDemo label={a.cat} cor={a.cor} />
                    <span className="text-[var(--color-ivory-66)]">{a.data} · e-SAJ TJSP</span>
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                    {a.txt}
                  </p>
                </li>
              ))}
            </ul>
          </SpotlightCard>
        </div>

        {/* ============ ANÁLISE PROCESSUAL (fake) ============ */}
        <div className="mt-12">
          <TituloSetor texto="Análise Processual" />
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-12">
            <div className="col-span-1 md:col-span-12">
              <SpotlightCard local claro borda={BORDA_CADERNO} className="p-6">
                <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.26em]" style={{ color: NEON.verde }}>
                  Próxima Ação Sugerida
                </p>
                <p className="mt-3 text-lg leading-snug text-ivory">
                  Impugnar os embargos à penhora dentro do prazo (vence em
                  03/09/2026) e requerer a avaliação definitiva do imóvel —
                  a penhora já efetivada cobre 90% do débito atualizado.
                </p>
              </SpotlightCard>
            </div>
            <div className="col-span-1 md:col-span-6">
              <SpotlightCard local claro borda={BORDA_CADERNO} className="h-full p-6">
                <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.26em] text-[var(--color-gold)]">
                  Cronologia do Caso
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    ["12/03/2024", "Distribuição do cumprimento de sentença"],
                    ["22/05/2026", "Citação positiva no endereço confirmado"],
                    ["11/02/2026", "Penhora do imóvel efetivada"],
                    ["30/07/2026", "Embargos à penhora (defesa do executado)"],
                  ].map(([d, t]) => (
                    <li key={d} className="flex items-baseline gap-3">
                      <span className="shrink-0 font-mono text-[12px] text-[var(--color-ivory-66)]">{d}</span>
                      <span className="text-sm text-ivory">{t}</span>
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </div>
            <div className="col-span-1 md:col-span-6">
              <SpotlightCard local claro borda={BORDA_CADERNO} className="h-full p-6">
                <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.26em]" style={{ color: NEON.ciano }}>
                  Próximos Atos Processuais
                </p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    ["03/09/2026", "Prazo da impugnação aos embargos", NEON.rosa],
                    ["15/09/2026", "Laudo de avaliação do oficial", NEON.ciano],
                    ["Out/2026", "Decisão dos embargos (estimativa)", NEON.amarelo],
                  ].map(([d, t, c]) => (
                    <li key={d as string} className="flex items-baseline gap-3">
                      <span className="shrink-0 font-mono text-[12px]" style={{ color: c as string }}>{d}</span>
                      <span className="text-sm text-ivory">{t}</span>
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <AvisoFicticio />
        </div>
      </div>
    </main>
  );
}
