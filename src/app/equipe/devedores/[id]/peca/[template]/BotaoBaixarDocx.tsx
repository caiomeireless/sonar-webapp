"use client";

// Botao primario "Baixar .docx" — chama a rota /api/pecas/.../docx
// que gera o arquivo Word real e dispara download via blob.
//
// Substitui o BotaoImprimir antigo (que so chamava window.print).
// O HTML print fica como fallback opcional na pagina, mas este eh o default.
import { useState } from "react";

type Props = {
  devedorId: number;
  templateId: string;
  /** "" ou "?eu=..." vindo da pagina (dev bypass) */
  euQuery: string;
  /** CSV de opcoes do template; "" ou ausente = usa defaults do server */
  opcoesCsv: string;
  /** id do caso (so passa se o user escolheu um especifico) */
  casoId?: number;
};

export function BotaoBaixarDocx({
  devedorId,
  templateId,
  euQuery,
  opcoesCsv,
  casoId,
}: Props) {
  const [loading, setLoading] = useState(false);

  function buildUrl(): string {
    const base = `/api/pecas/${devedorId}/${encodeURIComponent(templateId)}/docx`;
    // euQuery ja vem com '?' se existe. Construo o resto manualmente
    // pra preservar a mesma forma.
    const extras: string[] = [];
    if (opcoesCsv) extras.push(`opcoes=${encodeURIComponent(opcoesCsv)}`);
    if (typeof casoId === "number") extras.push(`caso_id=${casoId}`);

    if (!euQuery && extras.length === 0) return base;
    if (!euQuery) return `${base}?${extras.join("&")}`;
    if (extras.length === 0) return `${base}${euQuery}`;
    return `${base}${euQuery}&${extras.join("&")}`;
  }

  function filenameFromDisposition(disposition: string | null): string | null {
    if (!disposition) return null;
    const m = disposition.match(/filename="([^"]+)"/i);
    return m?.[1] ?? null;
  }

  async function baixar() {
    if (loading) return;
    setLoading(true);
    try {
      const url = buildUrl();
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Falha no download (${res.status})`);
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download =
        filenameFromDisposition(res.headers.get("Content-Disposition")) ??
        `peca-${templateId}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error("[BotaoBaixarDocx] erro:", e);
      alert("Erro ao gerar .docx");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={baixar}
      disabled={loading}
      aria-busy={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-gold)] px-4 py-1.5 text-[11px] font-semibold text-onyx shadow-[0_4px_16px_rgba(201,162,74,0.3)] transition hover:bg-[var(--color-tip-glow)] disabled:cursor-wait disabled:opacity-70"
    >
      {loading ? (
        <>
          <span
            aria-hidden
            className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-onyx/40 border-t-onyx"
          />
          Gerando…
        </>
      ) : (
        <>📄 Baixar .docx</>
      )}
    </button>
  );
}
