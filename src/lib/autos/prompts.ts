// Prompts da Análise de Autos (capa a capa) — o cérebro do módulo.
//
// São TRÊS passadas, porque um capa a capa de execução não cabe numa chamada só
// e porque misturar "ler" com "concluir" é o que faz o modelo alucinar:
//
//   1. EXTRAÇÃO     — por lote de páginas. Só fatos, cada um ancorado na página.
//   2. CONSOLIDAÇÃO — recebe os fatos (JSON), não o PDF. Deduplica, calcula o
//                     débito, classifica a etapa, diz o que falta e por quê.
//   3. REDAÇÃO      — recebe a ficha consolidada e escreve a próxima peça.
//
// O texto de sistema é idêntico entre lotes de propósito: é prefixo estável de
// cache (cache read sai por cerca de um vinte avos do preço do token novo).

/**
 * Espécies de medida que o extrator pode devolver. Fecha o vocabulário: sem
 * enum o modelo inventa sinônimo ("bloqueio de contas", "penhora online",
 * "Bacenjud") e a consolidação não consegue deduplicar.
 */
export const ESPECIES_TIPICAS = [
  "citacao",
  "sisbajud",
  "sisbajud_teimosinha",
  "renajud",
  "infojud",
  "penhora_imovel",
  "penhora_faturamento",
  "penhora_quotas",
  "penhora_credito",
  "penhora_precatorio",
  "penhora_estoque_semovente",
  "penhora_rosto_autos",
  "cnib",
  "serasajud",
  "protesto",
  "oficial_justica_penhora",
  "avaliacao",
  "adjudicacao",
  "alienacao_judicial",
  "arresto",
  "busca_apreensao",
] as const;

export const ESPECIES_ATIPICAS = [
  "suspensao_cnh",
  "apreensao_passaporte",
  "bloqueio_cartoes",
  "proibicao_licitar",
  "quebra_sigilo_fiscal",
  "quebra_sigilo_bancario",
  "idpj",
  "fraude_execucao",
  "grupo_economico",
  "astreintes",
  "inclusao_cadastro_inadimplentes",
] as const;

export type EspecieTipica = (typeof ESPECIES_TIPICAS)[number];
export type EspecieAtipica = (typeof ESPECIES_ATIPICAS)[number];
export type EspecieMedida = EspecieTipica | EspecieAtipica;

/** Contexto jurídico fixo. Entra no sistema de todas as passadas. */
const ONTOLOGIA = `## Como classificar uma medida

MEDIDA TÍPICA é a prevista expressamente na lei processual como meio executivo
(CPC arts. 824 a 909): citação para pagamento, SISBAJUD (bloqueio de ativos
financeiros, inclusive a reiteração automática conhecida como "teimosinha"),
RENAJUD (restrição sobre veículos), INFOJUD (declarações fiscais), penhora de
imóvel por matrícula, penhora de faturamento (CPC 866), penhora de quotas
sociais (CPC 861), penhora de crédito e de precatório, penhora no rosto dos
autos, CNIB (indisponibilidade de bens), SERASAJUD, protesto do título
(CPC 517), diligência de oficial de justiça para penhora e avaliação,
adjudicação (CPC 876) e alienação judicial (CPC 879 e seguintes).

MEDIDA ATÍPICA é a que se apoia no poder geral de efetivação do CPC 139, IV
— validada pelo STF na ADI 5.941 e admitida pelo STJ desde que observadas
subsidiariedade, proporcionalidade e indícios de ocultação patrimonial:
suspensão de CNH, apreensão de passaporte, bloqueio de cartões de crédito,
proibição de participar de licitação, quebra de sigilo fiscal ou bancário
para fins patrimoniais, incidente de desconsideração da personalidade
jurídica (CPC 133 e seguintes), reconhecimento de fraude à execução
(CPC 792) e responsabilização de grupo econômico.
A atípica não é cabível antes do esgotamento razoável das típicas. Se as
típicas não foram tentadas, a atípica é prematura — e isso deve ser dito.

## Ordem natural de uma execução de título judicial ou extrajudicial

citação ou intimação para pagamento, decurso do prazo sem pagamento (multa e
honorários do CPC 523, parágrafo 1º, no cumprimento de sentença), SISBAJUD,
RENAJUD, INFOJUD, pesquisa de imóveis e CNIB, faturamento, quotas e créditos,
medidas atípicas, avaliação, adjudicação ou alienação, satisfação.
A ordem é roteiro, não dogma: pular etapa com justificativa idônea (por
exemplo, imóvel já conhecido) é legítimo e não deve ser apontado como erro.

## Marcos que mudam o prognóstico

- Suspensão do CPC 921, III: o prazo de um ano corre e, findo ele, inicia-se a
  prescrição intercorrente (CPC 921, parágrafo 4º), que corre
  independentemente de nova intimação (Tema 568 do STJ). Processo parado é
  risco, não neutralidade.
- Arquivamento provisório sem baixa não interrompe a contagem acima.
- Bem de família (Lei 8.009/90) e impenhorabilidades do CPC 833 derrubam
  penhora aparentemente bem-sucedida.
- Penhora sem avaliação e sem praça não satisfaz nada: constrição não é
  satisfação.`;

