// Derivadores compartilhados entre dossie advogado e dossie cliente.
import type { Bem, CasoResumo } from "@/lib/casos";

export function primeiroEndereco(bens: Bem[]): string | null {
  const end = bens.find((b) => b.tipo === "endereco");
  if (!end) return null;
  const d = end.detalhes;
  const log = typeof d.logradouro === "string" ? d.logradouro : null;
  const cidade = typeof d.cidade === "string" ? d.cidade : null;
  const uf = typeof d.uf === "string" ? d.uf : null;
  const partes: string[] = [];
  if (log) partes.push(log);
  if (cidade && uf) partes.push(`${cidade}/${uf}`);
  else if (cidade) partes.push(cidade);
  else if (uf) partes.push(uf);
  return partes.length > 0 ? partes.join(" — ") : null;
}

export function responsavelPrincipal(casos: CasoResumo[]): string | null {
  const c = casos.find((x) => x.responsavel_email);
  return c?.responsavel_email ?? null;
}

export function areasDoDevedor(casos: CasoResumo[]): string | null {
  if (casos.length === 0) return null;
  return "Recuperação de Crédito";
}

export function somaCredito(casos: CasoResumo[]): number {
  return casos.reduce((acc, c) => acc + (c.valor_credito_brl ?? 0), 0);
}
