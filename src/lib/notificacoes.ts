// Notificacoes do Sonar — mock in-memory pra demo.
//
// Espelha o padrao de `lib/bugs.ts` e `lib/sugestoes.ts`:
//   - arrays _xxxx privados
//   - funcoes listar/buscar/marcar com Promise<>
//   - sem dependencia de Supabase (100% in-memory)
//
// Sao DOIS canais separados:
//   - equipe : notificacoes dos advogados (novos processos Themis, bens
//              encontrados, audiencias, casos parados, limite consultas, etc).
//   - cliente: notificacoes dos clientes (patrimonio encontrado no caso dele,
//              recuperacao efetivada, audiencia agendada, etc).
//
// As CATEGORIAS sao diferentes em cada canal — equipe nunca ve "Recuperacao
// Efetivada" e cliente nunca ve "Limite Mensal Excedido pelo Advogado".
//
// Conversao de `relativaEm` (texto humano) -> `criadoEm` (ISO) eh feita uma
// unica vez no module-init, usando Date.now() menos um offset estimado. O
// texto literal eh preservado em `relativaEm` pra exibicao direta.

import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  FileText,
  Gavel,
  Gem,
  Landmark,
  MessageSquare,
  Settings,
  TrendingUp,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// --------------------------------------------------------------------------
// Tipos
// --------------------------------------------------------------------------

export type PortalNotificacao = "equipe" | "cliente";

export type NotificacaoCategoriaEquipe =
  | "themis-novo-processo"
  | "patrimonio-bem-encontrado"
  | "processo-medida"
  | "processo-audiencia"
  | "processo-parado"
  | "cliente-novo"
  | "consulta-limite"
  | "sistema";

export type NotificacaoCategoriaCliente =
  | "patrimonio-encontrado"
  | "recuperacao-efetivada"
  | "relatorio-mensal"
  | "mensagem-escritorio"
  | "limite-consultas";

export type NotificacaoCategoria =
  | NotificacaoCategoriaEquipe
  | NotificacaoCategoriaCliente;

export type ReferenciaNotificacao = {
  caso_id?: number;
  devedor_nome?: string;
  valor_brl?: number;
};

export type Notificacao = {
  id: string;
  portal: PortalNotificacao;
  categoria: NotificacaoCategoria;
  titulo: string;
  resumo: string;
  corpo: string;
  criadoEm: string; // ISO
  relativaEm: string; // texto humano: "agora mesmo", "ha 5 min", "ha 2 dias"
  lida: boolean;
  destinatarioEmail?: string; // so usado no canal CLIENTE
  referencias?: ReferenciaNotificacao;
};

// --------------------------------------------------------------------------
// Categorias — rotulo + icone + cor de token CSS
// --------------------------------------------------------------------------

type CategoriaConfig<C extends string> = {
  chave: C;
  rotulo: string;
  icone: LucideIcon;
  cor: string; // CSS token
  corNome: "signal" | "gold" | "devedor" | "advogado";
};

export const CATEGORIAS_EQUIPE: ReadonlyArray<
  CategoriaConfig<NotificacaoCategoriaEquipe>
> = [
  {
    chave: "themis-novo-processo",
    rotulo: "Themis",
    icone: FileText,
    cor: "var(--color-signal)",
    corNome: "signal",
  },
  {
    chave: "patrimonio-bem-encontrado",
    rotulo: "Patrimônio",
    icone: Landmark,
    cor: "var(--color-gold)",
    corNome: "gold",
  },
  {
    chave: "processo-medida",
    rotulo: "Processo",
    icone: Gavel,
    cor: "var(--color-signal)",
    corNome: "signal",
  },
  {
    chave: "processo-audiencia",
    rotulo: "Audiência",
    icone: Calendar,
    cor: "var(--color-gold)",
    corNome: "gold",
  },
  {
    chave: "processo-parado",
    rotulo: "Caso Parado",
    icone: AlertTriangle,
    cor: "var(--color-devedor)",
    corNome: "devedor",
  },
  {
    chave: "cliente-novo",
    rotulo: "Cliente",
    icone: UserPlus,
    cor: "var(--color-signal)",
    corNome: "signal",
  },
  {
    chave: "consulta-limite",
    rotulo: "Consultas",
    icone: Wallet,
    cor: "var(--color-devedor)",
    corNome: "devedor",
  },
  {
    chave: "sistema",
    rotulo: "Sistema",
    icone: Settings,
    cor: "var(--color-advogado, var(--color-ivory-66))",
    corNome: "advogado",
  },
];

export const CATEGORIAS_CLIENTE: ReadonlyArray<
  CategoriaConfig<NotificacaoCategoriaCliente>