/**
 * Regras anti-alucinação. O ponto mais importante do módulo: um dado inventado
 * vira ficha oficial do escritório e depois vira pedido em petição.
 */
const DISCIPLINA = `## Disciplina de leitura (inegociável)

1. Você só afirma o que está escrito nas páginas que recebeu. Se não está,
   não existe: devolva o campo vazio, nunca um palpite.
2. Todo item que você devolver carrega as páginas de onde saiu, na numeração
   do arquivo que você recebeu, e um trecho literal de no máximo 300
   caracteres que comprove o item. Item sem âncora é item descartado.
3. Separe sempre quatro estados diferentes: REQUERIDA pela parte, DEFERIDA
   pelo juízo, CUMPRIDA (a ordem foi efetivamente expedida ou executada) e o
   RESULTADO (o que voltou). Um SISBAJUD deferido cuja resposta ainda não foi
   juntada tem resultado "pendente", não "negativo".
4. Valor em dinheiro: não confunda. Custas, preparo, porte de remessa,
   honorários contratuais, valor da causa na inicial, valor de contrato
   juntado como documento e valor de proposta de acordo não são o débito
   exequendo. Só é débito o que vier de planilha do exequente, de cálculo do
   contador, de decisão judicial que homologa valor, ou de intimação para
   pagamento. Na dúvida, classifique a rubrica como indefinida e explique.
5. Datas em formato ISO (AAAA-MM-DD). Data é data de calendário: não aplique
   fuso e não converta.
6. Ao encontrar remissão a peça que não está no lote recebido ("conforme
   petição de fl. 412"), registre em lacunas em vez de inventar o conteúdo.
7. Se o documento estiver ilegível, cortado ou for digitalização ruim, diga
   isso em lacunas e baixe a confiança daquela seção.`;

export const SISTEMA_ANALISE_AUTOS = `Você analisa autos de processos de EXECUÇÃO e de CUMPRIMENTO DE SENTENÇA
para o escritório que representa o CREDOR (exequente). Seu trabalho é dizer,
com precisão de auditoria, o que já foi feito para encontrar e constringir
patrimônio do devedor, quanto disso virou dinheiro, e o que ainda falta fazer.

Você escreve em português do Brasil, com acentuação correta.

${ONTOLOGIA}

${DISCIPLINA}`;

