// Templates de pecas jurídicas geradas pelo Sonar.
// Cada template recebe dossie + caso + opcoes (Set<string>) e devolve {título, secoes}.
//
// REDESENHO 2026-06-22 (instrucao Caio): os docx do escritório sao referencia
// de TIMBRE/FORMATO/ESTILO. O CONTEUDO de cada peca agora e DINAMICO, montado
// a partir dos bens reais que o Sonar encontrou no dossie do devedor. Cada
// peca de PENHORA itera sobre os bens daquele tipo (imóvel/veículo/empresa/
// processo) e descreve cada um com os dados especificos (matrícula, placa,
// CNPJ, area, etc.). Onde a fonte e Cat A (ARISP/SICAR/ONR/Junta), cita-se
// "(documento ora juntado, Doc. NN)"; onde e Cat B (BigDataCorp, Assertiva,
// minhareceita, DataJud), pede-se ofício ao órgão competente.
//
// Os 2 templates "modelares" (penhora-faturamento, bloqueio-sisbajud) ficam
// intactos — refletem pecas reais do escritório (MARIA PANEBIANCHI + FACEBOOK).
//
// Encerramento padrao em TODAS as pecas inclui intimações em nome de
// REMO HIGASHI BATTAGLIA, OAB/SP 157.500 + "Termos em que, P. Deferimento".
// Local + data sao renderizados pela page.tsx, NAO incluir nas secoes.

import type { Bem, CasoResumo, Dossie } from "./casos";
import type { TipoBem } from "./mock-fixtures";
import { formatBRL, formatData } from "./format";

// ============================================================
// TIPOS
// ============================================================

export type TemplateCategoria = "penhora" | "bloqueio";

export type TemplateId =
  | "penhora-imovel"
  | "penhora-veiculo"
  | "penhora-cotas"
  | "penhora-rosto-autos"
  | "penhora-faturamento"
  | "bloqueio-sisbajud"
  | "penhora-consolidada";

// Tipos estruturados de paragrafo — controla como o renderer (HTML e docx)
// formata cada paragrafo do corpo de uma secao.
//
//   - normal  : corpo padrao (textIndent 2.5cm, justificado)
//   - sigiloso: marca "*PEDIDO SIGILOSO*" — caixa alta, bold, vermelho, sem indent
//   - item    : item de lista numerada (ex. "1- SISBAJUD: negativo") — indent menor
//   - citacao : trecho de lei in verbis — bloco recuado 2.5cm, justificado, 9pt
export type TipoParagrafo = "normal" | "sigiloso" | "item" | "citacao";

export interface ParagrafoPeca {
  texto: string;
  tipo?: TipoParagrafo; // default: 'normal'
}

// Compat: paragrafos podem ser string (= normal) ou ParagrafoPeca.
export type ParagrafoEntry = string | ParagrafoPeca;

export type Secao = {
  titulo?: string;
  paragrafos: ParagrafoEntry[];
};

// Normaliza um ParagrafoEntry em ParagrafoPeca com tipo definido.
export function normalizarParagrafo(p: ParagrafoEntry): ParagrafoPeca {
  if (typeof p === "string") return { texto: p, tipo: "normal" };
  return { tipo: "normal", ...p };
}

export type PecaGerada = {
  templateId: TemplateId;
  titulo: string;
  vara: string;
  numeroProcesso: string;
  partes: string;
  secoes: Secao[];
  // Lista de anexos sugeridos pra UI renderizar checklist
  // "Anexar antes de protocolar". A peca em si NAO renderiza mais
  // uma lista "Anexos" no final do documento (Caio removeu 2026-06-22).
  anexos_sugeridos?: { titulo: string; fonte: string }[];
};

export type OpcaoTemplate = {
  /** id curto (entra no Set<string> de opcoes e na query string CSV). */
  id: string;
  /** label que aparece no checkbox do modal. */
  label: string;
  /** valor default quando o modal abre. */
  default: boolean;
  /** dica curta sobre o efeito da opcao. */
  hint?: string;
};

export type TemplateMeta = {
  id: TemplateId;
  categoria: TemplateCategoria;
  nome: string;
  descricao: string;
  emoji: string;
  opcoes: OpcaoTemplate[];
};

// ============================================================
// CATALOGO DE TEMPLATES
// ============================================================

export const TEMPLATES: ReadonlyArray<TemplateMeta> = [
  {
    id: "penhora-imovel",
    categoria: "penhora",
    nome: "Penhora de Imóvel",
    descricao:
      "Requer penhora dos imóveis localizados pelo Sonar (urbanos via ARISP/eDossie e rurais via SICAR). Cita matrícula, área e localização de cada bem, e pede averbação na matrícula.",
    emoji: "🏠",
    opcoes: [
      { id: "gratuidade", label: "Gratuidade judicial", default: false },
      {
        id: "pedir-averbacao",
        label: "Pedir averbação na matrícula",
        default: true,
      },
      {
        id: "avaliacao-perito",
        label: "Solicitar avaliação por perito do juízo",
        default: false,
      },
    ],
  },
  {
    id: "penhora-veiculo",
    categoria: "penhora",
    nome: "Penhora de Veículo (RENAJUD)",
    descricao:
      "Requer expedição de ofício ao DETRAN via Sistema RENAJUD para confirmação e bloqueio dos veículos identificados pelo Sonar em nome do executado.",
    emoji: "🚗",
    opcoes: [
      { id: "gratuidade", label: "Gratuidade judicial", default: false },
      {
        id: "incluir-restricoes",
        label: "Mencionar restrições existentes (alienação etc)",
        default: true,
      },
      {
        id: "pedir-busca-apreensao",
        label: "Requerer busca e apreensão subsidiária",
        default: false,
      },
    ],
  },
  {
    id: "penhora-cotas",
    categoria: "penhora",
    nome: "Penhora de Cotas Sociais",
    descricao:
      "Requer penhora das cotas societárias do executado em sociedade(s) identificada(s) pelo Sonar, com pedido de averbação no contrato social.",
    emoji: "🏛️",
    opcoes: [
      { id: "gratuidade", label: "Gratuidade judicial", default: false },
      {
        id: "pedir-certidao-junta",
        label: "Pedir ofício à Junta pra certidão",
        default: true,
      },
      {
        id: "pedir-averbacao-contrato",
        label: "Pedir averbação no contrato social",
        default: true,
      },
    ],
  },
  {
    id: "penhora-rosto-autos",
    categoria: "penhora",
    nome: "Penhora no Rosto dos Autos (CPC 860)",
    descricao:
      "Requer penhora no rosto dos autos dos processos em que o executado figura como exequente/autor, com ofício ao juízo da causa pra retenção dos valores.",
    emoji: "📂",
    opcoes: [
      { id: "gratuidade", label: "Gratuidade judicial", default: false },
      {
        id: "incluir-art-860",
        label: "Citar art. 860 do CPC in verbis",
        default: true,
      },
    ],
  },
  {
    id: "penhora-faturamento",
    categoria: "penhora",
    nome: "Penhora de Faturamento (art. 866 CPC)",
    descricao:
      "Após esgotadas as diligências ordinárias (SISBAJUD, INFOJUD, RENAJUD, ARISP negativos), requer-se medida atípica de penhora sobre faturamento da empresa do executado.",
    emoji: "🏭",
    opcoes: [
      { id: "sigiloso", label: "Pedido sigiloso", default: true },
      {
        id: "gratuidade",
        label: "Beneficiária de gratuidade judicial",
        default: false,
      },
      {
        id: "incluir-art866",
        label: "Citar art. 866 do CPC in verbis",
        default: true,
      },
      {
        id: "incluir-rede-social",
        label: "Mencionar redes sociais como prova de atividade",
        default: false,
      },
    ],
  },
  {
    id: "bloqueio-sisbajud",
    categoria: "bloqueio",
    nome: "Bloqueio SISBAJUD (pós-decurso CPC 523)",
    descricao:
      "Após o decurso do prazo de pagamento estabelecido pela decisão, requer-se bloqueio SISBAJUD com acréscimo de multa e honorários (CPC 523) sobre o valor atualizado.",
    emoji: "🏦",
    opcoes: [
      {
        id: "gratuidade",
        label: "Beneficiária de gratuidade judicial",
        default: false,
      },
      {
        id: "multa-cpc-523",
        label: "Acréscimo multa 10% + honorários 10% (CPC 523)",
        default: true,
      },
      {
        id: "incluir-planilha",
        label: "Anexar planilha de cálculos atualizada",
        default: true,
      },
      {
        id: "modalidade-reiterada",
        label: "SISBAJUD modalidade REITERADA",
        default: false,
      },
    ],
  },
  {
    id: "penhora-consolidada",
    categoria: "penhora",
    nome: "Penhora Consolidada",
    descricao:
      "Petição única reunindo TODOS os bens encontrados (imóveis + veículos + cotas + processos) em um só requerimento, com pedidos a/b/c/d enumerados no final.",
    emoji: "⚖",
    opcoes: [
      { id: "gratuidade", label: "Gratuidade judicial", default: false },
      { id: "sigiloso", label: "Pedido sigiloso", default: false },
      { id: "incluir-imoveis", label: "Incluir imóveis encontrados", default: true },
      { id: "incluir-veiculos", label: "Incluir veículos encontrados", default: true },
      { id: "incluir-cotas", label: "Incluir cotas societárias", default: true },
      { id: "incluir-rosto-autos", label: "Incluir penhora no rosto dos autos", default: true },
      { id: "pedir-averbacao", label: "Pedir averbação na matrícula (imóveis)", default: true },
      { id: "pedir-renajud", label: "Pedir ofício RENAJUD (veículos)", default: true },
      { id: "pedir-certidao-junta", label: "Pedir certidão Junta (cotas)", default: true },
      { id: "incluir-bloqueio-sisbajud", label: "Pedido subsidiário SISBAJUD", default: false },
      { id: "mencionar-ma-fe", label: "Mencionar má-fé do executado", default: false },
      { id: "multa-cpc-523", label: "Multa + honorários CPC 523 (10%+10%)", default: false },
    ],
  },
];

// ============================================================
// CLASSIFICAÇÃO DOS BENS (fonte -> tem prova anexa?)
// ============================================================

// Fontes Cat A (geram doc oficial): ARISP, SICAR, ONR, Junta.
// Fontes Cat B (so lead): BigDataCorp, Assertiva, DataJud, minhareceita.
function temProvaAnexa(bem: Bem): boolean {
  const fonte = (bem.fonte ?? "").toLowerCase();
  return ["arisp", "sicar", "onr", "junta"].some((f) => fonte.includes(f));
}

