"use client";

// Botao "Imprimir / Salvar PDF" que dispara window.print().
// O CSS print do navegador pega o conteudo do <article id="peca-documento">
// e gera PDF se o usuario escolher "Salvar como PDF" no dialogo.

export function BotaoImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-gold)] px-4 py-1.5 text-[11px] font-semibold text-onyx shadow-[0_4px_16px_rgba(201,162,74,0.3)] transition hover:bg-[var(--color-tip-glow)]"
    >
      🖨 Imprimir / Salvar PDF
    </button>
  );
}
