"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import {
  COOKIE_MAX_AGE,
  COOKIE_NAME,
  STORAGE_KEY,
  TEMA_DEFAULT,
  normalizaTema,
  type Tema,
} from "@/lib/theme";

/**
 * Botao unico que alterna entre light e dark.
 * - Mostra Sun quando o tema atual e `light` (indica "esta claro").
 * - Mostra Moon quando o tema atual e `dark`.
 *
 * Fonte da verdade na hidratacao: `<html data-theme>` (setado pelo SSR
 * via cookie + reaplicado pelo script anti-flash). useEffect onMount
 * sincroniza o estado React com esse atributo + espelha em localStorage.
 */
export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>(TEMA_DEFAULT);

  // onMount: le o tema que o SSR/anti-flash ja aplicou no <html>
  // e espelha no localStorage caso ele esteja dessincronizado do cookie.
  useEffect(() => {
    const atual = normalizaTema(
      document.documentElement.dataset.theme ?? null,
    );
    setTema(atual);
    try {
      localStorage.setItem(STORAGE_KEY, atual);
    } catch {
      // localStorage indisponivel (modo privado restrito) — segue a vida.
    }
  }, []);

  function aplicar(novo: Tema) {
    setTema(novo);
    document.documentElement.dataset.theme = novo;

    try {
      localStorage.setItem(STORAGE_KEY, novo);
    } catch {
      // ignora — cookie ja persiste sozinho.
    }

    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      `${COOKIE_NAME}=${novo}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }

  function alternar() {
    aplicar(tema === "dark" ? "light" : "dark");
  }

  const proximo: Tema = tema === "dark" ? "light" : "dark";
  const label =
    proximo === "light" ? "Mudar para tema claro" : "Mudar para tema escuro";

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={label}
      title={label}
      className="
        flex h-9 w-9 items-center justify-center rounded-lg
        border border-line bg-surface-2 text-fg-muted
        transition hover:border-signal-soft-2 hover:text-signal
        focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-soft-2
      "
    >
      {tema === "light" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

export default ThemeToggle;