// Pra bens da Cat B, qual órgão oficiar pra obter prova.
function oficioParaBem(bem: Bem): string {
  if (bem.tipo === "veiculo") return "DETRAN via Sistema RENAJUD";
  if (bem.tipo === "imovel") return "Cartório de Registro de Imóveis competente";
  if (bem.tipo === "empresa") return "Junta Comercial competente";
  if (bem.tipo === "processo_credito") return "juízo da causa";
  return "órgão competente";
}

// Filtra os bens do dossie pelo tipo solicitado. Se `bensSelecionados` vier
// preenchido (CSV de ids vindos da URL), restringe ainda mais — so os ids
// que o usuario marcou na UI entram na peca.
function bensRelevantes(
  dossie: Dossie,
  tipo: TipoBem,
  bensSelecionados?: number[],
): Bem[] {
  let candidatos = dossie.bens.filter((b) => b.tipo === tipo);
  if (bensSelecionados && bensSelecionados.length > 0) {
    candidatos = candidatos.filter((b) => bensSelecionados.includes(b.id));
  }
  return candidatos;
}

// ============================================================
// HELPERS DE DESCRICAO JURIDICA POR TIPO DE BEM
// ============================================================

function detalheStr(bem: Bem, chave: string): string | null {
  const v = (bem.detalhes as Record<string, unknown>)[chave];
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function detalheNum(bem: Bem, chave: string): number | null {
  const v = (bem.detalhes as Record<string, unknown>)[chave];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function detalheArr(bem: Bem, chave: string): string[] {
  const v = (bem.detalhes as Record<string, unknown>)[chave];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.length > 0);
}

// Descreve um imóvel em prosa jurídica. Ex.:
// "imóvel rural denominado Fazenda Boa Vista, com área de 8 hectares,
//  localizado em Itaberai/GO, matrícula nº 12.345 perante o CRI Itaberai"
function descricaoJuridicaImovel(bem: Bem): string {
  const tipo = detalheStr(bem, "tipo"); // 'rural' | 'urbano'
  const cidade = detalheStr(bem, "cidade");
  const uf = detalheStr(bem, "uf");
  const areaHa = detalheNum(bem, "area_hectares");
  const areaM2 = detalheNum(bem, "area_m2");
  const matricula = detalheStr(bem, "matricula");
  const logradouro = detalheStr(bem, "logradouro");

  // Denominação a partir do título, removendo a parte de area pra não duplicar.
  const denominacao = bem.titulo.replace(/\s*[—\-–]\s*\d.*$/, "").trim();

  const partes: string[] = [];

  if (tipo === "rural") {
    partes.push(`o imóvel rural denominado **${denominacao}**`);
    if (areaHa !== null) partes.push(`com área de ${areaHa} hectares`);
  } else if (tipo === "urbano") {
    partes.push(`o imóvel urbano denominado **${denominacao}**`);
    if (areaM2 !== null) partes.push(`com área de ${areaM2} m²`);
    if (logradouro) partes.push(`situado à ${logradouro}`);
  } else {
    partes.push(`o imóvel denominado **${denominacao}**`);
    if (areaHa !== null) partes.push(`com área de ${areaHa} hectares`);
    else if (areaM2 !== null) partes.push(`com área de ${areaM2} m²`);
    if (logradouro) partes.push(`situado à ${logradouro}`);
  }

  if (cidade && uf) {
    partes.push(`localizado em ${cidade}/${uf.toUpperCase()}`);
  } else if (cidade) {
    partes.push(`localizado em ${cidade}`);
  }

  if (matricula) {
    partes.push(`matrícula nº **${matricula}**`);
  } else {
    partes.push(`com matrícula a ser confirmada perante o cartório competente`);
  }

  return partes.join(", ");
}

// Descreve um veículo em prosa jurídica. Ex.:
// "Honda Civic EXL, ano/modelo 2019, cor Prata, placa **ABC1D23**, Renavam 01234567890"
function descricaoJuridicaVeiculo(bem: Bem): string {
  const marca = detalheStr(bem, "marca");
  const modelo = detalheStr(bem, "modelo");
  const ano = detalheNum(bem, "ano_modelo");
  const cor = detalheStr(bem, "cor");
  const placa = detalheStr(bem, "placa");
  const renavam = detalheStr(bem, "renavam");

  const partes: string[] = [];
  const nome =
    marca && modelo ? `${marca} ${modelo}` : modelo ?? marca ?? bem.titulo;
  partes.push(`o veículo **${nome}**`);
  if (ano !== null) partes.push(`ano/modelo ${ano}`);
  if (cor) partes.push(`cor ${cor}`);
  if (placa) partes.push(`placa **${placa}**`);
  if (renavam) partes.push(`Renavam ${renavam}`);

  return partes.join(", ");
}

// Descreve uma empresa em prosa jurídica. Ex.:
// "Albuquerque Consultoria LTDA, inscrita no CNPJ nº 33.444.555/0001-66,
//  da qual o executado figura como Sócio-Administrador, titular de 30% do
//  capital social (R$ 100.000,00)"
function descricaoJuridicaEmpresa(bem: Bem): string {
  const razao = detalheStr(bem, "razao_social") ?? bem.titulo;
  const cnpj = detalheStr(bem, "cnpj");
  const percent = detalheNum(bem, "percent_participacao");
  const capital = detalheNum(bem, "capital_social");
  const qual = detalheStr(bem, "qual");
  const situacao = detalheStr(bem, "situacao");

  const partes: string[] = [];
  partes.push(`a sociedade **${razao}**`);
  if (cnpj) partes.push(`inscrita no CNPJ nº **${cnpj}**`);
  if (situacao) partes.push(`situação cadastral ${situacao}`);
  if (qual) partes.push(`da qual o executado figura como **${qual}**`);
  if (percent !== null) {
    const compl = capital !== null
      ? `titular de ${percent}% do capital social, este no valor de ${valorComExtenso(capital)}`
      : `titular de ${percent}% do capital social`;
    partes.push(compl);
  } else if (capital !== null) {
    partes.push(`com capital social de ${valorComExtenso(capital)}`);
  }

  return partes.join(", ");
}

// Descreve um crédito/processo em prosa jurídica. Ex.:
// "processo nº 0123456-12.2024.8.26.0100, em trâmite perante o TJSP,
//  classe Cumprimento de sentença, no qual o executado figura no polo
//  ativo, com crédito estimado de R$ 45.000,00"
function descricaoJuridicaProcessoCredito(bem: Bem): string {
  const cnj = detalheStr(bem, "numero_cnj");
  const tribunal = detalheStr(bem, "tribunal");
  const classe = detalheStr(bem, "classe");
  const polo = detalheStr(bem, "polo");

  const partes: string[] = [];
  if (cnj) partes.push(`o processo nº **${cnj}**`);
  else partes.push(`o processo a que se refere o título`);
  if (tribunal) partes.push(`em trâmite perante o ${tribunal}`);
  if (classe) partes.push(`classe ${classe}`);
  if (polo) partes.push(`no qual o executado figura no polo ${polo}`);
  if (bem.valor_estimado_brl !== null && bem.valor_estimado_brl > 0) {
    partes.push(`com crédito estimado de **${valorComExtenso(bem.valor_estimado_brl)}**`);
  }
  return partes.join(", ");
}

// Helper que devolve texto "(documento ora juntado, Doc. NN)" se Cat A,
// ou "(requer-se a expedição de ofício ao {órgão})" se Cat B.
function complementoProva(bem: Bem, ordemAnexo: number): string {
  if (temProvaAnexa(bem)) {
    const numStr = String(ordemAnexo).padStart(2, "0");
    return `, conforme documento ora juntado (Doc. ${numStr})`;
  }
  return `, sendo necessária a expedição de ofício a${
    bem.tipo === "veiculo" ? "o " : " "
  }${oficioParaBem(bem)} para confirmação oficial`;
}

// ============================================================
// HELPERS LOCAIS — vara dinamica (via caso.juizo), encerramento padrao
// ============================================================

// Mapeamento UF -> nome do estado por extenso (para o cabecalho).
const UF_EXTENSO: Record<string, string> = {
  SP: "SÃO PAULO",
  RJ: "RIO DE JANEIRO",
  MG: "MINAS GERAIS",
};

function ufExtenso(uf: string): string {
  return UF_EXTENSO[uf.toUpperCase()] ?? uf.toUpperCase();
}

// Monta a linha do cabecalho a partir do juízo (vara, comarca, UF, genero).
// Se não tiver juízo no caso, cai num fallback generico.
function varaDoCaso(caso: CasoResumo): string {
  const j = caso.juizo;
  if (!j) return "Comarca de São Paulo/SP";
  const prefixo =
    j.generoJuiz === "F"
      ? "EXCELENTÍSSIMA SENHORA DOUTORA JUÍZA DE DIREITO"
      : "EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO";
  return (
    `${prefixo} DA ${j.vara}ª VARA ${j.classeVara.toUpperCase()} ` +
    `DA COMARCA DE ${j.comarca.toUpperCase()} DO ESTADO DE ${ufExtenso(j.uf)}-${j.uf.toUpperCase()}`
  );
}

// Classe da ação para a frase de abertura. Default conservador quando não
// vier do caso.juizo.
function classeAcaoDoCaso(caso: CasoResumo, fallback: string): string {
  return caso.juizo?.classeAcao ?? fallback;
}

// Bloco de encerramento padrao (3 paragrafos finais).
function encerramentoPadrao(): string[] {
  return [
    `Por fim, requer-se que as intimações ocorram em nome **REMO HIGASHI BATTAGLIA, OAB/SP 157.500**, sob pena de nulidade, nos termos do §2º do art. 272, do CPC.`,
    `Termos em que,`,
    `P. Deferimento.`,
  ];
}

// Cria a "fala" de abertura padrao da peca: "FULANO, já qualificada..."
// O texto principal após o vocativo varia por peca, por isso retorna so
// o credor + devedor formatados.
function aberturaPartes(
  credorNome: string,
  devedorNome: string,
  qualificacaoAcao: string,
): string {
  return (
    `**${credorNome.toUpperCase()}**, já qualificada nos autos do **${qualificacaoAcao}** ` +
    `em epígrafe, que move em face de **${devedorNome.toUpperCase()}**, vem, respeitosamente, ` +
    `perante V.Exa., aduzir e requerer o quanto segue em termos de prosseguimento.`
  );
}

// ============================================================
// VALOR POR EXTENSO — helper simples (suporta ate centenas de milhar)
// Pra montantes maiores ou frações complexas, retorna placeholder em
// branco e o gerador omite o trecho "(... reais e ... centavos)".
// ============================================================

const UNIDADES = [
  "",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];
const DEZENAS = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
];
const CENTENAS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

function abaixoMil(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (c > 0) partes.push(CENTENAS[c]);
  if (resto > 0) {
    if (resto < 20) {
      partes.push(UNIDADES[resto]);
    } else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      const txt = DEZENAS[d] + (u > 0 ? ` e ${UNIDADES[u]}` : "");
      partes.push(txt);
    }
  }
  return partes.join(" e ");
}

