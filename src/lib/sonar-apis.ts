// Catalogo unificado de APIs do Sonar com preco + modo (lead/doc).
// USADO tanto pelo botao do dossie quanto pelo card da Themis.
// Quando a Sem 2 entregar `executarConsultaPaga` real, esta constante
// vira a tabela `apis_sonar` no banco — ai admins podem editar precos
// e adicionar APIs sem deploy.

export type ApiModo = "lead" | "doc";

export type ApiSonar = {
  id: string;
  nome: string;
  preco: number;
  precoLabel: string;
  modo: ApiModo;
  inComboPadrao: boolean;
};

export const APIS: ApiSonar[] = [
  // ===== LEAD (sem documento — localizar / priorizar) =====
  {
    id: "assertiva.enderecos",
    nome: "Assertiva — enderecos/telefones",
    preco: 0.3,
    precoLabel: "R$ 0,30",
    modo: "lead",
    inComboPadrao: true,
  },
  {
    id: "bigdatacorp.veiculos",
    nome: "BigDataCorp — veiculos",
    preco: 0.4,
    precoLabel: "R$ 0,40",
    modo: "lead",
    inComboPadrao: true,
  },
  {
    id: "bigdatacorp.vinculos",
    nome: "BigDataCorp — vinculos",
    preco: 0.05,
    precoLabel: "R$ 0,05",
    modo: "lead",
    inComboPadrao: true,
  },
  {
    id: "bigdatacorp.aeronaves",
    nome: "BigDataCorp — aeronaves/embarcacoes",
    preco: 0.05,
    precoLabel: "R$ 0,05",
    modo: "lead",
    inComboPadrao: true,
  },
  {
    id: "datajud.processos",
    nome: "DataJud — processos CNJ",
    preco: 0,
    precoLabel: "gratis",
    modo: "lead",
    inComboPadrao: true,
  },
  {
    id: "minhareceita.cnpj",
    nome: "minhareceita — CNPJ + QSA",
    preco: 0,
    precoLabel: "gratis",
    modo: "lead",
    inComboPadrao: true,
  },
  {
    id: "sicar.imovel_rural",
    nome: "SICAR — imovel rural",
    preco: 0,
    precoLabel: "gratis",
    modo: "lead",
    inComboPadrao: true,
  },
  {
    id: "cenprot.protestos",
    nome: "Cenprot — protestos consolidados",
    preco: 15.0,
    precoLabel: "R$ 15,00",
    modo: "lead",
    inComboPadrao: false,
  },
  // ===== DOC (geram documento oficial — anexavel direto na peca) =====
  {
    id: "arisp.matricula",
    nome: "ARISP — matricula urbana SP",
    preco: 30.0,
    precoLabel: "R$ 30,00",
    modo: "doc",
    inComboPadrao: true,
  },
  {
    id: "onr.matricula",
    nome: "ONR — matricula urbana BR (nacional)",
    preco: 35.0,
    precoLabel: "R$ 35,00",
    modo: "doc",
    inComboPadrao: true,
  },
  {
    id: "junta.certidao",
    nome: "Junta Comercial — certidao + atos PJ",
    preco: 50.0,
    precoLabel: "R$ 50,00",
    modo: "doc",
    inComboPadrao: true,
  },
  {
    id: "edossie.completo",
    nome: "eDossie Pro — onus + acoes",
    preco: 500.0,
    precoLabel: "R$ 500,00",
    modo: "doc",
    inComboPadrao: false,
  },
];

export const COMBO_LEAD = APIS.filter(
  (a) => a.modo === "lead" && a.inComboPadrao,
);
export const COMBO_DOC = APIS.filter(
  (a) => a.modo === "doc" && a.inComboPadrao,
);

export const TOTAL_LEAD = COMBO_LEAD.reduce((s, a) => s + a.preco, 0);
export const TOTAL_DOC = COMBO_DOC.reduce((s, a) => s + a.preco, 0);

// IDs dos combos (urls usam essa forma compacta)
export const IDS_COMBO_LEAD = COMBO_LEAD.map((a) => a.id).join(",");
export const IDS_COMBO_DOC = COMBO_DOC.map((a) => a.id).join(",");

export function apisDeIds(ids: string[]): ApiSonar[] {
  const set = new Set(ids);
  return APIS.filter((a) => set.has(a.id));
}

export function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(v);
}
