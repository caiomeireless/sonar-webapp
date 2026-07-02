"use client";

// Navegacao entre paginas da Fila Themis.
// - Preserva os outros params do URL (q, v, eu).
// - Mostra Anterior + numeros com elipse + Proximo.
// - Numeros nao clicaveis quando ja estao ativos ou fora do range.
// - Scroll ao topo desligado (Next.js Link mantem posicao) — o servidor
//   re-render substitui o conteudo sem reload total.

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  pagina: number;
  totalPaginas: number;
};

// Gera a sequencia de "1 2 3 ... N-1 N" com elipses estrategicas quando
// tem muita pagina. Sempre mostra a primeira e a ultima; sempre mostra a
// vizinhanca da pagina atual.
function janelaPaginas(atual: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const primeira = 1;
  const ultima = total;
  const antes = Math.max(atual - 1, 2);
  const depois = Math.min(atual + 1, total - 1);
  const paginas: (number | "...")[] = [primeira];
  if (antes > 2) paginas.push("...");
  for (let i = antes; i <= depois; i++) paginas.push(i);
  if (depois < total - 1) paginas.push("...");
  paginas.push(ultima);
  return paginas;
}

export function PaginacaoThemis({ pagina, totalPaginas }: Props) {
  const sp = useSearchParams();
  const pathname = usePathname();

  const hrefParaPagina = useMemo(() => {
    return (p: number) => {
      const params = new URLSearchParams(sp.toString());
      if (p <= 1) params.delete("p");
      else params.set("p", String(p));
      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    };
  }, [sp, pathname]);

  if (totalPaginas <= 1) return null;

  const paginas = janelaPaginas(pagina, totalPaginas);
  const anteriorHabilitado = pagina > 1;
  const proximoHabilitado = pagina < totalPaginas;

  const chipBase =
    "inline-flex h-9 min-w-[36px] items-center justify-center rounded-lg border font-mono text-[12px] uppercase tracking-[0.12em] transition";
  const chipInativo =
    "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-ivory-66)] hover:border-[var(--color-signal-soft-2)] hover:text-[var(--color-ivory)]";
  const chipAtivo =
    "border-[var(--color-signal)] bg-[var(--color-signal-soft)] text-[var(--color-signal)]";
  const chipDesabilitado =
    "cursor-not-allowed border-[var(--color-line)] bg-[var(--color-surface-2)]/40 text-[var(--color-ivory-40)]";

  return (
    <nav
      aria-label="Paginação da Fila Themis"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      {anteriorHabilitado ? (
        <Link
          href={hrefParaPagina(pagina - 1)}
          scroll={false}
          className={`${chipBase} ${chipInativo} px-3`}
          aria-label="Página anterior"
        >
          <ChevronLeft className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Anterior
        </Link>
      ) : (
        <span className={`${chipBase} ${chipDesabilitado} px-3`} aria-hidden="true">
          <ChevronLeft className="mr-1 h-3.5 w-3.5" />
          Anterior
        </span>
      )}

      {paginas.map((p, idx) =>
        p === "..." ? (
          <span
            key={`e-${idx}`}
            className={`${chipBase} ${chipDesabilitado}`}
            aria-hidden="true"
          >
            …
          </span>
        ) : p === pagina ? (
          <span
            key={p}
            aria-current="page"
            className={`${chipBase} ${chipAtivo}`}
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={hrefParaPagina(p)}
            scroll={false}
            className={`${chipBase} ${chipInativo}`}
            aria-label={`Ir para página ${p}`}
          >
            {p}
          </Link>
        ),
      )}

      {proximoHabilitado ? (
        <Link
          href={hrefParaPagina(pagina + 1)}
          scroll={false}
          className={`${chipBase} ${chipInativo} px-3`}
          aria-label="Próxima página"
        >
          Próxima
          <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ) : (
        <span className={`${chipBase} ${chipDesabilitado} px-3`} aria-hidden="true">
          Próxima
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </span>
      )}
    </nav>
  );
}
