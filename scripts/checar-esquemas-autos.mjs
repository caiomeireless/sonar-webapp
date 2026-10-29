// Valida os JSON Schemas da Análise de Autos CONTRA A API.
//
// IMPORTANTE: usa messages.create de verdade, com max_tokens mínimo no
// modelo mais barato. Não dá para usar count_tokens: ele confere a FORMA
// do esquema mas NÃO o compila, e por isso deixou passar o erro de
// "too many parameters with union types" — que só apareceu quando o
// advogado já tinha esperado a leitura inteira do capa a capa. Custa
// frações de centavo e é a única checagem que vale.
//
// Existe porque o tsc não enxerga esse tipo de erro: um esquema pode estar
// perfeitamente tipado em TypeScript e ser rejeitado com 400 pela API. Foi
// o que aconteceu em 29/10 com `{ type: ["string","null"], enum: [...] }` —
// enum anulável é recusado, e o erro só apareceu quando o advogado já tinha
// arrastado o capa a capa e esperado a leitura inteira.
//
// Uso: npm run checar-esquemas
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const saida = path.join(raiz, ".tmp-esquemas");
const require = createRequire(path.join(raiz, "package.json"));

function chaveDoAmbiente() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const env = readFileSync(path.join(raiz, ".env.local"), "utf8");
    const m = env.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  } catch {
    // sem .env.local
  }
  return null;
}

const apiKey = chaveDoAmbiente();
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY não encontrada (nem no ambiente nem no .env.local).");
  process.exit(1);
}

// Compila dentro do projeto para o require resolver o SDK em node_modules.
// Chama o tsc pelo próprio Node em vez de pelo npx: no Windows o
// execFileSync recusa um .cmd com EINVAL desde o Node 20.
rmSync(saida, { recursive: true, force: true });
execFileSync(
  process.execPath,
  [
    require.resolve("typescript/bin/tsc"),
    "src/lib/autos/tipos.ts",
    "src/lib/autos/claude.ts",
    "--outDir", ".tmp-esquemas",
    "--module", "commonjs",
    "--moduleResolution", "node",
    "--target", "es2022",
    "--skipLibCheck",
    "--esModuleInterop",
  ],
  { cwd: raiz, stdio: "inherit" },
);

const { default: Anthropic } = require("@anthropic-ai/sdk");
const tipos = require(path.join(saida, "tipos.js"));
const claude = require(path.join(saida, "claude.js"));

const cliente = new Anthropic({ apiKey, timeout: 120_000 });

// Só os esquemas que REALMENTE vão à API. SCHEMA_CONSOLIDACAO não entra:
// ele é apenas a fonte de onde os dois recortes são derivados, e sozinho
// estoura a gramática — foi por isso que a consolidação virou duas etapas.
const ALVOS = [
  ["SCHEMA_TRIAGEM", tipos.SCHEMA_TRIAGEM],
  ["SCHEMA_EXTRACAO", tipos.SCHEMA_EXTRACAO],
  ["SCHEMA_CONSOLIDACAO_FATOS", tipos.SCHEMA_CONSOLIDACAO_FATOS],
  ["SCHEMA_CONSOLIDACAO_JUIZO", tipos.SCHEMA_CONSOLIDACAO_JUIZO],
  ["SCHEMA_PECA", claude.SCHEMA_PECA],
];

let falhou = false;

for (const [nome, schema] of ALVOS) {
  if (!schema) {
    console.log(`FALTA  ${nome} — não exportado`);
    falhou = true;
    continue;
  }
  try {
    await cliente.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 16,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema },
      },
      messages: [{ role: "user", content: "Devolva a estrutura vazia." }],
    });
    console.log(`OK     ${nome}`);
  } catch (e) {
    falhou = true;
    console.log(`FALHA  ${nome} -> ${String(e?.message ?? e).slice(0, 400)}`);
  }
}

rmSync(saida, { recursive: true, force: true });
process.exit(falhou ? 1 : 0);
