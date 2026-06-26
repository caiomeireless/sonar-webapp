// Tira prints high-res (1280x800) das telas principais do Sonar
// e salva como PNG em /public/img/showcase/. Cada print é independente:
// se um falhar, o loop continua nos próximos.
//
// Pré-requisito: dev server rodando em http://localhost:3000
// Uso: node scripts/tirar-prints.mjs

import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "..", "public", "img", "showcase");
const BASE_URL = process.env.SONAR_BASE_URL || "http://localhost:3000";

const targets = [
  { url: "/equipe?eu=caio@bpadvogados.com.br",                          file: "equipe-painel.png" },
  { url: "/equipe/devedores/1?eu=caio@bpadvogados.com.br",              file: "equipe-dossie.png" },
  { url: "/equipe/devedores/1/gerador-peca?eu=caio@bpadvogados.com.br", file: "equipe-gerador.png" },
  { url: "/cliente?eu=cliente.demo@battaglia.com.br",                   file: "cliente-painel.png" },
  { url: "/cliente/casos/1?eu=cliente.demo@battaglia.com.br",           file: "cliente-dossie.png" },
  { url: "/cliente/custos?eu=cliente.demo@battaglia.com.br",            file: "cliente-custos.png" },
];

async function main() {
  console.log(`[prints] base url: ${BASE_URL}`);
  console.log(`[prints] output:   ${OUTPUT_DIR}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2, // high-res (retina)
  });

  const results = [];
  for (const t of targets) {
    const fullUrl = `${BASE_URL}${t.url}`;
    const outPath = path.join(OUTPUT_DIR, t.file);
    const page = await context.newPage();
    try {
      console.log(`[prints] -> ${t.file}  (${fullUrl})`);
      await page.goto(fullUrl, { waitUntil: "networkidle", timeout: 60000 });
      // Aguarda render de Spline/Recharts/animações
      await page.waitForTimeout(3000);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`[prints]    ok -> ${outPath}`);
      results.push({ file: t.file, ok: true });
    } catch (err) {
      console.error(`[prints]    FALHOU ${t.file}: ${err?.message || err}`);
      // Tenta capturar mesmo em caso de timeout do networkidle
      try {
        await page.screenshot({ path: outPath, fullPage: false });
        console.log(`[prints]    (capturado mesmo com erro) -> ${outPath}`);
        results.push({ file: t.file, ok: true, warn: String(err?.message || err) });
      } catch (err2) {
        console.error(`[prints]    fallback tambem falhou: ${err2?.message || err2}`);
        results.push({ file: t.file, ok: false, error: String(err?.message || err) });
      }
    } finally {
      await page.close().catch(() => {});
    }
  }

  await context.close();
  await browser.close();

  console.log("\n[prints] resumo:");
  for (const r of results) {
    console.log(`  ${r.ok ? "OK " : "ERR"}  ${r.file}${r.warn ? "  (warn: " + r.warn + ")" : ""}${r.error ? "  (err: " + r.error + ")" : ""}`);
  }
}

main().catch((err) => {
  console.error("[prints] erro fatal:", err);
  process.exit(1);
});
