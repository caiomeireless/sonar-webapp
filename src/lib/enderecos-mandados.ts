// Reader dos Mandados de Avaliação e Penhora (endereços confirmados) —
// server-only.
//
// O advogado registra, por devedor, a expedição e o cumprimento do mandado
// num endereço confirmado (tabela `enderecos_mandados`, migração 024),
// anexando a certidão do oficial de justiça. Os anexos moram no MESMO
// bucket privado do módulo de Imóveis (`imoveis-pesquisas`).
//
// Este módulo só LÊ; o registro acontece nas Server Actions do dossiê
// (src/app/equipe/devedores/[id]/mandados-actions.ts).
//
// Se a tabela ainda não existir (migração 024 não rodou), devolve [] sem
// panic — a página do dossiê continua viva.
import { createAdminClient } from "@/lib/supabase/admin";
import { IMOVEIS_PESQUISAS_BUCKET } from "@/lib/imoveis-pesquisas";

export type ResultadoMandado =
  | "aguardando"
  | "cumprido_positivo"
  | "cumprido_negativo";

export type AnexoMandado = {
  path: string;
  nome: string;
  tipo: "certidao";
  contentType: string;
  // URL assinada de 1h pro download; null se a assinatura falhar.
  url: string | null;
};

export type MandadoEndereco = {
  id: number;
  resultado: ResultadoMandado;
  observacao: string | null;
  criadoPor: string;
  criadoEm: string;
  anexos: AnexoMandado[];
};

type AnexoBruto = {
  path?: unknown;
  nome?: unknown;
  tipo?: unknown;
  content_type?: unknown;
};

function lerResultado(bruto: unknown): ResultadoMandado {
  return bruto === "cumprido_positivo" || bruto === "cumprido_negativo"
    ? bruto
    : "aguardando";
}

// Lista os mandados de um devedor (mais recente primeiro) já com URLs
// assinadas de 1h pros anexos — todas em paralelo, nunca em série.
export async function listarMandadosEndereco(
  devedorId: number,
): Promise<MandadoEndereco[]> {
  const sb = createAdminClient();

  const { data, error } = await sb
    .from("enderecos_mandados")
    .select("id, resultado, observacao, criado_por, anexos, criado_em")
    .eq("devedor_id", devedorId)
    .order("criado_em", { ascending: false });
  if (error || !data) return [];

  return Promise.all(
    data.map(async (row): Promise<MandadoEndereco> => {
      const brutos: AnexoBruto[] = Array.isArray(row.anexos) ? row.anexos : [];
      const anexos = await Promise.all(
        brutos
          .filter((a) => typeof a?.path === "string" && a.path.length > 0)
          .map(async (a): Promise<AnexoMandado> => {
            const path = String(a.path);
            const { data: assinada } = await sb.storage
              .from(IMOVEIS_PESQUISAS_BUCKET)
              .createSignedUrl(path, 3600);
            return {
              path,
              nome:
                typeof a.nome === "string" && a.nome
                  ? a.nome
                  : path.split("/").pop()!,
              tipo: "certidao",
              contentType:
                typeof a.content_type === "string" ? a.content_type : "",
              url: assinada?.signedUrl ?? null,
            };
          }),
      );
      return {
        id: row.id as number,
        resultado: lerResultado(row.resultado),
        observacao: (row.observacao as string | null) ?? null,
        criadoPor: (row.criado_por as string) ?? "",
        criadoEm: row.criado_em as string,
        anexos,
      };
    }),
  );
}
