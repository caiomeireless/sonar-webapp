// Administração de credores (clientes do escritório) — server-only.
// Sprint 2: CRUD usado pela seção "Clientes do Portal" em
// /equipe/configuracoes. Toda escrita passa por aqui; as Server Actions
// só validam sessão/papel e delegam.

import { createAdminClient } from "@/lib/supabase/admin";

export interface CredorAdmin {
  id: number;
  tipo: "PF" | "PJ";
  documento: string;
  nome: string;
  email_contato: string | null;
  telefone: string | null;
  observacoes: string | null;
  criado_em: string;
  /** true quando existe perfil de login (papel=cliente) pra este email. */
  tem_acesso_portal: boolean;
  total_casos: number;
}

export interface NovoCredorInput {
  tipo: "PF" | "PJ";
  documento: string;
  nome: string;
  email_contato?: string | null;
  telefone?: string | null;
  observacoes?: string | null;
}

export type ResultadoCredor =
  | { ok: true; id: number }
  | { ok: false; erro: string };

// ============================================================
// Validação de documento (dígitos verificadores reais)
// ============================================================

export function somenteDigitos(s: string): string {
  return (s ?? "").replace(/\D+/g, "");
}

export function validarCPF(cpf: string): boolean {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const pos of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < pos; i++) soma += Number(d[i]) * (pos + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(d[pos])) return false;
  }
  return true;
}

