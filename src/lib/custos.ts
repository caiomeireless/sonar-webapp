// Monitor de Custos — registro das pesquisas PAGAS de API + IA (server-only).
import { createAdminClient } from "@/lib/supabase/admin";

// Tipos específicos do Sonar (busca de bens). Adicionar conforme as
// integrações forem entrando.
export type TipoCusto =
  | "assertiva-pf"
  | "assertiva-pj"
  | "assertiva-busca"
  | "assertiva-veiculos"
  | "bigdata-pessoa"
  | "bigdata-veiculo"
  | "bigdata-imovel"
  | "bigdata-qsa"
  | "bigdata-processos"
  | "edossie-cadastral"
  | "escavador-processos"
  | "datajud"
  | "crawl-tribunais"
  | "ia-resumo";

// Custo aproximado em R$ por tipo (veja pesquisa de custos no projeto).
// Tipos com custo calculado por tokens passam custo explícito.
export const CUSTO_ESTIMADO: Record<TipoCusto, number> = {
  "assertiva-pf": 0.203,
  "assertiva-pj": 0.203,
  "assertiva-busca": 0.203,
  // Proposta Q-19312-1: "Histórico de Veículos CPF/CNPJ" R$ 14,795 bruto.
  // Sobrescrever via env ASSERTIVA_CUSTO_VEICULOS_BRL (lib/assertiva.ts).
  "assertiva-veiculos": 14.795,
  "bigdata-pessoa": 0.03,
  "bigdata-veiculo": 0.05,
  "bigdata-imovel": 0.10,
  "bigdata-qsa": 0.05,
  "bigdata-processos": 0.07,
  "edossie-cadastral": 19.00,
  "escavador-processos": 4.50,
  "datajud": 0,
  "crawl-tribunais": 0,
  "ia-resumo": 0,
};

export const ROTULO_TIPO: Record<string, string> = {
  "assertiva-pf": "Assertiva — enriquecimento PF",
  "assertiva-pj": "Assertiva — enriquecimento PJ",
  "assertiva-busca": "Assertiva — busca por nome",
  "assertiva-veiculos": "Assertiva — veículos",
  "bigdata-pessoa": "BigDataCorp — dados de pessoa",
  "bigdata-veiculo": "BigDataCorp — veículos",
  "bigdata-imovel": "BigDataCorp — imóveis (rural)",
  "bigdata-qsa": "BigDataCorp — participações societárias",
  "bigdata-processos": "BigDataCorp — processos",
  "edossie-cadastral": "eDossie — Dossiê Cadastral",
  "escavador-processos": "Escavador — processos por CPF/CNPJ",
  "datajud": "CNJ DataJud (gratuito)",
  "crawl-tribunais": "Raspagem Tribunais (gratuito)",
  "ia-resumo": "IA — resumo do dossiê",
};

export interface RegistroCusto {
  id: number;
  email: string;
  tipo: string;
  descricao: string;
  custo: number;
  criadoEm: string;
}

// Registra um custo. Best-effort: nunca derruba a ação principal se falhar
// (ex.: migração ainda não rodada). devedor_id/credor_id alimentam os
// monitores por devedor (mig 006) e por cliente (mig 020).
export async function registrarCusto(input: {
  email: string;
  tipo: TipoCusto;
  descricao?: string;
  custo?: number;
  devedorId?: number | null;
  credorId?: number | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const linha: Record<string, unknown> = {
      email: (input.email || "").toLowerCase(),
      tipo: input.tipo,
      descricao: (input.descricao ?? "").slice(0, 300),
      custo: input.custo ?? CUSTO_ESTIMADO[input.tipo] ?? 0,
    };
    if (input.devedorId) linha.devedor_id = input.devedorId;
    if (input.credorId) linha.credor_id = input.credorId;
    const { error } = await admin.from("custos").insert(linha);
    // credor_id chegou na migration 020 — retry sem ela se a coluna faltar.
    if (error && input.credorId) {
      delete linha.credor_id;
      await admin.from("custos").insert(linha);
    }
  } catch {
    /* registro de custo é best-effort */
  }
}

// Lê os registros (mais recentes primeiro). Resiliente: tabela ausente -> [].
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
