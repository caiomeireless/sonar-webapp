// Tipos e catálogos da Comunicação de Custos — compartilhados entre o
// formulário (client) e a ponte com o BP (server). SEM dependência de
// servidor: este arquivo entra no bundle do navegador.

export type OrigemCusto = "ri_digital" | "registro_civil" | "outro";

export type OrigemCustoMeta = {
  chave: OrigemCusto;
  rotulo: string;
  /** Site de referência (só informativo na UI). */
  site: string | null;
  /** Tipos pré-definidos; vazio = campo livre. */
  tipos: string[];
};

export const ORIGENS_CUSTO: OrigemCustoMeta[] = [
  {
    chave: "ri_digital",
    rotulo: "RI Digital",
    site: "ridigital.org.br",
    tipos: [
      "Matrícula de Imóvel",
      "Pesquisa Prévia de Imóveis",
      "Pesquisa Qualificada de Imóveis",
      "Visualizador de Matrículas",
    ],
  },
  {
    chave: "registro_civil",
    rotulo: "Registro Civil",
    site: "registrocivil.org.br",
    tipos: [
      "Certidão de Óbito",
      "Certidão de Nascimento",
      "Certidão de Casamento",
    ],
  },
  { chave: "outro", rotulo: "Outro Sistema", site: null, tipos: [] },
];

export type StatusCusto = "pendente" | "repassado" | "ressarcido" | "recusado";

export function rotuloStatusCusto(status: string): {
  label: string;
  color: string;
} {
  switch (status) {
    case "repassado":
      return { label: "Repassado ao Cliente", color: "#C084FC" };
    case "ressarcido":
      return { label: "Ressarcido", color: "#3CFF8A" };
    case "recusado":
      return { label: "Recusado", color: "#DC2626" };
    default:
      return { label: "Aguardando Financeiro", color: "#C9A24A" };
  }
}

export type AnexoCusto = {
  path: string;
  nome: string;
  rotulo: "Recibo" | "Resultado";
  mime: string;
  tamanho: number;
};

export type ComunicacaoCusto = {
  id: number;
  criado_em: string;
  origem: OrigemCusto;
  tipo: string;
  valor_brl: number;
  data_gasto: string;
  cliente_nome: string;
  cliente_documento: string | null;
  processo_ref: string | null;
  descricao: string | null;
  advogado_nome: string;
  advogado_email: string;
  status: StatusCusto;
  status_obs: string | null;
  anexos: AnexoCusto[];
};