export function validarCNPJ(cnpj: string): boolean {
  const d = somenteDigitos(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (base: string): number => {
    const pesos =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base
      .split("")
      .reduce((s, ch, i) => s + Number(ch) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const dv1 = calc(d.slice(0, 12));
  if (dv1 !== Number(d[12])) return false;
  const dv2 = calc(d.slice(0, 13));
  return dv2 === Number(d[13]);
}

export function formatarDocumento(tipo: "PF" | "PJ", doc: string): string {
  const d = somenteDigitos(doc);
  if (tipo === "PF" && d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  if (tipo === "PJ" && d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  return doc;
}

function validarEmail(email: string): boolean {
  // Validação pragmática — o convite via Resend é o teste real.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Valida o input completo. Devolve o erro em PT-BR pronto pra UI, ou
// null quando está tudo certo.
export function validarNovoCredor(input: NovoCredorInput): string | null {
  const nome = (input.nome ?? "").trim();
  if (nome.length < 3) return "Nome precisa de pelo menos 3 caracteres.";

  const doc = somenteDigitos(input.documento ?? "");
  if (input.tipo === "PF" && !validarCPF(doc)) {
    return "CPF inválido — confira os dígitos.";
  }
  if (input.tipo === "PJ" && !validarCNPJ(doc)) {
    return "CNPJ inválido — confira os dígitos.";
  }

  const email = (input.email_contato ?? "").trim().toLowerCase();
  if (email && !validarEmail(email)) {
    return "E-mail de contato em formato inválido.";
  }

  return null;
}

// ============================================================
// Leitura
// ============================================================

// Lista credores REAIS (eh_demo=false) com flag de acesso ao portal.
// Ordena por criado_em desc — recém-cadastrados no topo.
export async function listarCredoresAdmin(): Promise<CredorAdmin[]> {
  const sb = createAdminClient();

  const { data: credores } = await sb
    .from("credores")
    .select("id, tipo, documento, nome, email_contato, telefone, observacoes, criado_em")
    .eq("eh_demo", false)
    .order("criado_em", { ascending: false })
    .limit(1000); // teto do PostgREST — acima disso exige paginação real
  if (!credores || credores.length === 0) return [];

  // Emails com perfil de login (papel=cliente) — 1 query pro lote.
  const emails = credores
    .map((c) => (c.email_contato as string | null)?.toLowerCase())
    .filter((e): e is string => !!e);
  const comPerfil = new Set<string>();
  if (emails.length > 0) {
    const { data: perfis } = await sb
      .from("perfis")
      .select("email")
      .eq("papel", "cliente")
      .in("email", emails);
    for (const p of perfis ?? []) {
      comPerfil.add((p.email as string).toLowerCase());
    }
  }

  // Contagem de casos reais por credor — 1 query agregada em JS.
  const ids = credores.map((c) => c.id as number);
  const casosPorCredor = new Map<number, number>();
  const PAGE = 1000;
  let offset = 0;
  for (;;) {
    const { data: casos } = await sb
      .from("casos")
      .select("credor_id")
      .in("credor_id", ids)
      .eq("eh_demo", false)
      .range(offset, offset + PAGE - 1);
    if (!casos || casos.length === 0) break;
    for (const k of casos) {
      const id = k.credor_id as number;
      casosPorCredor.set(id, (casosPorCredor.get(id) ?? 0) + 1);
    }
    if (casos.length < PAGE) break;
    offset += PAGE;
  }

  return credores.map((c) => {
    const email = (c.email_contato as string | null)?.toLowerCase() ?? null;
    return {
      id: c.id as number,
      tipo: c.tipo as "PF" | "PJ",
      documento: c.documento as string,
      nome: c.nome as string,
      email_contato: (c.email_contato as string | null) ?? null,
      telefone: (c.telefone as string | null) ?? null,
      observacoes: (c.observacoes as string | null) ?? null,
      criado_em: c.criado_em as string,
      tem_acesso_portal: !!email && comPerfil.has(email),
      total_casos: casosPorCredor.get(c.id as number) ?? 0,
    };
  });
}

// ============================================================
// Escrita
// ============================================================

export async function criarCredor(
  input: NovoCredorInput,
): Promise<ResultadoCredor> {
  const erro = validarNovoCredor(input);
  if (erro) return { ok: false, erro };

  const sb = createAdminClient();
  const documento = formatarDocumento(input.tipo, input.documento);
  const email = (input.email_contato ?? "").trim().toLowerCase() || null;

  // unique(documento) no banco — checa antes pra devolver mensagem clara.
  const docDigits = somenteDigitos(documento);
  const { data: existentes } = await sb
    .from("credores")
    .select("id, documento, nome")
    .limit(1000);
  const jaExiste = (existentes ?? []).find(
    (c) => somenteDigitos(c.documento as string) === docDigits,
  );
  if (jaExiste) {
    return {
      ok: false,
      erro: `Documento já cadastrado para "${jaExiste.nome}".`,
    };
  }

  const { data, error } = await sb
    .from("credores")
    .insert({
      tipo: input.tipo,
      documento,
      nome: input.nome.trim(),
      email_contato: email,
      telefone: (input.telefone ?? "").trim() || null,
      observacoes: (input.observacoes ?? "").trim() || null,
      eh_demo: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, erro: error?.message ?? "Falha ao gravar credor." };
  }
  return { ok: true, id: data.id as number };
}

export async function atualizarCredor(
  id: number,
  patch: Partial<Pick<NovoCredorInput, "nome" | "email_contato" | "telefone" | "observacoes">>,
): Promise<ResultadoCredor> {
  const sb = createAdminClient();

  const updates: Record<string, string | null> = {};
  if (patch.nome !== undefined) {
    const nome = patch.nome.trim();
    if (nome.length < 3) return { ok: false, erro: "Nome precisa de pelo menos 3 caracteres." };
    updates.nome = nome;
  }
  if (patch.email_contato !== undefined) {
    const email = (patch.email_contato ?? "").trim().toLowerCase();
    if (email && !validarEmail(email)) {
      return { ok: false, erro: "E-mail de contato em formato inválido." };
    }
    updates.email_contato = email || null;
  }
  if (patch.telefone !== undefined) {
    updates.telefone = (patch.telefone ?? "").trim() || null;
  }
  if (patch.observacoes !== undefined) {
    updates.observacoes = (patch.observacoes ?? "").trim() || null;
  }
  if (Object.keys(updates).length === 0) {
    return { ok: false, erro: "Nada para atualizar." };
  }
  updates.atualizado_em = new Date().toISOString();

  const { error } = await sb.from("credores").update(updates).eq("id", id);
  if (error) return { ok: false, erro: error.message };
  return { ok: true, id };
}
