// Prints finais (jun/2026) — dossie split + custos full
//
// Gera 3 PNGs em public/img/showcase/:
//   - cliente-dossie-topo.png    (viewport 1280x800 no topo)
//   - cliente-dossie-bens.png    (viewport 1280x800 com scroll ~1800px)
//   - cliente-custos-full.png    (fullPage, recortado p/ <= 2200px)
//
// Pre-requisito: dev server em http://localhost:3000.
// Uso: node scripts/tirar-prints-final.mjs

import { chromium } from "@playwright/test";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "img", "showcase");
const BASE_URL = process.env.SONAR_BASE_URL || "http://localhost:3000";
const ALTURA_MAX_CUSTOS = 2200;

const HIDE_CHROME_CSS = `
  aside.glass-side,
  aside[class*="glass-side"] { display: none !important; }
  header[class*="sticky"] { display: none !important; }
  div.flex.min-h-svh { display: block !important; }
  div.flex.min-h-svh > div { flex: 1 1 100% !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; }
  main { padding-top: 1.5rem !important; }
  /* Esconde o badge do Next dev no canto inferior esquerdo */
  [data-nextjs-toast-wrapper], [data-nextjs-toast] { display: none !important; }
  nextjs-portal { display: none !important; }
`;

// CSS especifico pro print do dossie: compacta espacamentos pra caber
// header + estatisticas + dados cadastrais completos em altura razoavel.
const COMPACT_DOSSIE_CSS = `
  main > section .py-12 { padding-top: 1.25rem !important; padding-bottom: 1.25rem !important; }
  main > section .py-10 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
  main > section .mt-12 { margin-top: 1.5rem !important; }
  main > section .mt-6 { margin-top: 0.75rem !important; }
  /* Reduz padding interno dos cards do dossie */
  main > section .gap-5 { gap: 1rem !important; }
  main > section .gap-6 { gap: 1.25rem !important; }
`;

async function aplicarCssOcultar(page) {
  await page.addStyleTag({ content: HIDE_CHROME_CSS });
}

async function aplicarCssCompactDossie(page) {
  await page.addStyleTag({ content: COMPACT_DOSSIE_CSS });
}

async function novaPagina(context) {
  return await context.newPage();
}

// Tira UM screenshot fullPage do dossie e gera 2 recortes:
//   - topo  : header + estatisticas + dados cadastrais + comeco casos
//   - bens  : "Bens Encontrados por Categoria" preenchido (varios cards)
// Usa o Y absoluto do <h2> "Bens Encontrados" pra ancorar o recorte de bens.
async function tirarDossieSplit(context) {
  const page = await novaPagina(context);
  const url = `${BASE_URL}/cliente/casos/1?eu=cliente.demo@battaglia.com.br`;
  console.log(`[final] dossie-split: goto ${url}`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await aplicarCssOcultar(page);
  await aplicarCssCompactDossie(page);
  await page.waitForTimeout(1200);

  // Lazy load: rola a pagina inteira pra hidratar cards, volta ao topo
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += 500) {
      window.scrollTo(0, y);
      await sleep(60);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  await aplicarCssOcultar(page);
  await aplicarCssCompactDossie(page);
  await page.waitForTimeout(2000);

  // Y absoluto do header "Bens Encontrados" pra ancorar o segundo print.
  const yBens = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("*"));
    const alvo = all.find((el) => {
      const t = (el.textContent || "").trim();
      return /^bens encontrados$/i.test(t);
    });
    if (!alvo) return null;
    const rect = alvo.getBoundingClientRect();
    return Math.max(0, Math.round(rect.top + window.scrollY) - 80);
  });
  console.log(`[final] dossie-split: yBens=${yBens}`);

  // Pega altura viewport (CSS px) — viewport e 1280x1200 nesse modo.
  const vpH = await page.evaluate(() => window.innerHeight);
  console.log(`[final] dossie-split: viewportH=${vpH}`);

  // ---- TOPO ---- viewport no topo (header + estat. + dados cadastrais).
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  const destTopo = path.join(OUTPUT_DIR, "cliente-dossie-topo.png");
  await page.screenshot({ path: destTopo, fullPage: false, type: "png" });
  console.log(`[final] dossie-topo salvo  (${destTopo})`);

  // ---- BENS ---- viewport posicionado em "Bens Encontrados" - 80px.
  if (yBens != null) {
    await page.evaluate((y) => window.scrollTo(0, y), yBens);
  } else {
    await page.evaluate(() => window.scrollTo(0, 2200));
  }
  await aplicarCssOcultar(page);
  await aplicarCssCompactDossie(page);
  await page.waitForTimeout(800);
  const destBens = path.join(OUTPUT_DIR, "cliente-dossie-bens.png");
  await page.screenshot({ path: destBens, fullPage: false, type: "png" });
  console.log(`[final] dossie-bens salvo  (${destBens})`);

  await page.close().catch(() => {});
  return [destTopo, destBens];
}

