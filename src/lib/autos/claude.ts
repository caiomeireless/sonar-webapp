// Chamadas ao modelo para a Análise de Autos. Server-only.
//
// Regra de ouro do módulo: o PDF nunca sai do navegador. O que chega aqui já
// é texto extraído página a página. Isso resolve de uma vez o teto de 4,5 MB
// de corpo da Vercel, o teto do bucket do Supabase e o custo (texto puro
// custa uma fração do que custa mandar a imagem de cada página).
import Anthropic from "@anthropic-ai/sdk";

import {
  SISTEMA_ANALISE_AUTOS,
  promptConsolidacao,
  promptExtracao,
  promptRedacaoPeca,
} from "./prompts";
import {
  SCHEMA_CONSOLIDACAO,
  SCHEMA_EXTRACAO,
  SCHEMA_TRIAGEM,
  type CustoTokens,
  type FichaAutos,
  type ResultadoExtracao,
  type ResultadoTriagem,
} from "./tipos";

// ============================================================
// MODELOS E PREÇO
// ============================================================

/** O pesado: lê os autos e conclui. O Caio pediu esforço MÁXIMO, explicitamente. */
const MODELO_ANALISE = "claude-opus-5-5";
/** O barato: só separa página de peça de página de anexo. */
const MODELO_TRIAGEM = "claude-haiku-5-5";

/** US$ por milhão de tokens. Tabela oficial da API. */
const PRECO = {
  "claude-opus-5-5": { input: 4.0, output: 20.0, cacheRead: 0.2 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
} as const;

/** Câmbio só para exibir o custo em reais na tela. Ajustável por env. */
const USD_BRL = Number(process.env.USD_BRL_ESTIMADO ?? "5.50");

export function custoEmReais(c: CustoTokens): number {
  const p = PRECO[c.modelo as keyof typeof PRECO];
  if (!p) return 0;
  const usd =
    (c.input / 1_000_000) * p.input +
    (c.output / 1_000_000) * p.output +
    (c.cacheRead / 1_000_000) * p.cacheRead +
    // escrita de cache custa ~1,25x o token de entrada
    (c.cacheWrite / 1_000_000) * p.input * 1.25;
  return usd * USD_BRL;
}

export function somarCustos(lista: CustoTokens[]): CustoTokens[] {
  const porModelo = new Map<string, CustoTokens>();
  for (const c of lista) {
    const atual = porModelo.get(c.modelo) ?? {
      modelo: c.modelo,
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
    };
    atual.input += c.input;
    atual.output += c.output;
    atual.cacheRead += c.cacheRead;
    atual.cacheWrite += c.cacheWrite;
    porModelo.set(c.modelo, atual);
  }
  return [...porModelo.values()];
}

// ============================================================
// CLIENTE
// ============================================================

export function temChaveAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function cliente(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada — a análise de autos precisa dela.",
    );
  }
  // Uma análise de capa a capa é longa por natureza: cada lote pode levar
  // minutos no esforço máximo. O padrão do SDK (10 min) serve, mas deixamos
  // explícito para não depender de default.
  return new Anthropic({ apiKey, timeout: 10 * 60 * 1000, maxRetries: 2 });
}

function usoDe(
  modelo: string,
  usage: Anthropic.Usage | undefined,
): CustoTokens {
  return {
    modelo,
    input: usage?.input_tokens ?? 0,
    output: usage?.output_tokens ?? 0,
    cacheRead: usage?.cache_read_input_tokens ?? 0,
    cacheWrite: usage?.cache_creation_input_tokens ?? 0,
  };
}

/**
 * Traduz a falha da API para algo que o advogado entenda — e, sobretudo,
 * que diga de quem é o problema. Um 400 de esquema é defeito NOSSO, não
 * dos autos, e mostrar o JSON cru da API faz o usuário achar que o PDF
 * está errado. (Aconteceu em 29/10 com enum anulável.)
 */
