// Radar de Movimentações — filtra, dos milhares de andamentos capturados
// pelos robôs (e-SAJ/eproc, Ter+Sex), só os de ALTO SINAL pra execução:
// penhora, bloqueio SISBAJUD, RENAJUD, expropriação (leilão/arrematação),
// defesas do devedor, citação e pagamento/acordo homologado.
//
// A classificação é por palavra-chave sobre `descricao` (mesma matéria-prima
// que vai alimentar a futura Central de Penhoras). Server-only (admin client).
// Se a tabela sumir ou a query falhar, devolve lista vazia sem panic.
import { createAdminClient } from "@/lib/supabase/admin";

export type CategoriaRadarChave =
  | "penhora"
  | "bloqueio"
  | "veiculos"
  | "expropriacao"
  | "defesa"
  | "citacao"
  | "pagamento";

export type CategoriaRadar = {
  chave: CategoriaRadarChave;
  rotulo: string;
  descricao: string;
  /**
   * Palavras usadas no ilike do banco E na classificação local. Como o
   * ilike do Postgres é sensível a acento, termos acentuados entram nas
   * duas grafias (ex.: "leilão" e "leilao").
   */
  palavras: string[];
};

// Ordem importa: a PRIMEIRA categoria cujo termo bater rotula o andamento.
export const CATEGORIAS_RADAR: CategoriaRadar[] = [
  {
    chave: "bloqueio",
    rotulo: "Bloqueio / SISBAJUD",
    descricao: "Bloqueios de valores e indisponibilidades via SISBAJUD/BacenJud",
    palavras: ["sisbajud", "bacenjud", "bloqueio", "indisponibilidade"],
  },
  {
    chave: "veiculos",
    rotulo: "RENAJUD / Veículos",
    descricao: "Restrições de veículos via RENAJUD",
    palavras: [
      "renajud",
      "restrição de transferência",
      "restricao de transferencia",
      "restrição veicular",
      "restricao veicular",
    ],
  },
  {
    chave: "expropriacao",
    rotulo: "Leilão / Expropriação",
    descricao: "Leilão, hasta, arrematação e adjudicação de bens penhorados",
    palavras: [
      "leilão",
      "leilao",
      "hasta pública",
      "hasta publica",
      "arrematação",
      "arrematacao",
      "adjudicação",
      "adjudicacao",
      "expropriação",
      "expropriacao",
    ],
  },
  {
    chave: "penhora",
    rotulo: "Penhora",
    descricao: "Penhoras deferidas, lavradas ou averbadas",
    palavras: ["penhora", "penhorado"],
  },
  {
    chave: "defesa",
    rotulo: "Defesa do Devedor",
    descricao: "Embargos, impugnações e exceções apresentadas pelo executado",
    palavras: [
      "embargos",
      "impugnação ao cumprimento",
      "impugnacao ao cumprimento",
      "exceção de pré-executividade",
      "excecao de pre-executividade",
    ],
  },
  {
    chave: "citacao",
    rotulo: "Citação",
    descricao: "Citações do executado (marco pra prosseguir com constrição)",
    palavras: ["citação", "citacao"],
  },
  {
    chave: "pagamento",
    rotulo: "Pagamento / Acordo",
    descricao: "Depósitos judiciais, quitações e acordos homologados",
    palavras: [
      "depósito judicial",
      "deposito judicial",
      "quitação",
      "quitacao",
      "acordo homologado",
      "homologação de acordo",
      "homologacao de acordo",
      "acordo de parcelamento",
      "pagamento espontâneo",
      "pagamento espontaneo",
    ],
  },
];

export const RADAR_POR_PAGINA = 40;

export type ItemRadar = {
  id: number;
  caso_id: number | null;
  numero_processo: string;
  fonte: string;
  tribunal: string | null;
  data_andamento: string | null;
  capturado_em: string;
  descricao: string;
  categoria: CategoriaRadarChave;
  devedor: { id: number; nome: string } | null;
  credor_nome: string | null;
  pasta_themis: string | null;
};

export type ListagemRadar = {
  itens: ItemRadar[];
  pagina: number;
  porPagina: number;
  /** Existe página seguinte (buscamos porPagina+1 — count exact custaria um
      seq scan extra de 162k+ linhas a cada view). */
  temMais: boolean;
  /** true = a QUERY falhou (≠ de radar vazio — a UI avisa em vez de mentir
      "Radar limpo"). */
  erro: boolean;
};

const VAZIA: ListagemRadar = {
  itens: [],
  pagina: 1,
  porPagina: RADAR_POR_PAGINA,
  temMais: false,
  erro: false,
};

const FALHA: ListagemRadar = { ...VAZIA, erro: true };

