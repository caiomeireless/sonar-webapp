// Tipos de domínio compartilhados (bens e fontes de busca).
//
// HISTÓRICO: este arquivo carregava as fixtures da DEMO (credores, devedores,
// casos e bens fictícios + DEMO_CLIENTE_EMAIL). A demo foi REMOVIDA em
// 08/08/2026 a pedido do Caio — o mock estava se misturando com dados reais
// na plataforma. Os dados saíram; ficaram só os TIPOS, que o app inteiro
// importa daqui. Se a demo voltar um dia, reconstruir a partir do git
// (commit anterior a 08/08) em módulo separado, sem tocar nas telas reais.

export type FonteBusca =
  | "DataJud"
  | "Themis"
  | "BigDataCorp"
  | "Assertiva"
  | "minhareceita"
  | "SICAR"
  | "ARISP"
  | "Escavador"
  | "Manual";

export type TipoBem =
  | "veiculo"
  | "imovel"
  | "empresa"
  | "processo_credito"
  | "endereco"
  | "vinculo";
