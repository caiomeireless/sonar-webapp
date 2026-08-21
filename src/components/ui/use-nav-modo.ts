"use client";

// Preferência de navegação da EQUIPE (seletor no menu do avatar, faixa 1):
// - "lateral" (padrão): nav lateral nas abas; menu radial GRANDE só no Início.
// - "radial": o nav lateral SOME e o menu radial flutuante (tamanho
//   intermediário) aparece em todas as abas.
// Vale por navegador (localStorage) e sincroniza entre componentes por evento
// — mesmo padrão do use-nav-fixo do BP Internal.

import { useEffect, useState } from "react";

export type NavModo = "lateral" | "radial";

const CHAVE = "sonar-nav-modo";
const EVENTO = "sonar-nav-modo";

export function lerNavModo(): NavModo {
  try {
    return localStorage.getItem(CHAVE) === "radial" ? "radial" : "lateral";
  } catch {
    return "lateral";
  }
}

export function gravarNavModo(valor: NavModo) {
  try {
    localStorage.setItem(CHAVE, valor);
  } catch {
    // localStorage indisponível — preferência não persiste
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function useNavModo(): NavModo {
  const [valor, setValor] = useState<NavModo>("lateral");
  useEffect(() => {
    const sync = () => setValor(lerNavModo());
    sync();
    window.addEventListener(EVENTO, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENTO, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return valor;
}
