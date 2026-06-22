// Geracao de .docx do Word a partir de uma PecaGerada do Sonar.
//
// Layout REPLICA o papel timbrado real do escritorio Battaglia & Pedrosa
// (extraido do MLE - Irmandade x Municipio Aluminio), usando Header/Footer
// nativos do Word com headers DIFERENTES pra primeira pagina vs paginas 2+:
//
//   HEADER PAGINA 1 (.first):
//     Tabela 2 cells SEM borda:
//       Cell esq (~6750 dxa): logo pequeno alinhado a ESQUERDA
//       Cell dir (~3783 dxa): enderecos SP CAPITAL + SOROCABA & REGIAO
//                              em Open Sans 8pt, bold pros titulos
//
//   HEADER PAGINAS 2+ (.default):
//     Logo CENTRALIZADO no topo, sem enderecos.
//
//   FOOTER (.first === .default):
//     URL "www.bpadvogados.com.br" alinhada a DIREITA + linha dourada
//     CURTA por baixo (so abaixo da URL, nao atravessa a pagina) +
//     QR code pequeno no canto extremo direito (tabela 2 cells).
//
//   CORPO (body):
//     1) Enderecamento (vara) em CAIXA ALTA + bold, justificado
//     2) 8 paragrafos em branco ate "Processo Nº ..."
//     3) Numero do processo (bold, esquerda)
//     4) Secoes: titulos bold, paragrafos com indent firstLine 2.5cm
//     5) Cidade + data por extenso, justificado
//     6) ASSINATURAS — tabela 2 cells (REMO esq + PAULO dir) +
//        CAIO centralizado embaixo. Espaco generoso (3 brancos) ACIMA
//        de cada bloco pra rubrica fisica.
//
// Roda no servidor — le PNGs via fs.readFileSync. Se as imagens nao forem
// encontradas (ambiente de teste, build do CI etc.), header/footer caem
// pra versao texto-only em vez de quebrar.

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  LineRuleType,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import {
  normalizarParagrafo,
  type PecaGerada,
  type Secao,
} from "@/lib/pecas-templates";

// ============================================================
// CONSTANTES DE LAYOUT
// ============================================================

// Twips. 1 twip = 1/1440 polegada. 2.54cm ≈ 1440 twips.
const INDENT_PRIMEIRA_LINHA_TWIPS = 1440;

// Margens da pagina (com header/footer ativo):
//   top/bottom: distancia do topo/base da pagina ate o body (deixa
//   espaco pro header/footer respirar embaixo deles)
//   header/footer: distancia do topo/base da pagina ate o header/footer
//   left/right: 2.5cm padrao
const MARGIN_TOP_TWIPS = 2160; // 3.75cm — header tem espaco respiratorio
const MARGIN_BOTTOM_TWIPS = 1440; // 2.5cm
const MARGIN_LEFT_TWIPS = 1440; // 2.5cm
const MARGIN_RIGHT_TWIPS = 1440; // 2.5cm
const MARGIN_HEADER_TWIPS = 720; // 1.25cm do topo ate o header
const MARGIN_FOOTER_TWIPS = 720; // 1.25cm da base ate o footer

// A4 em twips: 21cm × 29.7cm.
const PAGE_WIDTH_TWIPS = 11906;
const PAGE_HEIGHT_TWIPS = 16838;

// Fonte global: 10pt = 20 half-points.
const FONT_FAMILY = "Open Sans";
const FONT_SIZE_HALF_POINTS = 20;
const FONT_SIZE_HEADER_HALF_POINTS = 16; // 8pt nos enderecos (igual ao XML)
const FONT_SIZE_FOOTER_HALF_POINTS = 16; // 8pt no rodape

// Line height 1.5 = 360 (em vinte-avos de ponto, "line" em modo AUTO).
const LINE_SPACING_15 = 360;

// Logo do timbre — proporcao escolhida por fidelidade VISUAL aos screenshots
// que o Caio compartilhou (nao ao XML que tem srcRect crop estranho).
// Ratio 5:1 mantido. Instrucao Caio 2026-06-22 final: DOBRO do tamanho
// anterior (era 300x60). Aplica nos 2 headers (pagina 1 e paginas 2+).
const LOGO_WIDTH = 600;
const LOGO_HEIGHT = 120;