> = [
  {
    chave: "patrimonio-encontrado",
    rotulo: "Patrimônio Encontrado",
    icone: Gem,
    cor: "var(--color-signal)",
    corNome: "signal",
  },
  {
    chave: "recuperacao-efetivada",
    rotulo: "Recuperação Efetivada",
    icone: TrendingUp,
    cor: "var(--color-signal)",
    corNome: "signal",
  },
  {
    chave: "relatorio-mensal",
    rotulo: "Relatório Mensal",
    icone: FileText,
    cor: "var(--color-advogado, var(--color-ivory-66))",
    corNome: "advogado",
  },
  {
    chave: "mensagem-escritorio",
    rotulo: "Mensagem do Escritório",
    icone: MessageSquare,
    cor: "var(--color-advogado, var(--color-ivory-66))",
    corNome: "advogado",
  },
  {
    chave: "limite-consultas",
    rotulo: "Limite de Consultas",
    icone: AlertCircle,
    cor: "var(--color-devedor)",
    corNome: "devedor",
  },
];

// --------------------------------------------------------------------------
// Helpers de categoria
// --------------------------------------------------------------------------

export function configCategoria(
  portal: PortalNotificacao,
  chave: NotificacaoCategoria,
): CategoriaConfig<NotificacaoCategoria> | null {
  const tabela =
    portal === "equipe" ? CATEGORIAS_EQUIPE : CATEGORIAS_CLIENTE;
  const found = tabela.find((c) => c.chave === chave) as
    | CategoriaConfig<NotificacaoCategoria>
    | undefined;
  return found ?? null;
}

export function rotuloCategoria(
  portal: PortalNotificacao,
  chave: NotificacaoCategoria,
): string {
  return configCategoria(portal, chave)?.rotulo ?? String(chave);
}

export function iconeCategoria(
  portal: PortalNotificacao,
  chave: NotificacaoCategoria,
): LucideIcon {
  return configCategoria(portal, chave)?.icone ?? Bell;
}

// --------------------------------------------------------------------------
// Conversao "relativa_em" -> "criadoEm" ISO
// --------------------------------------------------------------------------

// Tabela aproximada de quanto tempo subtrair do "agora" pra cada rotulo
// usado nos mocks. Eh chamada UMA UNICA VEZ no module-init.
function relativaParaIso(relativa: string, agora: number): string {
  const r = relativa.trim().toLowerCase();
  const min = 60_000;
  const hora = 60 * min;
  const dia = 24 * hora;

  let offset = 0;
  if (r === "agora mesmo") offset = 30_000;
  else if (r === "há 5 min" || r === "ha 5 min") offset = 5 * min;
  else if (r === "há 22 min" || r === "ha 22 min") offset = 22 * min;
  else if (r === "há 1 hora" || r === "ha 1 hora") offset = 1 * hora;
  else if (r === "há 3 horas" || r === "ha 3 horas") offset = 3 * hora;
  else if (r === "há 5 horas" || r === "ha 5 horas") offset = 5 * hora;
  else if (r === "há 7 horas" || r === "ha 7 horas") offset = 7 * hora;
  else if (r === "há 8 horas" || r === "ha 8 horas") offset = 8 * hora;
  else if (r === "há 1 dia" || r === "ha 1 dia") offset = 1 * dia;
  else if (r === "há 2 dias" || r === "ha 2 dias") offset = 2 * dia;
  else if (r === "há 3 dias" || r === "ha 3 dias") offset = 3 * dia;
  else if (r === "há 4 dias" || r === "ha 4 dias") offset = 4 * dia;
  else if (r === "há 5 dias" || r === "ha 5 dias") offset = 5 * dia;
  else {
    // Fallback: tenta extrair numero + unidade
    const m = r.match(/(\d+)\s*(min|minuto|minutos|hora|horas|dia|dias)/);
    if (m) {
      const n = parseInt(m[1], 10);
      const u = m[2];
      if (u.startsWith("min")) offset = n * min;
      else if (u.startsWith("hora")) offset = n * hora;
      else if (u.startsWith("dia")) offset = n * dia;
    } else {
      offset = 12 * hora;
    }
  }

  return new Date(agora - offset).toISOString();
}

// --------------------------------------------------------------------------
// Email demo (vinculacao das notificacoes de cliente)
// --------------------------------------------------------------------------

const EMAIL_CLIENTE_DEMO = "cliente.demo@battaglia.com.br";

// --------------------------------------------------------------------------
// Mocks — Equipe
// --------------------------------------------------------------------------

const AGORA = Date.now();

type MockInput = Omit<Notificacao, "portal" | "criadoEm" | "destinatarioEmail">;

