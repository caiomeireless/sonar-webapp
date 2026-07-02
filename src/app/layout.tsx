import type { Metadata } from "next";
import {
  Manrope,
  Cormorant_Garamond,
  JetBrains_Mono,
  Open_Sans,
} from "next/font/google";
import "./globals.css";
import { lerTemaCookie } from "@/lib/theme-cookie";

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

// Tema sem script anti-flash: o data-theme vem 100% do cookie via SSR
// (lerTemaCookie) e o ThemeToggle grava cookie + localStorage a cada troca,
// entao o SSR sempre renderiza o tema mais recente — sem FOUC. O script
// inline que reconciliava localStorage foi removido: React 19 loga erro
// pra <script> cru em componente (mesmo via next/script beforeInteractive)
// e o caso que ele cobria (cookie e localStorage divergirem) nao acontece
// no fluxo normal.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tema = await lerTemaCookie();

  return (
    <html
      lang="pt-BR"
      data-theme={tema}
      suppressHydrationWarning
      className={`${manrope.variable} ${cormorant.variable} ${jetbrains.variable} ${openSans.variable}`}
    >
      <body className="fade-theme">{children}</body>
    </html>
  );
}