export function traduzirErroApi(e: unknown): string {
  if (!(e instanceof Anthropic.APIError)) {
    return e instanceof Error ? e.message : "Falha inesperada na análise.";
  }

  const detalhe = String(e.message ?? "");

  if (e instanceof Anthropic.AuthenticationError) {
    return "A chave da API do Claude não foi aceita. Confira ANTHROPIC_API_KEY no ambiente.";
  }
  if (e instanceof Anthropic.PermissionDeniedError) {
    return "A chave da API não tem permissão para este modelo.";
  }
  if (e instanceof Anthropic.RateLimitError) {
    return "A API atingiu o limite de requisições. Espere um minuto e continue a análise.";
  }
  if (e.status === 529 || /overloaded/i.test(detalhe)) {
    return "O modelo está sobrecarregado no momento. Tente de novo em alguns minutos.";
  }
  if (e instanceof Anthropic.BadRequestError) {
    // Defeito de configuração do Sonar, não do arquivo.
    if (/output_config|schema|format/i.test(detalhe)) {
      return `Erro de configuração do Sonar (esquema de saída), não dos autos. Rode "npm run checar-esquemas". Detalhe técnico: ${detalhe.slice(0, 220)}`;
    }
    if (/credit|billing|quota/i.test(detalhe)) {
      return "A conta da API está sem crédito ou fora da cota.";
    }
    return `A API recusou a requisição: ${detalhe.slice(0, 260)}`;
  }
  if (e.status && e.status >= 500) {
    return "A API do Claude falhou momentaneamente. Tente de novo.";
  }
  return detalhe.slice(0, 300) || "Falha inesperada na análise.";
}

/** Junta os blocos de texto da resposta e devolve o JSON já parseado. */
function jsonDaResposta<T>(msg: Anthropic.Message, onde: string): T {
  if (msg.stop_reason === "refusal") {
    throw new Error(
      `O modelo recusou a análise em ${onde}: ${msg.stop_details?.explanation ?? "sem detalhe"}`,
    );
  }
  if (msg.stop_reason === "max_tokens") {
    throw new Error(
      `A resposta em ${onde} foi cortada por limite de tokens — reduza o tamanho do lote.`,
    );
  }
  const texto = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!texto.trim()) {
    throw new Error(`O modelo devolveu resposta vazia em ${onde}.`);
  }
  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new Error(`O modelo devolveu JSON inválido em ${onde}.`);
  }
}

// ============================================================
// PASSADA 0 — TRIAGEM
// ============================================================

export interface PaginaTexto {
  /** 1-based, como o PDF numera. */
  pagina: number;
  texto: string;
}

/**
 * Separa peça de anexo. Num capa a capa integral, a maior parte do arquivo é
 * documento anexado — e mandar isso para o Opus no esforço máximo seria
 * queimar dinheiro. Aqui vai só uma amostra do início de cada página, que é
 * onde o cabeçalho denuncia o que a página é.
 */
export async function triarPaginas(
  paginas: PaginaTexto[],
): Promise<{ triagem: ResultadoTriagem; custo: CustoTokens }> {
  const amostra = paginas
    .map((p) => {
      const t = p.texto.replace(/\s+/g, " ").trim();
      return `[p${p.pagina}] ${t.slice(0, 450)}${t.length > 450 ? " …" : ""}`;
    })
    .join("\n");

  const msg = await cliente().messages.create({
    model: MODELO_TRIAGEM,
    max_tokens: 16000,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: SCHEMA_TRIAGEM },
    },
    system:
      "Você tria páginas de autos judiciais brasileiros. Para cada página, diga o que ela é e o quanto importa para uma análise de busca e constrição de patrimônio do devedor.",
    messages: [
      {
        role: "user",
        content: `Classifique cada página pelo começo do texto dela.

- "peca": petição, decisão, despacho, sentença, acórdão, certidão de cartório, mandado, auto de penhora, resposta de SISBAJUD, RENAJUD, INFOJUD, CNIB ou de ofício, cálculo e planilha de débito, termo de penhora, laudo de avaliação, edital.
- "anexo": contrato, procuração, substabelecimento, documento pessoal, comprovante de residência, nota fiscal, extrato bancário juntado como prova, aviso de recebimento, guia e comprovante de custas, cópia de matrícula juntada, carta.
- "capa": capa, índice, folha de rosto, termo de autuação, etiqueta.
- "ilegivel": página em branco, só carimbo, ou digitalização sem texto aproveitável.

E a relevância para a análise patrimonial: 2 quando a página decide, requer ou documenta uma medida de busca ou constrição, ou quando traz valor do débito; 1 quando dá contexto; 0 quando é descartável.

Devolva uma entrada para CADA página listada, sem pular nenhuma.

${amostra}`,
      },
    ],
  });

  return {
    triagem: jsonDaResposta<ResultadoTriagem>(msg, "triagem"),
    custo: usoDe(MODELO_TRIAGEM, msg.usage),
  };
}

// ============================================================
// PASSADA 1 — EXTRAÇÃO
// ============================================================