const MOCKS_EQUIPE: MockInput[] = [
  {
    id: "notif-eq-001",
    categoria: "themis-novo-processo",
    titulo: "Novo Processo Recebido via Themis",
    resumo:
      "Execução fiscal de R$ 487.320,55 contra Construtora Horizonte Norte LTDA foi vinculada ao caso 4 e aguarda triagem.",
    corpo:
      "A integração com o Themis identificou às 14:22 um novo processo distribuído na 12ª Vara da Fazenda Pública de São Paulo contra Construtora Horizonte Norte LTDA (CNPJ 18.432.876/0001-04). O valor da causa atualizado é de R$ 487.320,55, referente a débitos de ISS dos exercícios 2021 a 2023.\n\nO processo foi vinculado automaticamente ao caso 4, que já agrupa outros dois feitos contra o mesmo devedor. A advogada responsável atual é Fabiane, mas a distribuição pode ser revisada na Fila Themis.\n\nNão há ainda pesquisa patrimonial agendada — o devedor já possui histórico de bens encontrados (galpão em Guarulhos avaliado em R$ 2,1 mi), o que sugere viabilidade alta. Sugerimos iniciar pelo combo doc + ARISP para confirmar a permanência do imóvel.\n\nAções recomendadas: confirmar advogado responsável, agendar pesquisa patrimonial e revisar prazo de contestação (vencimento estimado para 12/07/2026).",
    relativaEm: "há 5 min",
    lida: false,
    referencias: {
      caso_id: 4,
      devedor_nome: "Construtora Horizonte Norte LTDA",
      valor_brl: 487320.55,
    },
  },
  {
    id: "notif-eq-002",
    categoria: "patrimonio-bem-encontrado",
    titulo: "Novo Bem Encontrado: Imóvel em Alphaville",
    resumo:
      "ARISP localizou casa de alto padrão em nome de Carlos Eduardo Mendes Albuquerque, avaliada preliminarmente em R$ 3,4 mi.",
    corpo:
      "A consulta combo ARISP rodada hoje pelo advogado Igor retornou uma matrícula até então desconhecida no nome do devedor Carlos Eduardo Mendes Albuquerque, vinculado ao caso 1. Trata-se de imóvel residencial de alto padrão localizado em Alphaville, Barueri/SP (matrícula 124.087, 12º Oficial de Registro de Imóveis).\n\nO valor venal lançado é de R$ 1,2 mi, mas a avaliação de mercado preliminar (CEPEMI) aponta para R$ 3,4 mi — o que cobriria com folga o saldo executado de R$ 1,87 mi.\n\nO imóvel está registrado em nome do devedor desde 2018, sem averbações de penhora ou alienação fiduciária. Há, contudo, uma hipoteca em favor do Banco Itaú no valor original de R$ 600 mil (saldo devedor estimado em R$ 410 mil), o que ainda mantém o bem viável para constrição.\n\nSugerimos protocolar pedido de penhora imediata e averbação no CRI antes que o devedor tenha ciência do achado.",
    relativaEm: "há 22 min",
    lida: false,
    referencias: {
      caso_id: 1,
      devedor_nome: "Carlos Eduardo Mendes Albuquerque",
      valor_brl: 3400000,
    },
  },
  {
    id: "notif-eq-003",
    categoria: "processo-medida",
    titulo: "Penhora Efetivada no Caso 3",
    resumo:
      "Bloqueio Sisbajud de R$ 218.450,90 em conta da Pedro Almeida ME foi convertido em penhora efetiva.",
    corpo:
      "A medida de constrição patrimonial protocolada por Hugo no dia 18/06 foi homologada hoje pela 4ª Vara Cível de Curitiba. O valor de R$ 218.450,90 bloqueado via Sisbajud em conta corrente do Bradesco (ag. 0428, c/c 12.345-6) titularizada por Pedro Almeida ME foi formalmente convertido em penhora efetiva.\n\nO valor representa cerca de 38% do saldo executado total no caso 3 (R$ 575.000). O devedor já foi intimado e o prazo de embargos é de 15 dias úteis a partir de 23/06.\n\nA próxima etapa é o levantamento do valor para depósito judicial vinculado ao cliente. Recomenda-se também iniciar nova pesquisa patrimonial para identificar bens complementares, considerando que o saldo remanescente ainda justifica esforço.\n\nO caso continua sob responsabilidade do advogado Hugo, com auxílio da Katia no acompanhamento das intimações.",
    relativaEm: "há 1 hora",
    lida: false,
    referencias: {
      caso_id: 3,
      devedor_nome: "Pedro Almeida ME",
      valor_brl: 218450.9,
    },
  },
  {
    id: "notif-eq-004",
    categoria: "processo-audiencia",
    titulo: "Audiência de Conciliação em 48h",
    resumo:
      "Caso 2 contra Maria Aparecida Santos tem audiência marcada para 27/06 às 14h00 no CEJUSC de Santo André.",
    corpo:
      "Lembrete automático: a audiência de conciliação designada pela 2ª Vara Cível de Santo André no processo do caso 2 está marcada para sexta-feira, 27/06/2026, às 14h00, no CEJUSC local (Rua das Figueiras, 410 — 3º andar).\n\nA devedora Maria Aparecida Santos foi pessoalmente intimada em 12/06 e confirmou presença via Whatsapp ao advogado Remo. O cliente credor já foi consultado sobre faixa de proposta e autorizou negociação a partir de R$ 95 mil em até 24 parcelas.\n\nO saldo executado atualizado é de R$ 142.880, e a pesquisa patrimonial mais recente (15/06) localizou apenas um veículo Fiat Mobi 2019 (avaliado em R$ 38 mil) — o que reforça a viabilidade do acordo dentro da faixa proposta.\n\nResponsável pela audiência: Remo Battaglia. Documentos de instrução já estão na pasta digital do caso.",
    relativaEm: "há 3 horas",
    lida: true,
    referencias: {
      caso_id: 2,
      devedor_nome: "Maria Aparecida Santos",
      valor_brl: 142880,
    },
  },
  {
    id: "notif-eq-005",
    categoria: "processo-parado",
    titulo: "Caso 5 Sem Movimentação Há 34 Dias",
    resumo:
      "Execução contra Construtora Horizonte Norte LTDA permanece sem nova diligência desde 22/05 — última pesquisa retornou negativa.",
    corpo:
      "O sistema identificou que o caso 5, sob responsabilidade da advogada Fabiane, completou hoje 34 dias sem nova movimentação patrimonial ou processual ativa. A última ação registrada foi uma pesquisa combo doc 2x realizada em 22/05, que retornou sem novos bens em comparação ao snapshot anterior.\n\nO saldo executado é de R$ 312.450, sem garantia parcial constituída. O devedor (Construtora Horizonte Norte LTDA) possui apenas um veículo penhorado (caminhão Mercedes Atego 2015, avaliado em R$ 165 mil), insuficiente para cobrir o débito.\n\nA política interna do escritório aciona o aviso aos 30 dias para evitar prescrição intercorrente — o próximo marco crítico é 22/08, quando completam 90 dias.\n\nSugestões: (a) nova consulta Cenprot incluindo protestos recentes, (b) verificação de novos vínculos societários via Receita Federal, (c) contato com cliente para reavaliar continuidade da execução.",
    relativaEm: "há 5 horas",
    lida: true,
    referencias: {
      caso_id: 5,
      devedor_nome: "Construtora Horizonte Norte LTDA",
      valor_brl: 312450,
    },
  },
  {
    id: "notif-eq-006",
    categoria: "consulta-limite",
    titulo: "Limite Mensal de Consultas em 92%",
    resumo:
      "Advogado Paulo consumiu R$ 4.620 do limite de R$ 5.000 em consultas pagas — 8 dias até virada do mês.",
    corpo:
      "O advogado Paulo André atingiu 92% do limite mensal individual de gastos com APIs pagas (BigDataCorp, Cenprot, ARISP, Assertiva). O consumo atualizado é de R$ 4.620,30, dentro do teto configurado de R$ 5.000 mensais.\n\nNos últimos 7 dias, o ritmo médio foi de R$ 142/dia, projeção que ultrapassaria o limite em 3 dias úteis se mantido. As consultas mais caras do mês foram dois combos doc completos (R$ 380 cada), ambos no caso 1.\n\nNão há bloqueio automático — apenas alerta. Caso Paulo precise rodar consultas adicionais ainda neste ciclo, é possível: (a) aguardar a virada do mês em 03/07, (b) solicitar ampliação temporária de limite via Configurações, (c) reaproveitar dados de consultas já feitas no mesmo devedor nos últimos 30 dias (cache).\n\nO Monitor de Custos detalha cada lançamento por cliente, devedor e tipo de API.",
    relativaEm: "há 7 horas",
    lida: true,
    referencias: {
      valor_brl: 4620.3,
    },
  },
  {
    id: "notif-eq-007",
    categoria: "patrimonio-bem-encontrado",
    titulo: "Valor Estimado Reavaliado: +R$ 410 Mil",
    resumo:
      "Galpão industrial de Construtora Horizonte Norte LTDA teve laudo CEPEMI atualizado — sobe de R$ 1,69 mi para R$ 2,10 mi.",
    corpo:
      "A reavaliação periódica CEPEMI rodada hoje no galpão industrial de 1.840 m² em Guarulhos/SP (matrícula 78.451, vinculado ao caso 4) atualizou o valor de mercado para R$ 2,10 milhões. O valor anterior, lançado em 02/2026, era de R$ 1,69 milhão — alta de 24,3% (R$ 410 mil).\n\nA elevação reflete: (a) ajuste pelo índice CUB-SP no período, (b) maior demanda por galpões logísticos na região do Anel Viário Norte, (c) reforma de fachada averbada na matrícula em 04/2026.\n\nO bem está penhorado nos autos do caso 4 contra Construtora Horizonte Norte LTDA desde 03/2025. A nova avaliação fortalece a posição do cliente em eventual hasta pública e justifica reabertura de proposta de acordo.\n\nSugestão: notificar o cliente credor e considerar novo cálculo do quantum disponível para abatimento direto da dívida.",
    relativaEm: "há 1 dia",
    lida: true,
    referencias: {
      caso_id: 4,
      devedor_nome: "Construtora Horizonte Norte LTDA",
      valor_brl: 2100000,
    },
  },
  {
    id: "notif-eq-008",
    categoria: "cliente-novo",
    titulo: "Novo Cliente Cadastrado: Indústria Atlântico SA",
    resumo:
      "Cadastro feito por Katia — 14 processos importados do Themis aguardam triagem inicial na fila.",
    corpo:
      "A advogada Katia concluiu hoje o cadastro de novo cliente: Indústria Atlântico SA (CNPJ 09.184.502/0001-77), grupo do segmento metalúrgico sediado em Joinville/SC. O contrato de honorários (êxito 20% + R$ 1.500 mensais de manutenção) foi assinado e está arquivado na pasta digital.\n\nA importação automática via Themis trouxe 14 processos ativos em que a empresa figura como exequente, com saldo executado consolidado de R$ 8,7 milhões distribuído entre 9 devedores distintos (6 PJ e 3 PF).\n\nOs casos estão na Fila Themis aguardando triagem de viabilidade e distribuição entre os advogados. Sugere-se priorizar os 3 processos com valor acima de R$ 1 mi, que totalizam R$ 5,4 mi do volume.\n\nO cliente solicitou reunião de kick-off na semana que vem para alinhamento de expectativas e critérios de priorização.",
    relativaEm: "há 1 dia",
    lida: true,
  },
  {
    id: "notif-eq-009",
    categoria: "themis-novo-processo",
    titulo: "Processo Atualizado no Themis: Sentença Publicada",
    resumo:
      "Caso 2 contra Maria Aparecida Santos teve sentença de procedência publicada no DJe — prazo recursal começa a correr.",
    corpo:
      "O sincronizador Themis identificou nova movimentação no processo principal do caso 2: sentença de procedência publicada no Diário da Justiça Eletrônico em 24/06, condenando Maria Aparecida Santos ao pagamento de R$ 142.880 mais juros, correção monetária e honorários sucumbenciais de 10%.\n\nO prazo recursal de 15 dias úteis começou a correr em 25/06 e termina em 16/07/2026. A devedora ainda não constituiu advogado nos autos, o que reduz a probabilidade de recurso. O advogado Remo, responsável pelo caso, já recebeu push e e-mail de alerta.\n\nA sentença abre caminho para início imediato da fase de cumprimento, com possibilidade de pedido de penhora online (Sisbajud) tão logo transitada em julgado.\n\nDocumento PDF da sentença foi anexado automaticamente à pasta digital do caso. Texto integral disponível para leitura na tela do processo.",
    relativaEm: "há 2 dias",
    lida: true,
    referencias: {
      caso_id: 2,
      devedor_nome: "Maria Aparecida Santos",
      valor_brl: 142880,
    },
  },
  {
    id: "notif-eq-010",
    categoria: "sistema",
    titulo: "Falha Intermitente na API ARISP",
    resumo:
      "Provedor reportou indisponibilidade parcial entre 09h e 11h30 hoje — 3 consultas falharam e foram reagendadas.",
    corpo:
      "O provedor ARISP comunicou indisponibilidade parcial em sua API REST entre 09h00 e 11h30 desta manhã, com taxa de erro reportada de aproximadamente 34%. O incidente já foi resolvido pelo lado deles.\n\nNo Sonar, 3 consultas combo ARISP falharam neste período (2 do advogado Igor no caso 1, 1 do Hugo no caso 3). Todas foram automaticamente colocadas em fila de reprocessamento e executadas com sucesso após 11h45. Nenhum custo adicional foi lançado para o cliente — as tentativas falhas não são cobradas.\n\nO histórico de SLA do ARISP no último trimestre é de 99,2%, dentro do esperado. Não há ação requerida da equipe.\n\nO log completo das tentativas e respostas brutas está disponível em Configurações → Logs de API para auditoria.",
    relativaEm: "há 2 dias",
    lida: true,
  },
  {
    id: "notif-eq-011",
    categoria: "processo-parado",
    titulo: "Pendência: Manifestação Aguardando Há 12 Dias",
    resumo:
      "Caso 1 tem despacho intimando o cliente a se manifestar sobre laudo pericial — prazo de 15 dias vence em 28/06.",
    corpo:
      "O processo principal do caso 1 contra Carlos Eduardo Mendes Albuquerque tem despacho publicado em 12/06 intimando o exequente a se manifestar sobre o laudo pericial de avaliação do imóvel penhorado em Itu/SP. O prazo legal de 15 dias úteis vence em 28/06/2026 (mais 3 dias úteis).\n\nO laudo aponta valor de R$ 940 mil — abaixo dos R$ 1,2 mi avaliados anteriormente pela CEPEMI. A diferença é relevante pois reduz a margem de garantia do crédito executado (R$ 1,87 mi).\n\nO advogado responsável (Igor) ainda não protocolou manifestação. A recomendação é impugnar o laudo apresentando: (a) avaliação CEPEMI paralela, (b) comparativos de mercado de imóveis similares na mesma região, (c) requerimento de nova perícia se necessário.\n\nO cliente já foi consultado em 14/06 e autorizou impugnação. O documento minutado está na pasta digital aguardando revisão final.",
    relativaEm: "há 2 dias",
    lida: true,
    referencias: {
      caso_id: 1,
      devedor_nome: "Carlos Eduardo Mendes Albuquerque",
      valor_brl: 940000,
    },
  },
  {
    id: "notif-eq-012",
    categoria: "sistema",
    titulo: "Relatório Mensal de Maio Disponível",
    resumo:
      "Consolidado de produtividade, custos por advogado e taxa de êxito de medidas patrimoniais foi gerado e pode ser baixado.",
    corpo:
      "O relatório consolidado mensal de maio/2026 foi gerado automaticamente pelo sistema e está disponível para download em formato PDF e XLSX na seção Configurações → Relatórios.\n\nDestaques do mês: (a) 23 novos processos importados do Themis, (b) 41 medidas patrimoniais protocoladas (alta de 12% sobre abril), (c) taxa de êxito em bloqueios Sisbajud de 38% (queda de 4 p.p.), (d) gasto total com APIs pagas de R$ 18.420 (8% acima do orçamento mensal).\n\nO relatório também traz ranking de produtividade por advogado, distribuição de saldo executado por cliente e mapa de calor de viabilidade dos casos ativos.\n\nA versão completa inclui anexo com detalhamento devedor a devedor das pesquisas patrimoniais realizadas, útil para revisão estratégica e renegociação de teto de consultas com o sócio responsável.",
    relativaEm: "há 3 dias",
    lida: true,
    referencias: {
      valor_brl: 18420,
    },
  },
];

