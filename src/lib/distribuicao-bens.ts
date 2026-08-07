// Agregação geográfica de bens — função PURA, sem I/O nem dependências
// de admin client. Vive aqui (e não em dashboard-caso/casos) só pra
// quebrar o ciclo entre essas duas camadas e ser reutilizada pelos três
// pontos: dossiê do devedor, Painel da Equipe, Painel do Cliente.
//
// Quando o bem não tem cidade/uf preenchidos no banco, gera mock estável
// via hash do bemId (Knuth multiplicative) — assim o mapa nunca aparece
// vazio durante a fase demo, mesmo antes dos campos serem populados.

/** Quebra por tipo de bem dentro de uma localizacao (veiculo, imovel...). */
export interface DistribuicaoPorTipo {
  tipo: string;
  qtd: number;
  valorBrl: number;
}

export interface DistribuicaoGeografica {
  cidade: string;
  uf: string;
  qtdBens: number;
  valorTotalBrl: number;
  bensIds: number[];
  /** O QUE foi encontrado ali, com valor — maior valor primeiro. */
  porTipo: DistribuicaoPorTipo[];
}

export type BemParaLocalizacao = {
  id: number;
  valor_estimado_brl: number | null;
  /** Tipo do bem (veiculo, imovel, empresa...) — alimenta a quebra por
   *  tipo nos mapas. Opcional: chamador sem tipo agrupa como "outro". */
  tipo?: string | null;
  cidade?: string | null;
  uf?: string | null;
  /** JSON de detalhes do bem — fonte real de cidade/uf quando as colunas
   *  nao existem (Assertiva grava detalhes.localizacao "SOROCABA/SP",
   *  enderecos gravam detalhes.cidade + detalhes.uf). */
  detalhes?: Record<string, unknown> | null;
};

// "SOROCABA" -> "Sorocaba" (agrupa com os rotulos title-case do mapa).
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((p) => (p.length > 2 ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ")
    .trim();
}

// Extrai cidade/uf REAIS do bem: colunas > detalhes.cidade/uf >
// detalhes.localizacao ("CIDADE/UF"). Null quando nada existe.
function localizacaoReal(
  b: BemParaLocalizacao,
): { cidade: string; uf: string } | null {
  const colCidade = (b.cidade ?? "").trim();
  const colUf = (b.uf ?? "").trim();
  if (colCidade && colUf) return { cidade: titleCase(colCidade), uf: colUf.toUpperCase() };

  const d = b.detalhes ?? {};
  const dCidade = typeof d.cidade === "string" ? d.cidade.trim() : "";
  const dUf = typeof d.uf === "string" ? d.uf.trim() : "";
  if (dCidade && dUf) return { cidade: titleCase(dCidade), uf: dUf.toUpperCase() };

  const loc = typeof d.localizacao === "string" ? d.localizacao.trim() : "";
  const m = /^(.+)[/\-](\s*[A-Za-z]{2})\s*$/.exec(loc);
  if (m) return { cidade: titleCase(m[1].trim()), uf: m[2].trim().toUpperCase() };

  return null;
}

const CIDADES_MOCK_SP: { cidade: string; uf: string }[] = [
  { cidade: "São Paulo", uf: "SP" },
  { cidade: "São Paulo", uf: "SP" },
  { cidade: "São Paulo", uf: "SP" },
  { cidade: "Sorocaba", uf: "SP" },
  { cidade: "Campinas", uf: "SP" },
  { cidade: "Santos", uf: "SP" },
  { cidade: "Ribeirão Preto", uf: "SP" },
  { cidade: "São José dos Campos", uf: "SP" },
];

const CIDADES_MOCK_FORA: { cidade: string; uf: string }[] = [
  { cidade: "Rio de Janeiro", uf: "RJ" },
  { cidade: "Belo Horizonte", uf: "MG" },
  { cidade: "Curitiba", uf: "PR" },
  { cidade: "Goiânia", uf: "GO" },
];

export function rotularBemMock(bemId: number): { cidade: string; uf: string } {
  // Hash determinista: 80% cai em SP (lista SP tem repetição de São Paulo),
  // 20% sai pra outras UFs.
  const h = Math.abs(bemId * 2654435761) >>> 0; // Knuth multiplicative hash
  if (h % 5 === 0) {
    return CIDADES_MOCK_FORA[h % CIDADES_MOCK_FORA.length];
  }
  return CIDADES_MOCK_SP[h % CIDADES_MOCK_SP.length];
}

export function calcularDistribuicaoGeografica(
  bens: BemParaLocalizacao[],
): DistribuicaoGeografica[] {
  type Bucket = {
    cidade: string;
    uf: string;
    valor: number;
    ids: number[];
    porTipo: Map<string, { qtd: number; valor: number }>;
  };
  const acc = new Map<string, Bucket>();
  for (const b of bens) {
    // Localizacao REAL primeiro (colunas ou detalhes); hash-mock apenas
    // como ultimo recurso pra nao deixar o mapa vazio na fase demo.
    const real = localizacaoReal(b);
    let cidade = real?.cidade ?? "";
    let uf = real?.uf ?? "";
    if (!cidade || !uf) {
      const mock = rotularBemMock(b.id);
      cidade = mock.cidade;
      uf = mock.uf;
    }
    const key = `${uf}|${cidade}`;
    let cur = acc.get(key);
    if (!cur) {
      cur = { cidade, uf, valor: 0, ids: [], porTipo: new Map() };
      acc.set(key, cur);
    }
    const valorBem = Number(b.valor_estimado_brl) || 0;
    cur.valor += valorBem;
    cur.ids.push(b.id);
    const tipo = (b.tipo ?? "").trim() || "outro";
    const t = cur.porTipo.get(tipo) ?? { qtd: 0, valor: 0 };
    t.qtd += 1;
    t.valor += valorBem;
    cur.porTipo.set(tipo, t);
    acc.set(key, cur);
  }
  const out: DistribuicaoGeografica[] = [];
  for (const v of acc.values()) {
    const porTipo: DistribuicaoPorTipo[] = [];
    for (const [tipo, t] of v.porTipo) {
      porTipo.push({ tipo, qtd: t.qtd, valorBrl: t.valor });
    }
    porTipo.sort((a, b) => b.valorBrl - a.valorBrl || b.qtd - a.qtd);
    out.push({
      cidade: v.cidade,
      uf: v.uf,
      qtdBens: v.ids.length,
      valorTotalBrl: v.valor,
      bensIds: v.ids,
      porTipo,
    });
  }
  out.sort((a, b) => b.valorTotalBrl - a.valorTotalBrl);
  return out;
}
