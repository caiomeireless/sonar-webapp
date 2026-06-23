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
 * Pílula com 2 botões "Claro" / "Escuro" (estilo BP CRM, paleta Sonar).
 * Ativo: fundo signal + texto onyx. Inativo: texto ivory-muted.
 *
 * Fonte da verdade na hidratação: `<html data-theme>` (setado pelo SSR
 * via cookie + reaplicado pelo script anti-flash). useEffect onMount
 * sincroniza o estado React com esse atributo + espelha em localStorage.
 */
export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>(TEMA_DEFAULT);

  useEffect(() => {
    const atual = normalizaTema(
      document.documentElement.dataset.theme ?? null,
    );
    setTema(atual);
    try {
      localStorage.setItem(STORAGE_KEY, atual);
    } catch {
      // localStorage indisponível — segue a vida.
    }
  }, []);

  function aplicar(novo: Tema) {
    if (novo === tema) return;
    setTema(novo);
    document.documentElement.dataset.theme = novo;
    try {
      localStorage.setItem(STORAGE_KEY, novo);
    } catch {
      // ignora — cookie já persiste sozinho.
    }
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie =
      `${COOKIE_NAME}=${novo}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }

  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-soft-2)]";
  const ativoCls =
    "bg-[var(--color-signal)] text-[var(--color-onyx)] shadow-[0_0_12px_rgba(60,255,138,0.45)]";
  const inativoCls =
    "text-[var(--color-ivory-66)] hover:text-[var(--color-ivory)]";

  return (
    <div
      role="group"
      aria-label="Alternar tema"
      className="inline-flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] p-1 backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={() => aplicar("light")}
        aria-pressed={tema === "light" ? "true" : "false"}
        className={`${base} ${tema === "light" ? ativoCls : inativoCls}`}
      >
        <Sun className="h-3.5 w-3.5" aria-hidden="true" />
        Claro
      </button>
      <button
        type="button"
        onClick={() => aplicar("dark")}
        aria-pressed={tema === "dark" ? "true" : "false"}
        className={`${base} ${tema === "dark" ? ativoCls : inativoCls}`}
      >
        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
        Escuro
      </button>
    </div>
  );
}

export default ThemeToggle;
