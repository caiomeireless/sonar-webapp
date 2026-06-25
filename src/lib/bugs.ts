// Comunicação de bugs reportados pela equipe.
//
// Storage em memória pra demo — em produção, migrar pra tabela `bugs` no
// Supabase (id, titulo, descricao, screenshots jsonb, reportado_por_email,
// reportado_por_nome, criado_em, status, resolvido_em).
//
// Os mocks pré-existentes servem só pra ilustrar como a lista fica quando
// já houve bugs reportados — Caio vê todos eles em /equipe/configuracoes,
// a equipe vê só os próprios em /equipe/bugs.

export type BugStatus = "aberto" | "em_analise" | "resolvido" | "ignorado";

export type BugReport = {
  id: string;
  titulo: string;
  descricao: string;
  screenshots: string[]; // data URLs base64 ou nomes de arquivo (demo)
  reportadoPorEmail: string;
  reportadoPorNome: string;
  criadoEm: string; // ISO
  status: BugStatus;
};

// Storage em memória pra demo (em produção migrar pra Supabase tabela `bugs`).
const _bugs: BugReport[] = [
  // 3 mocks pré-existentes pra mostrar como a tela fica:
  {
    id: "bug-001",
    titulo: "Cálculo judicial não atualiza ao trocar índice",
    descricao:
      "Quando troco o índice de IGP-M para IPCA-E na tela de cálculo, o valor exibido na coluna `Total Atualizado` continua mostrando o do IGP-M. Reproduzido 3x.",
    screenshots: [],
    reportadoPorEmail: "paulo@bpadvogados.com.br",
    reportadoPorNome: "Paulo André",
    criadoEm: "2026-06-23T14:30:00.000Z",
    status: "em_analise",
  },
  {
    id: "bug-002",
    titulo: "Modal de confirmação corta texto em telas pequenas",
    descricao:
      "Em notebook 13 polegadas, o botão de cancelar fica abaixo da dobra e não dá pra clicar sem rolar.",
    screenshots: [],
    reportadoPorEmail: "remo@bpadvogados.com.br",
    reportadoPorNome: "Remo Battaglia",
    criadoEm: "2026-06-22T10:15:00.000Z",
    status: "aberto",
  },
  {
    id: "bug-003",
    titulo: "Pesquisa BigDataCorp não retorna telefones",
    descricao:
      "Devedor PF Carlos Eduardo — fiz a busca combo doc 2x, ARISP e Cenprot retornaram OK mas BigDataCorp veio sem telefones.",
    screenshots: [],
    reportadoPorEmail: "igor@bpadvogados.com.br",
    reportadoPorNome: "Igor",
    criadoEm: "2026-06-21T16:45:00.000Z",
    status: "resolvido",
  },
];

export async function listarBugs(): Promise<BugReport[]> {
  return [..._bugs].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function listarBugsDoUsuario(email: string): Promise<BugReport[]> {
  const e = (email ?? "").toLowerCase().trim();
  if (!e) return [];
  return [..._bugs]
    .filter((b) => b.reportadoPorEmail.toLowerCase() === e)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function adicionarBug(
  b: Omit<BugReport, "id" | "criadoEm" | "status">,
): Promise<BugReport> {
  const novo: BugReport = {
    ...b,
    id: `bug-${String(_bugs.length + 1).padStart(3, "0")}`,
    criadoEm: new Date().toISOString(),
    status: "aberto",
  };
  _bugs.unshift(novo);
  return novo;
}

export async function atualizarStatusBug(
  id: string,
  status: BugStatus,
): Promise<BugReport | null> {
  const bug = _bugs.find((b) => b.id === id);
  if (!bug) return null;
  bug.status = status;
  return bug;
}

// Rótulo + cor de token CSS pra cada status — usado nas pills da listagem.
// Aberto = devedor (vermelho), em_analise = gold, resolvido = signal,
// ignorado = ivory neutro.
export function rotuloStatusBug(status: BugStatus): { label: string; color: string } {
  switch (status) {
    case "aberto":
      return { label: "Aberto", color: "var(--color-devedor)" };
    case "em_analise":
      return { label: "Em análise", color: "var(--color-gold)" };
    case "resolvido":
      return { label: "Resolvido", color: "var(--color-signal)" };
    case "ignorado":
      return { label: "Ignorado", color: "var(--color-ivory-66)" };
    default:
      return { label: status, color: "var(--color-ivory-66)" };
  }
}
