// Agregação geográfica de bens — função PURA, sem I/O nem dependências
// de admin client. Vive aqui (e não em dashboard-caso/casos) só pra
// quebrar o ciclo entre essas duas camadas e ser reutilizada pelos três
// pontos: dossiê do devedor, Painel da Equipe, Painel do Cliente.
//
// Quando o bem não tem cidade/uf preenchidos no banco, gera mock estável
// via hash do bemId (Knuth multiplicative) — assim o mapa nunca aparece
// vazio durante a fase demo, mesmo antes dos campos serem populados.

export interface DistribuicaoGeografica {
  cidade: string;
  uf: string;
  qtdBens: number;
  valorTotalBrl: number;
  bensIds: number[];
}

export type BemParaLocalizacao = {
  id: number;
  valor_estimado_brl: number | null;
  cidade?: string | null;
  uf?: string | null;
};

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
  type Bucket = { cidade: string; uf: string; valor: number; ids: number[] };
  const acc = new Map<string, Bucket>();
  for (const b of bens) {
    let cidade = (b.cidade ?? "").trim();
    let uf = (b.uf ?? "").trim();
    if (!cidade || !uf) {
      const mock = rotularBemMock(b.id);
      cidade = mock.cidade;
      uf = mock.uf;
    }
    const key = `${uf}|${cidade}`;
    const cur = acc.get(key) ?? { cidade, uf, valor: 0, ids: [] };
    cur.valor += Number(b.valor_estimado_brl) || 0;
    cur.ids.push(b.id);
    acc.set(key, cur);
  }
  const out: DistribuicaoGeografica[] = [];
  for (const v of acc.values()) {
    out.push({
      cidade: v.cidade,
      uf: v.uf,
      qtdBens: v.ids.length,
      valorTotalBrl: v.valor,
      bensIds: v.ids,
    });
  }
  out.sort((a, b) => b.valorTotalBrl - a.valorTotalBrl);
  return out;
}
