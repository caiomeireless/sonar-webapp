// Extração do texto do capa a capa — roda NO NAVEGADOR, de propósito.
//
// Por que no navegador e não no servidor:
//   1. A Vercel corta requisição em ~4,5 MB e o bucket do Supabase trava em
//      20 MB. Um capa a capa integral passa dos dois com folga. Extraindo
//      aqui, só o TEXTO sobe, em lotes pequenos.
//   2. O progresso vira verdade: dá para dizer "lendo página 412 de 1.830"
//      em vez de girar uma ampulheta sem informação.
//   3. Texto puro custa uma fração do que custaria mandar a imagem de cada
//      página ao modelo.
//   4. O arquivo com todos os anexos nem sai da máquina do advogado.
"use client";

import type { PaginaTexto } from "./claude";

/** Página sem camada de texto: é digitalização, precisa de OCR. */
export interface PaginaImagem {
  pagina: number;
  /** JPEG em base64, sem o prefixo data:. */
  base64: string;
}

export interface ResultadoLeituraPdf {
  totalPaginas: number;
  paginas: PaginaTexto[];
  /** Páginas digitalizadas, que o pdf.js não consegue ler como texto. */
  paginasSemTexto: number[];
}

/** Abaixo disso a página é tratada como digitalizada. */
const MINIMO_CARACTERES = 40;

type ModuloPdfJs = typeof import("pdfjs-dist");

let moduloPromise: Promise<ModuloPdfJs> | null = null;

/**
 * Carrega o pdf.js sob demanda. O worker vem de /public (copiado do pacote)
 * em vez de ser resolvido pelo bundler: é o caminho que não depende de
 * detalhe de empacotamento e não quebra quando o Next troca de bundler.
 */
function carregarPdfJs(): Promise<ModuloPdfJs> {
  if (!moduloPromise) {
    moduloPromise = import("pdfjs-dist").then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return mod;
    });
  }
  return moduloPromise;
}

/**
 * Lê o PDF inteiro, página a página, chamando `aoProgredir` a cada página.
 * `sinal` permite cancelar no meio de um arquivo de milhares de páginas.
 */
export async function lerPdf(
  arquivo: File,
  aoProgredir: (lidas: number, total: number) => void,
  sinal?: AbortSignal,
): Promise<ResultadoLeituraPdf> {
  const pdfjs = await carregarPdfJs();
  const buffer = await arquivo.arrayBuffer();

  const tarefa = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    // Autos digitalizados costumam trazer fonte embutida incompleta; sem
    // isto o pdf.js reclama e perde caracteres acentuados.
    useSystemFonts: true,
  });

  const documento = await tarefa.promise;
  const totalPaginas = documento.numPages;
  const paginas: PaginaTexto[] = [];
  const paginasSemTexto: number[] = [];

  try {
    for (let n = 1; n <= totalPaginas; n++) {
      if (sinal?.aborted) throw new DOMException("Cancelado", "AbortError");

      const pagina = await documento.getPage(n);
      const conteudo = await pagina.getTextContent();

      // O pdf.js devolve fragmentos soltos. `hasEOL` marca a quebra de linha
      // real do PDF — sem respeitar isso, a petição vira um bloco único e o
      // modelo perde a estrutura de parágrafo e de item numerado.
      let texto = "";
      for (const item of conteudo.items) {
        if (!("str" in item)) continue;
        texto += item.str;
        if (item.hasEOL) texto += "\n";
        else if (item.str && !item.str.endsWith(" ")) texto += " ";
      }
      texto = texto.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

      if (texto.length < MINIMO_CARACTERES) paginasSemTexto.push(n);
      paginas.push({ pagina: n, texto });

      pagina.cleanup();
      aoProgredir(n, totalPaginas);
    }
  } finally {
    // `destroy()` mora na tarefa de carregamento, não no documento (pdf.js 6).
    await tarefa.destroy();
  }

  return { totalPaginas, paginas, paginasSemTexto };
}

/**
 * Rasteriza as páginas sem camada de texto para mandar ao modelo como imagem
 * (o caminho de OCR). Só vale a pena para poucas páginas: cada imagem custa
 * muito mais que a mesma página em texto.
 */
export async function rasterizarPaginas(
  arquivo: File,
  numeros: number[],
  aoProgredir?: (feitas: number, total: number) => void,
  sinal?: AbortSignal,
): Promise<PaginaImagem[]> {
  if (numeros.length === 0) return [];

  const pdfjs = await carregarPdfJs();
  const buffer = await arquivo.arrayBuffer();
  const tarefa = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const documento = await tarefa.promise;

  const saida: PaginaImagem[] = [];
  try {
    for (const [i, n] of numeros.entries()) {
      if (sinal?.aborted) throw new DOMException("Cancelado", "AbortError");

      const pagina = await documento.getPage(n);
      // 1.6x dá resolução suficiente para o modelo ler carimbo e tabela sem
      // estourar o tamanho da imagem.
      const viewport = pagina.getViewport({ scale: 1.6 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Não foi possível preparar o canvas.");

      await pagina.render({ canvas, canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
      saida.push({ pagina: n, base64: dataUrl.split(",")[1] ?? "" });

      pagina.cleanup();
      canvas.width = 0;
      canvas.height = 0;
      aoProgredir?.(i + 1, numeros.length);
    }
  } finally {
    await tarefa.destroy();
  }

  return saida;
}

/**
 * Monta os lotes que vão ao modelo, um pedido HTTP por lote.
 * O limite é duplo: número de páginas (para a resposta caber em `max_tokens`)
 * e tamanho em caracteres (para o corpo não encostar no teto da Vercel).
 */
export function montarLotes(
  paginas: PaginaTexto[],
  maxPaginas = 40,
  maxCaracteres = 320_000,
): PaginaTexto[][] {
  const lotes: PaginaTexto[][] = [];
  let atual: PaginaTexto[] = [];
  let tamanho = 0;

  for (const p of paginas) {
    const custo = p.texto.length;
    const estouraria =
      atual.length >= maxPaginas ||
      (atual.length > 0 && tamanho + custo > maxCaracteres);
    if (estouraria) {
      lotes.push(atual);
      atual = [];
      tamanho = 0;
    }
    atual.push(p);
    tamanho += custo;
  }
  if (atual.length > 0) lotes.push(atual);

  return lotes;
}

/** Fatia a triagem para que nenhum pedido passe do teto de corpo da Vercel. */
export function montarLotesTriagem(
  paginas: PaginaTexto[],
  maxPaginas = 600,
): PaginaTexto[][] {
  const lotes: PaginaTexto[][] = [];
  for (let i = 0; i < paginas.length; i += maxPaginas) {
    lotes.push(paginas.slice(i, i + maxPaginas));
  }
  return lotes;
}

/**
 * Impressão digital barata do arquivo, para reconhecer o MESMO capa a capa
 * quando o advogado o arrasta de novo e retomar de onde parou — sem triar
 * e sem reler os lotes que já estão no banco.
 *
 * Não precisa ser criptograficamente única: tamanho + SHA-256 dos
 * primeiros 2 MB distinguem arquivos diferentes e reconhecem o mesmo, e
 * custam nada mesmo num PDF de 500 MB.
 */
export async function impressaoDigital(arquivo: File): Promise<string> {
  const fatia = await arquivo.slice(0, 2 * 1024 * 1024).arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", fatia);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${arquivo.size}:${hex}`;
}
