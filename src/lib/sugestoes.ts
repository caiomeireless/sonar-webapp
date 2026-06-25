// Sugestoes e Duvidas enviadas pelo cliente.
//
// Storage em memoria pra demo — em producao, migrar pra tabela `sugestoes`
// no Supabase (id, tipo, titulo, descricao, reportado_por_email,
// reportado_por_nome, criado_em, status).
//
// Espelha a estrutura de bugs.ts (mesma forma de adicionarBug/listarBugs)
// mas com um campo `tipo` ('sugestao' | 'duvida') pra Caio triar.

export type SugestaoTipo = "sugestao" | "duvida";
export type SugestaoStatus = "aberto" | "em_analise" | "respondido" | "fechado";

export type Sugestao = {
  id: string;
  tipo: SugestaoTipo;
  titulo: string;
  descricao: string;
  reportadoPorEmail: string;
  reportadoPorNome: string;
  criadoEm: string;
  status: SugestaoStatus;
};

const _sugestoes: Sugestao[] = [
  // 2 mocks pra ilustrar a tela do cliente
  {
    id: "sug-001",
    tipo: "sugestao",
    titulo: "Exportar relatório mensal em PDF",
    descricao:
      "Seria ótimo conseguir baixar um PDF mensal com os bens encontrados, valores e medidas tomadas, pra anexar nos relatórios internos da minha empresa.",
    reportadoPorEmail: "cliente.demo@battaglia.com.br",
    reportadoPorNome: "Cliente Demonstração",
    criadoEm: "2026-06-20T15:30:00.000Z",
    status: "em_analise",
  },
  {
    id: "sug-002",
    tipo: "duvida",
    titulo: "Posso ver os documentos da matricula encontrada?",
    descricao:
      "No card do imóvel localizado em SP aparece 'matrícula 98.765' — consigo baixar a certidão diretamente pela plataforma ou preciso pedir pra equipe?",
    reportadoPorEmail: "cliente.demo@battaglia.com.br",
    reportadoPorNome: "Cliente Demonstração",
    criadoEm: "2026-06-18T11:00:00.000Z",
    status: "respondido",
  },
];

export async function listarSugestoes(): Promise<Sugestao[]> {
  return [..._sugestoes].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function listarSugestoesDoUsuario(
  email: string,
): Promise<Sugestao[]> {
  const e = (email ?? "").toLowerCase().trim();
  if (!e) return [];
  return [..._sugestoes]
    .filter((s) => s.reportadoPorEmail.toLowerCase() === e)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function adicionarSugestao(
  s: Omit<Sugestao, "id" | "criadoEm" | "status">,
): Promise<Sugestao> {
  const novo: Sugestao = {
    ...s,
    id: `sug-${String(_sugestoes.length + 1).padStart(3, "0")}`,
    criadoEm: new Date().toISOString(),
    status: "aberto",
  };
  _sugestoes.unshift(novo);
  return novo;
}

// Rotulo + cor pra cada status — usado nas pills da listagem.
export function rotuloStatusSugestao(
  status: SugestaoStatus,
): { label: string; color: string } {
  switch (status) {
    case "aberto":
      return { label: "Aberto", color: "var(--color-signal)" };
    case "em_analise":
      return { label: "Em análise", color: "var(--color-gold)" };
    case "respondido":
      return { label: "Respondido", color: "var(--color-signal)" };
    case "fechado":
      return { label: "Fechado", color: "var(--color-ivory-66)" };
  }
}

export function rotuloTipoSugestao(tipo: SugestaoTipo): string {
  return tipo === "duvida" ? "Dúvida" : "Sugestão";
}
