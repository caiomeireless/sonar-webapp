// Select de status do bug — auto-submit ao trocar de opção.
// Wrapper client pequeno em volta da Server Action mudarStatusBug.
"use client";

import { useRef } from "react";

import { mudarStatusBug } from "../actions";
import type { BugStatus } from "@/lib/bugs";

type Props = {
  id: string;
  atual: BugStatus;
};

export default function SelectStatusBug({ id, atual }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <form ref={formRef} action={mudarStatusBug} className="inline-flex">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={atual}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ivory focus:border-[var(--color-signal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]/30"
        aria-label="Alterar status do bug"
      >
        <option value="aberto">Aberto</option>
        <option value="em_analise">Em análise</option>
        <option value="resolvido">Resolvido</option>
        <option value="ignorado">Ignorado</option>
      </select>
    </form>
  );
}
