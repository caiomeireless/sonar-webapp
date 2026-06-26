// Re-tira os prints do painel do cliente garantindo que o robo Spline
// (AssistantBot na TopBar) terminou de renderizar antes do screenshot.
//
// Refaz:
//  - cliente-painel-full.png        (notebook do hero — viewport top)
//  - cliente-painel-graficos.png    (bloco 01 — viewport scrollY=750)
//
// Pre-requisito: dev server em http://localhost:3000.
// Uso: node scripts/tirar-prints-painel-com-robo.mjs

import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "img", "showcase");
const BASE_URL = process.env.SONAR_BASE_URL || "http://localhost:3000";

const HIDE_SIDEBAR_CSS = `
  aside.glass-side { display: none !important; }
  aside[class*="glass-side"] { display: none !important; }
  div.flex.min-h-svh > div { flex: 1 1 100% !important; }
`;

async function esperarSplineCarregar(page) {
  // Espera por qualquer canvas existir com dimensoes > 0 dentro de header
  // ou de botao da TopBar (onde o AssistantBot vive).
  await page.waitForFunction(
    () => {
      const cs = [
        ...document.querySelectorAll("header canvas"),
        ...document.querySelectorAll("button canvas"),
      ];
      return cs.some(
        (c) =>
          c instanceof HTMLCanvasElement && c.width > 0 && c.height > 0,
      );
    },
    null,
    { timeout: 45000, polling: 400 },
  );
  // Spline precisa de tempo extra pra carregar a scene (modelo + texturas
  // + animacao de entrada). 8s e suficiente em maquina local.
  await page.waitForTimeout(8000);
}

async function run(label, fn) {
  try {
    console.log(`[painel-robo] -> ${label}`);
    await fn();
    console.log(`[painel-robo]    ok ${label}`);
    return { label, ok: true };
  } catch (err) {
    console.error(`[painel-robo]    FALHOU ${label}: ${err?.message || err}`);
    return { label, ok: false, error: String(err?.message || err) };
  }
}

async function main() {
  console.log(`[painel-robo] base url: ${BASE_URL}`);
  console.log(`[painel-robo] output:   ${OUTPUT_DIR}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const results = [];

  // ---------- cliente-painel-full (FULLPAGE — usada no HeroNotebook
  // que rola dentro do tablet). Garante robo carregado + feed com
  // "solicitou" no rodape. ---------------------------------------------
  results.push(
    await run("cliente-painel-full.png", async () => {
      const page = await context.newPage();
      try {
        await page.goto(
          `${BASE_URL}/cliente?eu=cliente.demo@battaglia.com.br`,
          { waitUntil: "networkidle", timeout: 60000 },
        );
        await page.addStyleTag({ content: HIDE_SIDEBAR_CSS });
        await esperarSplineCarregar(page);
        // hidrata lazy widgets em toda a pagina antes do print
        await page.evaluate(async () => {
          const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
          const max = document.documentElement.scrollHeight;
          for (let y = 0; y < max; y += 500) {
            window.scrollTo(0, y);
            await sleep(70);
          }
          window.scrollTo(0, 0);
        });
        await page.addStyleTag({ content: HIDE_SIDEBAR_CSS });
        await page.waitForTimeout(1500);
        await page.screenshot({
          path: path.join(OUTPUT_DIR, "cliente-painel-full.png"),
          fullPage: true,
        });
      } finally {
        await page.close().catch(() => {});
      }
    }),
  );

  // ---------- cliente-painel-graficos (viewport, scrollY=750) ----------
  results.push(
    await run("cliente-painel-graficos.png", async () => {
      const page = await context.newPage();
      try {
        await page.goto(
          `${BASE_URL}/cliente?eu=cliente.demo@battaglia.com.br`,
          { waitUntil: "networkidle", timeout: 60000 },
        );
        await page.addStyleTag({ content: HIDE_SIDEBAR_CSS });
        await esperarSplineCarregar(page);
        // dispara animacoes Recharts
        await page.waitForTimeout(1500);
        await page.evaluate(() => {
          window.scrollTo({ top: 750, behavior: "instant" });
        });
        await page.waitForTimeout(1500);
        await page.screenshot({
          path: path.join(OUTPUT_DIR, "cliente-painel-graficos.png"),
          fullPage: false,
        });
      } finally {
        await page.close().catch(() => {});
      }
    }),
  );

  await context.close();
  await browser.close();

  console.log("\n[painel-robo] resumo:");
  for (const r of results) {
    console.log(
      `  ${r.ok ? "OK " : "ERR"}  ${r.label}${r.error ? "  (err: " + r.error + ")" : ""}`,
    );
  }

  const erros = results.filter((r) => !r.ok);
  if (erros.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("[painel-robo] erro fatal:", err);
  process.exit(1);
});