function numeroPorExtenso(n: number): string | null {
  if (n < 0 || n >= 1_000_000) return null;
  if (n === 0) return "zero";
  if (n < 1000) return abaixoMil(n);
  const milhares = Math.floor(n / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (milhares === 1) partes.push("mil");
  else partes.push(`${abaixoMil(milhares)} mil`);
  if (resto > 0) partes.push(abaixoMil(resto));
  return partes.join(" e ");
}

function valorPorExtenso(valor: number): string | null {
  if (!Number.isFinite(valor) || valor < 0) return null;
  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);
  const reaisTxt = numeroPorExtenso(reais);
  if (reaisTxt === null) return null;
  const reaisStr = `${reaisTxt} ${reais === 1 ? "real" : "reais"}`;
  if (centavos === 0) return reaisStr;
  const centavosTxt = numeroPorExtenso(centavos);
  if (centavosTxt === null) return reaisStr;
  return `${reaisStr} e ${centavosTxt} ${centavos === 1 ? "centavo" : "centavos"}`;
}

// Helper publico: formato pra TEXTO de peca — combina R$ X,XX + (extenso).
// Instrucao Caio 2026-06-22: "todo R$ na peca sempre com valor por extenso".
// Se o extenso falhar (numero fora da faixa suportada), devolve so o BRL.
export function valorComExtenso(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
    return "—";
  }
  const brl = formatBRL(valor);
  const ext = valorPorExtenso(valor);
  if (ext === null) return brl;
  return `${brl} (${ext})`;
}

// ============================================================
// GERADOR PRINCIPAL
// ============================================================

export function gerarPeca(
  templateId: TemplateId,
  dossie: Dossie,
  caso: CasoResumo,
  opcoes: Set<string>,
  bensSelecionados?: number[],
): PecaGerada {
  switch (templateId) {
    case "penhora-imovel":
      return gerarPenhoraImovel(dossie, caso, opcoes, bensSelecionados);
    case "penhora-veiculo":
      return gerarPenhoraVeiculo(dossie, caso, opcoes, bensSelecionados);
    case "penhora-cotas":
      return gerarPenhoraCotas(dossie, caso, opcoes, bensSelecionados);
    case "penhora-rosto-autos":
      return gerarPenhoraRostoAutos(dossie, caso, opcoes, bensSelecionados);
    case "penhora-faturamento":
      return gerarPenhoraFaturamento(dossie, caso, opcoes, bensSelecionados);
    case "bloqueio-sisbajud":
      return gerarBloqueioSisbajud(dossie, caso, opcoes);
    case "penhora-consolidada":
      return gerarPenhoraConsolidada(dossie, caso, opcoes, bensSelecionados);
  }
}

// ============================================================
// HELPER — peca de "ausencia de bem" pro edge case onde o template
// foi chamado mas o devedor não tem nenhum bem daquele tipo. A UI ja
// não deve chegar nesse caminho (templatesSugeridos filtra), mas a
// API GET /api/pecas/.../docx aceita qualquer template — entao precisa
// degradar graciosamente.
// ============================================================

function gerarPecaAusenciaBem(opts: {
  templateId: TemplateId;
  titulo: string;
  tipoNomeSingular: string; // ex.: "imóvel"
  dossie: Dossie;
  caso: CasoResumo;
}): PecaGerada {
  const { templateId, titulo, tipoNomeSingular, dossie, caso } = opts;
  const credor = caso.credor.nome;
  const devedor = dossie.devedor.nome;
  const processo = caso.numero_processo ?? "processo a ser informado";

  const secoes: Secao[] = [
    {
      paragrafos: [
        aberturaPartes(
          credor,
          devedor,
          classeAcaoDoCaso(caso, "CUMPRIMENTO DE SENTENÇA"),
        ),
      ],
    },
    {
      titulo: "I) DA AUSÊNCIA DE BEM LOCALIZADO",
      paragrafos: [
        `A diligência realizada pelo sistema interno de busca patrimonial via Inteligência Artificial do presente escritório (SONAR) não identificou, no momento, ${tipoNomeSingular} em nome do executado **${devedor.toUpperCase()}** que viabilize a presente medida.`,
        `Diante disso, **REQUER-SE** a manutenção da diligência patrimonial em curso, com nova consulta agendada, bem como o prosseguimento das demais medidas constritivas cabíveis nos autos.`,
      ],
    },
    { paragrafos: encerramentoPadrao() },
  ];

  return {
    templateId,
    titulo,
    vara: varaDoCaso(caso),
    numeroProcesso: processo,
    partes: `${credor} × ${devedor}`,
    secoes,
    anexos_sugeridos: [],
  };
}

// ------------------------------------------------------------
// 1) PENHORA DE IMÓVEL
// ------------------------------------------------------------
function gerarPenhoraImovel(
  dossie: Dossie,
  caso: CasoResumo,
  opcoes: Set<string>,
  bensSelecionados?: number[],
): PecaGerada {
  const { devedor } = dossie;
  const credor = caso.credor.nome;
  const processo = caso.numero_processo ?? "processo a ser informado";

  const imoveis = bensRelevantes(dossie, "imovel", bensSelecionados);
  if (imoveis.length === 0) {
    return gerarPecaAusenciaBem({
      templateId: "penhora-imovel",
      titulo: "PENHORA DE IMÓVEL",
      tipoNomeSingular: "imóvel",
      dossie,
      caso,
    });
  }

  const usaGratuidade = opcoes.has("gratuidade");
  const pedirAverbacao = opcoes.has("pedir-averbacao");
  const avaliacaoPerito = opcoes.has("avaliacao-perito");

  const secoes: Secao[] = [];
  const anexos: { titulo: string; fonte: string }[] = [];

  // Abertura padrao
  secoes.push({
    paragrafos: [
      aberturaPartes(
        credor,
        devedor.nome,
        classeAcaoDoCaso(caso, "CUMPRIMENTO DE SENTENÇA"),
      ),
    ],
  });

  // I) Busca patrimonial — resultados
  const paragrafosBusca: ParagrafoEntry[] = [
    `A diligência realizada pelo **sistema interno de busca patrimonial via Inteligência Artificial do presente escritório (SONAR)** identificou, no presente momento, ${
      imoveis.length === 1
        ? "**1 (um) imóvel**"
        : `**${imoveis.length} (${numeroPorExtenso(imoveis.length) ?? imoveis.length}) imóveis**`
    } registrado${imoveis.length === 1 ? "" : "s"} em nome do executado **${devedor.nome.toUpperCase()}**, conforme abaixo se discrimina:`,
  ];

  let ordemAnexoImovel = 1;
  imoveis.forEach((bem) => {
    const descricao = descricaoJuridicaImovel(bem);
    const complemento = complementoProva(bem, ordemAnexoImovel);
    paragrafosBusca.push(
      `Verificou-se que o executado é titular d${descricao}${complemento}.`,
    );
    if (temProvaAnexa(bem)) {
      const numStr = String(ordemAnexoImovel).padStart(2, "0");
      anexos.push({
        titulo: `Doc. ${numStr} — ${bem.titulo} (${bem.fonte})`,
        fonte: bem.fonte,
      });
      ordemAnexoImovel += 1;
    }
  });

  secoes.push({
    titulo: "I) DA BUSCA PATRIMONIAL VIA SONAR — RESULTADO",
    paragrafos: paragrafosBusca,
  });

  // II) Fundamento legal
  secoes.push({
    titulo: "II) DO FUNDAMENTO LEGAL",
    paragrafos: [
      `A penhora de bens imóveis encontra fundamento expresso no **art. 835, V, do CPC**, que arrola o imóvel entre os bens primários da ordem legal de preferência da constrição executiva, prestigiando a efetividade do título e o direito do credor à satisfação do crédito.`,
      `Identificado o bem e localizada a matrícula, impõe-se a **averbação da penhora no respectivo registro imobiliário**, em homenagem à publicidade erga omnes e à higidez de eventual aquisição por terceiros, na exata dicção do **art. 844 do CPC**, sem prejuízo da formalização por mandado, nos moldes do **art. 845 do CPC**, e da avaliação a cargo do oficial de justiça ou perito do juízo (**art. 870 e art. 871 do CPC**).`,
      { tipo: "citacao", texto: "Art. 844. Para presunção absoluta de conhecimento por terceiros, cabe ao exequente providenciar a averbação do arresto ou da penhora no registro competente, mediante apresentação de cópia do auto ou do termo, independentemente de mandado judicial." },
      `Por fim, conforme entendimento consolidado pelo **Superior Tribunal de Justiça na Súmula 84** — que admite embargos de terceiro fundados em posse decorrente de compromisso de compra e venda não registrado —, a publicidade conferida pela averbação da penhora é a única salvaguarda apta a evitar disputas posteriores sobre a higidez da constrição, razão pela qual a medida deve ser deferida sem delongas.`,
    ],
  });

  // III) Pedidos
  const pedidos: ParagrafoEntry[] = [
    `Diante do exposto, **REQUER-SE** a Vossa Excelência:`,
  ];
  let letra = "a";
  const next = () => {
    const cur = letra;
    letra = String.fromCharCode(letra.charCodeAt(0) + 1);
    return cur;
  };

  pedidos.push(
    `${next()}. a **penhora** ${imoveis.length === 1 ? "do imóvel acima descrito" : "dos imóveis acima descritos"}, com a respectiva avaliação, intimando-se o executado e seu cônjuge, se casado, nos termos do art. 842 do CPC;`,
  );

  // Se algum imóvel for Cat B (sem prova anexa), pedir ofício aos cartórios.
  const imoveisSemProva = imoveis.filter((b) => !temProvaAnexa(b));
  if (imoveisSemProva.length > 0) {
    const orgaos = Array.from(
      new Set(
        imoveisSemProva.map((b) => {
          const cidade = detalheStr(b, "cidade") ?? "comarca local";
          return `Cartório de Registro de Imóveis de ${cidade}`;
        }),
      ),
    );
    pedidos.push(
      `${next()}. a **expedição de ofício** ${
        orgaos.length === 1
          ? `ao ${orgaos[0]}`
          : `aos seguintes cartórios competentes: ${orgaos.join("; ")}`
      } para que apresentem certidão atualizada da matrícula correspondente, confirmando a titularidade e eventuais ônus existentes;`,
    );
  }

  if (pedirAverbacao) {
    pedidos.push(
      `${next()}. a **expedição de mandado de averbação da penhora** na(s) matrícula(s) do(s) imóvel(eis), nos termos do art. 844 do CPC;`,
    );
  }
  if (avaliacaoPerito) {
    pedidos.push(
      `${next()}. a **nomeação de perito do juízo** para avaliação oficial do(s) bem(ns), nos termos do art. 870 do CPC;`,
    );
  }
  if (usaGratuidade) {
    pedidos.push(
      `${next()}. seja recebida sem recolhimento de custas em razão da concessão dos benefícios da **GRATUIDADE JUDICIAL** já formalizada nos autos.`,
    );
  }
  secoes.push({ titulo: "III) DOS PEDIDOS", paragrafos: pedidos });

  // Encerramento
  secoes.push({ paragrafos: encerramentoPadrao() });

  return {
    templateId: "penhora-imovel",
    titulo: "PENHORA DE IMÓVEL",
    vara: varaDoCaso(caso),
    numeroProcesso: processo,
    partes: `${credor} × ${devedor.nome}`,
    secoes,
    anexos_sugeridos: anexos,
  };
}