// --------------------------------------------------------------------------
// Mocks — Cliente
// --------------------------------------------------------------------------

const MOCKS_CLIENTE: MockInput[] = [
  {
    id: "cli-novo-bem-horizonte",
    categoria: "patrimonio-encontrado",
    titulo: "Novo Imóvel Localizado em Construtora Horizonte",
    resumo:
      "Identificamos um terreno comercial de 1.840 m² em Vinhedo/SP, avaliado em R$ 3,2 milhões, no patrimônio da devedora.",
    corpo:
      "A varredura patrimonial desta semana retornou um resultado importante no processo movido contra a Construtora Horizonte Empreendimentos Ltda. Um terreno comercial de 1.840 m², localizado em Vinhedo/SP, próximo ao corredor da Rod. Anhanguera, foi identificado em nome da empresa.\n\nO imóvel está registrado no 1º Cartório de Registro de Imóveis da comarca e não consta como gravado por hipoteca ou alienação fiduciária. A avaliação preliminar pelo valor de mercado da região aponta R$ 3,2 milhões, suficiente para cobrir mais de 70% do crédito atualizado em aberto.\n\nA matrícula completa já está disponível na ficha do devedor, junto com a localização exata em mapa e o histórico de transmissões dos últimos 10 anos.\n\nO próximo passo natural é avaliar o pedido de penhora deste bem específico. Caso queira conversar sobre estratégia, é só responder por aqui ou agendar uma reunião com o escritório.",
    relativaEm: "agora mesmo",
    lida: false,
    referencias: {
      caso_id: 1042,
      devedor_nome: "Construtora Horizonte Empreendimentos Ltda.",
      valor_brl: 3200000,
    },
  },
  {
    id: "cli-penhora-carlos",
    categoria: "recuperacao-efetivada",
    titulo: "Penhora Efetivada em Conta de Carlos Eduardo",
    resumo:
      "Bloqueio judicial recuperou R$ 187.430,12 em contas bancárias do devedor.",
    corpo:
      "Boa notícia para a sua carteira: o pedido de bloqueio judicial contra Carlos Eduardo Mendes Albuquerque foi atendido integralmente e R$ 187.430,12 já estão bloqueados em contas bancárias do devedor.\n\nO valor representa cerca de 22% do crédito atualizado deste processo. O bloqueio incidiu sobre três contas: duas em bancos digitais e uma em banco tradicional, sendo a maior parcela proveniente de uma conta corrente vinculada à atividade profissional do executado.\n\nO próximo passo é o pedido de conversão em penhora, que costuma ser deferido em até 15 dias. Assim que houver o despacho, vamos solicitar a transferência para a conta judicial vinculada ao processo. A previsão de liberação para o seu CNPJ, contando todos os trâmites, é de 60 a 90 dias.\n\nVocê pode acompanhar todos os detalhes na ficha do caso, incluindo cópias dos extratos e o cálculo atualizado do saldo devedor.",
    relativaEm: "há 3 horas",
    lida: false,
    referencias: {
      caso_id: 871,
      devedor_nome: "Carlos Eduardo Mendes Albuquerque",
      valor_brl: 187430.12,
    },
  },
  {
    id: "cli-bem-veiculo-carlos",
    categoria: "patrimonio-encontrado",
    titulo: "Frota de Veículos Localizada para Carlos Eduardo",
    resumo:
      "RENAJUD apontou três veículos no nome do devedor, somando aproximadamente R$ 412 mil em valor de tabela.",
    corpo:
      "A consulta automatizada ao RENAJUD encontrou três veículos registrados em nome de Carlos Eduardo Mendes Albuquerque, sem restrições ativas até o momento.\n\nSão eles: uma caminhonete Toyota Hilux SRX 2024, avaliada em R$ 298 mil pela tabela FIPE; um sedan Honda Civic Touring 2022, avaliado em R$ 134 mil; e uma motocicleta BMW R 1250 GS 2023, avaliada em R$ 98 mil. Todos com IPVA em dia e licenciamento regular.\n\nO escritório já protocolou pedido de restrição de circulação dos três veículos, o que normalmente é deferido em 5 a 10 dias e impede a transferência. Após o deferimento, pode-se evoluir para penhora e remoção.\n\nA estratégia recomendada é priorizar a Hilux e a BMW, que têm liquidez mais alta em leilão. O Civic pode ser usado como reforço de garantia em uma eventual proposta de acordo.",
    relativaEm: "há 2 dias",
    lida: true,
    referencias: {
      caso_id: 871,
      devedor_nome: "Carlos Eduardo Mendes Albuquerque",
      valor_brl: 530000,
    },
  },
  {
    id: "cli-relatorio-junho",
    categoria: "relatorio-mensal",
    titulo: "Relatório Mensal de Junho Disponível",
    resumo:
      "O resumo completo da sua carteira em junho, com bens encontrados, valores recuperados e próximos passos, já está pronto.",
    corpo:
      "O relatório mensal da sua carteira referente a junho de 2026 está disponível para leitura e download.\n\nDestaques do mês: 1 imóvel comercial novo identificado, 3 veículos rastreados via RENAJUD, R$ 187 mil bloqueados via SISBAJUD, 2 audiências realizadas e 1 acordo proposto. A taxa de localização patrimonial efetiva ficou em 71%, acima da média histórica.\n\nO documento inclui também a evolução mês a mês do valor estimado da carteira, o status de cada um dos seus processos ativos, os principais riscos identificados e a agenda dos próximos 30 dias.\n\nVocê pode baixar a versão em PDF para arquivamento interno ou ler diretamente no portal. Se preferir, o escritório também envia uma cópia por e-mail no início do próximo mês.",
    relativaEm: "há 2 dias",
    lida: true,
  },
  {
    id: "cli-mensagem-estrategia",
    categoria: "mensagem-escritorio",
    titulo: "Estratégia para Construtora Horizonte Disponível",
    resumo:
      "O escritório preparou uma nota com recomendações sobre como evoluir o caso após o novo bem encontrado.",
    corpo:
      "Após a localização do terreno comercial em Vinhedo no patrimônio da Construtora Horizonte, o escritório preparou uma nota de estratégia para a sua leitura.\n\nA recomendação é avançar com pedido de penhora do imóvel ainda neste mês, antes da empresa ter chance de constituir gravames ou alienação. Em paralelo, sugerimos retomar a tentativa de acordo, agora com posição patrimonial conhecida e mais favorável à negociação.\n\nA nota inclui três cenários de desfecho: penhora seguida de leilão, acordo à vista com deságio controlado e acordo parcelado com garantia real sobre o próprio terreno. Para cada cenário, há estimativa de prazo, custo processual e valor líquido provável de recuperação.\n\nA decisão final é sua. Caso queira agendar uma conversa rápida para alinhar a estratégia, é só responder a esta notificação ou ligar diretamente.",
    relativaEm: "há 3 dias",
    lida: true,
    referencias: {
      caso_id: 1042,
      devedor_nome: "Construtora Horizonte Empreendimentos Ltda.",
    },
  },
  {
    id: "cli-limite-consultas",
    categoria: "limite-consultas",
    titulo: "Carteira Atingiu 80% do Limite Mensal de Consultas",
    resumo:
      "Você está em R$ 4.180 dos R$ 5.200 contratados em consultas pagas este mês. Avalie se faz sentido ampliar.",
    corpo:
      "O consumo de consultas pagas da sua carteira em junho atingiu R$ 4.180,00, o que representa 80% do teto mensal de R$ 5.200,00 que você definiu nas preferências.\n\nO ritmo atual indica que o teto pode ser alcançado por volta do dia 27, com cerca de 3 dias úteis ainda no mês. Caso o teto seja atingido, novas consultas patrimoniais ficam pausadas automaticamente e só voltam após o seu aval ou no primeiro dia do mês seguinte.\n\nVocê tem três opções: manter o teto e aceitar a pausa preventiva, ampliar pontualmente o limite só para este mês (sugerimos +R$ 1.500 dada a maturidade dos processos atuais), ou ampliar o teto fixo nas preferências.\n\nO escritório sugere a opção 2 para este mês, dado o ROI observado em junho: cada R$ 1,00 em consultas resultou em aproximadamente R$ 38,00 de patrimônio efetivamente localizado.",
    relativaEm: "há 4 dias",
    lida: true,
    referencias: {
      valor_brl: 4180,
    },
  },
  {
    id: "cli-mensagem-aniversario",
    categoria: "mensagem-escritorio",
    titulo: "Aniversário do Contrato: 1 Ano de Parceria",
    resumo:
      "Faz um ano desde o início da nossa parceria. Preparamos um balanço consolidado da carteira.",
    corpo:
      "Hoje completa-se 1 ano desde o início da parceria entre a sua empresa e o escritório. Para marcar a data, preparamos um balanço consolidado da carteira nesse período.\n\nNúmeros do ano: 14 processos ativos rastreados, R$ 8,7 milhões em créditos sob acompanhamento, R$ 2,3 milhões em patrimônio efetivamente localizado, R$ 612 mil em valores já recuperados e creditados, 4 acordos firmados e 9 audiências realizadas.\n\nDestaque para o aumento gradual da taxa de localização patrimonial, que partiu de 41% no primeiro trimestre e fechou o último em 71%, refletindo a maturidade da base de dados e o refinamento das varreduras automatizadas.\n\nObrigado pela confiança. Caso queira agendar uma reunião de revisão estratégica para definir os focos do próximo ciclo, é só sinalizar a melhor janela na sua agenda.",
    relativaEm: "há 5 dias",
    lida: true,
  },
];