// QR code do rodape — extent 447675 × 447675 EMU = 47 × 47 px @ 96dpi.
const QR_SIZE = 47;

// Cor dourada do escritorio.
const COR_DOURADO = "C9A24A";
const COR_CINZA_RODAPE = "666666";

// ============================================================
// HELPERS DE PARAGRAFO
// ============================================================

function paragrafoVazio(): Paragraph {
  return new Paragraph({ children: [] });
}

// Parser de **bold** in-line. Divide a string em pedacos {text, bold}
// alternados pra serem renderizados como TextRuns.
//
// Ex.: "Vem **REMO HIGASHI**, requerer..."  ->
//        [{text:"Vem ", bold:false},
//         {text:"REMO HIGASHI", bold:true},
//         {text:", requerer...", bold:false}]
type RunSpec = { text: string; bold: boolean };

function parseBoldRuns(texto: string): RunSpec[] {
  const partes = texto.split(/\*\*(.+?)\*\*/g);
  const runs: RunSpec[] = [];
  for (let i = 0; i < partes.length; i++) {
    const txt = partes[i];
    if (txt === "") continue;
    runs.push({ text: txt, bold: i % 2 === 1 });
  }
  return runs;
}

function paragrafoTexto(
  texto: string,
  opts: {
    bold?: boolean;
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    indentFirstLine?: boolean;
    allCapsViaUpper?: boolean;
    color?: string;
    size?: number;
  } = {},
): Paragraph {
  const conteudo = opts.allCapsViaUpper ? texto.toUpperCase() : texto;
  const specs = parseBoldRuns(conteudo);

  // Bold global forca bold em todos os runs; senao, respeita o marcador
  // **...** in-line de cada pedaco.
  const runs = specs.map(
    (s) =>
      new TextRun({
        text: s.text,
        bold: opts.bold ? true : s.bold,
        font: FONT_FAMILY,
        size: opts.size ?? FONT_SIZE_HALF_POINTS,
        color: opts.color,
      }),
  );

  return new Paragraph({
    alignment: opts.alignment,
    indent: opts.indentFirstLine
      ? { firstLine: INDENT_PRIMEIRA_LINHA_TWIPS }
      : undefined,
    spacing: { line: LINE_SPACING_15, lineRule: LineRuleType.AUTO },
    children: runs,
  });
}

// ============================================================
// HEADER + FOOTER NATIVOS DO WORD
// ============================================================

// Le um asset de timbre/qr do public/timbre/ no servidor. Retorna null
// se nao achar — header/footer caem pra fallback texto-only.
function lerAssetTimbre(nome: string): Buffer | null {
  try {
    return readFileSync(path.join(process.cwd(), "public", "timbre", nome));
  } catch {
    return null;
  }
}

// Borda invisivel — pra esconder bordas das tables do header/footer.
const BORDA_INVISIVEL = {
  style: BorderStyle.NONE,
  size: 0,
  color: "FFFFFF",
} as const;

const TODAS_BORDAS_INVISIVEIS = {
  top: BORDA_INVISIVEL,
  bottom: BORDA_INVISIVEL,
  left: BORDA_INVISIVEL,
  right: BORDA_INVISIVEL,
} as const;

// Helper pra criar paragrafo curto do header (font Open Sans, 8pt).
function paragrafoHeader(texto: string, opts: { bold?: boolean } = {}): Paragraph {
  return new Paragraph({
    spacing: { line: 240, lineRule: LineRuleType.AUTO }, // line height 1.0
    children: [
      new TextRun({
        text: texto,
        bold: opts.bold,
        font: FONT_FAMILY,
        size: FONT_SIZE_HEADER_HALF_POINTS,
      }),
    ],
  });
}

// Larguras das cells do header (twips) — extraidas direto do header2.xml
// original do escritorio: gridCol 6750 + 3783 = 10533 dxa total.
const HEADER_CELL_ESQ_TWIPS = 6750;
const HEADER_CELL_DIR_TWIPS = 3783;

