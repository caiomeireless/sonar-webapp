// Dropzone client component — input file múltiplo com preview em grid.
// Lê os arquivos como Object URL pra mostrar miniatura ANTES de enviar.
// Os arquivos vão pro FormData via o `name="screenshots"` (multiple).
//
// Pra demo, não há upload de fato (Server Action só coleta os nomes).
// Em produção, trocar pra upload pro Supabase Storage.
"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";

type Preview = { url: string; nome: string; tamanho: number };

export default function DropzoneScreenshots() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [drag, setDrag] = useState(false);

  // Limpa Object URLs criados pra evitar leak quando o componente desmonta
  // ou quando a lista é trocada.
  useEffect(() => {
    return () => {
      for (const p of previews) URL.revokeObjectURL(p.url);
    };
  }, [previews]);

  function adicionar(files: FileList | null) {
    if (!files || files.length === 0) return;
    const novos: Preview[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      novos.push({
        url: URL.createObjectURL(f),
        nome: f.name,
        tamanho: f.size,
      });
    }
    setPreviews((p) => [...p, ...novos]);
  }

  function remover(idx: number) {
    setPreviews((p) => {
      const removido = p[idx];
      if (removido) URL.revokeObjectURL(removido.url);
      return p.filter((_, i) => i !== idx);
    });
  }

  function clique() {
    inputRef.current?.click();
  }

  return (
    <div>
      <button
        type="button"
        onClick={clique}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          adicionar(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition ${
          drag
            ? "border-[var(--color-signal)] bg-[var(--color-signal-soft)]"
            : "border-[var(--color-line)] bg-[var(--color-surface-2)] hover:border-[var(--color-signal)]/60 hover:bg-[var(--color-signal-06)]"
        }`}
      >
        <ImagePlus className="h-7 w-7 text-[var(--color-signal)]" aria-hidden="true" />
        <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-88)]">
          Arraste ou clique para anexar capturas de tela
        </p>
        <p className="text-xs text-[var(--color-ivory-66)]">
          PNG ou JPG · até 5 imagens
        </p>
      </button>

      <input
        ref={inputRef}
        type="file"
        name="screenshots"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => adicionar(e.target.files)}
      />

      {previews.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {previews.map((p, idx) => (
            <div
              key={`${p.nome}-${idx}`}
              className="group relative overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.nome}
                className="aspect-video w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remover(idx)}
                className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-onyx/80 text-ivory ring-1 ring-[var(--color-line)] backdrop-blur transition hover:bg-[var(--color-devedor)]/80 hover:text-onyx"
                aria-label={`Remover ${p.nome}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="truncate px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                {p.nome}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