// Remove acentos pra classificar sem depender da grafia do tribunal.
function semAcento(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function classificarDescricao(
  descricao: string,
  preferida?: CategoriaRadarChave,
): CategoriaRadarChave | null {
  const alvo = semAcento(descricao.toLowerCase());
  // Com filtro ativo, a categoria filtrada tem preferência — senão um
  // andamento "Citação; bloqueio SISBAJUD" apareceria na lista filtrada
  // por Citação exibindo badge de Bloqueio.
  const ordem = preferida
    ? [
        ...CATEGORIAS_RADAR.filter((c) => c.chave === preferida),
        ...CATEGORIAS_RADAR.filter((c) => c.chave !== preferida),
      ]
    : CATEGORIAS_RADAR;
  for (const cat of ordem) {
    for (const p of cat.palavras) {
      if (alvo.includes(semAcento(p.toLowerCase()))) return cat.chave;
    }
  }
  return null;
}

function clausulaOr(categorias: CategoriaRadar[]): string {
  // Palavras não têm vírgula nem % — seguro pro .or() do PostgREST.
  return categorias
    .flatMap((c) => c.palavras)
    .map((p) => `descricao.ilike.%${p}%`)
    .join(",");
}

export async function listarRadar(opts: {
  categoria?: CategoriaRadarChave | "todas";
  pagina?: number;
}): Promise<ListagemRadar> {
  try {
    const sb = createAdminClient();
    const escolhidas =
      opts.categoria && opts.categoria !== "todas"
        ? CATEGORIAS_RADAR.filter((c) => c.chave === opts.categoria)
        : CATEGORIAS_RADAR;
    if (escolhidas.length === 0) return VAZIA;

    const pagina = Math.max(1, Math.floor(opts.pagina ?? 1) || 1);
    const inicio = (pagina - 1) * RADAR_POR_PAGINA;
    // +1 linha só pra saber se existe próxima página, sem count exact.
    const fim = inicio + RADAR_POR_PAGINA;

    const { data: cru, error } = await sb
      .from("andamentos")
      .select(
        "id, caso_id, numero_processo, fonte, tribunal, data_andamento, descricao, capturado_em",
      )
      .or(clausulaOr(escolhidas))
      .order("data_andamento", { ascending: false, nullsFirst: false })
      .order("capturado_em", { ascending: false })
      .range(inicio, fim);
    if (error || !cru) return FALHA;
    const temMais = cru.length > RADAR_POR_PAGINA;
    const data = cru.slice(0, RADAR_POR_PAGINA);

    // Enriquece com devedor/credor do caso (pra linkar o dossiê).
    const casoIds = Array.from(
      new Set(data.map((a) => a.caso_id as number | null).filter(Boolean)),
    ) as number[];
    const porCaso = new Map<
      number,
      {
        pasta_themis: string | null;
        devedor: { id: number; nome: string } | null;
        credor_nome: string | null;
      }
    >();
    if (casoIds.length > 0) {
      const { data: casos } = await sb
        .from("casos")
        .select("id, pasta_themis, devedor:devedores(id, nome), credor:credores(nome)")
        .in("id", casoIds);
      for (const c of casos ?? []) {
        const devedor = c.devedor as unknown as { id: number; nome: string } | null;
        const credor = c.credor as unknown as { nome: string } | null;
        porCaso.set(c.id as number, {
          pasta_themis: (c.pasta_themis as string | null) ?? null,
          devedor: devedor ?? null,
          credor_nome: credor?.nome ?? null,
        });
      }
    }

    const fallback = escolhidas[0]!.chave;
    const preferida = escolhidas.length === 1 ? escolhidas[0]!.chave : undefined;
    const itens: ItemRadar[] = data.map((a) => {
      const extra = a.caso_id ? porCaso.get(a.caso_id as number) : undefined;
      return {
        id: a.id as number,
        caso_id: (a.caso_id as number | null) ?? null,
        numero_processo: (a.numero_processo as string) ?? "",
        fonte: (a.fonte as string) ?? "",
        tribunal: (a.tribunal as string | null) ?? null,
        data_andamento: (a.data_andamento as string | null) ?? null,
        capturado_em: (a.capturado_em as string) ?? "",
        descricao: (a.descricao as string) ?? "",
        categoria:
          classificarDescricao((a.descricao as string) ?? "", preferida) ??
          fallback,
        devedor: extra?.devedor ?? null,
        credor_nome: extra?.credor_nome ?? null,
        pasta_themis: extra?.pasta_themis ?? null,
      };
    });

    return { itens, pagina, porPagina: RADAR_POR_PAGINA, temMais, erro: false };
  } catch {
    return FALHA;
  }
}
