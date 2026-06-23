// Tema compartilhado dos gráficos do Dashboard (Recharts).
// Centraliza cores, tooltip, grid e tick style — sem isso cada gráfico
// vira um "frankenstein" visual.
//
// Importação:
//   import {
//     CHART_COLOR_SIGNAL, CHART_COLOR_GOLD, TIPO_BEM_COLORS,
//     tooltipContentStyle, gridStroke, axisTickStyle,
//     CHART_PALETTE_PASTEL, CHART_PALETTE_ACCENT,
//     BAR_RADIUS_HORIZONTAL, BAR_RADIUS_VERTICAL,
//     BAR_SIZE_HORIZONTAL, BAR_SIZE_VERTICAL_MAX,
//     num,
//   } from "./ChartTheme";
//
// Notas de design (espelho do ChartTheme do BP CRM):
//   - Tooltip onyx 96% + borda signal 30% + radius 10.
//   - Grid em signal suave (rgba(60,255,138,0.10)) — reforça identidade.
//   - Barras horizontais: radius [0,6,6,0] + size 16. Verticais: [4,4,0,0] + max 28.
//   - Donut: cornerRadius 6 + paddingAngle 2 (quando >1 fatia).
//   - Recharts NÃO resolve `var(--...)` em `fill`/`stroke`: usar literais.
//   - `num(v)` formata pt-BR — usar em todo formatter de Tooltip e LabelList.

import type { CSSProperties, SVGProps } from "react";
import type { TextProps } from "recharts";

// ============================================================
// CORES BASE
// ============================================================

export const CHART_COLOR_SIGNAL = "#3CFF8A"; // verde Sonar — accent principal
export const CHART_COLOR_SIGNAL_STRONG = "#7CFFB0"; // signal claro — hover/grad
export const CHART_COLOR_GOLD = "#C9A24A"; // ouro BP — meta/target (secundário)
export const CHART_COLOR_IVORY = "#EAE7DC"; // marfim — neutro texto/serie
export const CHART_COLOR_NEGATIVE = "#FF5B5B"; // vermelho — negativos
export const CHART_COLOR_WARN = "#F4C542"; // amber — parcial/aguardando

// Paleta primária — usar para séries independentes em ordem.
export const CHART_COLORS: readonly string[] = [
  CHART_COLOR_SIGNAL,
  CHART_COLOR_GOLD,
  "#9ED8FF",
  "#B08CFF",
  "#FF8A3D",
  CHART_COLOR_IVORY,
];

// Paleta pastel multi-tom — usar em donut com várias fatias.
// Espelho do PALETA_PASTEL do BP (signal claro substitui o gold-strong).
export const CHART_PALETTE_PASTEL: readonly string[] = [
  "#7CFFB0", // signal claro (1a posição)
  "#9ED8FF", // azul suave
  "#A8E4B0", // verde suave alt
  "#E8A3A3", // rosa suave
  "#C0A3D0", // lilás
  "#8FC1BD", // teal
  "#E8C39A", // pêssego
  "#B3B8C4", // ardósia
];

// Paleta accent — rankings com 1-2 séries destacadas.
export const CHART_PALETTE_ACCENT: readonly string[] = [
  CHART_COLOR_SIGNAL,
  CHART_COLOR_SIGNAL_STRONG,
  "rgba(60, 255, 138, 0.5)",
  "rgba(232, 228, 214, 0.40)", // ivory-66
  "rgba(60, 255, 138, 0.25)",
];

// Paleta de tipos de bem — alinhada ao dossiê.
export const TIPO_BEM_COLORS: Record<string, string> = {
  veiculo: "#9ED8FF",
  imovel: CHART_COLOR_GOLD,
  empresa: "#B08CFF",
  processo_credito: CHART_COLOR_SIGNAL,
  endereco: "#FF8A3D",
  vinculo: "#FF6B9D",
};

// ============================================================
// GRADIENTES (para <defs> em Bar/Area)
// ============================================================

