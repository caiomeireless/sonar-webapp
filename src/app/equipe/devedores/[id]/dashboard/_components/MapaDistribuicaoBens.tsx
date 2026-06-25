"use client";

// Mapa de distribuição geográfica dos bens — Brasil inteiro com bolhas por UF.
// Inspirado no MapaBrasil do BP CRM: paths SVG embarcados (br-geo.ts), zero fetch,
// renderização instantânea. Hover destaca a UF e mostra detalhes lateralmente.
//
// Agregação: recebe DistribuicaoGeografica[] (por cidade+uf), agrupa por UF
// pras bolhas; cidades viram lista no painel lateral quando a UF é selecionada.

import { useMemo, useState } from "react";

import type { DistribuicaoGeografica } from "@/lib/dashboard-caso";
import { BR_STATES, BR_VIEWBOX } from "@/lib/br-geo";
import { formatBRL } from "@/lib/format";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

type Props = {
  distribuicao: DistribuicaoGeografica[];
  // Permite reusar o mesmo mapa em outros contextos (Painel da Equipe,
  // Painel do Cliente) mudando só o cabeçalho do card.
  titulo?: string;
  descricao?: string;
};

interface DadosUf {
  qtdBens: number;
  valorBrl: number;
  cidades: { nome: string; qtd: number; valor: number }[];
}

function agregarPorUf(
  itens: DistribuicaoGeografica[],
): { porUf: Record<string, DadosUf>; semUf: number; totalGeral: number; valorGeral: number } {
  const porUf: Record<string, DadosUf> = {};
  let semUf = 0;
  let totalGeral = 0;
  let valorGeral = 0;

  for (const d of itens) {
    totalGeral += d.qtdBens;
    valorGeral += d.valorTotalBrl;
    const uf = (d.uf ?? "").trim().toUpperCase();
    if (!uf) {
      semUf += d.qtdBens;
      continue;
    }
    if (!porUf[uf]) porUf[uf] = { qtdBens: 0, valorBrl: 0, cidades: [] };
    porUf[uf].qtdBens += d.qtdBens;
    porUf[uf].valorBrl += d.valorTotalBrl;
    porUf[uf].cidades.push({
      nome: d.cidade || "—",
      qtd: d.qtdBens,
      valor: d.valorTotalBrl,
    });
  }
  // Ordena cidades por qtd dentro de cada UF
  for (const uf of Object.keys(porUf)) {
    porUf[uf].cidades.sort((a, b) => b.qtd - a.qtd);
  }
  return { porUf, semUf, totalGeral, valorGeral };
}