// --------------------------------------------------------------------------
// Hidratacao dos arrays in-memory
// --------------------------------------------------------------------------

const _notificacoesEquipe: Notificacao[] = MOCKS_EQUIPE.map((m) => ({
  ...m,
  portal: "equipe",
  criadoEm: relativaParaIso(m.relativaEm, AGORA),
}));

const _notificacoesCliente: Notificacao[] = MOCKS_CLIENTE.map((m) => ({
  ...m,
  portal: "cliente",
  criadoEm: relativaParaIso(m.relativaEm, AGORA),
  destinatarioEmail: EMAIL_CLIENTE_DEMO,
}));

// --------------------------------------------------------------------------
// API publica
// --------------------------------------------------------------------------

export async function listarNotificacoesEquipe(): Promise<Notificacao[]> {
  return [..._notificacoesEquipe].sort((a, b) =>
    b.criadoEm.localeCompare(a.criadoEm),
  );
}

export async function listarNotificacoesCliente(
  emailCliente?: string | null,
): Promise<Notificacao[]> {
  const filtro = (emailCliente ?? "").toLowerCase().trim();
  const base = [..._notificacoesCliente].sort((a, b) =>
    b.criadoEm.localeCompare(a.criadoEm),
  );
  if (!filtro) return base;
  return base.filter(
    (n) => (n.destinatarioEmail ?? "").toLowerCase() === filtro,
  );
}

