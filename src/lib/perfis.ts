import { createAdminClient } from "@/lib/supabase/admin";
import { ALLOWED_DOMAIN } from "@/lib/config";

export const AVATAR_BUCKET = "avatares";

// Papéis do Sonar:
// - admin/socio: equipe, acesso completo (escrita + leitura)
// - funcionario: equipe, acesso por chave em `acessos`
// - cliente: portal externo, SOMENTE LEITURA dos próprios processos
export type Papel = "admin" | "socio" | "funcionario" | "cliente";

// Chaves de acesso granular que o admin pode ligar por pessoa.
// Admin e sócio têm TODAS automaticamente (ver `pode()`); estas chaves só
// importam para FUNCIONÁRIOS. Cliente nunca passa em `pode()` (read-only).
export const ACESSOS = [
  { chave: "casos", rotulo: "Casos / Devedores" },
  { chave: "bens", rotulo: "Pesquisa de bens" },
  { chave: "custos", rotulo: "Monitor de Custos" },
  { chave: "exportar", rotulo: "Exportar dossiê" },
] as const;

export interface Perfil {
  email: string;
  nome: string;
  fotoPath: string | null;
  fotoUrl: string | null;
  papel: Papel;
  acessos: string[];
}

const vazio = (email: string): Perfil => ({
  email,
  nome: "",
  fotoPath: null,
  fotoUrl: null,
  papel: "funcionario",
  acessos: [],
});

// Deriva um nome legivel do email: "paulo.andre@..." -> "Paulo Andre".
// Quebra em separadores comuns (. _ -), capitaliza cada parte, junta com espaco.
function nomeDoEmail(email: string): string {
  const local = (email.split("@")[0] ?? "").trim();
  if (!local) return "";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

// Auto-cria perfil para emails do dominio do escritorio que ainda nao
// existem na tabela. Defaults seguros (papel funcionario, sem acessos).
// Admin/socio promovem depois pelas configuracoes. Para emails externos
// (clientes), NAO auto-cria — eles tem que ser cadastrados pelo admin
// (regra ja imposta no middleware via isEmailAutorizado).
async function autoCriarPerfilEquipe(
  sb: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<void> {
  if (!email.endsWith("@" + ALLOWED_DOMAIN)) return;
  await sb.from("perfis").upsert(
    {
      email,
      nome: nomeDoEmail(email),
      papel: "funcionario",
      acessos: [],
    },
    { onConflict: "email", ignoreDuplicates: true },
  );
}

// Resiliente: se a tabela/colunas ainda não existem (migração não rodada) ou
// o e-mail não tem perfil, devolve um perfil "vazio" (funcionário sem foto).
// Para emails @ALLOWED_DOMAIN, auto-cria o registro na primeira leitura para
// que o usuario passe a aparecer em listas (carteira, atividade, etc).
export async function perfilAtual(email: string | null | undefined): Promise<Perfil | null> {
  if (!email) return null;
  const e = email.toLowerCase();
  try {
    const sb = createAdminClient();
    let { data, error } = await sb
      .from("perfis")
      .select("email, nome, foto_path, papel, acessos")
      .eq("email", e)
      .maybeSingle();

    // Nao encontrou: tenta auto-criar (so funciona pra email do dominio).
    if (!error && !data) {
      await autoCriarPerfilEquipe(sb, e);
      const releitura = await sb
        .from("perfis")
        .select("email, nome, foto_path, papel, acessos")
        .eq("email", e)
        .maybeSingle();
      data = releitura.data;
      error = releitura.error;
    }

    if (error || !data) return vazio(e);

    const fotoPath = (data.foto_path as string) ?? null;
    let fotoUrl: string | null = null;
    if (fotoPath) {
      const { data: assinada } = await sb.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(fotoPath, 3600);
      fotoUrl = assinada?.signedUrl ?? null;
    }
    return {
      email: e,
      nome: (data.nome as string) ?? "",
      fotoPath,
      fotoUrl,
      papel: ((data.papel as Papel) ?? "funcionario"),
      acessos: ((data.acessos as string[]) ?? []),
    };
  } catch {
    return vazio(e);
  }
}

export function ehAdmin(p: Perfil | null): boolean {
  return p?.papel === "admin";
}

export function ehSocio(p: Perfil | null): boolean {
  return p?.papel === "socio";
}

export function ehEquipe(p: Perfil | null): boolean {
  return p?.papel === "admin" || p?.papel === "socio" || p?.papel === "funcionario";
}

export function ehCliente(p: Perfil | null): boolean {
  return p?.papel === "cliente";
}

// Map de email -> nome de todos os perfis. Usado pra mostrar o nome do
// autor em vez do email. Resiliente: tabela ausente -> {}.
export async function perfisPorEmail(): Promise<Record<string, string>> {
  try {
    const sb = createAdminClient();
    const { data, error } = await sb.from("perfis").select("email, nome");
    if (error || !data) return {};
    const m: Record<string, string> = {};
    for (const r of data) {
      const e = ((r.email as string) ?? "").toLowerCase();
      const n = (r.nome as string) ?? "";
      if (e && n) m[e] = n;
    }
    return m;
  } catch {
    return {};
  }
}

export function nomeOuEmail(email: string, mapa: Record<string, string>): string {
  const e = (email ?? "").toLowerCase().trim();
  if (!e) return "";
  if (mapa[e]) return mapa[e];
  const local = e.split("@")[0] ?? e;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

// Pode acessar um recurso (chave) com permissão de ESCRITA.
// - Cliente NUNCA passa (read-only).
// - Admin e sócio passam em qualquer chave.
// - Funcionário passa apenas nas chaves listadas em `acessos`.
export function pode(p: Perfil | null, chave: string): boolean {
  if (!p) return false;
  if (p.papel === "cliente") return false;
  if (p.papel === "admin" || p.papel === "socio") return true;
  return p.acessos.includes(chave);
}