// HEADER PAGINA 1 — logo a esquerda + 2 enderecos a direita, sem bordas
// visiveis. Bate com header2.xml do papel timbrado original do BP.
function buildHeaderFirstPage(): Header {
  const timbreData = lerAssetTimbre("timbre-bp-completo.png");

  // Coluna esquerda: imagem do logo (ou placeholder texto se faltar).
  const cellEsquerda = new TableCell({
    width: { size: HEADER_CELL_ESQ_TWIPS, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: TODAS_BORDAS_INVISIVEIS,
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 240, lineRule: LineRuleType.AUTO },
        children: timbreData
          ? [
              new ImageRun({
                type: "png",
                data: timbreData,
                transformation: { width: LOGO_WIDTH, height: LOGO_HEIGHT },
              }),
            ]
          : [
              new TextRun({
                text: "BATTAGLIA & PEDROSA",
                bold: true,
                font: FONT_FAMILY,
                size: FONT_SIZE_HEADER_HALF_POINTS,
              }),
            ],
      }),
    ],
  });

  // Coluna direita: 2 blocos de endereco empilhados.
  const cellDireita = new TableCell({
    width: { size: HEADER_CELL_DIR_TWIPS, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: TODAS_BORDAS_INVISIVEIS,
    children: [
      paragrafoHeader("SÃO PAULO CAPITAL", { bold: true }),
      paragrafoHeader("Rua Funchal, 573 - 5º andar"),
      paragrafoHeader("Vila Olímpia - São Paulo."),
      paragrafoHeader(""),
      paragrafoHeader("SOROCABA & REGIÃO", { bold: true }),
      paragrafoHeader("Av. Gisele Constantino 1.850 - CJ. 1216"),
      paragrafoHeader("Pq. Bela Vista - Votorantim."),
    ],
  });

  const table = new Table({
    width: {
      size: HEADER_CELL_ESQ_TWIPS + HEADER_CELL_DIR_TWIPS,
      type: WidthType.DXA,
    },
    columnWidths: [HEADER_CELL_ESQ_TWIPS, HEADER_CELL_DIR_TWIPS],
    borders: {
      top: BORDA_INVISIVEL,
      bottom: BORDA_INVISIVEL,
      left: BORDA_INVISIVEL,
      right: BORDA_INVISIVEL,
      insideHorizontal: BORDA_INVISIVEL,
      insideVertical: BORDA_INVISIVEL,
    },
    rows: [
      new TableRow({
        children: [cellEsquerda, cellDireita],
      }),
    ],
  });

  return new Header({ children: [table] });
}

// HEADER PAGINAS 2+ — so o timbre ALINHADO A DIREITA, sem enderecos.
// Instrucao Caio 2026-06-22 final: "header 2 nao e centralizado, e a direita"
// (bate com header1.xml original que usa positionH=margin align=right).
function buildHeaderOtherPages(): Header {
  const timbreData = lerAssetTimbre("timbre-bp-completo.png");

  const paragrafo = new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { line: 240, lineRule: LineRuleType.AUTO },
    children: timbreData
      ? [
          new ImageRun({
            type: "png",
            data: timbreData,
            transformation: { width: LOGO_WIDTH, height: LOGO_HEIGHT },
          }),
        ]
      : [],
  });

  return new Header({ children: [paragrafo] });
}

