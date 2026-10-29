// Estilo BP 2026 — calibragem por exemplo e checklist de qualidade.
//
// Vem do Master Prompt BP (Caio, 29/10/2026). Os exemplos são few-shot de
// ESTILO: fixam cadência, vocabulário ritual e formato de pedido. Os fatos
// neles são FICTÍCIOS e nunca podem virar fonte de fato nem de precedente —
// é o que o próprio Master Prompt determina.
//
// Separado dos prompts porque o escritório vai querer trocar isto por peças
// reais anonimizadas sem mexer na lógica da análise.

/**
 * Peças reais do escritório, anonimizadas. Quando preenchido, substitui os
 * exemplos de calibragem como padrão de estilo.
 */
export const EXEMPLOS_DO_ESCRITORIO = "";

export const EXEMPLOS_CALIBRAGEM = `## Exemplos de calibragem (fatos fictícios — reproduza o PADRÃO, nunca o conteúdo)

ABERTURA DA SÍNTESE:
"Cuida-se de cumprimento de sentença em que a EXECUTADA, regularmente
intimada em [●] (ev. [●]), deixou transcorrer sem pagamento o prazo do
art. 523 do Código de Processo Civil, tendo a ordem de bloqueio anterior
resultado negativa (ev. [●])."

PEDIDO DE BLOQUEIO:
"a) a expedição de ordem de bloqueio de ativos financeiros, via SISBAJUD,
sem prévia ciência da EXECUTADA (art. 854 do CPC), em face do CNPJ nº [●],
até o limite de R$ [●], atualizado até [●], alcançando contas de depósito,
poupança, aplicações, fundos e contas de pagamento, na modalidade de
bloqueio permanente onde disponível e, subsidiariamente, com reiteração
automática por 30 (trinta) dias, renovável;"

PEDIDO ESCALONADO (sempre com o gatilho explícito):
"b) na hipótese de resultado negativo ou insuficiente da ordem requerida no
item \\"a\\", desde já requer a requisição de informações e a consulta ao CCS,
com as guias anexas (doc. [●]);"

INTIMAÇÃO PRÉVIA PARA ATÍPICAS (o máximo que se pode escalonar — Tema 1137):
"d) a intimação da EXECUTADA para que, no prazo de 15 (quinze) dias, efetue
o pagamento do débito, indique bens penhoráveis livres e desembaraçados ou
justifique fundamentadamente a impossibilidade de fazê-lo, sob advertência
de que, no silêncio ou diante de justificativa inidônea, serão requeridas a
suspensão de seu passaporte e a inclusão de seu CPF na Central Nacional de
Indisponibilidade de Bens, pelo prazo de 180 (cento e oitenta) dias, nos
termos do art. 139, IV, do Código de Processo Civil e do Tema Repetitivo
1137 do Superior Tribunal de Justiça;"

SUBTÓPICO DE DIREITO COMPLETO (note a cadência: proêmio constitucional,
dispositivo transcrito, precedente com tese literal, subsunção ao caso com
referência, antecipação do contra-argumento, conclusão imperativa):

"4.1 — DA REITERAÇÃO AUTOMÁTICA DA ORDEM DE BLOQUEIO DE ATIVOS FINANCEIROS

De proêmio, cumpre rememorar que a tutela executiva efetiva e a razoável
duração do processo constituem garantias fundamentais do jurisdicionado
(art. 5º, incisos XXXV e LXXVIII, da Constituição Federal), cuja
concretização, na execução por quantia certa, passa necessariamente pela
constrição prioritária de dinheiro.

Nesse sentido, dispõe o art. 835, §1º, do Código de Processo Civil:

'§ 1º É prioritária a penhora em dinheiro, podendo o juiz, nas demais
hipóteses, alterar a ordem prevista no caput de acordo com as
circunstâncias do caso concreto.'

Nessa toada, ao julgar o Tema Repetitivo 1325, o Superior Tribunal de
Justiça assentou a legitimidade da reiteração automática das ordens de
bloqueio, atribuindo ao executado o ônus de demonstrar meio menos gravoso.
Vejamos: [tese literal, com a nota de rodapé do acórdão]

Verifica-se, no caso concreto, que a única ordem expedida resultou negativa
(ev. [●]), não tendo a EXECUTADA, regularmente intimada (ev. [●]), indicado
qualquer bem à penhora.

Nem se alegue que a reiteração seria medida gravosa, porquanto o parágrafo
único do art. 805 do Código de Processo Civil impõe a quem a alega o ônus de
indicar meio mais eficaz e menos oneroso, o que a EXECUTADA, até aqui, não
fez.

Destarte, impõe-se a expedição de nova ordem de bloqueio, na modalidade de
bloqueio permanente onde disponível e, subsidiariamente, com reiteração
automática pelo prazo de 30 (trinta) dias, renovável."`;

/**
 * Os 26 itens do checklist de qualidade do Master Prompt BP.
 *
 * Entram no prompt de redação como auto-revisão antes de fechar a peça: o
 * modelo percorre a lista no papel do JUIZ DA EXECUÇÃO e corrige o que
 * falhar, em vez de entregar e deixar o erro para o protocolo descobrir.
 */
export const CHECKLIST_QUALIDADE = `## Checklist de qualidade — percorra antes de fechar a peça e corrija o que falhar

FATOS
1. Toda afirmação fática tem folha ou evento.
2. Data de corte e último evento declarados.
3. Todos os executados identificados com CPF/CNPJ.
4. Valor e data-base conferem com a planilha, ou estão marcados com [●].
5. Nenhuma informação presumida além dos autos.

DIREITO
6. Cada medida pedida cumpre cabimento, instrução, fundamentos, pedidos,
   erros fatais, auditoria e desdobramento.
7. Artigos conferidos até o parágrafo e o inciso.
8. Só precedentes da base autorizada, com tese literal.
9. Temas 1137, 1230, 1235 e 1210 invocados onde incidem; Tema 1325
   apresentado como PERSUASIVO, nunca como vinculante na execução civil.
10. Contra-argumento provável do EXECUTADO antecipado em cada tópico.

PEDIDOS
11. Ordem dos pedidos igual à do plano.
12. Cada pedido com sistema, CPF/CNPJ, valor, data-base e prazo.
13. Pedidos escalonados com gatilho explícito.
14. Nenhuma atípica automática; contraditório prévio e prazo previstos.
15. Guias listadas por sistema e por pessoa.
16. Intimações obrigatórias pedidas: cônjuge, condôminos, credores com
    garantia real, terceiros devedores.

PRAZOS E RISCOS
17. Prescrição intercorrente calculada, com semáforo.
18. Prazos em curso identificados e respeitados.
19. Matriz de vulnerabilidades percorrida.
20. Poderes da procuração conferidos para o levantamento (art. 105).

ESTILO
21. Estrutura ritual e títulos do Estilo BP 2026.
22. Prosa contínua, sem marcadores nem travessão argumentativo.
23. Partes em caixa alta e honoríficos corretos.
24. "Ex positis, requer-se" antes dos pedidos enumerados.

SAÍDA
25. Pendências listadas ao final, com o que obter e onde.
26. Nenhum dado essencial faltando sem o marcador [●].`;