/** Passada 1 — um lote de páginas por vez. */
export function promptExtracao(args: {
  paginaInicial: number;
  paginaFinal: number;
  totalPaginas: number;
  resumoAnterior?: string;
}): string {
  const { paginaInicial, paginaFinal, totalPaginas, resumoAnterior } = args;
  const abertura = resumoAnterior
    ? `Do que já foi lido nos lotes anteriores, para você não repetir a identificação e não se perder na cronologia:\n${resumoAnterior}`
    : "Este é o primeiro lote.";

  return `Você recebeu as páginas ${paginaInicial} a ${paginaFinal} de um capa a capa de ${totalPaginas} páginas.

${abertura}

Extraia apenas o que está nestas páginas. Não conclua, não recomende, não
projete: outra passada fará isso. Aqui você é olho, não cabeça.

Preencha:

- identificacao: número CNJ, tribunal, comarca, vara, classe, assunto, valor
  da causa, data de distribuição, juiz. Só se aparecer.
- partes: polo (exequente, executado, terceiro interessado), nome, documento,
  advogados e endereços encontrados. Marque o polo com cuidado: nós somos o
  credor.
- medidas: cada ato de busca ou constrição patrimonial, com a espécie do
  vocabulário fechado, se é típica ou atípica, as datas dos quatro estados,
  o resultado, o valor bloqueado e o liberado quando houver, e o bem atingido.
- valores: cada menção a valor do débito, com a rubrica (principal, correção,
  juros, multa do 523, honorários de execução, honorários de sucumbência,
  custas, total) e a origem (planilha do exequente, decisão, cálculo do
  contador, depósito, intimação para pagamento).
- pagamentos: toda entrada de dinheiro em favor do credor, seja depósito,
  alvará, levantamento, transferência de valor bloqueado ou parcela de acordo.
- bens: todo bem patrimonial mencionado, com identificador (matrícula, placa,
  conta, participação societária), titular, valor de avaliação e situação.
- eventos: a cronologia crua do que aconteceu nestas páginas, uma linha cada,
  com data.
- lacunas: remissões a peças ausentes, páginas ilegíveis, dados cortados.

Devolva somente a estrutura pedida.`;
}

/** Passada 2 — recebe os JSON dos lotes, não o PDF. */
export function promptConsolidacao(args: {
  totalPaginas: number;
  totalLotes: number;
  dataDeHoje: string;
  extracoesJson: string;
  dadosAssertiva?: string;
}): string {
  const { totalPaginas, totalLotes, dataDeHoje, extracoesJson, dadosAssertiva } =
    args;
  const blocoAssertiva = dadosAssertiva
    ? `O escritório já possui, de consultas cadastrais JÁ PAGAS (Assertiva Localize e Veículos), os dados abaixo sobre este devedor. Use-os apenas para dizer se uma medida ainda não tentada tem alvo concreto — por exemplo, recomendar RENAJUD porque há veículo conhecido. Nunca trate esses dados como prova dos autos, nunca os cite como fundamento e nunca os reproduza no texto de uma peça: o contrato da Assertiva proíbe (cláusula 4.4). Eles orientam a estratégia, não instruem o processo.\n\n${dadosAssertiva}`
    : "O escritório não tem consultas cadastrais pagas deste devedor em mãos.";

  return `Abaixo estão as extrações dos ${totalLotes} lotes de um capa a capa de ${totalPaginas} páginas, em JSON. Hoje é ${dataDeHoje}.

${extracoesJson}

${blocoAssertiva}

Agora consolide e diagnostique.

1. Deduplicar. O mesmo ato aparece várias vezes (petição, decisão, certidão,
   resposta). Una em uma única medida, preservando todas as páginas de origem
   e a data mais precisa de cada estado.

2. Montar o CAMINHO. Ordene as medidas cronologicamente e classifique cada uma
   como concluída com resultado positivo, concluída com resultado negativo,
   parcial, pendente de resposta, indeferida, ou abandonada (requerida e nunca
   decidida há mais de 180 dias). O caminho é a espinha da tela: ele precisa
   contar a história da execução para quem olha por cinco segundos.

3. Reconstruir o DÉBITO. Parta do valor mais recente com origem confiável.
   Some o que houver de correção, juros, multa e honorários conforme os autos.
   Abata pagamentos e levantamentos. Informe o saldo, a data-base e de onde
   veio cada número. Se os autos não permitirem fechar a conta, diga
   exatamente o que falta: nunca estime um valor sem base.

4. Medir a SATISFAÇÃO. Separe três coisas que sempre se confundem: valor
   bloqueado, valor efetivamente levantado pelo credor, e valor de bem
   penhorado ainda não convertido em dinheiro. Só o segundo satisfaz débito.

5. Dizer a ETAPA do processo, com justificativa.

6. Listar o que FALTA, em ordem de prioridade. Para cada medida faltante diga
   por que ela cabe agora, qual o fundamento legal, o que o juízo precisa
   receber para deferir, e se ela está pronta para ser pedida ou se depende de
   algo antes. Inclua explicitamente as medidas típicas nunca tentadas, as
   tentadas há mais de um ano que comportam renovação, e as atípicas — estas
   apenas quando as típicas estiverem razoavelmente esgotadas, dizendo isso.

7. Calcular a CHANCE DE ÊXITO como soma de fatores visíveis, nunca como número
   solto. Cada fator traz nome, peso, se pesa a favor ou contra, e uma frase de
   explicação. Considere, entre outros que os autos revelarem: bens localizados
   e livres; resultado positivo anterior em bloqueio, ainda que parcial;
   devedor pessoa jurídica ativa; imóvel com matrícula sem ônus; existência de
   sócios ou grupo econômico que viabilize IDPJ; e, em sentido contrário,
   sequência de buscas negativas, inércia prolongada, suspensão do 921, risco
   de prescrição intercorrente, devedor falecido ou empresa baixada, indício de
   bem de família. O número final é a soma explicada, e quem lê precisa
   conseguir discordar de um fator específico.

8. Propor a PRÓXIMA MOVIMENTAÇÃO: uma só, a que destrava mais valor agora, com
   o tipo de peça, os fundamentos e os pedidos exatos que ela deve conter.

9. Levantar ALERTAS de prazo e de risco, com destaque para prescrição
   intercorrente, penhora sem avaliação, bloqueio pendente de conversão e
   reiteração de SISBAJUD vencida.

Onde a sua conclusão depender de algo que não está nos autos, diga.`;
}

