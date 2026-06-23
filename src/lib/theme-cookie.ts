import { cookies } from "next/headers";

export type Tema = "light" | "dark";

/**
 * Lê o cookie `sonar-theme` no servidor.
 * Fallback `dark` quando ausente ou inválido — mantém continuidade com a
 * identidade visual atual do Sonar.
 */
export async function lerTemaCookie(): Promise<Tema> {
  const c = await cookies();
  const v = c.get("sonar-theme")?.value;
  return v === "light" ? "light" : "dark";
}
