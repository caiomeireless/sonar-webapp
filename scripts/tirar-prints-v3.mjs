// Reprints v3 (jun/2026) - resolve dois bugs reportados pelo Caio:
//
//  1) Nav lateral (aside.glass-side) ainda aparecia nas imagens. Aqui
//     a injeção de CSS é mais agressiva — esconde sidebar + topbar e
//     força a coluna principal a ocupar 100% da largura, eliminando
//     o "buraco" que ficava onde a sidebar estava.
//
//  2) Imagens muito altas (5000+ px) faziam o efeito de scroll da
//     landing puxar a imagem demais e o topo nunca aparecer. Agora
//     cada print é recortado pra altura máxima 2600px via sharp.
//
// Gera (sobrescreve):
//  - cliente-dossie-full.png             (max 1280x2600)
//  - equipe-dashboard-analitico-full.png (max 1280x2600)
//  - cliente-custos-full.png             (max 1280x2600)
//
// Pré-requisito: dev server em http://localhost:3000.
// Uso: node scripts/tirar-prints-v3.mjs

import { chromium } from "@playwright/test";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "img", "showcase");
const BASE_URL = process.env.SONAR_BASE_URL || "http://localhost:3000";
const ALTURA_MAX = 2600;

// CSS agressivo pra esconder qualquer chrome do app shell e fazer o
// conteúdo principal ocupar largura/altura cheia.
const HIDE_CHROME_CSS = `
  /* Sidebar — investigação confirmou seletor aside.glass-side */
  aside.glass-side,
  aside[class*="glass-side"] { display: none !important; }

  /* TopBar — header sticky do shell */
  header[class*="sticky"] { display: none !important; }

  /* O shell autenticado usa div.flex.min-h-svh > [sidebar, main-column].
     Com sidebar oculta, força a coluna principal a ocupar 100% e
     remover qualquer margin/padding que ficaria como espaço vazio. */
  div.flex.min-h-svh { display: block !important; }
  div.flex.min-h-svh > div { flex: 1 1 100% !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; }

  /* Reduz padding interno do main pra ganhar área útil */
  main { padding-top: 1.5rem !important; }
`;

async function run(label, fn) {
  try {
    console.log(`[v3] -> ${label}`);
    await fn();
    console.log(`[v3]    ok ${label}`);
    return { label, ok: true };
  } catch (err) {
    console.error(`[v3]    FALHOU ${label}: ${err?.message || err}`);
    return { label, ok: false, error: String(err?.message || err) };
  }
}

async function tirarPrintRecortado(context, url, arquivo) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    // Injeta CSS imediatamente
    await page.addStyleTag({ content: HIDE_CHROME_CSS });
    await page.waitForTimeout(2500);

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

    // Reaplica CSS depois da hidratação tardia (componentes client-side)
    await page.addStyleTag({ content: HIDE_CHROME_CSS });
    await page.waitForTimeout(1200);

    // Print fullPage em memória → recorta com sharp
    const buf = await page.screenshot({ fullPage: true, type: "png" });
    const img = sharp(buf);
    const meta = await img.metadata();
    const altura = Math.min(meta.height || ALTURA_MAX, ALTURA_MAX);
    const largura = meta.width || 1280;

    const destino = path.join(OUTPUT_DIR, arquivo);
    await img
      .extract({ left: 0, top: 0, width: largura, height: altura })
      .toFile(destino);

    console.log(
      `[v3]    salvo ${arquivo}: original ${meta.width}x${meta.height} → recortado ${largura}x${altura}`,
    );
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  console.log(`[v3] base url: ${BASE_URL}`);
  console.log(`[v3] output:   ${OUTPUT_DIR}`);
  console.log(`[v3] altura máxima: ${ALTURA_MAX}px`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const results = [];

  results.push(
    await run("cliente-dossie-full.png", () =>
      tirarPrintRecortado(
        context,
        `${BASE_URL}/cliente/casos/1?eu=cliente.demo@battaglia.com.br`,
        "cliente-dossie-full.png",
      ),
    ),
  );

  results.push(
    await run("equipe-dashboard-analitico-full.png", () =>
      tirarPrintRecortado(
        context,
        `${BASE_URL}/equipe/devedores/1/dashboard?eu=caio@bpadvogados.com.br`,
        "equipe-dashboard-analitico-full.png",
      ),
    ),
  );

  results.push(
    await run("cliente-custos-full.png", () =>
      tirarPrintRecortado(
        context,
        `${BASE_URL}/cliente/custos?eu=cliente.demo@battaglia.com.br`,
        "cliente-custos-full.png",
      ),
    ),
  );

  await context.close();
  await browser.close();

  console.log("\n[v3] resumo:");
  for (const r of results) {
    console.log(
      `  ${r.ok ? "OK " : "ERR"}  ${r.label}${r.error ? "  (err: " + r.error + ")" : ""}`,
    );
  }

  // Reporta tamanhos finais
  console.log("\n[v3] tamanhos finais:");
  for (const r of results) {
    if (!r.ok) continue;
    const p = path.join(OUTPUT_DIR, r.label);
    try {
      const meta = await sharp(p).metadata();
      console.log(`  ${r.label}: ${meta.width}x${meta.height}`);
    } catch (err) {
      console.log(`  ${r.label}: erro lendo metadados — ${err?.message}`);
    }
  }

  const erros = results.filter((r) => !r.ok);
  if (erros.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error("[v3] erro fatal:", err);
  process.exit(1);
});
