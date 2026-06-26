// Próxima Ação — card prescritivo do Dashboard do Caso.
// Mostra a ação sugerida pela engine de regras em obterDadosDashboardCaso(),
// com motivo curto e um botão secundário que revela 2-3 alternativas
// "default repertoire" pro advogado escolher caminho diferente.
//
// CLIENT component: o toggle "Ver outras opções" precisa de estado.
"use client";

import { useState } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { CHART_COLOR_SIGNAL, CHART_COLOR_GOLD } from "@/components/dashboard/ChartTheme";
import type { DashboardProximaAcao } from "@/lib/dashboard-caso";

// ============================================================
// CATÁLOGO de ações — ícone + cor + alternativas
// ============================================================
// As ações vêm do calcularProximaAcao() em dashboard-caso.ts. Aqui mapeamos
// cada string conhecida pro seu ícone, accent e repertório de alternativas.
// Quando a ação não bate com nenhuma chave conhecida, cai no DEFAULT.

type AcaoMeta = {
  icone: string; // glyph monoespacado (single char)
  accent: "green" | "gold" | "neutral";
  alternativas: string[];
};

const ACOES_CATALOGO: Record<string, AcaoMeta> = {
  "Solicitar SISBAJUD": {
    icone: "B",
    accent: "green",
    alternativas: [
      "Atualizar INFOJUD (declarações recentes)",
      "Cruzar RENAJUD para veículos novos",
      "Reabrir CCS pra contas em outras instituições",
    ],
  },
  "Solicitar matricula no ARISP": {
    icone: "M",
    accent: "gold",
    alternativas: [
      "Pedir certidão de ônus diretamente no RGI",
      "Cruzar CNIB pra indisponibilidades",
      "Avaliar penhora no rosto dos autos do imóvel",
    ],
  },
  "Cruzar com Receita Federal": {
    icone: "R",
    accent: "gold",
    alternativas: [
      "Consultar JUCESP pra contrato social atualizado",
      "Solicitar INFOJUD pra DIRPF do sócio",
      "Pedir desconsideração da personalidade jurídica",
    ],
  },
  "Avaliar prosseguimento do caso": {
    icone: "!",
    accent: "neutral",
    alternativas: [
      "Reunir com cliente pra revisar expectativa",
      "Tentar acordo com desconto",
      "Suspender caso e monitorar trimestralmente",
    ],
  },
};

const ACAO_DEFAULT: AcaoMeta = {
  icone: "•",
  accent: "neutral",
  alternativas: [
    "Revisar timeline de medidas dos últimos 12 meses",
    "Conferir dossiê patrimonial completo",
    "Agendar nova rodada de consultas em 30 dias",
  ],
};

function metaPara(acao: string): AcaoMeta {
  // Match prefix-tolerante: a regra default ("Sem próxima ação clara...")
  // tem texto longo, então usamos startsWith pra estabilidade.
  // As chaves do ACOES_CATALOGO ficam SEM acento porque o casamento depende
  // do texto produzido por calcularProximaAcao() em lib/dashboard-caso.ts.
  for (const [chave, meta] of Object.entries(ACOES_CATALOGO)) {
    if (acao.startsWith(chave)) return meta;
  }
  return ACAO_DEFAULT;
}

const ACCENT_GLYPH_COLOR: Record<AcaoMeta["accent"], string> = {
  green: CHART_COLOR_SIGNAL,
  gold: CHART_COLOR_GOLD,
  neutral: "var(--color-ivory-66)",
};

// ============================================================
// COMPONENTE
// ============================================================

type Props = {
  proximaAcao: DashboardProximaAcao;
};

export default function ProximaAcao({ proximaAcao }: Props) {
  const [aberto, setAberto] = useState(false);
  const meta = metaPara(proximaAcao.acao);
  const glyphColor = ACCENT_GLYPH_COLOR[meta.accent];

  return (
    <DashboardCard
      titulo="Próxima ação sugerida"
      descricao="Recomendação prescritiva baseada nas regras do caso"
      accent={meta.accent}
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border text-lg font-medium"
          style={{
            color: glyphColor,
            borderColor: "var(--color-ivory-12)",
            background: "rgba(234, 231, 220, 0.03)",
          }}
        >
          {meta.icone}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-lg font-medium leading-snug text-[var(--color-ivory)]">
            {proximaAcao.acao}
          </p>
          <p className="mt-1.5 text-xs text-[var(--color-ivory-66)]">
            {proximaAcao.motivo}
          </p>

          <div className="relative mt-4">
            <button
              type="button"
              onClick={() => setAberto((v) => !v)}
              aria-expanded={aberto}
              aria-controls="proxima-acao-alternativas"
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs text-[var(--color-ivory)] transition-colors hover:bg-[rgba(234,231,220,0.04)]"
              style={{ borderColor: "var(--color-ivory-12)" }}
            >
              <span>Ver outras opções</span>
              <span
                aria-hidden
                className="text-[10px] leading-none transition-transform"
                style={{ transform: aberto ? "rotate(180deg)" : "none" }}
              >
                ▾
              </span>
            </button>

            {aberto ? (
              <div
                id="proxima-acao-alternativas"
                role="tooltip"
                className="absolute left-0 top-full z-10 mt-2 w-72 rounded-lg border bg-[var(--color-carbon)] p-3 shadow-lg"
                style={{
                  borderColor: "var(--color-ivory-12)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}
              >
                <p className="eyebrow mb-2 text-[var(--color-ivory-66)]">
                  Alternativas
                </p>
                <ul className="space-y-1.5">
                  {meta.alternativas.map((alt) => (
                    <li
                      key={alt}
                      className="flex items-start gap-2 text-xs text-[var(--color-ivory)]"
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full"
                        style={{ background: glyphColor }}
                      />
                      <span className="leading-snug">{alt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
