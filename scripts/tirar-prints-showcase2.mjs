// Prints da nova seção showcase v2 (notebook + cards laterais).
// Gera:
//  - cliente-painel-full.png    (página inteira do /cliente, fullPage)
//  - mapa-continental.png       (screenshot do card do mapa em /equipe)
//  - mapa-estadual.png          (drill-down do estado, overlay modal)
//
// Pré-requisito: dev server em http://localhost:3000.
// Uso: node scripts/tirar-prints-showcase2.mjs

import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "img", "showcase");
const BASE_URL = process.env.SONAR_BASE_URL || "http://localhost:3000";

async function run(label, fn) {
  try {
    console.log(`[showcase2] -> ${label}`);
    await fn();
    console.log(`[showcase2]    ok ${label}`);
    return { label, ok: true };
  } catch (err) {
    console.error(`[showcase2]    FALHOU ${label}: ${err?.message || err}`);
    return { label, ok: false, error: String(err?.message || err) };
  }
}

async function main() {
  console.log(`[showcase2] base url: ${BASE_URL}`);
  console.log(`[showcase2] output:   ${OUTPUT_DIR}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const results = [];

  // ---------- 1) /cliente FULL PAGE -----------------------------------
  results.push(
    await run("cliente-painel-full.png", async () => {
      const page = await context.newPage();
      try {
        await page.goto(
          `${BASE_URL}/cliente?eu=cliente.demo@battaglia.com.br`,
          { waitUntil: "networkidle", timeout: 60000 },
        );
        // dá tempo pra Recharts/animações
        await page.waitForTimeout(3500);
        // força um scroll completo pra disparar lazy-render se houver,
        // depois volta pro topo antes do screenshot
        await page.evaluate(async () => {
          const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
          const max = document.documentElement.scrollHeight;
          for (let y = 0; y < max; y += 400) {
            window.scrollTo(0, y);
            await sleep(60);
          }
          window.scrollTo(0, 0);
        });
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

  // ---------- 2) MAPA CONTINENTAL no /equipe --------------------------
  results.push(
    await run("mapa-continental.png", async () => {
      const page = await context.newPage();
      try {
        await page.goto(
          `${BASE_URL}/equipe?eu=caio@bpadvogados.com.br`,
          { waitUntil: "networkidle", timeout: 60000 },
        );
        await page.waitForTimeout(3000);
        // Encontra o SVG com aria-label "Mapa do Brasil" e tira print do
        // card que o contém. Subimos 1-2 níveis até DashboardCard.
        // Esconde a TopBar sticky pra ela não cobrir o topo do card no print.
        await page.addStyleTag({
          content:
            'header.sticky, header[class*="sticky"]{display:none !important}',
        });
        const svg = page.locator('svg[aria-label="Mapa do Brasil"]').first();
        await svg.waitFor({ state: "visible", timeout: 15000 });
        await svg.scrollIntoViewIfNeeded();
        await page.waitForTimeout(800);
        // Sobe pro <section> ancestral mais próximo (DashboardCard) pra
        // pegar título + legenda junto. Se não achar, cai pro SVG sozinho.
        const card = svg.locator("xpath=ancestor::section[1]");
        const target = (await card.count()) ? card : svg;
        await target.screenshot({
          path: path.join(OUTPUT_DIR, "mapa-continental.png"),
        });
      } finally {
        await page.close().catch(() => {});
      }
    }),
  );

  // ---------- 3) MAPA ESTADUAL drill-down -----------------------------
  results.push(
    await run("mapa-estadual.png", async () => {
      const page = await context.newPage();
      try {
        await page.goto(
          `${BASE_URL}/equipe?eu=caio@bpadvogados.com.br`,
          { waitUntil: "networkidle", timeout: 60000 },
        );
        await page.waitForTimeout(3000);
        const svg = page.locator('svg[aria-label="Mapa do Brasil"]').first();
        await svg.waitFor({ state: "visible", timeout: 15000 });
        await svg.scrollIntoViewIfNeeded();
        await page.waitForTimeout(800);

        // Acha um path/g com cursor:pointer (estado clicável = tem bens)
        // e clica no primeiro. As "bolhas" são <g> com cursor pointer.
        // Preferência: clicar numa bolha (mais previsível).
        const bolha = page
          .locator('svg[aria-label="Mapa do Brasil"] g[style*="cursor"]')
          .first();
        if (await bolha.count()) {
          await bolha.click({ force: true });
        } else {
          // fallback: path clicável
          const pathClicavel = page
            .locator(
              'svg[aria-label="Mapa do Brasil"] path[style*="cursor: pointer"]',
            )
            .first();
          await pathClicavel.click({ force: true });
        }

        // espera o overlay modal aparecer
        const overlay = page.locator('[role="dialog"]').first();
        await overlay.waitFor({ state: "visible", timeout: 8000 });
        await page.waitForTimeout(1500); // anim
        await overlay.screenshot({
          path: path.join(OUTPUT_DIR, "mapa-estadual.png"),
        });
      } finally {
        await page.close().catch(() => {});
      }
    }),
  );

  await context.close();
  await browser.close();

  console.log("\n[showcase2] resumo:");
  for (const r of results) {
    console.log(
      `  ${r.ok ? "OK " : "ERR"}  ${r.label}${r.error ? "  (err: " + r.error + ")" : ""}`,
    );
  }

  const erros = results.filter((r) => !r.ok);
  if (erros.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("[showcase2] erro fatal:", err);
  process.exit(1);
});