async function tirarDashboardAnalitico(context) {
  const page = await context.newPage();
  const url = `${BASE_URL}/equipe/devedores/1/dashboard?eu=caio@bpadvogados.com.br`;
  console.log(`[final] dash-analitico: goto ${url}`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await aplicarCssOcultar(page);
  await page.waitForTimeout(2500);

  // Rolagem pra disparar lazy load (Recharts)
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += 500) {
      window.scrollTo(0, y);
      await sleep(60);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  await aplicarCssOcultar(page);
  await page.waitForTimeout(2000);

  const destino = path.join(OUTPUT_DIR, "equipe-dashboard-analitico-full.png");
  await page.screenshot({ path: destino, fullPage: true, type: "png" });
  console.log(`[final] dash-analitico salvo  (${destino})`);

  await page.close().catch(() => {});
  return destino;
}

async function tirarCustosFull(context) {
  const page = await novaPagina(context);
  const url = `${BASE_URL}/cliente/custos?eu=cliente.demo@battaglia.com.br`;
  console.log(`[final] custos-full: goto ${url}`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await aplicarCssOcultar(page);
  await page.waitForTimeout(2500);

  // Rolagem pra disparar lazy load
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += 500) {
      window.scrollTo(0, y);
      await sleep(50);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  await aplicarCssOcultar(page);
  await page.waitForTimeout(1500);

  // Tira FULL PAGE inteira — sem recortar. O ScrollWindow do bloco 5
  // depende da imagem ter altura COMPLETA pra mostrar pagina inteira
  // rolando dentro da janela.
  const destino = path.join(OUTPUT_DIR, "cliente-custos-full.png");
  await page.screenshot({ path: destino, fullPage: true, type: "png" });

  const meta = await sharp(destino).metadata();
  console.log(
    `[final] custos-full salvo: ${meta.width}x${meta.height}  (FULL — sem corte)`,
  );

  await page.close().catch(() => {});
  return destino;
}

async function main() {
  console.log(`[final] base url: ${BASE_URL}`);
  console.log(`[final] output:   ${OUTPUT_DIR}`);

  const browser = await chromium.launch({ headless: true });

  // Contexto pro dossie split — viewport mais alto pra caber tudo na viewport.
  const ctxDossie = await browser.newContext({
    viewport: { width: 1280, height: 1200 },
    deviceScaleFactor: 2,
  });
  // Contexto pro custos full — viewport padrao 800.
  const ctxCustos = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const arquivos = [];
  try {
    arquivos.push(...(await tirarDossieSplit(ctxDossie)));
    arquivos.push(await tirarDashboardAnalitico(ctxCustos));
    arquivos.push(await tirarCustosFull(ctxCustos));
  } finally {
    await ctxDossie.close();
    await ctxCustos.close();
    await browser.close();
  }

  console.log("\n[final] === RESUMO ===");
  for (const f of arquivos) {
    const m = await sharp(f).metadata();
    console.log(
      `[final] ${path.basename(f)}: ${m.width}x${m.height}  (${f})`,
    );
  }
}

main().catch((err) => {
  console.error("[final] erro fatal:", err);
  process.exit(1);
});