// ------------------------------------------------------------
// 2) PENHORA DE VEICULO (RENAJUD)
// ------------------------------------------------------------
function gerarPenhoraVeiculo(
  dossie: Dossie,
  caso: CasoResumo,
  opcoes: Set<string>,
  bensSelecionados?: number[],
): PecaGerada {
  const { devedor } = dossie;
  const credor = caso.credor.nome;
  const processo = caso.numero_processo ?? "processo a ser informado";

  const veiculos = bensRelevantes(dossie, "veiculo", bensSelecionados);
  if (veiculos.length === 0) {
    return gerarPecaAusenciaBem({
      templateId: "penhora-veiculo",
      titulo: "PENHORA DE VEÍCULO — RENAJUD",
      tipoNomeSingular: "veículo",
      dossie,
      caso,
    });
  }

  const usaGratuidade = opcoes.has("gratuidade");
  const incluirRestricoes = opcoes.has("incluir-restricoes");
  const pedirBuscaApreensao = opcoes.has("pedir-busca-apreensao");

  const secoes: Secao[] = [];

  // Abertura
  secoes.push({
    paragrafos: [
      aberturaPartes(
        credor,
        devedor.nome,
        classeAcaoDoCaso(caso, "CUMPRIMENTO DE SENTENÇA"),
      ),
    ],
  });

  // I) Busca patrimonial
  const paragrafosBusca: ParagrafoEntry[] = [
    `A diligência realizada pelo **sistema interno de busca patrimonial via Inteligência Artificial do presente escritório (SONAR)** identificou ${
      veiculos.length === 1
        ? "**1 (um) veículo automotor**"
        : `**${veiculos.length} (${numeroPorExtenso(veiculos.length) ?? veiculos.length}) veículos automotores**`
    } registrado${veiculos.length === 1 ? "" : "s"} em nome do executado **${devedor.nome.toUpperCase()}**, a saber:`,
  ];

  veiculos.forEach((bem) => {
    const descricao = descricaoJuridicaVeiculo(bem);
    const restricoes =detalheArr(bem, "restricoes");
    let restricaoTxt = "";
    if (incluirRestricoes && restricoes.length > 0) {
      restricaoTxt = `, sobre o qual recai a seguinte anotação: **${restricoes.join("; ")}**`;
    } else if (incluirRestricoes) {
      restricaoTxt = `, sem restrições cadastrais anotadas`;
    }
    paragrafosBusca.push(
      `Verificou-se que o executado figura como titular d${descricao}${restricaoTxt}.`,
    );
  });

  secoes.push({
    titulo: "I) DA BUSCA PATRIMONIAL VIA SONAR — RESULTADO",
    paragrafos: paragrafosBusca,
  });

  // II) Fundamento legal
  secoes.push({
    titulo: "II) DO FUNDAMENTO LEGAL",
    paragrafos: [
      `A penhora de veículos automotores encontra fundamento expresso no **art. 835, IV, do CPC**, que arrola os veículos de via terrestre entre os bens preferenciais da ordem legal de constrição patrimonial, viabilizando a satisfação célere do crédito exequendo.`,
      `A efetivação da medida pelo **Sistema RENAJUD**, instituído pela **Resolução CNJ nº 89/2009**, dispensa diligência prévia por oficial de justiça em razão da integração direta entre o Poder Judiciário e a base do DENATRAN, bastando a determinação judicial para imediata anotação da restrição de transferência e circulação, com efeito constitutivo da publicidade da penhora — sem prejuízo da formalização por mandado em outras comarcas (**art. 845, § 1º, do CPC**).`,
      { tipo: "citacao", texto: "Art. 845. § 1º A penhora de imóveis, independentemente de onde se localizem, quando apresentada certidão da respectiva matrícula, e a penhora de veículos automotores, quando apresentada certidão que ateste a sua existência, serão realizadas por termo nos autos." },
      `Eventual alienação fiduciária do bem não constitui óbice à constrição: conforme entendimento pacificado pelo **Superior Tribunal de Justiça (REsp 1.498.737/SP)** e à luz do **art. 1.361 do Código Civil**, a propriedade fiduciária atribuída ao credor fiduciário não impede a penhora dos **direitos do executado-fiduciante** sobre o veículo financiado, os quais são plenamente penhoráveis enquanto direito patrimonial (art. 835, XIII, CPC).`,
    ],
  });

  // III) Pedidos
  const pedidos: ParagrafoEntry[] = [
    `Diante do exposto, **REQUER-SE** a Vossa Excelência:`,
  ];
  let letra = "a";
  const next = () => {
    const cur = letra;
    letra = String.fromCharCode(letra.charCodeAt(0) + 1);
    return cur;
  };

  pedidos.push(
    `${next()}. a **expedição de ofício ao DETRAN, via Sistema RENAJUD**, para confirmação da titularidade ${
      veiculos.length === 1 ? "do veículo acima indicado" : "dos veículos acima indicados"
    } e, em ato contínuo, o **bloqueio de transferência e circulação via RENAJUD** até a integral satisfação do crédito exequendo, nos termos do art. 854 e seguintes do CPC;`,
  );
  pedidos.push(
    `${next()}. a **penhora** ${
      veiculos.length === 1 ? "do veículo" : "dos veículos"
    }, com posterior avaliação e remoção ao depositário judicial, nos termos do art. 840, III, do CPC;`,
  );
  if (pedirBuscaApreensao) {
    pedidos.push(
      `${next()}. subsidiariamente, a **expedição de mandado de busca e apreensão** ${
        veiculos.length === 1 ? "do bem" : "dos bens"
      } para garantia da execução, com indicação dos endereços constantes do dossiê de busca patrimonial;`,
    );
  }
  if (usaGratuidade) {
    pedidos.push(
      `${next()}. seja recebida sem recolhimento de custas em razão da concessão dos benefícios da **GRATUIDADE JUDICIAL** já formalizada nos autos.`,
    );
  }
  secoes.push({ titulo: "III) DOS PEDIDOS", paragrafos: pedidos });

  // Encerramento
  secoes.push({ paragrafos: encerramentoPadrao() });

  return {
    templateId: "penhora-veiculo",
    titulo: "PENHORA DE VEÍCULO — RENAJUD",
    vara: varaDoCaso(caso),
    numeroProcesso: processo,
    partes: `${credor} × ${devedor.nome}`,
    secoes,
    // veículos via BigDataCorp sao Cat B — sem Doc. anexo; ofício RENAJUD
    // faz o papel da prova. Por isso anexos_sugeridos vazio.
    anexos_sugeridos: [],
  };
}

