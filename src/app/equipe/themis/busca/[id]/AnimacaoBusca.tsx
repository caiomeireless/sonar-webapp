"use client";

// Animação cinematográfica das APIs SELECIONADAS acendendo em sequência.
// Recebe `apisAtivas: ApiSonar[]` da URL — pode ser:
//   - Combo Lead: 7 APIs (Assertiva + BigData x3 + DataJud + minhareceita + SICAR)
//   - Combo Doc: 3 APIs (ARISP + ONR + Junta Comercial)
//   - Individual: N escolhidas pelo advogado
//
// Cada card tem 3 estados: idle (cinza) -> buscando (pulso dourado) -> completo.
// Preço mostrado no rótulo (regra sonar-consultas-pagas-sob-demanda).
// Timing distribuído: 1.1s por card, gap de ~200ms — total escala com N.

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FonteBusca } from "@/lib/mock-fixtures";
import {
  type ApiSonar,
  type ApiModo,
  formatBRL,
} from "@/lib/sonar-apis";

type Estado = "idle" | "buscando" | "completo";

const STAGGER = 1100; // ms entre inícios consecutivos
const DURACAO_CARD = 1100; // ms em estado buscando
const ENTRADA = 400; // ms de intro antes do primeiro card
const POS_FIM = 700; // ms de respiro depois do último terminar

// Mapeia API id pra fonte canônica do banco (pra puxar contagem real).
function apiIdToFonte(apiId: string): FonteBusca {
  if (apiId.startsWith("assertiva.")) return "Assertiva";
  if (apiId.startsWith("bigdatacorp.")) return "BigDataCorp";
  if (apiId.startsWith("datajud.")) return "DataJud";
  if (apiId.startsWith("minhareceita.")) return "minhareceita";
  if (apiId.startsWith("sicar.")) return "SICAR";
  if (apiId.startsWith("arisp.")) return "ARISP";
  // Fontes que ainda não existem na seed (no demo darão "documento solicitado")
  return "Manual";
}

// Legenda curta extraída do nome (depois do "—")
function legendaCurta(nome: string): string {
  const idx = nome.indexOf("—");
  return idx >= 0 ? nome.slice(idx + 1).trim() : nome;
}

// Tag "fonte" curta pra cabeçalho do card
function tagCurta(apiId: string): string {
  const fonte = apiIdToFonte(apiId);
  if (fonte === "Manual") {
    if (apiId.startsWith("onr.")) return "ONR";
    if (apiId.startsWith("junta.")) return "Junta";
    if (apiId.startsWith("cenprot.")) return "Cenprot";
    if (apiId.startsWith("edossie.")) return "eDossie";
    return apiId.split(".")[0];
  }
  return fonte;
}

type Props = {
  devedorId: number;
  devedorNome: string;
  devedorTipo: "PF" | "PJ";
  devedorDocumento: string;
  modo: ApiModo | "individual";
  apisAtivas: ApiSonar[];
  contagemPorFonte: Record<FonteBusca, number>;
  totalBens: number;
  valorEstimadoTotal: number;
  euQuery: string;
};