// Helper opaco — usar `id` único por chart.
// Exemplo de uso em <defs>:
//   <linearGradient id={BAR_GRADIENT_SIGNAL.id} x1="0" y1="0" x2="1" y2="0">
//     <stop offset="0%"  stopColor={CHART_COLOR_SIGNAL_STRONG} stopOpacity={0.55} />
//     <stop offset="100%" stopColor={CHART_COLOR_SIGNAL}        stopOpacity={1} />
//   </linearGradient>
//   <Bar fill={`url(#${BAR_GRADIENT_SIGNAL.id})`} ... />
export const BAR_GRADIENT_SIGNAL = {
  id: "sonar-bar-grad-signal",
  from: CHART_COLOR_SIGNAL_STRONG,
  to: CHART_COLOR_SIGNAL,
  fromOpacity: 0.55,
  toOpacity: 1,
} as const;

export const AREA_GRADIENT_SIGNAL = {
  id: "sonar-area-grad-signal",
  from: CHART_COLOR_SIGNAL,
  to: CHART_COLOR_SIGNAL,
  fromOpacity: 0.45,
  toOpacity: 0.02,
} as const;

// ============================================================
// GRID + EIXOS
// ============================================================

// Grid em signal suave (espelho gold suave do BP). Padrão `strokeDasharray="3 3"`.
export const gridStroke = "rgba(60, 255, 138, 0.10)";

// Recharts 3.x exige TextProps (não CSSProperties) para `tick`, e SVGProps
// para `axisLine`. Mantemos os mesmos valores visuais, só trocamos os types.
export const axisTickStyle: TextProps = {
  fill: "rgba(234, 231, 220, 0.40)", // var(--color-ivory-66) literal pra Recharts
  fontSize: 11,
  fontFamily: "var(--font-manrope), system-ui, sans-serif",
};

// Variante p/ YAxis categórico grosso (espelho BP).
export const axisTickStyleLarge: TextProps = {
  fill: "rgba(234, 231, 220, 0.40)",
  fontSize: 12,
  fontFamily: "var(--font-manrope), system-ui, sans-serif",
};

export const axisLineStyle: SVGProps<SVGLineElement> = {
  stroke: "rgba(234, 231, 220, 0.13)",
};

// ============================================================
// TOOLTIP
// ============================================================

// Onyx 96% + borda signal 30% + radius 10 + sombra mais forte (espelho TIP do BP).
export const tooltipContentStyle: CSSProperties = {
  background: "rgba(10, 12, 11, 0.96)", // var(--color-onyx) com alpha
  border: "1px solid rgba(60, 255, 138, 0.30)", // signal soft (replicar borda gold BP)
  borderRadius: 10,
  padding: "8px 12px",
  fontFamily: "var(--font-manrope), system-ui, sans-serif",
  fontSize: 12,
  color: "#EAE7DC",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.45)",
};

export const tooltipItemStyle: CSSProperties = {
  color: "#EAE7DC",
  fontFamily: "var(--font-manrope), system-ui, sans-serif",
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

// Cursor scatter — linha tracejada signal suave.
export const tooltipCursorScatter: SVGProps<SVGLineElement> = {
  strokeDasharray: "3 3",
  stroke: "rgba(60, 255, 138, 0.4)",
};

// ============================================================
// BARRAS — radius e size padrões (espelho BP)
// ============================================================

// Tupla [top-left, top-right, bottom-right, bottom-left] — formato do Recharts Bar.
export const BAR_RADIUS_HORIZONTAL: [number, number, number, number] = [
  0, 6, 6, 0,
];
export const BAR_RADIUS_VERTICAL: [number, number, number, number] = [
  4, 4, 0, 0,
];
export const BAR_SIZE_HORIZONTAL = 16;
export const BAR_SIZE_VERTICAL_MAX = 28;

// ============================================================
// FORMATTERS
// ============================================================

// `num(v)` — formata número em pt-BR. Usar em todo formatter de Tooltip/LabelList.
export const num = (v: number | string): string =>
  Number(v).toLocaleString("pt-BR");