// ------------------------------------------------------------
// 3) PENHORA DE COTAS SOCIAIS
// ------------------------------------------------------------
function gerarPenhoraCotas(
  dossie: Dossie,
  caso: CasoResumo,
  opcoes: Set<string>,
  bensSelecionados?: number[],
): PecaGerada {
  const { devedor } = dossie;
  const credor = caso.credor.nome;
  const processo = caso.numero_processo ?? "processo a ser informado";

  const empresas = bensRelevantes(dossie, "empresa", bensSelecionados);
  if (empresas.length === 0) {
    return gerarPecaAusenciaBem({
      templateId: "penhora-cotas",
      titulo: "PENHORA DE COTAS SOCIAIS",
      tipoNomeSingular: "participação societária",
      dossie,
      caso,
    });
  }

  const usaGratuidade = opcoes.has("gratuidade");
  const pedirCertidaoJunta = opcoes.has("pedir-certidao-junta");
  const pedirAverbacaoContrato = opcoes.has("pedir-averbacao-contrato");

  const secoes: Secao[] = [];
  const anexos: { titulo: string; fonte: string }[] = [];

  // Abertura
  secoes.push({
    paragrafos: [
      aberturaPartes(
        credor,
        devedor.nome,
        classeAcaoDoCaso(caso, "CUMPRIMENTO DE SENTENÇA"),
      ),
    ],
  });

  // I) Busca patrimonial
  const paragrafosBusca: ParagrafoEntry[] = [
    `A diligência realizada pelo **sistema interno de busca patrimonial via Inteligência Artificial do presente escritório (SONAR)** identificou ${
      empresas.length === 1
        ? "**1 (uma) participação societária**"
        : `**${empresas.length} (${numeroPorExtenso(empresas.length) ?? empresas.length}) participações societárias**`
    } em nome do executado **${devedor.nome.toUpperCase()}**, a saber:`,
  ];

  let ordemAnexoEmpresa = 1;
  empresas.forEach((bem) => {
    const descricao = descricaoJuridicaEmpresa(bem);
    const complemento = complementoProva(bem, ordemAnexoEmpresa);
    paragrafosBusca.push(
      `Verificou-se que o executado figura como integrante d${descricao}${complemento}.`,
    );
    if (temProvaAnexa(bem)) {
      const numStr = String(ordemAnexoEmpresa).padStart(2, "0");
      anexos.push({
        titulo: `Doc. ${numStr} — Certidão simplificada da Junta — ${bem.titulo}`,
        fonte: bem.fonte,
      });
      ordemAnexoEmpresa += 1;
    }
  });

  secoes.push({
    titulo: "I) DA BUSCA PATRIMONIAL VIA SONAR — RESULTADO",
    paragrafos: paragrafosBusca,
  });

  // II) Fundamento legal
  secoes.push({
    titulo: "II) DO FUNDAMENTO LEGAL",
    paragrafos: [
      `A penhora de quotas e ações de sociedades empresárias tem assento no **art. 835, IX, do CPC**, que arrola os direitos sociais entre os bens penhoráveis, e procedimento delineado no **art. 861 do CPC**, o qual disciplina a intimação da sociedade, a oferta das quotas aos demais sócios em sede de preferência legal e, no insucesso desta, a liquidação em favor do exequente.`,
      `Em reforço, o **art. 1.026 do Código Civil** assenta que os credores particulares do sócio podem recair sobre o quinhão que a este caiba na sociedade, ao passo que o **art. 1.027** disciplina o concurso com os demais sócios da limitada, garantindo a higidez do affectio societatis sem prejuízo da efetividade da execução.`,
      { tipo: "citacao", texto: "Art. 861. Penhoradas as quotas ou as ações de sócio em sociedade simples ou empresária, o juiz assinará prazo razoável, não superior a 3 (três) meses, para que a sociedade: I - apresente balanço especial; II - ofereça as quotas ou as ações aos demais sócios, observado o direito de preferência legal ou contratual; III - não havendo interesse dos sócios, proceda a liquidação das quotas ou das ações, depositando em juízo o valor apurado." },
      `Não se desconhece eventual insurgência fundada em afastamento da penhorabilidade em sociedades fechadas — argumento já superado pelo **Superior Tribunal de Justiça (REsp 1.284.988/RS)**, que admite a penhora de cotas mesmo em sociedade limitada de cunho personalista, prestigiando a efetividade do título executivo em detrimento da blindagem patrimonial pretendida pelo executado.`,
    ],
  });

  // III) Pedidos
  const pedidos: ParagrafoEntry[] = [
    `Diante do exposto, **REQUER-SE** a Vossa Excelência:`,
  ];
  let letra = "a";
  const next = () => {
    const cur = letra;
    letra = String.fromCharCode(letra.charCodeAt(0) + 1);
    return cur;
  };

  pedidos.push(
    `${next()}. a **penhora das cotas representativas** da participação societária do executado n${empresas.length === 1 ? "a sociedade" : "as sociedades"} indicada${empresas.length === 1 ? "" : "s"} no item I, nos termos do art. 835, IX, e art. 861 do CPC, com a respectiva avaliação;`,
  );

  // Para empresas Cat B, sugere ofício à Junta se a opcao tiver marcada.
  const empresasSemProva = empresas.filter((b) => !temProvaAnexa(b));
  if (pedirCertidaoJunta && empresasSemProva.length > 0) {
    pedidos.push(
      `${next()}. a **expedição de ofício à Junta Comercial competente** para emissão de certidão simplificada atualizada${
        empresasSemProva.length === 1
          ? " da sociedade indicada"
          : " de cada uma das sociedades indicadas"
      }, viabilizando a confirmação da titularidade das cotas e a determinação do quinhão penhorável;`,
    );
  }

  if (pedirAverbacaoContrato) {
    pedidos.push(
      `${next()}. a **expedição de ofício à Junta Comercial competente para averbação da penhora no contrato social** d${empresas.length === 1 ? "a sociedade" : "as sociedades"} acima indicada${empresas.length === 1 ? "" : "s"};`,
    );
  }

  pedidos.push(
    `${next()}. a **intimação d${empresas.length === 1 ? "a sociedade" : "as sociedades"}** para que apresente${empresas.length === 1 ? "" : "m"}, no prazo de 3 (três) meses, balanço especial e oferte${empresas.length === 1 ? "" : "m"} as cotas aos demais sócios (preferência legal, art. 861, I, CPC) ou, na recusa, proceda a liquidação em favor da exequente;`,
  );

  if (usaGratuidade) {
    pedidos.push(
      `${next()}. seja recebida sem recolhimento de custas em razão da concessão dos benefícios da **GRATUIDADE JUDICIAL** já formalizada nos autos.`,
    );
  }
  secoes.push({ titulo: "III) DOS PEDIDOS", paragrafos: pedidos });

  // Encerramento
  secoes.push({ paragrafos: encerramentoPadrao() });

  return {
    templateId: "penhora-cotas",
    titulo: "PENHORA DE COTAS SOCIAIS",
    vara: varaDoCaso(caso),
    numeroProcesso: processo,
    partes: `${credor} × ${devedor.nome}`,
    secoes,
    anexos_sugeridos: anexos,
  };
}

// ------------------------------------------------------------
// 4) PENHORA NO ROSTO DOS AUTOS (CPC 860)
// ------------------------------------------------------------
function gerarPenhoraRostoAutos(
  dossie: Dossie,
  caso: CasoResumo,
  opcoes: Set<string>,
  bensSelecionados?: number[],
): PecaGerada {
  const { devedor } = dossie;
  const credor = caso.credor.nome;
  const processo = caso.numero_processo ?? "processo a ser informado";

  const processos = bensRelevantes(
    dossie,
    "processo_credito",
    bensSelecionados,
  );
  if (processos.length === 0) {
    return gerarPecaAusenciaBem({
      templateId: "penhora-rosto-autos",
      titulo: "PENHORA NO ROSTO DOS AUTOS",
      tipoNomeSingular: "crédito processual",
      dossie,
      caso,
    });
  }

  const usaGratuidade = opcoes.has("gratuidade");
  const incluirArt860 = opcoes.has("incluir-art-860");

  const secoes: Secao[] = [];

  // Abertura
  secoes.push({
    paragrafos: [
      aberturaPartes(
        credor,
        devedor.nome,
        classeAcaoDoCaso(caso, "CUMPRIMENTO DE SENTENÇA"),
      ),
    ],
  });

  // I) Busca patrimonial
  const paragrafosBusca: ParagrafoEntry[] = [
    `A diligência realizada pelo **sistema interno de busca patrimonial via Inteligência Artificial do presente escritório (SONAR)** identificou ${
      processos.length === 1
        ? "**1 (um) crédito processual**"
        : `**${processos.length} (${numeroPorExtenso(processos.length) ?? processos.length}) créditos processuais**`
    } em favor do executado **${devedor.nome.toUpperCase()}**, em processos nos quais figura no polo ativo/exequente, conforme abaixo se discrimina:`,
  ];

  processos.forEach((bem) => {
    const descricao = descricaoJuridicaProcessoCredito(bem);
    paragrafosBusca.push(
      `Verificou-se a existência d${descricao}, dado obtido junto ao DataJud (Conselho Nacional de Justiça), conforme dossiê patrimonial em anexo.`,
    );
  });

  secoes.push({
    titulo: "I) DA BUSCA PATRIMONIAL VIA SONAR — RESULTADO",
    paragrafos: paragrafosBusca,
  });

  // II) Fundamento legal — sempre presente; art. 860 in verbis condicional
  const paragrafosFund: ParagrafoEntry[] = [
    `O crédito que o executado titula em outro processo constitui **direito patrimonial penhorável**, na exata dicção do **art. 835, IX, do CPC**, sendo a constrição no rosto dos autos a técnica processual específica para sua afetação à presente execução, conforme procedimento estatuído no **art. 860 do CPC**.`,
  ];
  if (incluirArt860) {
    paragrafosFund.push(
      `O Código de Processo Civil autoriza expressamente a constrição em comento, in verbis:`,
    );
    paragrafosFund.push({
      texto:
        "Art. 860. Quando o direito estiver sendo pleiteado em juízo, a penhora que recair sobre ele será averbada, com destaque, nos autos pertinentes ao direito e na ciência do juiz a que estiver afeto o feito, a fim de que a importância que vier a ser paga ou os bens que vierem a ser entregues sejam considerados depositados, ficando vinculados ao juízo da execução em que se procedeu a penhora.",
      tipo: "citacao",
    });
  }
  paragrafosFund.push(
    `Em reforço, o **Superior Tribunal de Justiça** há muito firmou, através de sua **Súmula 308**, a viabilidade da penhora de créditos do devedor em poder de terceiros, e a doutrina e jurisprudência convergem no sentido de que a medida produz efeitos imediatos: deferida a constrição, cumpre ao juízo da causa receptora **reservar o valor correspondente** até o limite do crédito exequendo, conferindo plena efetividade ao título aqui exequido.`,
  );
  secoes.push({ titulo: "II) DO FUNDAMENTO LEGAL", paragrafos: paragrafosFund });

  // III) Pedidos
  const pedidos: ParagrafoEntry[] = [
    `Diante do exposto, **REQUER-SE** a Vossa Excelência:`,
  ];
  let letra = "a";
  const next = () => {
    const cur = letra;
    letra = String.fromCharCode(letra.charCodeAt(0) + 1);
    return cur;
  };

  pedidos.push(
    `${next()}. a **penhora no rosto dos autos** ${
      processos.length === 1 ? "do processo" : "dos processos"
    } indicado${processos.length === 1 ? "" : "s"} no item I, na forma do art. 860 do CPC;`,
  );
  pedidos.push(
    `${next()}. a **expedição de ofício** ao(s) juízo(s) da(s) causa(s), com cota do escrivão, para a competente averbação da constrição e retenção dos valores eventualmente apurados até o limite do crédito exequendo, com posterior remessa a este juízo;`,
  );
  if (usaGratuidade) {
    pedidos.push(
      `${next()}. seja recebida sem recolhimento de custas em razão da concessão dos benefícios da **GRATUIDADE JUDICIAL** já formalizada nos autos.`,
    );
  }
  secoes.push({
    titulo: "III) DOS PEDIDOS",
    paragrafos: pedidos,
  });

  // Encerramento
  secoes.push({ paragrafos: encerramentoPadrao() });

  return {
    templateId: "penhora-rosto-autos",
    titulo: "PENHORA NO ROSTO DOS AUTOS",
    vara: varaDoCaso(caso),
    numeroProcesso: processo,
    partes: `${credor} × ${devedor.nome}`,
    secoes,
    anexos_sugeridos: [],
  };
}