export default function MapaDistribuicaoBens({
  distribuicao,
  titulo = "Distribuição geográfica dos bens",
  descricao = "Bens identificados por UF. Passe o mouse para ver cidades.",
}: Props) {
  const [ativo, setAtivo] = useState<string | null>(null);

  const { porUf, semUf, totalGeral, valorGeral } = useMemo(
    () => agregarPorUf(distribuicao),
    [distribuicao],
  );

  const max = useMemo(
    () =>
      Object.values(porUf).reduce((m, d) => Math.max(m, d.qtdBens), 0) || 1,
    [porUf],
  );

  const ranking = useMemo(
    () =>
      Object.entries(porUf)
        .map(([uf, d]) => ({ uf, qtd: d.qtdBens, valor: d.valorBrl }))
        .sort((a, b) => b.qtd - a.qtd),
    [porUf],
  );

  const nomeDe = (uf: string) => BR_STATES.find((s) => s.uf === uf)?.nome ?? uf;
  const raio = (qtd: number) => 5 + 27 * Math.sqrt(qtd / max);
  const detalhe = ativo ? porUf[ativo] : null;

  return (
    <DashboardCard
      titulo={titulo}
      descricao={descricao}
      accent="green"
    >
      <div
        className="relative grid gap-5 lg:grid-cols-[1fr_240px]"
        onMouseLeave={() => setAtivo(null)}
      >
        {/* Fundo preto opaco — protege a leitura do mapa do AetherBackground
            (partículas verdes do layout passariam por cima sem isso). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-3 rounded-2xl bg-[var(--color-onyx)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        />
        {/* ===== Mapa ===== */}
        <div className="relative z-10">
          <svg
            viewBox={BR_VIEWBOX}
            className="h-auto w-full"
            role="img"
            aria-label="Mapa do Brasil"
          >
            {/* Contorno dos estados */}
            {BR_STATES.map((s) => {
              const tem = porUf[s.uf]?.qtdBens ?? 0;
              const on = ativo === s.uf;
              return (
                <path
                  key={s.uf}
                  d={s.d}
                  onMouseEnter={() => setAtivo(s.uf)}
                  style={{
                    fill: on
                      ? "rgba(60, 255, 138, 0.16)"
                      : tem > 0
                        ? "rgba(60, 255, 138, 0.06)"
                        : "rgba(234, 231, 220, 0.025)",
                    stroke: on
                      ? "var(--color-signal)"
                      : "var(--color-ivory-22)",
                    strokeWidth: on ? 1.5 : 0.7,
                    cursor: tem > 0 ? "pointer" : "default",
                    transition: "fill .15s, stroke .15s",
                  }}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {/* Bolhas proporcionais — 1 por UF com bens */}
            {BR_STATES.filter((s) => (porUf[s.uf]?.qtdBens ?? 0) > 0).map(
              (s) => {
                const qtd = porUf[s.uf].qtdBens;
                const r = raio(qtd);
                const on = ativo === s.uf;
                return (
                  <g
                    key={s.uf}
                    onMouseEnter={() => setAtivo(s.uf)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* halo */}
                    <circle
                      cx={s.cx}
                      cy={s.cy}
                      r={r * 1.6}
                      style={{
                        fill: "rgba(60, 255, 138, 0.18)",
                        opacity: on ? 1 : 0.6,
                        transition: "opacity .15s",
                      }}
                    />
                    {/* dot */}
                    <circle
                      cx={s.cx}
                      cy={s.cy}
                      r={r}
                      style={{
                        fill: "rgba(60, 255, 138, 0.65)",
                        stroke: "var(--color-signal)",
                        strokeWidth: on ? 2 : 1,
                        opacity: on ? 1 : 0.9,
                        transition: "opacity .15s, stroke-width .15s",
                      }}
                    />
                    {/* número dentro da bolha (se cabe) */}
                    {r >= 13 && (
                      <text
                        x={s.cx}
                        y={s.cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{
                          fill: "#050706",
                          fontSize: r > 22 ? 16 : 11,
                          fontWeight: 700,
                          pointerEvents: "none",
                        }}
                      >
                        {qtd}
                      </text>
                    )}
                  </g>
                );
              },
            )}
          </svg>
        </div>

        {/* ===== Painel lateral ===== */}
        <div className="relative z-10 flex flex-col gap-3">
          {detalhe ? (
            <div className="rounded-xl border border-[var(--color-signal)]/30 bg-[rgba(60,255,138,0.06)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                {ativo}
              </p>
              <p className="text-base font-medium text-[var(--color-ivory)]">
                {nomeDe(ativo!)}
              </p>
              <p className="mt-1 text-2xl font-medium tabular-nums text-[var(--color-signal)]">
                {detalhe.qtdBens}
              </p>
              <p className="text-[11px] text-[var(--color-ivory-66)]">
                {detalhe.qtdBens === 1 ? "bem identificado" : "bens identificados"}
                {totalGeral
                  ? ` · ${((detalhe.qtdBens / totalGeral) * 100).toFixed(1)}% do total`
                  : ""}
              </p>
              <p className="mt-1.5 text-base tabular-nums text-[var(--color-gold)]">
                {formatBRL(detalhe.valorBrl)}
              </p>
              {detalhe.cidades.length > 0 && (
                <div className="mt-3 border-t border-[var(--color-signal)]/15 pt-2">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                    Principais cidades
                  </p>
                  {detalhe.cidades.slice(0, 6).map((c) => (
                    <div
                      key={`${ativo}-${c.nome}`}
                      className="flex items-center justify-between py-0.5 text-xs"
                    >
                      <span className="truncate text-[var(--color-ivory-88)]">
                        {c.nome}
                      </span>
                      <span className="ml-2 shrink-0 font-medium tabular-nums text-[var(--color-ivory)]">
                        {c.qtd}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-ivory-12)] bg-[var(--color-onyx)]/40 p-4">
              <p className="text-xs text-[var(--color-ivory-66)]">
                Passe o mouse sobre uma UF para ver detalhes.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[var(--color-ivory-12)] pt-2 text-[11px]">
                <div>
                  <p className="text-[var(--color-ivory-66)]">Total de bens</p>
                  <p className="text-base font-medium text-[var(--color-ivory)] tabular-nums">
                    {totalGeral}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--color-ivory-66)]">Valor estimado</p>
                  <p className="text-2xl font-medium text-[var(--color-gold)] tabular-nums">
                    {formatBRL(valorGeral)}
                  </p>
                </div>
              </div>
              {ranking.length > 0 && (
                <div className="mt-3 border-t border-[var(--color-ivory-12)] pt-2">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                    Top UFs
                  </p>
                  {ranking.slice(0, 6).map((r) => (
                    <button
                      key={r.uf}
                      type="button"
                      onMouseEnter={() => setAtivo(r.uf)}
                      className="flex w-full items-center justify-between rounded-md px-1.5 py-1 text-xs transition hover:bg-white/5"
                    >
                      <span className="text-[var(--color-ivory-66)]">
                        <span className="font-medium text-[var(--color-ivory)]">
                          {r.uf}
                        </span>
                        <span className="ml-1">· {nomeDe(r.uf)}</span>
                      </span>
                      <span className="ml-2 shrink-0 font-medium tabular-nums text-[var(--color-signal)]">
                        {r.qtd}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {semUf > 0 && (
            <p className="text-[11px] text-[var(--color-ivory-66)]">
              {semUf} {semUf === 1 ? "bem" : "bens"} sem UF informada.
            </p>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}
