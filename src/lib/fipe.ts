// Tabela FIPE — estimativa de valor de veículo (server-only, GRATUITO).
// A Assertiva Veículos devolve placa/marca/modelo/ano mas NÃO devolve
// valor. Este cliente consulta a FIPE (API pública parallelum) e casa o
// "RENAULT/SANDERO EXP1016V" da Assertiva com a tabela oficial pra
// preencher valor_estimado_brl automaticamente.
//
// API: https://fipe.parallelum.com.br/api/v2 (sem chave pra uso leve).
// Falha em silêncio: FIPE fora do ar ou modelo não casado -> null, e o
// bem entra sem valor (melhor sem valor do que com valor errado).

const FIPE_BASE =
  process.env.FIPE_BASE_URL || "https://fipe.parallelum.com.br/api/v2";
const TIMEOUT_MS = 8_000;

if (typeof window !== "undefined") {
  throw new Error("lib/fipe.ts e server-only.");
}

type TipoVeiculoFipe = "cars" | "motorcycles" | "trucks";

export interface ValorFipe {
  valorBrl: number;
  codigoFipe: string;
  nomeFipe: string;
  mesReferencia: string;
}

// ---------------------------------------------------------------------------
// Fetch com timeout + cache em memória (marcas/modelos mudam ~nunca)
// ---------------------------------------------------------------------------

const cacheGet = new Map<string, unknown>();

async function fipeGet<T>(path: string): Promise<T | null> {
  if (cacheGet.has(path)) return cacheGet.get(path) as T;
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${FIPE_BASE}${path}`, {
      headers: { Accept: "application/json" },
      signal: ac.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as T;
    cacheGet.set(path, json);
    return json;
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

// ---------------------------------------------------------------------------
// Normalização + matching
// ---------------------------------------------------------------------------

function norm(s: string): string {
  return s
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return norm(s).split(" ").filter(Boolean);
}

// Similaridade por tokens compartilhados, com peso maior pros primeiros
// tokens do alvo (em "SANDERO EXP1016V", acertar "SANDERO" vale mais).
// Prefixo com 3+ chars vale meio ponto — abreviacoes Denatran ("EXP" =
// "EXPRESSION", "WOR" = "WORKING") sao a regra, nao a excecao.
function score(alvo: string, candidato: string): number {
  const ta = tokens(alvo);
  const tc = new Set(tokens(candidato));
  let s = 0;
  ta.forEach((t, i) => {
    const peso = i === 0 ? 3 : 1;
    if (tc.has(t)) s += peso;
    else if (t.length >= 3 && [...tc].some((c) => c.startsWith(t) || t.startsWith(c))) {
      s += peso * 0.5;
    }
  });
  return s;
}

function parsePrecoBR(s: string): number | null {
  const n = Number(s.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

type ItemFipe = { code: string; name: string };

// ---------------------------------------------------------------------------
// Estimativa principal
// ---------------------------------------------------------------------------

export async function estimarValorFipe(input: {
  /** Texto da Assertiva, ex.: "RENAULT/SANDERO EXP1016V". */
  marcaModelo: string;
  /** Ano modelo, ex.: "2009". */
  ano?: string;
}): Promise<ValorFipe | null> {
  const bruto = (input.marcaModelo ?? "").trim();
  if (!bruto) return null;

  // "MARCA/MODELO ..." — separador padrão da base Denatran/Assertiva.
  const [marcaBruta, ...resto] = bruto.split("/");
  const modeloBruto = resto.join("/") || marcaBruta;
  const marcaNorm = norm(marcaBruta);
  if (!marcaNorm) return null;

  // Tenta carros -> motos -> caminhões (a Assertiva não separa o tipo).
  for (const tipo of ["cars", "motorcycles", "trucks"] as TipoVeiculoFipe[]) {
    const resultado = await estimarPorTipo(tipo, marcaNorm, modeloBruto, input.ano);
    if (resultado) return resultado;
  }
  return null;
}

async function estimarPorTipo(
  tipo: TipoVeiculoFipe,
  marcaNorm: string,
  modeloBruto: string,
  ano?: string,
): Promise<ValorFipe | null> {
  const marcas = await fipeGet<ItemFipe[]>(`/${tipo}/brands`);
  if (!marcas) return null;

  // Marca: match exato normalizado, senão contains (GM x GM - CHEVROLET).
  const marca =
    marcas.find((m) => norm(m.name) === marcaNorm) ??
    marcas.find(
      (m) => norm(m.name).includes(marcaNorm) || marcaNorm.includes(norm(m.name)),
    );
  if (!marca) return null;

  const modelos = await fipeGet<ItemFipe[]>(`/${tipo}/brands/${marca.code}/models`);
  if (!modelos || modelos.length === 0) return null;

  // Modelos rankeados por score; exige o token principal (>=3). Vários
  // acabamentos empatam ("Sandero Expression", "Sandero Authentique"...),
  // então tenta os top candidatos ATÉ um ter o ano compatível.
  const candidatos = modelos
    .map((m) => ({ m, s: score(modeloBruto, m.name) }))
    .filter((x) => x.s >= 3)
    .sort((a, b) => b.s - a.s)
    .slice(0, 8);

  const alvoAno = Number((ano ?? "").replace(/\D/g, "")) || null;

  for (const { m: modelo } of candidatos) {
    const anos = await fipeGet<ItemFipe[]>(
      `/${tipo}/brands/${marca.code}/models/${modelo.code}/years`,
    );
    if (!anos || anos.length === 0) continue;

    // Ano: code vem "2009-1" (ano-combustível); "32000" é zero km.
    let anoEscolhido = anos[0];
    if (alvoAno) {
      let menorDelta = Infinity;
      for (const a of anos) {
        const n = Number(a.code.split("-")[0]);
        if (!Number.isFinite(n) || n > 3000) continue; // pula zero km
        const delta = Math.abs(n - alvoAno);
        if (delta < menorDelta) {
          menorDelta = delta;
          anoEscolhido = a;
        }
      }
      if (menorDelta > 2) continue; // ano longe = acabamento errado, tenta o próximo
    }

    const preco = await fipeGet<{
      price?: string;
      codeFipe?: string;
      brand?: string;
      model?: string;
      referenceMonth?: string;
    }>(`/${tipo}/brands/${marca.code}/models/${modelo.code}/years/${anoEscolhido.code}`);
    if (!preco?.price) continue;

    const valorBrl = parsePrecoBR(preco.price);
    if (!valorBrl) continue;

    return {
      valorBrl,
      codigoFipe: preco.codeFipe ?? "",
      nomeFipe: [preco.brand, preco.model].filter(Boolean).join(" "),
      mesReferencia: preco.referenceMonth ?? "",
    };
  }
  return null;
}
