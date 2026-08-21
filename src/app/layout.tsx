import type { Metadata } from "next";
import {
  Manrope,
  Cormorant_Garamond,
  JetBrains_Mono,
  Open_Sans,
} from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Open Sans — fonte padrão das peças processuais do BP Advogados.
// Tamanho 10pt + line-height 1.5 + recuo de parágrafo 2.5cm (padrão
// do escritório, instrução explícita do Caio em 2026-06-21).
const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sonar — Inteligência patrimonial · Battaglia & Pedrosa Advogados",
  description:
    "Plataforma de localização de bens de devedores. Encontra o que está escondido nas profundezas.",
  icons: { icon: "/favicon.svg" },
};

// Tema: SOMENTE ESCURO por decisão do Caio (21/08 — "tire o modo claro").
// O data-theme fica cravado em "dark"; o ThemeToggle saiu do nav lateral.
// A infraestrutura de tema (cookie, tokens light no globals.css) continua
// no lugar pra reativar depois se ele quiser.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${manrope.variable} ${cormorant.variable} ${jetbrains.variable} ${openSans.variable}`}
    >
      <body className="fade-theme">{children}</body>
    </html>
  );
}
