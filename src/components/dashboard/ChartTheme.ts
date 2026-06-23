// Tema compartilhado dos graficos do Dashboard (Recharts).
// Centraliza cores, tooltip, grid e tick style — sem isso cada grafico
// vira um "frankenstein" visual.
//
// Importacao:
//   import {
//     CHART_COLOR_SIGNAL, CHART_COLOR_GOLD, TIPO_BEM_COLORS,
//     tooltipContentStyle, gridStroke, axisTickStyle,
//   } from "./ChartTheme";

import type { CSSProperties, SVGProps } from "react";
import type { TextProps } from "recharts";

// ============================================================
// CORES BASE
// ============================================================

export const CHART_COLOR_SIGNAL = "#3CFF8A"; // verde Sonar — destaque
export const CHART_COLOR_GOLD = "#C9A24A"; // ouro BP — meta/target
export const CHART_COLOR_IVORY = "#EAE7DC"; // marfim — neutro texto/serie
export const CHART_COLOR_NEGATIVE = "#FF5B5B"; // vermelho — negativos
export const CHART_COLOR_WARN = "#F4C542"; // amber — parcial/aguardando

// Paleta primaria — usar para series independentes em ordem.
export const CHART_COLORS: readonly string[] = [
  CHART_COLOR_SIGNAL,
  CHART_COLOR_GOLD,
  "#9ED8FF",
  "#B08CFF",
  "#FF8A3D",
  CHART_COLOR_IVORY,
];

// Paleta de tipos de bem — alinhada ao dossie.
export const TIPO_BEM_COLORS: Record<string, string> = {
  veiculo: "#9ED8FF",
  imovel: CHART_COLOR_GOLD,
  empresa: "#B08CFF",
  processo_credito: CHART_COLOR_SIGNAL,
  endereco: "#FF8A3D",
  vinculo: "#FF6B9D",
};

// ============================================================
// GRID + EIXOS
// ============================================================

export const gridStroke = "rgba(234, 231, 220, 0.08)";

// Recharts 3.x exige TextProps (nao CSSProperties) para `tick`, e SVGProps
// para `axisLine`. Mantemos os mesmos valores visuais, so trocamos os types.
export const axisTickStyle: TextProps = {
  fill: "rgba(234, 231, 220, 0.40)", // var(--color-ivory-66) literal pra Recharts
  fontSize: 11,
  fontFamily: "var(--font-open-sans), system-ui, sans-serif",
};

export const axisLineStyle: SVGProps<SVGLineElement> = {
  stroke: "rgba(234, 231, 220, 0.13)",
};

// ============================================================
// TOOLTIP
// ============================================================

export const tooltipContentStyle: CSSProperties = {
  background: "#050706", // var(--color-carbon)
  border: "1px solid rgba(234, 231, 220, 0.13)", // var(--color-ivory-22)
  borderRadius: 8,
  padding: "8px 12px",
  fontFamily: "var(--font-open-sans), system-ui, sans-serif",
  fontSize: 12,
  color: "#EAE7DC",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
};

export const tooltipItemStyle: CSSProperties = {
  color: "#EAE7DC",
  fontFamily: "var(--font-open-sans), system-ui, sans-serif",
  fontSize: 12,
  padding: 0,
};

export const tooltipLabelStyle: CSSProperties = {
  color: "rgba(234, 231, 220, 0.40)",
  fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 4,
};

export const tooltipCursorFill = "rgba(60, 255, 138, 0.06)";
