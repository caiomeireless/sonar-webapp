// Reader/types de medidas_tomadas — histórico processual por caso.
// Server-only (usa admin client). Renderizado como timeline no dossiê.
//
// Tabela criada na migration 004. Se a tabela não existir ainda (migration
// não rodou), as funções devolvem [] sem panic — a página continua viva.
import { createAdminClient } from "@/lib/supabase/admin";

export type TipoMedida =
  | "sisbajud"
  | "infojud"
  | "renajud"
  | "arisp"
  | "oficio_cartorio"
  | "oficio_junta"
  | "peticao_penhora"
  | "penhora_efetivada"
  | "audiencia"
  | "recurso"
  | "cumprimento_sentenca"
  | "sniper"
  | "serasajud"
  | "outro";

export type ResultadoMedida =
  | "positivo"
  | "negativo"
  | "parcial"
  | "aguardando"
  | "nao_aplica";

export interface Medida {
  id: number;
  caso_id: number;
  data: string;
  tipo: TipoMedida;
  resultado: ResultadoMedida;
  titulo: string;
  detalhes: string | null;
  advogado_email: string | null;
  criado_em: string;
}

// Lista todas medidas dos casos vinculados a um devedor.
// Ordenado por data DESC (mais recente primeiro).
// Se a tabela não existir (migration 004 não rodou), devolve [].
export async function listarMedidasPorDevedor(
  devedorId: number,
): Promise<Medida[]> {
  const sb = createAdminClient();

  // 1) Pega os IDs dos casos deste devedor.
  const { data: casos, error: errCasos } = await sb
    .from("casos")
    .select("id")
    .eq("devedor_id", devedorId);
  if (errCasos || !casos || casos.length === 0) return [];

  const casoIds = casos.map((c) => c.id as number);

  // 2) Busca medidas. Se a tabela não existir (PostgREST 42P01),
  //    devolve array vazio em vez de quebrar a página.
  const { data, error } = await sb
    .from("medidas_tomadas")
    .select("*")
    .in("caso_id", casoIds)
    .order("data", { ascending: false });

  if (error) {
    // 42P01 = undefined_table; PGRST205 = schema cache não tem tabela.
    // Em ambos cenários o significado prático é "tabela não existe ainda".
    console.warn(
      `[medidas] tabela indisponível ou erro de leitura: ${error.message}`,
    );
    return [];
  }

  return (data ?? []) as unknown as Medida[];
}

// ============================================================
// Metadados de UI — tipos e resultados com label + cor.
// Centralizado aqui pra TimelineMedidas e AdicionarMedidaForm
// consumirem o mesmo dicionário.
// ============================================================
export const TIPO_META: Record<TipoMedida, { label: string; cor: string }> = {
  sisbajud: { label: "SISBAJUD", cor: "#5a9bff" },
  infojud: { label: "INFOJUD", cor: "#7a86ff" },
  renajud: { label: "RENAJUD", cor: "#ff8a3d" },
  arisp: { label: "ARISP", cor: "#d4b46a" },
  oficio_cartorio: { label: "Ofício cartório", cor: "#c9a24a" },
  oficio_junta: { label: "Ofício junta", cor: "#c9a24a" },
  peticao_penhora: { label: "Petição penhora", cor: "#c9a24a" },
  penhora_efetivada: { label: "Penhora efetivada", cor: "#3cff8a" },
  audiencia: { label: "Audiência", cor: "#b08cff" },
  recurso: { label: "Recurso", cor: "#ff6b9d" },
  cumprimento_sentenca: { label: "Cumprim. sentença", cor: "#9ed8ff" },
  sniper: { label: "SNIPER", cor: "#ff5050" },
  serasajud: { label: "SERASAJUD", cor: "#5ad4d4" },
  outro: { label: "Outro", cor: "#a9a9a9" },
};

export const RESULTADO_META: Record<
  ResultadoMedida,
  { label: string; cor: string }
> = {
  positivo: { label: "Positivo", cor: "#3cff8a" },
  negativo: { label: "Negativo", cor: "#ff5b5b" },
  parcial: { label: "Parcial", cor: "#f4c542" },
  aguardando: { label: "Aguardando", cor: "#a9a9a9" },
  nao_aplica: { label: "N/A", cor: "#777" },
};

// Ordem dos selects no form — humana, agrupada por etapa processual.
export const TIPOS_ORDEM: TipoMedida[] = [
  "sisbajud",
  "infojud",
  "renajud",
  "arisp",
  "serasajud",
  "sniper",
  "oficio_cartorio",
  "oficio_junta",
  "peticao_penhora",
  "penhora_efetivada",
  "audiencia",
  "recurso",
  "cumprimento_sentenca",
  "outro",
];

export const RESULTADOS_ORDEM: ResultadoMedida[] = [
  "positivo",
  "negativo",
  "parcial",
  "aguardando",
  "nao_aplica",
];
