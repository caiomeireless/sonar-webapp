// Print do mapa estadual com São Paulo selecionado (drill-down).
// Substitui public/img/showcase/mapa-estadual.png.
//
// Pre-requisito: dev server em http://localhost:3000.
// Uso: node scripts/tirar-mapa-sp.mjs

import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT = path.resolve(
  __dirname,
  "..",
  "public",
  "img",
  "showcase",
  "mapa-estadual.png",
);
const BASE_URL = process.env.SONAR_BASE_URL || "http://localhost:3000";

async function main() {
  console.log(`[mapa-sp] base url: ${BASE_URL}`);
  console.log(`[mapa-sp] output:   ${OUTPUT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Logs do console pra debug
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`[browser-error] ${msg.text()}`);
    }
  });

  await page.goto(
    `${BASE_URL}/equipe?eu=caio@bpadvogados.com.br`,
    { waitUntil: "networkidle", timeout: 90000 },
  );
  await page.waitForTimeout(3000);

  // Rola até o mapa de distribuição geográfica (procura pelo título do card)
  const mapaCard = page
    .locator("text=Distribuição geográfica dos bens")
    .first()
    .locator("xpath=ancestor::*[contains(@class,'rounded') or contains(@class,'card')][1]");

  // Fallback: localiza o SVG com aria-label="Mapa do Brasil"
  const svgMapa = page.locator('svg[aria-label="Mapa do Brasil"]');
  await svgMapa.waitFor({ state: "visible", timeout: 30000 });
  await svgMapa.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Investiga a estrutura do SVG pra entender selectors. Os paths estão
  // sem data-uf — só uma key React. Mas BR_STATES tem cx/cy. Precisamos
  // descobrir o caminho de SP. Vou pegar a bolha de SP via posicao no painel
  // lateral OU clicar no botao "SP" do ranking top UFs.

  // Estrategia A: clicar no botao do ranking lateral (botoes com "SP · São Paulo")
  // dentro do mesmo container do mapa.
  let metodoClick = "";

  // Tenta primeiro pelo botao do ranking ("SP · São Paulo")
  const botaoRankingSP = page
    .locator('button:has-text("São Paulo")')
    .first();

  const temBotaoRanking = await botaoRankingSP.count();
  console.log(`[mapa-sp] botões com "São Paulo": ${temBotaoRanking}`);

  if (temBotaoRanking > 0) {
    try {
      await botaoRankingSP.scrollIntoViewIfNeeded();
      await botaoRankingSP.click({ timeout: 5000 });
      metodoClick = "botão lateral 'São Paulo' no ranking";
    } catch (e) {
      console.log(`[mapa-sp] botão lateral falhou: ${e.message}`);
    }
  }

  // Confirma que o drill-down abriu (procura por overlay/modal)
  let drillAberto = false;
  try {
    await page.waitForSelector(
      'text=/cidades.*com.*bens|São Paulo/i',
      { timeout: 3000 },
    );
    drillAberto = true;
  } catch {}

  // Estrategia B (fallback): clicar direto no path/bolha do SVG na posicao de SP.
  // SP em BR_VIEWBOX está aprox cx=-47, cy=-23 em coordenadas geográficas.
  // Vou investigar os elementos do SVG.
  if (!metodoClick || !drillAberto) {
    console.log("[mapa-sp] tentando clicar via SVG paths/bolhas...");

    // Lê BR_STATES via window pra descobrir cx/cy de SP
    const info = await page.evaluate(() => {
      const svg = document.querySelector('svg[aria-label="Mapa do Brasil"]');
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const vb = svg.getAttribute("viewBox") || "";
      // Lista todos os <g> com onClick (bolhas) — eles tem <circle> com cx/cy
      const grupos = Array.from(svg.querySelectorAll("g")).map((g) => {
        const c = g.querySelector("circle");
        return {
          cx: c?.getAttribute("cx"),
          cy: c?.getAttribute("cy"),
          r: c?.getAttribute("r"),
          textoInterno: g.querySelector("text")?.textContent,
        };
      });
      return { rect, viewBox: vb, grupos };
    });
    console.log(
      `[mapa-sp] svg info: viewBox=${info?.viewBox}, bolhas=${info?.grupos?.length}`,
    );
    if (info?.grupos) {
      info.grupos.forEach((g, i) => {
        console.log(
          `  bolha ${i}: cx=${g.cx} cy=${g.cy} r=${g.r} text=${g.textoInterno}`,
        );
      });
    }

    // SP em coordenadas SVG do br-geo.ts: precisamos descobrir.
    // Pelo viewBox tipico do br-geo, SP fica em torno de cx=-47..-48, cy=-23.
    // Em vez de adivinhar, vamos hover em cada bolha até o painel lateral
    // mostrar "São Paulo".
    const svgEl = svgMapa;
    const grupos = await svgEl.locator("g").all();
    console.log(`[mapa-sp] grupos clicáveis: ${grupos.length}`);
    for (let i = 0; i < grupos.length; i++) {
      try {
        await grupos[i].hover({ timeout: 1000 });
        await page.waitForTimeout(150);
        const visivel = await page
          .locator("text=São Paulo")
          .first()
          .isVisible()
          .catch(() => false);
        if (visivel) {
          // Achou — clica
          await grupos[i].click({ timeout: 3000 });
          metodoClick = `bolha SVG índice ${i} (hover→detecta São Paulo→click)`;
          break;
        }
      } catch {}
    }
  }

  // Aguarda animação do drill-down (overlay com pinos das cidades)
  await page.waitForTimeout(2500);

  // Tira screenshot — se o overlay (modal) abriu, captura o overlay;
  // senão captura o card do mapa.
  const overlay = page
    .locator('[role="dialog"], [data-overlay], .fixed.inset-0')
    .filter({ hasText: /São Paulo|cidades/i })
    .first();

  let alvo = overlay;
  let alvoLabel = "overlay drill-down";
  if (!(await overlay.count())) {
    // Fallback: o próprio container do mapa (card pai do svg)
    alvo = mapaCard;
    alvoLabel = "card do mapa";
  }

  await alvo.waitFor({ state: "visible", timeout: 10000 });
  await alvo.screenshot({ path: OUTPUT });
  console.log(`[mapa-sp] screenshot salvo (${alvoLabel}) em ${OUTPUT}`);
  console.log(`[mapa-sp] método de click: ${metodoClick || "nenhum"}`);

  await browser.close();
  return metodoClick;
}

main()
  .then((m) => {
    console.log(`[mapa-sp] DONE. método=${m}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(`[mapa-sp] FALHOU:`, err);
    process.exit(1);
  });
