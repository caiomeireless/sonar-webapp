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
//
// NEON (a pedido do Caio 2026-06-23):
//   - As paletas TIPO_BEM_COLORS e CHART_PALETTE_PASTEL agora usam versões
//     NEON BRILHANTE das mesmas cores (mantendo o tom de cada uma, só
//     saturando pro aspecto neon).
//   - CHART_COLOR_GOLD original (#C9A24A) foi preservado — quem precisa do
//     gold neon usa CHART_COLOR_GOLD_NEON (#FFD93D).

import type { CSSProperties, SVGProps } from "react";
import type { TextProps } from "recharts";

// ============================================================
// CORES BASE
// ============================================================

export const CHART_COLOR_SIGNAL = "#3CFF8A"; // verde Sonar — accent principal
export const CHART_COLOR_SIGNAL_STRONG = "#7CFFB0"; // signal claro — hover/grad
export const CHART_COLOR_GOLD = "#C9A24A"; // ouro BP — meta/target (secundário)
export const CHART_COLOR_GOLD_NEON = "#FFD93D"; // ouro neon — só pra TIPO_BEM_COLORS.imovel (a pedido do Caio 2026-06-23)
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
// Espelho do PALETA_PASTEL do BP, agora em versão NEON (Caio 2026-06-23).
export const CHART_PALETTE_PASTEL: readonly string[] = [
  "#00FFA3", // verde neon brilhante
  "#00D4FF", // azul neon
  "#39FF14", // lima neon
  "#FF3366", // rosa neon
  "#B967FF", // lilás neon
  "#00F5D4", // teal neon
  "#FFB833", // âmbar neon
  "#7DF9FF", // cyan claro neon
];

// Paleta accent — rankings com 1-2 séries destacadas.
export const CHART_PALETTE_ACCENT: readonly string[] = [
  CHART_COLOR_SIGNAL,
  CHART_COLOR_SIGNAL_STRONG,
  "rgba(60, 255, 138, 0.5)",
  "rgba(232, 228, 214, 0.40)", // ivory translúcido (paleta de série, não texto)
  "rgba(60, 255, 138, 0.25)",
];

// Paleta de tipos de bem — alinhada ao dossiê, versão NEON (Caio 2026-06-23).
export const TIPO_BEM_COLORS: Record<string, string> = {
  veiculo: "#00D4FF", // cyan neon
  imovel: CHART_COLOR_GOLD_NEON, // #FFD93D — amarelo dourado neon vibrante
  empresa: "#B967FF", // purple neon
  processo_credito: CHART_COLOR_SIGNAL, // #3CFF8A — já é neon
  endereco: "#FF6B00", // laranja neon
  vinculo: "#FF1F8F", // pink neon
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

// Grid em ivory-22 taupe (token --color-ivory-22 do globals.css dark).
// Padrão `strokeDasharray="3 3"`.
export const gridStroke = "rgba(232, 228, 214, 0.13)";

// Recharts 3.x exige TextProps (não CSSProperties) para `tick`, e SVGProps
// para `axisLine`. Eixos usam taupe khaki (var(--color-ivory-40) = #8E866F).
export const axisTickStyle: TextProps = {
  fill: "#8E866F", // var(--color-ivory-40) — caption/meta taupe
  fontSize: 11,
  fontFamily: "var(--font-manrope), system-ui, sans-serif",
};

// Variante p/ YAxis categórico grosso (espelho BP).
export const axisTickStyleLarge: TextProps = {
  fill: "#8E866F", // var(--color-ivory-40)
  fontSize: 12,
  fontFamily: "var(--font-manrope), system-ui, sans-serif",
};

export const axisLineStyle: SVGProps<SVGLineElement> = {
  stroke: "rgba(232, 228, 214, 0.13)", // var(--color-ivory-22)
};

// ============================================================
// TOOLTIP
// ============================================================

// Onyx 95% + borda line taupe + radius 10 + sombra forte. Texto em ivory primário.
export const tooltipContentStyle: CSSProperties = {
  background: "rgba(20, 25, 22, 0.95)", // onyx escuro com alpha
  border: "1px solid rgba(232, 228, 214, 0.09)", // var(--color-line)
  borderRadius: 10,
  padding: "8px 12px",
  fontFamily: "var(--font-manrope), system-ui, sans-serif",
  fontSize: 12,
  color: "#E8E4D6", // var(--color-ivory)
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.45)",
};

export const tooltipItemStyle: CSSProperties = {
  color: "#E8E4D6", // var(--color-ivory)
  fontFamily: "var(--font-manrope), system-ui, sans-serif",
  fontSize: 12,
  padding: 0,
};

export const tooltipLabelStyle: CSSProperties = {
  color: "#8E866F", // var(--color-ivory-40) — caption taupe
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