// FOOTER — URL alinhada a DIREITA com linha dourada CURTA logo abaixo
// (so do meio ate a URL) + QR pequeno no canto extremo direito.
// IDENTICO em todas as paginas (footers.first === footers.default).
//
// Layout (fiel ao screenshot 2 do Caio):
//
//                                               www.bpadvogados.com.br [QR]
//                                               ──────────────────────
//
// Implementacao: tabela 2 cells SEM borda.
//   - Cell larga (esquerda, ~9000 twips): URL alinhada a DIREITA com
//     border-BOTTOM dourada (linha so cobre essa cell, nao a inteira).
//   - Cell pequena (direita, ~600 twips): QR alinhado center.
//
// A linha dourada aparece imediatamente abaixo da URL porque o
// "border-bottom" da cell vai na BASE da cell — e o paragrafo da URL
// fica na parte de baixo (verticalAlign BOTTOM).
function buildFooter(): Footer {
  const qrData = lerAssetTimbre("qr-bp.png");

  // Larguras: util = 9026 twips. Cell URL = ~94%, cell QR = ~6%.
  const W_URL = 8426;
  const W_QR = 600;

  // Cell esquerda (a maior): URL alinhada RIGHT, border-bottom dourada CURTA
  // (so cobre essa cell — nao atravessa a pagina inteira).
  const cellUrl = new TableCell({
    width: { size: W_URL, type: WidthType.DXA },
    verticalAlign: VerticalAlign.BOTTOM,
    borders: {
      top: BORDA_INVISIVEL,
      left: BORDA_INVISIVEL,
      right: BORDA_INVISIVEL,
      bottom: {
        style: BorderStyle.SINGLE,
        size: 6, // 0.75pt
        color: COR_DOURADO,
      },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { line: 240, lineRule: LineRuleType.AUTO },
        children: [
          new TextRun({
            text: "www.bpadvogados.com.br",
            bold: true,
            font: FONT_FAMILY,
            size: FONT_SIZE_FOOTER_HALF_POINTS,
            color: COR_CINZA_RODAPE,
          }),
        ],
      }),
    ],
  });

  // Cell pequena (direita): QR centralizado, sem borda inferior (so a cell
  // da URL leva a linha dourada — assim a linha "termina" antes do QR,
  // como no screenshot).
  const cellQr = new TableCell({
    width: { size: W_QR, type: WidthType.DXA },
    verticalAlign: VerticalAlign.BOTTOM,
    borders: TODAS_BORDAS_INVISIVEIS,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: 240, lineRule: LineRuleType.AUTO },
        children: qrData
          ? [
              new ImageRun({
                type: "png",
                data: qrData,
                transformation: { width: QR_SIZE, height: QR_SIZE },
              }),
            ]
          : [],
      }),
    ],
  });

  const table = new Table({
    width: {
      size: W_URL + W_QR,
      type: WidthType.DXA,
    },
    columnWidths: [W_URL, W_QR],
    borders: {
      top: BORDA_INVISIVEL,
      bottom: BORDA_INVISIVEL,
      left: BORDA_INVISIVEL,
      right: BORDA_INVISIVEL,
      insideHorizontal: BORDA_INVISIVEL,
      insideVertical: BORDA_INVISIVEL,
    },
    rows: [
      new TableRow({
        children: [cellUrl, cellQr],
      }),
    ],
  });

  return new Footer({ children: [table] });
}

// ============================================================
// SECOES — converte secao.titulo + paragrafos em Paragraph[]
// ============================================================

// Twips pro recuo de bloco da citacao in verbis (2.5cm).
const INDENT_CITACAO_TWIPS = 1440;
// Twips pro indent moderado de itens de lista (~2cm).
const INDENT_ITEM_TWIPS = 1133;
// Fonte da citacao: 9pt = 18 half-points.
const FONT_SIZE_CITACAO_HALF_POINTS = 18;
// Vermelho do *PEDIDO SIGILOSO*.
const COR_SIGILOSO = "C00000";

function paragrafosDaSecao(secao: Secao): Paragraph[] {
  // INSTRUCAO EXPLICITA Caio 2026-06-22 final:
  //   "deixa tudo junto com espacamento de 1,5"
  // Logo, ZERO paragrafos em branco aqui — nem antes/depois do titulo,
  // nem antes/depois de items, nem no fim da secao. O lineHeight 1.5
  // (LINE_SPACING_15) ja da o respiro visual entre paragrafos consecutivos.
  const out: Paragraph[] = [];

  if (secao.titulo) {
    out.push(
      paragrafoTexto(secao.titulo, {
        bold: true,
        alignment: AlignmentType.LEFT,
      }),
    );
  }

  secao.paragrafos.forEach((entry) => {
    const par = normalizarParagrafo(entry);
    const tipo = par.tipo ?? "normal";
    const specs = parseBoldRuns(par.texto);

    if (tipo === "sigiloso") {
      // *PEDIDO SIGILOSO*: caixa alta bold vermelho, esquerda, sem indent.
      out.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: LINE_SPACING_15, lineRule: LineRuleType.AUTO },
          children: [
            new TextRun({
              text: par.texto.toUpperCase(),
              bold: true,
              font: FONT_FAMILY,
              size: FONT_SIZE_HALF_POINTS,
              color: COR_SIGILOSO,
            }),
          ],
        }),
      );
    } else if (tipo === "item") {
      // Item de lista — indent moderado, esquerda. Sem blanks entre items
      // (instrucao Caio: tudo junto com line-height 1.5).
      out.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { firstLine: INDENT_ITEM_TWIPS },
          spacing: { line: LINE_SPACING_15, lineRule: LineRuleType.AUTO },
          children: specs.map(
            (s) =>
              new TextRun({
                text: s.text,
                bold: s.bold,
                font: FONT_FAMILY,
                size: FONT_SIZE_HALF_POINTS,
              }),
          ),
        }),
      );
    } else if (tipo === "citacao") {
      // Trecho de lei in verbis: bloco recuado 2.5cm (left), justificado, 9pt.
      out.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: INDENT_CITACAO_TWIPS },
          spacing: { line: LINE_SPACING_15, lineRule: LineRuleType.AUTO },
          children: specs.map(
            (s) =>
              new TextRun({
                text: s.text,
                bold: s.bold,
                font: FONT_FAMILY,
                size: FONT_SIZE_CITACAO_HALF_POINTS,
              }),
          ),
        }),
      );
    } else {
      // tipo === 'normal' — paragrafo padrao do corpo.
      out.push(
        paragrafoTexto(par.texto, {
          alignment: AlignmentType.JUSTIFIED,
          indentFirstLine: true,
        }),
      );
    }
  });

  return out;
}