export async function extrairLote(args: {
  paginas: PaginaTexto[];
  totalPaginas: number;
  resumoAnterior?: string;
}): Promise<{ extracao: ResultadoExtracao; custo: CustoTokens }> {
  const { paginas, totalPaginas, resumoAnterior } = args;
  if (paginas.length === 0) {
    throw new Error("Lote vazio: não há páginas para extrair.");
  }

  const corpo = paginas
    .map((p) => `===== PÁGINA ${p.pagina} =====\n${p.texto.trim()}`)
    .join("\n\n");

  const stream = cliente().messages.stream({
    model: MODELO_ANALISE,
    max_tokens: 32000,
    output_config: {
      // Esforço MÁXIMO: foi pedido explicitamente e é onde se ganha a
      // diferença entre "listou os atos" e "entendeu a execução".
      effort: "max",
      format: { type: "json_schema", schema: SCHEMA_EXTRACAO },
    },
    system: [
      {
        type: "text",
        text: SISTEMA_ANALISE_AUTOS,
        // Prefixo estável entre todos os lotes: a partir do segundo, este
        // bloco é lido do cache por uma fração do preço.
        cache_control: { type: "ephemeral", ttl: "1h" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `${promptExtracao({
          paginaInicial: paginas[0].pagina,
          paginaFinal: paginas[paginas.length - 1].pagina,
          totalPaginas,
          resumoAnterior,
        })}\n\n${corpo}`,
      },
    ],
  });

  const msg = await stream.finalMessage();
  return {
    extracao: jsonDaResposta<ResultadoExtracao>(msg, "extração"),
    custo: usoDe(MODELO_ANALISE, msg.usage),
  };
}

// ============================================================
// PASSADA 2 — CONSOLIDAÇÃO
// ============================================================

export async function consolidar(args: {
  extracoes: ResultadoExtracao[];
  totalPaginas: number;
  dadosAssertiva?: string;
  hoje: string;
}): Promise<{ ficha: FichaAutos; custo: CustoTokens }> {
  const { extracoes, totalPaginas, dadosAssertiva, hoje } = args;

  const stream = cliente().messages.stream({
    model: MODELO_ANALISE,
    max_tokens: 48000,
    output_config: {
      effort: "max",
      format: { type: "json_schema", schema: SCHEMA_CONSOLIDACAO },
    },
    system: SISTEMA_ANALISE_AUTOS,
    messages: [
      {
        role: "user",
        content: promptConsolidacao({
          totalPaginas,
          totalLotes: extracoes.length,
          dataDeHoje: hoje,
          extracoesJson: JSON.stringify(extracoes),
          dadosAssertiva,
        }),
      },
    ],
  });

  const msg = await stream.finalMessage();
  return {
    ficha: jsonDaResposta<FichaAutos>(msg, "consolidação"),
    custo: usoDe(MODELO_ANALISE, msg.usage),
  };
}

// ============================================================
// PASSADA 3 — REDAÇÃO DA PEÇA
// ============================================================

/**
 * Devolve a peça no MESMO formato que `gerarPeca()` produz para os templates
 * fixos, de propósito: assim ela entra direto em `gerarDocxPeca()` e sai no
 * papel timbrado do escritório sem nenhuma conversão.
 */
export const SCHEMA_PECA = {
  type: "object",
  additionalProperties: false,
  required: ["titulo", "vara", "numeroProcesso", "partes", "secoes"],
  properties: {
    titulo: { type: "string" },
    vara: { type: "string" },
    numeroProcesso: { type: "string" },
    partes: { type: "string" },
    secoes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["paragrafos"],
        properties: {
          titulo: { type: ["string", "null"] },
          paragrafos: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["texto", "tipo"],
              properties: {
                texto: { type: "string" },
                tipo: {
                  type: "string",
                  enum: ["normal", "sigiloso", "item", "citacao"],
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export interface PecaRedigida {
  titulo: string;
  vara: string;
  numeroProcesso: string;
  partes: string;
  secoes: {
    titulo?: string | null;
    paragrafos: {
      texto: string;
      tipo: "normal" | "sigiloso" | "item" | "citacao";
    }[];
  }[];
}

export async function redigirPeca(args: {
  ficha: FichaAutos;
  movimentacaoEscolhida: string;
  bensSelecionados?: string;
  hoje: string;
}): Promise<{ peca: PecaRedigida; custo: CustoTokens }> {
  const { ficha, movimentacaoEscolhida, bensSelecionados, hoje } = args;

  const stream = cliente().messages.stream({
    model: MODELO_ANALISE,
    max_tokens: 32000,
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: SCHEMA_PECA },
    },
    system: SISTEMA_ANALISE_AUTOS,
    messages: [
      {
        role: "user",
        content: promptRedacaoPeca({
          fichaJson: JSON.stringify(ficha),
          movimentacaoEscolhida,
          bensSelecionados,
          dataDeHoje: hoje,
        }),
      },
    ],
  });

  const msg = await stream.finalMessage();
  return {
    peca: jsonDaResposta<PecaRedigida>(msg, "redação da peça"),
    custo: usoDe(MODELO_ANALISE, msg.usage),
  };
}