export function AnimacaoBusca(props: Props) {
  const apis = props.apisAtivas;
  const fim = ENTRADA + apis.length * STAGGER + POS_FIM;

  const [tempo, setTempo] = useState(0);
  const [concluiu, setConcluiu] = useState(false);

  useEffect(() => {
    if (apis.length === 0) return;
    const inicio = performance.now();
    let raf = 0;
    const tick = () => {
      const agora = performance.now() - inicio;
      setTempo(agora);
      if (agora >= fim) {
        setConcluiu(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [apis.length, fim]);

  function estadoDe(index: number): Estado {
    const delayInicio = ENTRADA + index * STAGGER;
    if (tempo < delayInicio) return "idle";
    if (tempo < delayInicio + DURACAO_CARD) return "buscando";
    return "completo";
  }

  const completas = apis.filter((_, i) => estadoDe(i) === "completo").length;
  const total = apis.length;
  const progresso = total === 0 ? 100 : Math.min(100, (tempo / fim) * 100);

  const custoTotal = apis.reduce((s, a) => s + a.preco, 0);

  // Mensagem do resultado final, conforme modo
  const labelModo =
    props.modo === "lead"
      ? "Combo lead"
      : props.modo === "doc"
        ? "Combo documento"
        : "Consultas selecionadas";

  return (
    <main className="min-h-svh bg-onyx text-ivory">
      {/* Glow de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-1/2 h-[700px] w-[1300px] -translate-x-1/2 -translate-y-1/2 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(201,162,74,0.18), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
        {/* Cabeçalho */}
        <div className="flex flex-col items-center text-center">
          <span className="eyebrow">
            {concluiu ? "Análise concluída" : "Buscando bens"}
          </span>
          <h1 className="mt-4 font-serif text-[clamp(28px,4vw,46px)] font-medium leading-[1.1] tracking-tight text-ivory">
            {props.devedorNome}
          </h1>
          <p className="mt-3 font-mono text-sm text-[var(--color-ivory-66)]">
            {props.devedorTipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"} ·{" "}
            {props.devedorDocumento}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-gold)]">
            {labelModo} · {total} {total === 1 ? "consulta" : "consultas"} · {formatBRL(custoTotal)}
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="mx-auto mt-10 max-w-[700px]">
          <div className="relative h-1 overflow-hidden rounded-full bg-[var(--color-ivory-12)]">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progresso}%`,
                background:
                  "linear-gradient(90deg, var(--color-signal), var(--color-gold))",
                transition: "width 0.05s linear",
                boxShadow: "0 0 12px rgba(201,162,74,0.4)",
              }}
            />
          </div>
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
            {concluiu
              ? `100% · ${total} ${total === 1 ? "fonte consultada" : "fontes consultadas"}`
              : `${Math.round(progresso)}% · ${completas} de ${total} ${total === 1 ? "fonte" : "fontes"}`}
          </p>
        </div>

        {/* Grade dinâmica de fontes — flex-wrap centra naturalmente quando N é pequeno */}
        {apis.length === 0 ? (
          <div className="mt-12 grid place-items-center">
            <p className="rounded-lg border border-[var(--color-ivory-22)] bg-white/5 p-6 font-mono text-xs text-[var(--color-ivory-66)]">
              Nenhuma API selecionada.
            </p>
          </div>
        ) : (
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {apis.map((api, i) => (
              <CardFonte
                key={api.id}
                api={api}
                estado={estadoDe(i)}
                contagem={
                  props.contagemPorFonte[apiIdToFonte(api.id)] ?? 0
                }
              />
            ))}
          </div>
        )}

        {/* Resultado + CTA */}
        {concluiu ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="eyebrow !text-[var(--color-signal)]">Resultado</span>
            <p className="mt-4 font-serif text-[clamp(22px,3vw,32px)] leading-tight text-ivory">
              <span className="text-[var(--color-gold)]">{props.totalBens}</span>{" "}
              {props.totalBens === 1 ? "bem encontrado" : "bens encontrados"}
              {props.valorEstimadoTotal > 0 ? (
                <>
                  {" "}
                  · valor estimado{" "}
                  <span className="text-[var(--color-gold)]">
                    {formatBRL(props.valorEstimadoTotal)}
                  </span>
                </>
              ) : null}
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
              Custo debitado: {formatBRL(custoTotal)}
            </p>
            <Link
              href={`/equipe/devedores/${props.devedorId}${props.euQuery}`}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[var(--color-gold)] px-8 py-4 text-sm font-semibold text-onyx shadow-[0_4px_24px_rgba(201,162,74,0.4)] transition hover:bg-[var(--color-tip-glow)]"
            >
              Ver dossiê completo →
            </Link>
            <Link
              href={`/equipe/themis${props.euQuery}`}
              className="mt-4 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)] transition hover:text-[var(--color-gold)]"
            >
              ← voltar para a fila
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function CardFonte({
  api,
  estado,
  contagem,
}: {
  api: ApiSonar;
  estado: Estado;
  contagem: number;
}) {
  const isIdle = estado === "idle";
  const isBuscando = estado === "buscando";
  const semContagem = contagem === 0;
  const precoCor =
    api.preco === 0 ? "var(--color-signal)" : "var(--color-gold)";

  return (
    <div
      className={`relative w-[220px] overflow-hidden rounded-xl border p-4 transition-all duration-500 ${
        isIdle
          ? "border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.5)] opacity-45"
          : isBuscando
            ? "border-[var(--color-gold)] bg-[rgba(201,162,74,0.08)] shadow-[0_0_40px_rgba(201,162,74,0.4)] ring-2 ring-[var(--color-gold)]/30"
            : "border-[var(--color-signal)]/45 bg-[rgba(60,255,138,0.04)]"
      }`}
    >
      {/* Pulso radial quando buscando */}
      {isBuscando ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-pulse"
          style={{
            background:
              "radial-gradient(circle at center, rgba(201,162,74,0.15), transparent 70%)",
          }}
        />
      ) : null}

      {/* Tag fonte + preço */}
      <div className="relative flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ivory">
          {tagCurta(api.id)}
        </span>
        <span
          className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: precoCor }}
        >
          {api.precoLabel}
        </span>
      </div>

      {/* Legenda (o que essa API faz) */}

      <p className="relative mt-2 font-mono text-[10px] leading-tight text-[var(--color-ivory-66)]">
        {legendaCurta(api.nome)}
      </p>

      {/* Estado */}
      <div className="relative mt-4 flex items-center gap-2">
        {isIdle ? (
          <>
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-ivory-22)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              Aguardando
            </span>
          </>
        ) : isBuscando ? (
          <>
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-gold)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-gold)]">
              Buscando...
            </span>
          </>
        ) : (
          <>
            <span className="font-mono text-base font-semibold leading-none text-[var(--color-signal)]">
              ✓
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
              {api.modo === "doc"
                ? "documento baixado"
                : semContagem
                  ? "sem resultados"
                  : `${contagem} ${contagem === 1 ? "achado" : "achados"}`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