// ============================================================
// ASSINATURAS — layout 2 colunas + 1 centralizado embaixo
// ============================================================
//
// Estrutura:
//
//   [3 paragrafos em branco — espaco pra rubrica fisica]
//
//   REMO HIGASHI BATTAGLIA        PAULO ANDRE M. PEDROSA
//   OAB/SP 157.500                OAB/SP nº 286.704
//
//   [3 paragrafos em branco]
//
//           CAIO MEIRELES VICENTINO
//           OAB/SP 466.468
//
// Implementacao: tabela 1 row × 2 cells SEM bordas pros 2 socios senior
// (cada cell centraliza seu conteudo), + paragrafos centralizados pro Caio.

type Socio = { nome: string; oab: string };

const SOCIO_REMO: Socio = {
  nome: "REMO HIGASHI BATTAGLIA",
  oab: "OAB/SP 157.500",
};
const SOCIO_PAULO: Socio = {
  nome: "PAULO ANDRE M. PEDROSA",
  oab: "OAB/SP nº 286.704",
};
const SOCIO_CAIO: Socio = {
  nome: "CAIO MEIRELES VICENTINO",
  oab: "OAB/SP 466.468",
};

// Largura util do body: 11906 - 1440*2 = 9026 twips. Meio: 4513 cada.
const ASSINATURA_CELL_WIDTH_TWIPS = 4513;

function cellAssinatura(socio: Socio): TableCell {
  return new TableCell({
    width: { size: ASSINATURA_CELL_WIDTH_TWIPS, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    borders: TODAS_BORDAS_INVISIVEIS,
    children: [
      paragrafoTexto(socio.nome, {
        bold: true,
        alignment: AlignmentType.CENTER,
      }),
      paragrafoTexto(socio.oab, {
        alignment: AlignmentType.CENTER,
      }),
    ],
  });
}

function paragrafosDeAssinaturas(): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];

  // 3 brancos ACIMA da linha REMO+PAULO — espaco pra rubrica fisica.
  out.push(paragrafoVazio(), paragrafoVazio(), paragrafoVazio());

  // Tabela 1 row × 2 cells: REMO esq + PAULO dir.
  out.push(
    new Table({
      width: {
        size: ASSINATURA_CELL_WIDTH_TWIPS * 2,
        type: WidthType.DXA,
      },
      columnWidths: [
        ASSINATURA_CELL_WIDTH_TWIPS,
        ASSINATURA_CELL_WIDTH_TWIPS,
      ],
      borders: {
        top: BORDA_INVISIVEL,
        bottom: BORDA_INVISIVEL,
        left: BORDA_INVISIVEL,
        right: BORDA_INVISIVEL,
        insideHorizontal: BORDA_INVISIVEL,
        insideVertical: BORDA_INVISIVEL,
      },
      rows: [
        new TableRow({
          children: [cellAssinatura(SOCIO_REMO), cellAssinatura(SOCIO_PAULO)],
        }),
      ],
    }),
  );

  // 3 brancos ACIMA do Caio — outro espaco pra rubrica fisica.
  out.push(paragrafoVazio(), paragrafoVazio(), paragrafoVazio());

  // Caio centralizado embaixo.
  out.push(
    paragrafoTexto(SOCIO_CAIO.nome, {
      bold: true,
      alignment: AlignmentType.CENTER,
    }),
  );
  out.push(
    paragrafoTexto(SOCIO_CAIO.oab, {
      alignment: AlignmentType.CENTER,
    }),
  );

  return out;
}