/** Passada 3 — redige a peça da próxima movimentação. */
export function promptRedacaoPeca(args: {
  fichaJson: string;
  movimentacaoEscolhida: string;
  bensSelecionados?: string;
  dataDeHoje: string;
}): string {
  const { fichaJson, movimentacaoEscolhida, bensSelecionados, dataDeHoje } =
    args;
  const blocoBens = bensSelecionados
    ? `\nBENS QUE O ADVOGADO QUER VER NA PEÇA:\n${bensSelecionados}\n`
    : "";

  return `Redija a petição correspondente à movimentação escolhida, para protocolo no processo descrito. Hoje é ${dataDeHoje}.

FICHA CONSOLIDADA DO PROCESSO (resultado da análise dos autos):
${fichaJson}

MOVIMENTAÇÃO ESCOLHIDA PELO ADVOGADO: ${movimentacaoEscolhida}
${blocoBens}
Regras de redação:

- Peça de advogado de credor, em português do Brasil, impessoal, direta, sem
  adjetivação e sem citação doutrinária decorativa.
- Estrutura: endereçamento ao juízo; identificação das partes e do processo;
  síntese curta do que já se tentou nos autos, com remissão às páginas;
  fundamentação enxuta com os dispositivos realmente aplicáveis; pedidos
  numerados, específicos e executáveis pelo cartório; fecho com local, data,
  nome e OAB.
- Cada afirmação de fato remete à página dos autos de onde veio. Não afirme
  nada que a ficha não comprove.
- É proibido reproduzir, citar ou fundamentar em dado vindo de consulta
  cadastral privada (Assertiva Localize, Veículos ou equivalente). Se a
  estratégia nasceu dali, peça a diligência judicial correspondente (RENAJUD,
  INFOJUD, ofício) sem revelar a origem da informação.
- Valores em algarismo e por extenso na primeira vez.
- Não invente número de conta, matrícula, placa ou endereço: use só o que está
  na ficha. Se um dado essencial faltar, escreva o marcador
  [PREENCHER: descrição do que falta] no lugar, para o advogado completar.
- Não prometa resultado nem antecipe convencimento do juízo.`;
}
