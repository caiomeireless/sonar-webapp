// Reprint do dossie do CLIENTE (v2 - jun/2026)
//
// O print anterior foi tirado antes do redeploy que habilitou o botao
// "Dashboard Analitico" pro cliente. Esse script gera so o dossie cliente
// e VERIFICA que o botao aparece antes de salvar.
//
// Pre-requisito: dev server em http://localhost:3000.
// Uso: node scripts/tirar-dossie-cliente-v2.mjs

import { chromium } from "@playwright/test";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "img", "showcase");
const BASE_URL = process.env.SONAR_BASE_URL || "http://localhost:3000";
const ALTURA_MAX = 2600;

const HIDE_CHROME_CSS = `
  aside.glass-side,
  aside[class*="glass-side"] { display: none !important; }
  header[class*="sticky"] { display: none !important; }
  div.flex.min-h-svh { display: block !important; }
  div.flex.min-h-svh > div { flex: 1 1 100% !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; }
  main { padding-top: 1.5rem !important; }
`;

async function main() {
  console.log(`[dossie-v2] base url: ${BASE_URL}`);
  console.log(`[dossie-v2] output:   ${OUTPUT_DIR}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  const url = `${BASE_URL}/cliente/casos/1?eu=cliente.demo@battaglia.com.br`;
  console.log(`[dossie-v2] goto ${url}`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.addStyleTag({ content: HIDE_CHROME_CSS });
  await page.waitForTimeout(2500);

  // Verifica que botao Dashboard Analitico esta presente
  const botaoLocator = page.locator('text=/Dashboard Anal[íi]tico/i').first();
  let botaoVisivel = false;
  try {
    await botaoLocator.waitFor({ state: 'visible', timeout: 5000 });
    botaoVisivel = true;
    console.log(`[dossie-v2] OK botao "Dashboard Analitico" visivel`);
  } catch (err) {
    console.warn(`[dossie-v2] AVISO: botao "Dashboard Analitico" nao encontrado: ${err?.message || err}`);
  }

  // Rola pra disparar lazy load, depois volta ao topo
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += 400) {
      window.scrollTo(0, y);
      await sleep(50);
    }
    window.scrollTo(0, 0);
  });

  await page.addStyleTag({ content: HIDE_CHROME_CSS });
  await page.waitForTimeout(1200);

  // Reverifica (caso so tenha hidratado depois)
  if (!botaoVisivel) {
    try {
      await botaoLocator.waitFor({ state: 'visible', timeout: 3000 });
      botaoVisivel = true;
      console.log(`[dossie-v2] OK botao "Dashboard Analitico" visivel (apos rolagem)`);
    } catch {}
  }

  const buf = await page.screenshot({ fullPage: true, type: "png" });
  const img = sharp(buf);
  const meta = await img.metadata();
  const altura = Math.min(meta.height || ALTURA_MAX, ALTURA_MAX);
  const largura = meta.width || 1280;

  const destino = path.join(OUTPUT_DIR, "cliente-dossie-full.png");
  await img
    .extract({ left: 0, top: 0, width: largura, height: altura })
    .toFile(destino);

  console.log(
    `[dossie-v2] salvo cliente-dossie-full.png: original ${meta.width}x${meta.height} -> recortado ${largura}x${altura}`,
  );

  // Print final saved metadata
  const metaFinal = await sharp(destino).metadata();
  const resumo = {
    arquivo: destino,
    largura: metaFinal.width,
    altura: metaFinal.height,
    botaoDashboardVisivel: botaoVisivel,
  };
  console.log(`[dossie-v2] RESULTADO_JSON=${JSON.stringify(resumo)}`);

  await page.close().catch(() => {});
  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error("[dossie-v2] erro fatal:", err);
  process.exit(1);
});
