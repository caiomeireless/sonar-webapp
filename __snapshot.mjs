// Tira screenshot full-page do dossie do cliente.
// Uso: node snapshot.mjs <url> <out-path> [maxHeight]
import { chromium } from "playwright";
import sharp from "sharp";
import path from "node:path";

const url = process.argv[2];
const out = process.argv[3];
const maxHeight = parseInt(process.argv[4] ?? "2600", 10);
if (!url || !out) {
  console.error("usage: node snapshot.mjs <url> <out> [maxHeight]");
  process.exit(2);
}

const HIDE_CSS = `
  aside.glass-side { display: none !important; }
  header[class*='sticky'] { display: none !important; }
  div.flex.min-h-svh > div { flex: 1 1 100% !important; }
`;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.addStyleTag({ content: HIDE_CSS }).catch(() => {});
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.addStyleTag({ content: HIDE_CSS });
// dispara qualquer auto-animacao
await page.waitForTimeout(800);

const tmp = path.join(path.dirname(out), `__tmp_${Date.now()}.png`);
await page.screenshot({ path: tmp, fullPage: true });
await browser.close();

// recorta no topo ate maxHeight
const img = sharp(tmp);
const meta = await img.metadata();
const w = meta.width ?? 1280;
const h = meta.height ?? maxHeight;
const cropH = Math.min(h, maxHeight);
await sharp(tmp)
  .extract({ left: 0, top: 0, width: w, height: cropH })
  .png()
  .toFile(out);

console.log(`OK: ${out} (${w}x${cropH}, from ${w}x${h})`);
