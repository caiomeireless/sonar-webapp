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

// Open Sans — fonte padrao das pecas processuais do BP Advogados.
// Tamanho 10pt + line-height 1.5 + recuo de paragrafo 2.5cm (padrao
// do escritorio, instrucao explicita do Caio em 2026-06-21).
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${cormorant.variable} ${jetbrains.variable} ${openSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