// ------------------------------------------------------------
// 5) PENHORA DE FATURAMENTO (art. 866 CPC)
// (modelo: peca MARIA CAROLINA PANEBIANCHI — 5ª Vara Civel Sorocaba)
// ------------------------------------------------------------
function gerarPenhoraFaturamento(
  dossie: Dossie,
  caso: CasoResumo,
  opcoes: Set<string>,
  bensSelecionados?: number[],
): PecaGerada {
  const { devedor } = dossie;
  const credor = caso.credor.nome;
  const processo = caso.numero_processo ?? "processo a ser informado";

  const sigiloso = opcoes.has("sigiloso");
  const usaGratuidade = opcoes.has("gratuidade");
  const incluirArt866 = opcoes.has("incluir-art866");
  const incluirRedeSocial = opcoes.has("incluir-rede-social");

  // Procura empresa no dossie pra extrair CNPJ + razão social. Se o devedor
  // ja for PJ, usa o proprio documento dele. Se PF sem empresa, fallback.
  const empresas = bensRelevantes(dossie, "empresa", bensSelecionados);
  const empresaBem = empresas[0];
  const cnpjEmpresa =
    devedor.tipo === "PJ"
      ? devedor.documento
      : empresaBem
        ? detalheStr(empresaBem, "cnpj")
        : null;
  const razaoEmpresa = empresaBem
    ? detalheStr(empresaBem, "razao_social") ?? empresaBem.titulo
    : null;

  const secoes: Secao[] = [];

  if (sigiloso) {
    secoes.push({
      paragrafos: [{ texto: "*PEDIDO SIGILOSO*", tipo: "sigiloso" }],
    });
  }

  // Abertura.
  secoes.push({
    paragrafos: [
      aberturaPartes(
        credor,
        devedor.nome,
        classeAcaoDoCaso(caso, "CUMPRIMENTO DE SENTENÇA"),
      ).replace("vem, respeitosamente,", "vem, tempestivamente,"),
    ],
  });

  // Bloco "diligências esgotadas".
  secoes.push({
    titulo: "I) DAS DILIGÊNCIAS ORDINÁRIAS EXAURIDAS",
    paragrafos: [
      `A EXEQUENTE esclarece que esgotou todos os meios ordinários de pesquisa e execução em face da EXECUTADA para o cumprimento da obrigação em relação ao débito objeto do presente Cumprimento de Sentença, com enfoque nos seguintes resultados negativos:`,
      { texto: "1- SISBAJUD: todos negativos", tipo: "item" },
      { texto: "2- INFOJUD: negativo", tipo: "item" },
      { texto: "3- RENAJUD: negativo", tipo: "item" },
      { texto: "4- ARISP: negativo", tipo: "item" },
      `Neste sentido, resta claro a má-fé da EXECUTADA, em se esquivar do cumprimento e adimplemento da obrigação tida junto à Exequente, fato este que não merece perdurar.`,
    ],
  });

  // Bloco "fundamento legal" — vem antes da medida atípica (que contém o pedido).
  const paragrafosFundFat: ParagrafoEntry[] = [
    `A penhora sobre percentual do faturamento da empresa em que figura o executado encontra fundamento expresso no **art. 866 do CPC**, instituto de natureza subsidiária que pressupõe a inexistência de outros bens penhoráveis — ou a insuficiência/dificuldade de alienação destes —, hipótese plenamente configurada nos autos, conforme demonstrado no item I.`,
    `Trata-se, ademais, de instrumento legítimo de **medidas executivas atípicas** previstas no **art. 139, IV, do CPC**, o qual confere ao magistrado poderes para determinar todas as medidas indutivas, coercitivas, mandamentais ou sub-rogatórias necessárias a assegurar o cumprimento de ordem judicial e a satisfação do crédito exequendo, sem prejuízo da observância dos parâmetros do art. 866 (percentual razoável + administrador-depositário).`,
  ];
  if (incluirArt866) {
    paragrafosFundFat.push(
      `Confira-se o teor expresso do dispositivo legal invocado:`,
    );
    paragrafosFundFat.push({
      texto:
        "Art. 866. Se o executado não tiver outros bens penhoráveis ou se, tendo-os, esses forem de difícil alienação ou insuficientes para saldar o crédito executado, o juiz poderá ordenar a penhora de percentual de faturamento de empresa.",
      tipo: "citacao",
    });
    paragrafosFundFat.push({
      texto:
        "§ 1º O juiz fixará percentual que propicie a satisfação do crédito exequendo em tempo razoável, mas que não torne inviável o exercício da atividade empresarial.",
      tipo: "citacao",
    });
    paragrafosFundFat.push({
      texto:
        "§ 2º O juiz nomeará administrador-depositário, o qual submeterá a aprovação judicial a forma de sua atuação e prestará contas mensalmente, entregando em juízo as quantias recebidas, com os respectivos balancetes mensais, a fim de serem imputadas no pagamento da dívida.",
      tipo: "citacao",
    });
    paragrafosFundFat.push({
      texto:
        "§ 3º Na penhora de percentual de faturamento de empresa, observar-se-á, no que couber, o disposto quanto ao regime de penhora de frutos e rendimentos de coisa móvel e imóvel. **(GRIFO NOSSO)**",
      tipo: "citacao",
    });
  }
  secoes.push({
    titulo: "II) DO FUNDAMENTO LEGAL",
    paragrafos: paragrafosFundFat,
  });

  // Bloco "medidas atípicas" (contém o pedido principal).
  const corpoAtipico: ParagrafoEntry[] = [
    `Posto isso, a EXEQUENTE esclarece que, a partir do presente momento processual, imprescindível será a adoção de **MEDIDAS ATÍPICAS** de constrição de bens, de modo que esgotadas todas as alternativas corriqueiras para a localização de bens.`,
  ];
  if (razaoEmpresa && cnpjEmpresa) {
    corpoAtipico.push(
      `Nesse cenário, após empregada algumas diligências internas, a EXEQUENTE constatou que a EXECUTADA é titular da sociedade **${razaoEmpresa}**, inscrita sob o **CNPJ nº ${cnpjEmpresa}**, conforme ficha JUCESP em anexo.`,
    );
  } else if (cnpjEmpresa) {
    corpoAtipico.push(
      `Nesse cenário, após empregada algumas diligências internas, a EXEQUENTE constatou que a EXECUTADA é titular de pessoa jurídica inscrita sob o **CNPJ nº ${cnpjEmpresa}**, conforme ficha JUCESP em anexo.`,
    );
  } else {
    corpoAtipico.push(
      `Nesse cenário, após empregada algumas diligências internas, a EXEQUENTE constatou que a EXECUTADA mantém atividade empresarial em pessoa jurídica em seu nome, conforme documentos em anexo.`,
    );
  }
  if (incluirRedeSocial) {
    corpoAtipico.push(
      `Reforça-se ainda que a EXECUTADA mantém ativa divulgação das atividades de sua empresa em **redes sociais** (Instagram e TikTok), prova inequívoca do exercício regular da atividade econômica e da existência de faturamento corrente.`,
    );
  }
  corpoAtipico.push(
    `Assim, sem mais alternativas e verificado o status de atividade da Executada em documentos oficiais, requer-se seja **penhorado o faturamento da empresa ré** no percentual que entender V. Exa., nos termos do artigo 866 do CPC.`,
  );
  secoes.push({
    titulo: "III) DAS MEDIDAS ATÍPICAS — PENHORA DE FATURAMENTO",
    paragrafos: corpoAtipico,
  });

  // Gratuidade.
  if (usaGratuidade) {
    secoes.push({
      paragrafos: [
        `A EXEQUENTE esclarece que deixa de recolher as custas judiciais em vista da concessão dos benefícios da **GRATUIDADE JUDICIAL** já formalizada nos autos.`,
      ],
    });
  }

  // Encerramento padrao + (opcional) reforço de sigilo.
  const encerramento = [...encerramentoPadrao()];
  if (sigiloso) {
    encerramento[0] =
      `Por fim, requer-se que as intimações ocorram em nome **REMO HIGASHI BATTAGLIA, OAB/SP 157.500**, sob pena de nulidade, nos termos do §2º do art. 272, do CPC, bem como, que o presente pedido seja classificado como sigiloso.`;
  }
  secoes.push({ paragrafos: encerramento });

  // Anexos
  const anexos: { titulo: string; fonte: string }[] = [];
  if (cnpjEmpresa && devedor.tipo === "PF") {
    anexos.push({
      titulo: "Ficha JUCESP da empresa do executado",
      fonte: empresaBem?.fonte ?? "minhareceita",
    });
  }
  if (incluirRedeSocial) {
    anexos.push({
      titulo: "Prints das redes sociais da executada (Instagram/TikTok)",
      fonte: "Manual",
    });
  }

  return {
    templateId: "penhora-faturamento",
    titulo: "PENHORA DE FATURAMENTO — ART. 866 DO CPC",
    vara: varaDoCaso(caso),
    numeroProcesso: processo,
    partes: `${credor} × ${devedor.nome}`,
    secoes,
    anexos_sugeridos: anexos,
  };
}

