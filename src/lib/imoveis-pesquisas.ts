// Reader das pesquisas manuais de Imóveis (RI Digital) — server-only.
//
// Não existe API de matrículas de imóveis: o advogado pesquisa manualmente
// no RI Digital e registra aqui (tabela `imoveis_pesquisas`, migração 024).
// Este módulo só LÊ; o registro acontece nas Server Actions do dossiê
// (src/app/equipe/devedores/[id]/imoveis-actions.ts).
//
// Se a tabela ainda não existir (migração 024 não rodou), devolve [] sem
// panic — a página do dossiê continua viva.
import { createAdminClient } from "@/lib/supabase/admin";

export const IMOVEIS_PESQUISAS_BUCKET = "imoveis-pesquisas";

export type TipoAnexoImovel = "print" | "matricula";

export type AnexoPesquisaImovel = {
  path: string;
  nome: string;
  tipo: TipoAnexoImovel;
  contentType: string;
  // URL assinada de 1h pro download; null se a assinatura falhar.
  url: string | null;
};

export type PesquisaImovel = {
  id: number;
  pesquisadoEm: string;
  observacao: string | null;
  criadoPor: string;
  anexos: AnexoPesquisaImovel[];
};

type AnexoBruto = {
  path?: unknown;
  nome?: unknown;
  tipo?: unknown;
  content_type?: unknown;
};

// Lista as pesquisas de um devedor (mais recente primeiro) já com URLs
// assinadas de 1h pros anexos — todas em paralelo, nunca em série.
export async function listarPesquisasImoveis(
  devedorId: number,
): Promise<PesquisaImovel[]> {
  const sb = createAdminClient();

  const { data, error } = await sb
    .from("imoveis_pesquisas")
    .select("id, pesquisado_em, observacao, criado_por, anexos")
    .eq("devedor_id", devedorId)
    .order("pesquisado_em", { ascending: false });
  if (error || !data) return [];

  return Promise.all(
    data.map(async (row): Promise<PesquisaImovel> => {
      const brutos: AnexoBruto[] = Array.isArray(row.anexos) ? row.anexos : [];
      const anexos = await Promise.all(
        brutos
          .filter((a) => typeof a?.path === "string" && a.path.length > 0)
          .map(async (a): Promise<AnexoPesquisaImovel> => {
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
              tipo: a.tipo === "matricula" ? "matricula" : "print",
              contentType:
                typeof a.content_type === "string" ? a.content_type : "",
              url: assinada?.signedUrl ?? null,
            };
          }),
      );
      return {
        id: row.id as number,
        pesquisadoEm: row.pesquisado_em as string,
        observacao: (row.observacao as string | null) ?? null,
        criadoPor: (row.criado_por as string) ?? "",
        anexos,
      };
    }),
  );
}
