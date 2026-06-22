// Monitor de Custos — registro das pesquisas PAGAS de API + IA (server-only).
import { createAdminClient } from "@/lib/supabase/admin";

// Tipos especificos do Sonar (busca de bens). Adicionar conforme as
// integracoes forem entrando.
export type TipoCusto =
  | "assertiva-pf"
  | "assertiva-pj"
  | "assertiva-busca"
  | "bigdata-pessoa"
  | "bigdata-veiculo"
  | "bigdata-imovel"
  | "bigdata-qsa"
  | "bigdata-processos"
  | "edossie-cadastral"
  | "escavador-processos"
  | "datajud"
  | "ia-resumo";

// Custo aproximado em R$ por tipo (veja pesquisa de custos no projeto).
// Tipos com custo calculado por tokens passam custo explicito.
export const CUSTO_ESTIMADO: Record<TipoCusto, number> = {
  "assertiva-pf": 0.203,
  "assertiva-pj": 0.203,
  "assertiva-busca": 0.203,
  "bigdata-pessoa": 0.03,
  "bigdata-veiculo": 0.05,
  "bigdata-imovel": 0.10,
  "bigdata-qsa": 0.05,
  "bigdata-processos": 0.07,
  "edossie-cadastral": 19.00,
  "escavador-processos": 4.50,
  "datajud": 0,
  "ia-resumo": 0,
};

export const ROTULO_TIPO: Record<string, string> = {
  "assertiva-pf": "Assertiva — enriquecimento PF",
  "assertiva-pj": "Assertiva — enriquecimento PJ",
  "assertiva-busca": "Assertiva — busca por nome",
  "bigdata-pessoa": "BigDataCorp — dados de pessoa",
  "bigdata-veiculo": "BigDataCorp — veiculos",
  "bigdata-imovel": "BigDataCorp — imoveis (rural)",
  "bigdata-qsa": "BigDataCorp — participacoes societarias",
  "bigdata-processos": "BigDataCorp — processos",
  "edossie-cadastral": "eDossie — Dossie Cadastral",
  "escavador-processos": "Escavador — processos por CPF/CNPJ",
  "datajud": "CNJ DataJud (gratuito)",
  "ia-resumo": "IA — resumo do dossie",
};

export interface RegistroCusto {
  id: number;
  email: string;
  tipo: string;
  descricao: string;
  custo: number;
  criadoEm: string;
}

// Registra um custo. Best-effort: nunca derruba a acao principal se falhar
// (ex.: migracao ainda nao rodada).
export async function registrarCusto(input: {
  email: string;
  tipo: TipoCusto;
  descricao?: string;
  custo?: number;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("custos").insert({
      email: (input.email || "").toLowerCase(),
      tipo: input.tipo,
      descricao: (input.descricao ?? "").slice(0, 300),
      custo: input.custo ?? CUSTO_ESTIMADO[input.tipo] ?? 0,
    });
  } catch {
    /* registro de custo e best-effort */
  }
}

// Le os registros (mais recentes primeiro). Resiliente: tabela ausente -> [].
export async function getCustos(limite = 2000): Promise<RegistroCusto[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("custos")
      .select("id, email, tipo, descricao, custo, criado_em")
      .order("criado_em", { ascending: false })
      .limit(limite);
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id as number,
      email: (r.email as string) ?? "",
      tipo: (r.tipo as string) ?? "",
      descricao: (r.descricao as string) ?? "",
      custo: Number(r.custo) || 0,
      criadoEm: (r.criado_em as string) ?? "",
    }));
  } catch {
    return [];
  }
}
