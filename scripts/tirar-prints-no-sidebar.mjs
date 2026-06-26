// Reprints sem sidebar (jun/2026) - solicitado pelo Caio.
// O nav lateral esquerdo (aside.glass-side) estava aparecendo nas imagens
// usadas pelos blocos 3, 4 e 5 do ShowcaseAction da landing. Este script
// reproduz os mesmos prints, mas escondendo a sidebar via injecao de CSS
// antes do screenshot.
//
// Gera (sobrescreve):
//  - cliente-dossie-full.png             (fullPage /cliente/casos/1)
//  - equipe-dashboard-analitico-full.png (fullPage /equipe/devedores/1/dashboard)
//  - cliente-custos-full.png             (fullPage /cliente/custos)
//
// Pre-requisito: dev server em http://localhost:3000.
// Uso: node scripts/tirar-prints-no-sidebar.mjs

import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "img", "showcase");
const BASE_URL = process.env.SONAR_BASE_URL || "http://localhost:3000";

const HIDE_SIDEBAR_CSS = `
  /* Esconde sidebar do app inteira */
  aside.glass-side { display: none !important; }
  /* O main pai costuma estar em flex; libera o conteudo principal em largura total */
  div.flex.min-h-svh > div { flex: 1 1 100% !important; }
  /* Reforco: qualquer aside fixed/sticky no shell tambem some */
  aside[class*="glass-side"] { display: none !important; }
`;

async function run(label, fn) {
  try {
    console.log(`[no-sidebar] -> ${label}`);
    await fn();
    console.log(`[no-sidebar]    ok ${label}`);
    return { label, ok: true };
  } catch (err) {
    console.error(`[no-sidebar]    FALHOU ${label}: ${err?.message || err}`);
    return { label, ok: false, error: String(err?.message || err) };
  }
}

async function tirarFullSemSidebar(context, url, arquivo) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    // injeta o CSS antes de qualquer rolagem para evitar reflows visiveis
    await page.addStyleTag({ content: HIDE_SIDEBAR_CSS });
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
    // reaplica o CSS por seguranca (Next pode hidratar componentes depois)
    await page.addStyleTag({ content: HIDE_SIDEBAR_CSS });
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, arquivo),
      fullPage: true,
    });
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  console.log(`[no-sidebar] base url: ${BASE_URL}`);
  console.log(`[no-sidebar] output:   ${OUTPUT_DIR}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const results = [];

  results.push(
    await run("cliente-dossie-full.png", () =>
      tirarFullSemSidebar(
        context,
        `${BASE_URL}/cliente/casos/1?eu=cliente.demo@battaglia.com.br`,
        "cliente-dossie-full.png",
      ),
    ),
  );

  results.push(
    await run("equipe-dashboard-analitico-full.png", () =>
      tirarFullSemSidebar(
        context,
        `${BASE_URL}/equipe/devedores/1/dashboard?eu=caio@bpadvogados.com.br`,
        "equipe-dashboard-analitico-full.png",
      ),
    ),
  );

  results.push(
    await run("cliente-custos-full.png", () =>
      tirarFullSemSidebar(
        context,
        `${BASE_URL}/cliente/custos?eu=cliente.demo@battaglia.com.br`,
        "cliente-custos-full.png",
      ),
    ),
  );

  await context.close();
  await browser.close();

  console.log("\n[no-sidebar] resumo:");
  for (const r of results) {
    console.log(
      `  ${r.ok ? "OK " : "ERR"}  ${r.label}${r.error ? "  (err: " + r.error + ")" : ""}`,
    );
  }

  const erros = results.filter((r) => !r.ok);
  if (erros.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("[no-sidebar] erro fatal:", err);
  process.exit(1);
});