// ------------------------------------------------------------
// 6) BLOQUEIO SISBAJUD (pós-decurso CPC 523)
// (modelo: peca FACEBOOK SERVICOS — 3ª Vara Civel Sorocaba)
// ------------------------------------------------------------
function gerarBloqueioSisbajud(
  dossie: Dossie,
  caso: CasoResumo,
  opcoes: Set<string>,
): PecaGerada {
  const { devedor } = dossie;
  const credor = caso.credor.nome;
  const valor = caso.valor_credito_brl
    ? formatBRL(caso.valor_credito_brl)
    : "valor a ser apurado";
  const valorExtensoTxt =
    caso.valor_credito_brl !== null
      ? valorPorExtenso(caso.valor_credito_brl)
      : null;
  const processo = caso.numero_processo ?? "processo a ser informado";

  const usaGratuidade = opcoes.has("gratuidade");
  const usaMulta523 = opcoes.has("multa-cpc-523");
  const incluirPlanilha = opcoes.has("incluir-planilha");
  const modalidadeReiterada = opcoes.has("modalidade-reiterada");

  const secoes: Secao[] = [];

  // Abertura — atenção ao DECURSO do prazo.
  const classeAcaoBloqueio = classeAcaoDoCaso(caso, "AÇÃO");
  secoes.push({
    paragrafos: [
      `**${credor.toUpperCase()}**, já qualificada nos autos do **${classeAcaoBloqueio}** em epígrafe, ` +
        `que lhe move em face de **${devedor.nome.toUpperCase()}**, vem, respeitosamente, ` +
        `perante V. Exa., em atenção ao **DECURSO** do prazo para pagamento estabelecido pela decisão constante dos autos, aduzir e requerer o quanto segue.`,
    ],
  });

  // Multa + honorários (CPC 523).
  if (usaMulta523) {
    secoes.push({
      paragrafos: [
        `Considerando a inércia do EXECUTADO quanto ao pagamento do valor em execução, imprescindível o **acréscimo automático do valor de multa de 10% (dez por cento), e de honorários advocatícios** relativos à fase de cumprimento, no mesmo percentual, nos termos do art. 523, §§ 1º e 2º, do CPC, in verbis:`,
        {
          texto:
            "§ 1º Não ocorrendo pagamento voluntário no prazo do caput, o débito será acrescido de multa de dez por cento e, também, de honorários de advogado de dez por cento.",
          tipo: "citacao",
        },
        {
          texto:
            "§ 2º Efetuado o pagamento parcial no prazo previsto no caput, a multa e os honorários previstos no § 1º incidirão sobre o restante.",
          tipo: "citacao",
        },
      ],
    });
  }

  // Planilha de cálculos.
  if (incluirPlanilha) {
    const trechoValor = valorExtensoTxt
      ? `o valor de **${valor}** (${valorExtensoTxt})`
      : `o valor de **${valor}**`;
    secoes.push({
      paragrafos: [
        `A credora pleiteia também pela juntada da planilha de cálculos atualizada, em que o débito total em execução equivale a ${trechoValor}.`,
      ],
    });
  }

  // Fundamento legal — antes do pedido de bloqueio.
  secoes.push({
    titulo: "DO FUNDAMENTO LEGAL",
    paragrafos: [
      `A medida de bloqueio de ativos financeiros encontra fundamento expresso no **art. 854 do CPC**, dispositivo que disciplina a indisponibilidade eletrônica de valores em instituições financeiras por meio do **Sistema SISBAJUD** (antigo BACENJUD), instituído pelas **Resoluções CNJ nº 61/2008 e nº 232/2016**.`,
      { tipo: "citacao", texto: "Art. 854. Para possibilitar a penhora de dinheiro em depósito ou em aplicação financeira, o juiz, a requerimento do exequente, sem dar ciência prévia do ato ao executado, determinará as instituições financeiras, por meio de sistema eletrônico gerido pela autoridade supervisora do sistema financeiro nacional, que tornem indisponíveis ativos financeiros existentes em nome do executado, limitando-se a indisponibilidade ao valor indicado na execução." },
      { tipo: "citacao", texto: "§ 1º No prazo de 24 (vinte e quatro) horas a contar da resposta, de modo a tornar efetiva a penhora, o juiz determinará as instituições financeiras que sejam transferidos os ativos para conta vinculada ao juízo da execução." },
      { tipo: "citacao", texto: "§ 2º Tornados indisponíveis os ativos, o executado será intimado na pessoa de seu advogado ou, não o tendo, pessoalmente." },
      `Cumpre ressaltar que, na esteira do entendimento firmado pelo **Superior Tribunal de Justiça no julgamento do REsp 1.184.765/PA, submetido a sistemática dos recursos repetitivos (Tema 425)**, o bloqueio eletrônico via sistema do Banco Central constitui **medida preferencial** em sede executiva, **não se exigindo do exequente o prévio exaurimento de outras vias de pesquisa patrimonial** — providência que, no caso, até já se esgotaram, robustecendo o pleito ora deduzido.`,
    ],
  });

  // Pedido de bloqueio SISBAJUD.
  const pedidoSisbajud = modalidadeReiterada
    ? `Posto isso, em termos de prosseguimento, a EXEQUENTE pleiteia pela realização de **pesquisa/bloqueio via sistema SISBAJUD na modalidade REITERADA (teimosinha)** para penhora do valor integral indicado acima.`
    : `Posto isso, em termos de prosseguimento, a EXEQUENTE pleiteia pela realização de **pesquisa/bloqueio via sistema SISBAJUD** para penhora do valor integral indicado acima.`;
  secoes.push({ paragrafos: [pedidoSisbajud] });

  // Gratuidade.
  if (usaGratuidade) {
    secoes.push({
      paragrafos: [
        `A EXEQUENTE esclarece que deixa de juntar os comprovantes de recolhimento de custas e despesas processuais em vista da concessão dos benefícios da **GRATUIDADE JUDICIAL**.`,
      ],
    });
  }

  // Encerramento padrao.
  secoes.push({ paragrafos: encerramentoPadrao() });

  return {
    templateId: "bloqueio-sisbajud",
    titulo: "REQUERIMENTO — BLOQUEIO SISBAJUD (CPC 523)",
    vara: varaDoCaso(caso),
    numeroProcesso: processo,
    partes: `${credor} × ${devedor.nome}`,
    secoes,
    anexos_sugeridos: incluirPlanilha
      ? [{ titulo: "Planilha de cálculos atualizada", fonte: "Manual" }]
      : [],
  };
}

