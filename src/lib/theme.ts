// src/lib/theme.ts
// Helpers compartilhados de tema (light/dark) — usados por
// `ThemeToggle.tsx` (client) e por `layout.tsx` (SSR, via cookie).

export type Tema = "light" | "dark";

export const COOKIE_NAME = "sonar-theme";
export const STORAGE_KEY = "sonar-theme";

/** 1 ano em segundos — usado no `Max-Age` do cookie. */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Default do app: continuidade com a identidade visual atual. */
export const TEMA_DEFAULT: Tema = "dark";

/** Garante que um valor desconhecido vire um Tema valido. */
export function normalizaTema(v: string | null | undefined): Tema {
  return v === "light" || v === "dark" ? v : TEMA_DEFAULT;
}

/**
 * Server-side helper: extrai o tema de um header `Cookie` cru
 * (string no formato `nome=valor; outro=valor; ...`).
 *
 * Aceita undefined pra simplificar o callsite (`headers().get('cookie')`).
 */
export function temaInicialDoCookie(cookieHeader: string | undefined): Tema {
  if (!cookieHeader) return TEMA_DEFAULT;

  const par = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!par) return TEMA_DEFAULT;

  const valor = decodeURIComponent(par.slice(COOKIE_NAME.length + 1));
  return normalizaTema(valor);
}
