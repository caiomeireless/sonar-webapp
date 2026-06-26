// Prints da revamp do ShowcaseAction (jun/2026).
// Gera:
//  - cliente-painel-graficos.png         (viewport, scroll Y=750 em /cliente)
//  - cliente-dossie-full.png             (fullPage /cliente/casos/1)
//  - equipe-dashboard-analitico-full.png (fullPage /equipe/devedores/1/dashboard)
//  - cliente-custos-full.png             (fullPage /cliente/custos)
//
// Pre-requisito: dev server em http://localhost:3000.
// Uso: node scripts/tirar-prints-revamp.mjs

import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "img", "showcase");
const BASE_URL = process.env.SONAR_BASE_URL || "http://localhost:3000";

async function run(label, fn) {
  try {
    console.log(`[revamp] -> ${label}`);
    await fn();
    console.log(`[revamp]    ok ${label}`);
    return { label, ok: true };
  } catch (err) {
    console.error(`[revamp]    FALHOU ${label}: ${err?.message || err}`);
    return { label, ok: false, error: String(err?.message || err) };
  }
}

async function main() {
  console.log(`[revamp] base url: ${BASE_URL}`);
  console.log(`[revamp] output:   ${OUTPUT_DIR}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const results = [];

  // ---------- 1) cliente-painel-graficos (viewport, scrollY=750) -------
  results.push(
    await run("cliente-painel-graficos.png", async () => {
      const page = await context.newPage();
      try {
        await page.goto(
          `${BASE_URL}/cliente?eu=cliente.demo@battaglia.com.br`,
          { waitUntil: "networkidle", timeout: 60000 },
        );
        // dispara animacoes Recharts
        await page.waitForTimeout(2500);
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

  // ---------- 2) cliente-dossie-full (fullPage /cliente/casos/1) -------
  results.push(
    await run("cliente-dossie-full.png", async () => {
      const page = await context.newPage();
      try {
        await page.goto(
          `${BASE_URL}/cliente/casos/1?eu=cliente.demo@battaglia.com.br`,
          { waitUntil: "networkidle", timeout: 60000 },
        );
        await page.waitForTimeout(3000);
        // rola pra disparar lazy/animacoes e volta ao topo
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
          path: path.join(OUTPUT_DIR, "cliente-dossie-full.png"),
          fullPage: true,
        });
      } finally {
        await page.close().catch(() => {});
      }
    }),
  );

  // ---------- 3) equipe-dashboard-analitico-full -----------------------
  results.push(
    await run("equipe-dashboard-analitico-full.png", async () => {
      const page = await context.newPage();
      try {
        await page.goto(
          `${BASE_URL}/equipe/devedores/1/dashboard?eu=caio@bpadvogados.com.br`,
          { waitUntil: "networkidle", timeout: 60000 },
        );
        await page.waitForTimeout(3000);
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
          path: path.join(
            OUTPUT_DIR,
            "equipe-dashboard-analitico-full.png",
          ),
          fullPage: true,
        });
      } finally {
        await page.close().catch(() => {});
      }
    }),
  );

  // ---------- 4) cliente-custos-full -----------------------------------
  results.push(
    await run("cliente-custos-full.png", async () => {
      const page = await context.newPage();
      try {
        await page.goto(
          `${BASE_URL}/cliente/custos?eu=cliente.demo@battaglia.com.br`,
          { waitUntil: "networkidle", timeout: 60000 },
        );
        await page.waitForTimeout(3000);
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
          path: path.join(OUTPUT_DIR, "cliente-custos-full.png"),
          fullPage: true,
        });
      } finally {
        await page.close().catch(() => {});
      }
    }),
  );

  await context.close();
  await browser.close();

  console.log("\n[revamp] resumo:");
  for (const r of results) {
    console.log(
      `  ${r.ok ? "OK " : "ERR"}  ${r.label}${r.error ? "  (err: " + r.error + ")" : ""}`,
    );
  }

  const erros = results.filter((r) => !r.ok);
  if (erros.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("[revamp] erro fatal:", err);
  process.exit(1);
});