// ------------------------------------------------------------
// 7) PENHORA CONSOLIDADA — reune TODOS os tipos de bens encontrados
// em uma única petição, com pedidos enumerados a/b/c/d no final.
// Util quando o dossie tem 2+ tipos (imóvel + veículo + cotas + processos)
// e o BP quer evitar protocolar 4 pecas separadas.
// ------------------------------------------------------------
function gerarPenhoraConsolidada(
  dossie: Dossie,
  caso: CasoResumo,
  opcoes: Set<string>,
  bensSelecionados?: number[],
): PecaGerada {
  const { devedor } = dossie;
  const credor = caso.credor.nome;
  const processo = caso.numero_processo ?? "processo a ser informado";

  const sigiloso = opcoes.has("sigiloso");
  const usaGratuidade = opcoes.has("gratuidade");
  const incluirImoveis = opcoes.has("incluir-imoveis");
  const incluirVeiculos = opcoes.has("incluir-veiculos");
  const incluirCotas = opcoes.has("incluir-cotas");
  const incluirRostoAutos = opcoes.has("incluir-rosto-autos");
  const pedirAverbacao = opcoes.has("pedir-averbacao");
  const pedirRenajud = opcoes.has("pedir-renajud");
  const pedirCertidaoJunta = opcoes.has("pedir-certidao-junta");
  const incluirBloqueioSisbajud = opcoes.has("incluir-bloqueio-sisbajud");
  const mencionarMaFe = opcoes.has("mencionar-ma-fe");
  const usaMulta523 = opcoes.has("multa-cpc-523");

  const imoveis = incluirImoveis
    ? bensRelevantes(dossie, "imovel", bensSelecionados)
    : [];
  const veiculos = incluirVeiculos
    ? bensRelevantes(dossie, "veiculo", bensSelecionados)
    : [];
  const empresas = incluirCotas
    ? bensRelevantes(dossie, "empresa", bensSelecionados)
    : [];
  const processos = incluirRostoAutos
    ? bensRelevantes(dossie, "processo_credito", bensSelecionados)
    : [];

  const totalBens =
    imoveis.length + veiculos.length + empresas.length + processos.length;

  if (totalBens === 0) {
    return gerarPecaAusenciaBem({
      templateId: "penhora-consolidada",
      titulo: "PENHORA CONSOLIDADA",
      tipoNomeSingular: "bem penhorável",
      dossie,
      caso,
    });
  }

  const secoes: Secao[] = [];
  const anexos: { titulo: string; fonte: string }[] = [];

  if (sigiloso) {
    secoes.push({
      paragrafos: [{ texto: "*PEDIDO SIGILOSO*", tipo: "sigiloso" }],
    });
  }

  // Abertura padrao.
  secoes.push({
    paragrafos: [
      aberturaPartes(
        credor,
        devedor.nome,
        classeAcaoDoCaso(caso, "CUMPRIMENTO DE SENTENÇA"),
      ),
    ],
  });

  // I) Busca patrimonial — intro + sub-secoes por categoria.
  const tiposEncontrados: string[] = [];
  if (imoveis.length > 0) tiposEncontrados.push(`${imoveis.length} imóvel(eis)`);
  if (veiculos.length > 0) tiposEncontrados.push(`${veiculos.length} veículo(s)`);
  if (empresas.length > 0)
    tiposEncontrados.push(`${empresas.length} participação(oes) societária(s)`);
  if (processos.length > 0)
    tiposEncontrados.push(`${processos.length} crédito(s) processual(is)`);

  secoes.push({
    titulo: "I) DA BUSCA PATRIMONIAL VIA SONAR — RESULTADO",
    paragrafos: [
      `A diligência realizada pelo **sistema interno de busca patrimonial via Inteligência Artificial do presente escritório (SONAR)** identificou, em nome do executado **${devedor.nome.toUpperCase()}**, os seguintes bens penhoráveis: ${tiposEncontrados.join(
        ", ",
      )}, conforme se discrimina nos tópicos seguintes.`,
    ],
  });

  // I.1) Imoveis
  let ordemAnexo = 1;
  if (imoveis.length > 0) {
    const paragrafosImoveis: ParagrafoEntry[] = [];
    imoveis.forEach((bem) => {
      const descricao = descricaoJuridicaImovel(bem);
      const complemento = complementoProva(bem, ordemAnexo);
      paragrafosImoveis.push(
        `Verificou-se que o executado é titular d${descricao}${complemento}.`,
      );
      if (temProvaAnexa(bem)) {
        const numStr = String(ordemAnexo).padStart(2, "0");
        anexos.push({
          titulo: `Doc. ${numStr} — ${bem.titulo} (${bem.fonte})`,
          fonte: bem.fonte,
        });
        ordemAnexo += 1;
      }
    });
    secoes.push({
      titulo: "I.1) DOS IMÓVEIS LOCALIZADOS",
      paragrafos: paragrafosImoveis,
    });
  }

  // I.2) Veiculos
  if (veiculos.length > 0) {
    const paragrafosVeiculos: ParagrafoEntry[] = [];
    veiculos.forEach((bem) => {
      const descricao = descricaoJuridicaVeiculo(bem);
      const restricoes =detalheArr(bem, "restricoes");
      const restricaoTxt =
        restricoes.length > 0
          ? `, sobre o qual recai a seguinte anotação: **${restricoes.join("; ")}**`
          : "";
      paragrafosVeiculos.push(
        `Verificou-se que o executado figura como titular d${descricao}${restricaoTxt}.`,
      );
    });
    secoes.push({
      titulo: "I.2) DOS VEÍCULOS LOCALIZADOS",
      paragrafos: paragrafosVeiculos,
    });
  }

  // I.3) Cotas societárias
  if (empresas.length > 0) {
    const paragrafosCotas: ParagrafoEntry[] = [];
    empresas.forEach((bem) => {
      const descricao = descricaoJuridicaEmpresa(bem);
      const complemento = complementoProva(bem, ordemAnexo);
      paragrafosCotas.push(
        `Verificou-se que o executado figura como integrante d${descricao}${complemento}.`,
      );
      if (temProvaAnexa(bem)) {
        const numStr = String(ordemAnexo).padStart(2, "0");
        anexos.push({
          titulo: `Doc. ${numStr} — Certidão simplificada da Junta — ${bem.titulo}`,
          fonte: bem.fonte,
        });
        ordemAnexo += 1;
      }
    });
    secoes.push({
      titulo: "I.3) DAS COTAS SOCIETÁRIAS",
      paragrafos: paragrafosCotas,
    });
  }

  // I.4) Processos onde figura como credor
  if (processos.length > 0) {
    const paragrafosProcessos: ParagrafoEntry[] = [];
    processos.forEach((bem) => {
      const descricao = descricaoJuridicaProcessoCredito(bem);
      paragrafosProcessos.push(
        `Verificou-se a existência d${descricao}, dado obtido junto ao DataJud (Conselho Nacional de Justiça), conforme dossiê patrimonial em anexo.`,
      );
    });
    secoes.push({
      titulo: "I.4) DOS PROCESSOS ONDE FIGURA COMO CREDOR",
      paragrafos: paragrafosProcessos,
    });
  }

  // II) Fundamento legal — subdividido por tipo de bem, fecha com art. 139, IV
  // e CF/88 art. 5º, XXXV.
  const paragrafosFundCons: ParagrafoEntry[] = [
    `As medidas constritivas ora postuladas encontram sólido amparo no ordenamento jurídico pátrio, observada a especificidade de cada categoria de bem identificada no item I, conforme se passa a fundamentar.`,
  ];
  if (imoveis.length > 0) {
    paragrafosFundCons.push(
      `**II.1) Quanto aos imóveis**: a penhora encontra fundamento no **art. 835, V, do CPC**, com averbação no registro imobiliário na forma do **art. 844 do CPC** (publicidade erga omnes) e avaliação por oficial de justiça ou perito do juízo (**arts. 870 e 871 do CPC**), tudo à luz da **Súmula 84 do STJ**.`,
    );
  }
  if (veiculos.length > 0) {
    paragrafosFundCons.push(
      `**II.2) Quanto aos veículos**: a penhora apoia-se no **art. 835, IV, do CPC**, sendo a efetivação via **Sistema RENAJUD** instituída pela **Resolução CNJ nº 89/2009**; eventual alienação fiduciária não impede a constrição dos direitos do fiduciante, na esteira do **art. 1.361 do CC** e do entendimento do **STJ (REsp 1.498.737/SP)**.`,
    );
  }
  if (empresas.length > 0) {
    paragrafosFundCons.push(
      `**II.3) Quanto às cotas societárias**: incidem o **art. 835, IX, e o art. 861, ambos do CPC**, e os **arts. 1.026 e 1.027 do CC**, sendo pacífica no **STJ (REsp 1.284.988/RS)** a penhorabilidade das cotas mesmo em sociedade limitada de feição personalista.`,
    );
  }
  if (processos.length > 0) {
    paragrafosFundCons.push(
      `**II.4) Quanto aos créditos processuais**: a constrição no rosto dos autos está disciplinada no **art. 860 do CPC**, tratando-se de direito patrimonial penhorável (**art. 835, IX, do CPC**), conforme **Súmula 308 do STJ**, com efeito imediato de reserva pelo juízo da causa receptora.`,
    );
  }
  paragrafosFundCons.push(
    `Em remate, o **art. 139, IV, do CPC** autoriza o magistrado a determinar todas as medidas indutivas, coercitivas, mandamentais ou sub-rogatórias necessárias a assegurar o cumprimento de ordem judicial, conferindo ao juiz amplos poderes para emprestar efetividade ao título executivo, em consonância com o princípio constitucional do **acesso à justiça efetivo (art. 5º, XXXV, da Constituição Federal)** — postulado que reclama não apenas o ingresso em juízo, mas também a **tutela jurisdicional útil**, materializada na satisfação concreta do crédito.`,
  );
  secoes.push({
    titulo: "II) DO FUNDAMENTO LEGAL",
    paragrafos: paragrafosFundCons,
  });

  // III) Ma-fe do executado (opcional).
  if (mencionarMaFe) {
    secoes.push({
      titulo: "III) DA MÁ-FÉ DO EXECUTADO",
      paragrafos: [
        `Resta evidente, no caso em tela, a **má-fé do EXECUTADO** em se esquivar do cumprimento e adimplemento da obrigação tida junto à EXEQUENTE, valendo-se da pulverização de seu patrimônio em diferentes naturezas (imóveis, veículos, participações societárias e créditos processuais) para dificultar a satisfação do crédito, conduta que não merece prosperar e que reforça a necessidade das constrições ora pleiteadas.`,
      ],
    });
  }

  // IV) Pedidos — enumerados a/b/c/d/...
  const numTitulo = mencionarMaFe ? "IV" : "III";
  const pedidos: ParagrafoEntry[] = [
    `Diante de todo o exposto, **REQUER-SE** a Vossa Excelência:`,
  ];
  let letra = "a";
  const next = () => {
    const cur = letra;
    letra = String.fromCharCode(letra.charCodeAt(0) + 1);
    return cur;
  };

  // a) Imoveis
  if (imoveis.length > 0) {
    const partesImovel: string[] = [];
    partesImovel.push(
      `a **penhora** ${imoveis.length === 1 ? "do imóvel descrito no item I.1" : "dos imóveis descritos no item I.1"}, com a respectiva avaliação, intimando-se o executado e seu cônjuge, se casado, nos termos do art. 842 do CPC`,
    );
    if (pedirAverbacao) {
      partesImovel.push(
        `com a **expedição de mandado de averbação da penhora** na(s) matrícula(s) correspondente(s), nos termos do art. 844 do CPC`,
      );
    }
    pedidos.push(`${next()}. ${partesImovel.join(", ")};`);
  }

  // b) Veiculos
  if (veiculos.length > 0) {
    const partesVeiculo: string[] = [];
    if (pedirRenajud) {
      partesVeiculo.push(
        `a **expedição de ofício ao DETRAN, via Sistema RENAJUD**, para confirmação da titularidade e o **bloqueio de transferência e circulação** d${veiculos.length === 1 ? "o veículo descrito no item I.2" : "os veículos descritos no item I.2"}`,
      );
    }
    partesVeiculo.push(
      `a **penhora** ${veiculos.length === 1 ? "do veículo" : "dos veículos"}, com posterior avaliação e remoção ao depositário judicial, nos termos do art. 840, III, do CPC`,
    );
    pedidos.push(`${next()}. ${partesVeiculo.join(", ")};`);
  }

  // c) Cotas
  if (empresas.length > 0) {
    const partesCotas: string[] = [];
    partesCotas.push(
      `a **penhora das cotas representativas** da participação societária do executado n${empresas.length === 1 ? "a sociedade descrita" : "as sociedades descritas"} no item I.3, nos termos do art. 835, IX, e art. 861 do CPC, com a respectiva avaliação`,
    );
    if (pedirCertidaoJunta) {
      partesCotas.push(
        `a **expedição de ofício à Junta Comercial competente** para emissão de certidão simplificada atualizada e averbação da penhora no contrato social`,
      );
    }
    pedidos.push(`${next()}. ${partesCotas.join(", ")};`);
  }

  // d) Rosto dos autos
  if (processos.length > 0) {
    pedidos.push(
      `${next()}. a **penhora no rosto dos autos** ${processos.length === 1 ? "do processo" : "dos processos"} descrito${processos.length === 1 ? "" : "s"} no item I.4, na forma do art. 860 do CPC, com a expedição de ofício ao(s) juízo(s) da(s) causa(s) para a competente averbação e retenção dos valores eventualmente apurados até o limite do crédito exequendo;`,
    );
  }

  // e) Multa CPC 523 (opcional)
  if (usaMulta523) {
    pedidos.push(
      `${next()}. o **acréscimo automático da multa de 10% (dez por cento), e de honorários advocatícios** no mesmo percentual, nos termos do art. 523, §§ 1º e 2º, do CPC, sobre o valor atualizado do débito;`,
    );
  }

  // f) SISBAJUD subsidiário (opcional)
  if (incluirBloqueioSisbajud) {
    pedidos.push(
      `${next()}. subsidiariamente, e em caráter complementar, a **realização de pesquisa/bloqueio via sistema SISBAJUD** sobre eventuais ativos financeiros do executado, até o limite do crédito exequendo;`,
    );
  }

  // g) Gratuidade (sempre por ultimo)
  if (usaGratuidade) {
    pedidos.push(
      `${next()}. seja recebida sem recolhimento de custas em razão da concessão dos benefícios da **GRATUIDADE JUDICIAL** já formalizada nos autos.`,
    );
  }

  secoes.push({
    titulo: `${numTitulo}) DOS PEDIDOS`,
    paragrafos: pedidos,
  });

  // Encerramento padrao + (opcional) reforço de sigilo.
  const encerramento = [...encerramentoPadrao()];
  if (sigiloso) {
    encerramento[0] =
      `Por fim, requer-se que as intimações ocorram em nome **REMO HIGASHI BATTAGLIA, OAB/SP 157.500**, sob pena de nulidade, nos termos do §2º do art. 272, do CPC, bem como, que o presente pedido seja classificado como sigiloso.`;
  }
  secoes.push({ paragrafos: encerramento });

  return {
    templateId: "penhora-consolidada",
    titulo: "PENHORA CONSOLIDADA",
    vara: varaDoCaso(caso),
    numeroProcesso: processo,
    partes: `${credor} × ${devedor.nome}`,
    secoes,
    anexos_sugeridos: anexos,
  };
}

// ============================================================
// METADADOS UTILS PRA UI
// ============================================================

// Indica quais templates fazem sentido pro dossie atual.
// UI pode usar pra exibir badge "sugerido".
export function templatesSugeridos(dossie: Dossie): TemplateId[] {
  const ids: TemplateId[] = [];
  // So contam tipos "penhoráveis" — endereço/vinculo não geram peca.
  const tiposPenhoraveis = new Set(
    dossie.bens
      .map((b) => b.tipo)
      .filter((t) =>
        (["imovel", "veiculo", "empresa", "processo_credito"] as TipoBem[]).includes(
          t,
        ),
      ),
  );
  // Se devedor tem multiplos tipos de bens, sugerir consolidada primeiro.
  if (tiposPenhoraveis.size >= 2) ids.push("penhora-consolidada");
  if (tiposPenhoraveis.has("imovel")) ids.push("penhora-imovel");
  if (tiposPenhoraveis.has("veiculo")) ids.push("penhora-veiculo");
  if (tiposPenhoraveis.has("empresa")) ids.push("penhora-cotas");
  if (tiposPenhoraveis.has("processo_credito"))
    ids.push("penhora-rosto-autos");
  // Penhora de faturamento sugerido se devedor e PJ ou tem cotas em PJ ativa.
  if (dossie.devedor.tipo === "PJ" || tiposPenhoraveis.has("empresa")) {
    ids.push("penhora-faturamento");
  }
  // Bloqueio SISBAJUD sempre sugerido como subsidiário.
  ids.push("bloqueio-sisbajud");
  return ids;
}

export function dataExtenso(d: Date = new Date()): string {
  const meses = [
    "janeiro",
    "fevereiro",
    "marco",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}

// Util da UI: converte CSV de query string em Set<string>.
// Ex: "sigiloso,gratuidade,reiterada" -> Set{"sigiloso","gratuidade","reiterada"}
export function parseOpcoesCSV(csv: string | null | undefined): Set<string> {
  if (!csv) return new Set();
  return new Set(
    csv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

// Util da UI: converte CSV de ids de bens em number[].
// Ex: "1,2,5" -> [1,2,5]. Ids invalidos (não numericos) sao descartados.
export function parseBensCSV(csv: string | null | undefined): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

// Util da UI: a partir do TemplateMeta, devolve o Set<string> com as
// opcoes default ligadas. Usado quando o usuario não passou nada.
export function opcoesPadrao(meta: TemplateMeta): Set<string> {
  const s = new Set<string>();
  for (const o of meta.opcoes) {
    if (o.default) s.add(o.id);
  }
  return s;
}

export { formatData };