// ============================================================
// API PUBLICA
// ============================================================

export async function gerarDocxPeca(input: {
  peca: PecaGerada;
  dataExtenso: string;
  cidade: string;
}): Promise<Buffer> {
  const { peca, dataExtenso, cidade } = input;

  // children do body — aceita Paragraph OU Table (assinaturas vem como tabela).
  const children: (Paragraph | Table)[] = [];

  // (0) 1 paragrafo em branco entre timbre (header) e enderecamento
  //     (instrucao Caio 2026-06-22 final: "1 paragrafo entre timbre
  //     e endercamento").
  children.push(paragrafoVazio());

  // (1) Enderecamento (vara) — CAIXA ALTA + bold, justificado
  //     (timbre e URL agora vivem no Header/Footer nativos do Word —
  //     repetem em toda pagina, nao mais inline no body).
  children.push(
    paragrafoTexto(peca.vara, {
      bold: true,
      alignment: AlignmentType.JUSTIFIED,
      allCapsViaUpper: true,
    }),
  );

  // (2) 7 paragrafos em branco antes do numero do processo
  //     (instrucao Caio 2026-06-22 final: 7 paragrafos — esta e a UNICA
  //     excecao "blanks explicitos" no corpo do enderecamento ao processo).
  for (let i = 0; i < 7; i++) children.push(paragrafoVazio());

  // (3) Processo Nº — bold, alinhado a esquerda
  children.push(
    paragrafoTexto(`Processo Nº ${peca.numeroProcesso}`, {
      bold: true,
      alignment: AlignmentType.LEFT,
    }),
  );

  // (4) Corpo — secoes. SEM blank entre secoes (instrucao Caio 2026-06-22
  //     final: "deixa tudo junto com espacamento de 1,5"). Apenas o
  //     lineHeight 1.5 separa visualmente.
  peca.secoes.forEach((secao) => {
    children.push(...paragrafosDaSecao(secao));
  });

  // (5) Cidade + data por extenso — JUSTIFICADO, logo apos a ultima secao,
  //     sem blank antes (continua o fluxo continuo).
  children.push(
    paragrafoTexto(`${cidade}, ${dataExtenso}.`, {
      alignment: AlignmentType.JUSTIFIED,
    }),
  );

  // (7) Assinaturas — tabela 2 colunas (REMO + PAULO) + Caio centralizado
  //     embaixo. paragrafosDeAssinaturas() ja inclui os brancos pra rubrica.
  children.push(...paragrafosDeAssinaturas());

  // Monta o Document
  const doc = new Document({
    creator: "Sonar — Localizador de Bens",
    title: peca.titulo,
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: FONT_SIZE_HALF_POINTS,
          },
          paragraph: {
            spacing: { line: LINE_SPACING_15, lineRule: LineRuleType.AUTO },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: PAGE_WIDTH_TWIPS,
              height: PAGE_HEIGHT_TWIPS,
            },
            margin: {
              top: MARGIN_TOP_TWIPS,
              right: MARGIN_RIGHT_TWIPS,
              bottom: MARGIN_BOTTOM_TWIPS,
              left: MARGIN_LEFT_TWIPS,
              header: MARGIN_HEADER_TWIPS,
              footer: MARGIN_FOOTER_TWIPS,
            },
          },
          // titlePage habilita header/footer .first separados do .default —
          // assim a pagina 1 leva timbre pequeno + enderecos a direita, e as
          // paginas 2+ levam so o timbre CENTRALIZADO (igual ao papel
          // timbrado real do escritorio).
          titlePage: true,
        },
        headers: {
          first: buildHeaderFirstPage(),
          default: buildHeaderOtherPages(),
        },
        footers: {
          first: buildFooter(),
          default: buildFooter(),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