export async function buscarNotificacaoPorId(
  id: string,
): Promise<Notificacao | null> {
  const todas = [..._notificacoesEquipe, ..._notificacoesCliente];
  return todas.find((n) => n.id === id) ?? null;
}

export async function marcarComoLida(id: string): Promise<Notificacao | null> {
  const eq = _notificacoesEquipe.find((n) => n.id === id);
  if (eq) {
    eq.lida = true;
    return eq;
  }
  const cli = _notificacoesCliente.find((n) => n.id === id);
  if (cli) {
    cli.lida = true;
    return cli;
  }
  return null;
}

export async function marcarTodasComoLidas(
  portal: PortalNotificacao,
  emailCliente?: string | null,
): Promise<number> {
  let count = 0;
  if (portal === "equipe") {
    for (const n of _notificacoesEquipe) {
      if (!n.lida) {
        n.lida = true;
        count++;
      }
    }
  } else {
    const filtro = (emailCliente ?? "").toLowerCase().trim();
    for (const n of _notificacoesCliente) {
      if (
        !n.lida &&
        (!filtro || (n.destinatarioEmail ?? "").toLowerCase() === filtro)
      ) {
        n.lida = true;
        count++;
      }
    }
  }
  return count;
}

export async function contarNaoLidas(
  portal: PortalNotificacao,
  emailCliente?: string | null,
): Promise<number> {
  if (portal === "equipe") {
    return _notificacoesEquipe.reduce((n, x) => n + (x.lida ? 0 : 1), 0);
  }
  const filtro = (emailCliente ?? "").toLowerCase().trim();
  return _notificacoesCliente.reduce((n, x) => {
    if (x.lida) return n;
    if (filtro && (x.destinatarioEmail ?? "").toLowerCase() !== filtro) return n;
    return n + 1;
  }, 0);
}
