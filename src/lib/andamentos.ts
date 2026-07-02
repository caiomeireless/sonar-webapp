// Reader de public.andamentos — timeline de movimentacoes processuais por
// devedor (agregando todos os casos vinculados ao devedor). Populada por:
// - importador-esaj (fonte='esaj-tjsp')   — Ter+Sex 12h via GH Actions
// - importador-eproc-tjsp (fonte='eproc-tjsp') — Ter+Sex 13h via GH Actions
// - importador-datajud (fonte='datajud')   — futuro
//
// Server-only (usa admin client). Se a tabela ou colunas nao existirem,
// devolve [] / contagens zeradas sem panic — pagina continua viva.
import { createAdminClient } from "@/lib/supabase/admin";

export type FonteAndamento =
  | "datajud"
  | "esaj-tjsp"
  | "eproc-tjsp"
  | "pje"
  | "projudi"
  | "manual";

export type Andamento = {
  id: number;
  caso_id: number | null;
  numero_processo: string;
  fonte: FonteAndamento;
  tribunal: string | null;
  data_andamento: string | null;
  descricao: string;
  capturado_em: string;
};

export type EstatisticasAndamentos = {
  total: number;
  ultimos_30d: number;
  ultimos_90d: number;
  ultima_data: string | null;
  ultima_descricao: string | null;
  fonte_mais_ativa: FonteAndamento | null;
  fonte_mais_ativa_count: number;
  por_fonte: Record<string, number>;
};

const VAZIO: EstatisticasAndamentos = {
  total: 0,
  ultimos_30d: 0,
  ultimos_90d: 0,
  ultima_data: null,
  ultima_descricao: null,
  fonte_mais_ativa: null,
  fonte_mais_ativa_count: 0,
  por_fonte: {},
};

// Resolve a lista de caso_id + numero_processo que pertencem a esse devedor.
// Andamentos podem ter caso_id NULL (crawler nao conseguiu mapear), entao
// tambem buscamos por numero_processo pra nao perder nada.
async function chavesDoDevedor(
  devedorId: number,
): Promise<{ casoIds: number[]; numeros: string[] }> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("casos")
    .select("id, numero_processo")
    .eq("devedor_id", devedorId);
  if (error || !data) return { casoIds: [], numeros: [] };
  const casoIds = data.map((c) => c.id as number).filter((n) => Number.isFinite(n));
  const numeros = data
    .map((c) => c.numero_processo as string | null)
    .filter((s): s is string => !!s && s.length > 0);
  return { casoIds, numeros };
}

export async function listarAndamentosPorDevedor(
  devedorId: number,
  limite = 200,
): Promise<Andamento[]> {
  try {
    const { casoIds, numeros } = await chavesDoDevedor(devedorId);
    if (casoIds.length === 0 && numeros.length === 0) return [];
    const sb = createAdminClient();

    // Faz duas queries (por caso_id e por numero_processo) e mescla com
    // dedup por id. Andamentos com caso_id setado aparecem na primeira;
    // os sem caso_id (mas com numero_processo) aparecem na segunda.
    const [porCaso, porNumero] = await Promise.all([
      casoIds.length
        ? sb
            .from("andamentos")
            .select(
              "id, caso_id, numero_processo, fonte, tribunal, data_andamento, descricao, capturado_em",
            )
            .in("caso_id", casoIds)
            .order("data_andamento", { ascending: false, nullsFirst: false })
            .order("capturado_em", { ascending: false })
            .limit(limite)
        : Promise.resolve({ data: [] as Andamento[], error: null }),
      numeros.length
        ? sb
            .from("andamentos")
            .select(
              "id, caso_id, numero_processo, fonte, tribunal, data_andamento, descricao, capturado_em",
            )
            .in("numero_processo", numeros)
            .is("caso_id", null)
            .order("data_andamento", { ascending: false, nullsFirst: false })
            .order("capturado_em", { ascending: false })
            .limit(limite)
        : Promise.resolve({ data: [] as Andamento[], error: null }),
    ]);

    const acc = new Map<number, Andamento>();
    for (const a of (porCaso.data ?? []) as Andamento[]) acc.set(a.id, a);
    for (const a of (porNumero.data ?? []) as Andamento[]) acc.set(a.id, a);
    const out = Array.from(acc.values());
    out.sort((a, b) => {
      const da = a.data_andamento ?? a.capturado_em;
      const db = b.data_andamento ?? b.capturado_em;
      return db.localeCompare(da);
    });
    return out.slice(0, limite);
  } catch {
    return [];
  }
}

export async function estatisticasAndamentosPorDevedor(
  devedorId: number,
): Promise<EstatisticasAndamentos> {
  try {
    const lista = await listarAndamentosPorDevedor(devedorId, 1000);
    if (lista.length === 0) return VAZIO;

    const agora = Date.now();
    const ms30 = 30 * 24 * 60 * 60 * 1000;
    const ms90 = 90 * 24 * 60 * 60 * 1000;

    let ultimos_30d = 0;
    let ultimos_90d = 0;
    const por_fonte: Record<string, number> = {};

    for (const a of lista) {
      const ref = a.data_andamento ?? a.capturado_em;
      const t = new Date(ref).getTime();
      if (Number.isFinite(t)) {
        if (agora - t <= ms30) ultimos_30d++;
        if (agora - t <= ms90) ultimos_90d++;
      }
      por_fonte[a.fonte] = (por_fonte[a.fonte] ?? 0) + 1;
    }

    const primeiro = lista[0];
    const [fonteTop, countTop] =
      Object.entries(por_fonte).sort((a, b) => b[1] - a[1])[0] ?? [null, 0];

    return {
      total: lista.length,
      ultimos_30d,
      ultimos_90d,
      ultima_data: primeiro?.data_andamento ?? primeiro?.capturado_em ?? null,
      ultima_descricao: primeiro?.descricao ?? null,
      fonte_mais_ativa: fonteTop as FonteAndamento | null,
      fonte_mais_ativa_count: countTop,
      por_fonte,
    };
  } catch {
    return VAZIO;
  }
}
