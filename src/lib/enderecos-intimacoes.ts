// Reader das Intimações/Citações no Endereço — server-only.
//
// O advogado registra, por devedor, o resultado da tentativa de intimação
// ou citação no endereço encontrado (tabela `enderecos_intimacoes`,
// migração 024), anexando o AR positivo. Os anexos moram no MESMO bucket
// privado do módulo de Imóveis (`imoveis-pesquisas`).
//
// Este módulo só LÊ; o registro acontece nas Server Actions do dossiê
// (src/app/equipe/devedores/[id]/intimacoes-actions.ts).
//
// Se a tabela ainda não existir (migração 024 não rodou), devolve [] sem
// panic — a página do dossiê continua viva.
import { createAdminClient } from "@/lib/supabase/admin";
import { IMOVEIS_PESQUISAS_BUCKET } from "@/lib/imoveis-pesquisas";

export type ResultadoIntimacao = "aguardando" | "exito" | "sem_exito";

export type AnexoIntimacao = {
  path: string;
  nome: string;
  tipo: "ar";
  contentType: string;
  // URL assinada de 1h pro download; null se a assinatura falhar.
  url: string | null;
};

export type IntimacaoEndereco = {
  id: number;
  resultado: ResultadoIntimacao;
  observacao: string | null;
  criadoPor: string;
  criadoEm: string;
  anexos: AnexoIntimacao[];
};

type AnexoBruto = {
  path?: unknown;
  nome?: unknown;
  tipo?: unknown;
  content_type?: unknown;
};

function lerResultado(bruto: unknown): ResultadoIntimacao {
  return bruto === "exito" || bruto === "sem_exito" ? bruto : "aguardando";
}

// Lista as intimações de um devedor (mais recente primeiro) já com URLs
// assinadas de 1h pros anexos — todas em paralelo, nunca em série.
export async function listarIntimacoesEndereco(
  devedorId: number,
): Promise<IntimacaoEndereco[]> {
  const sb = createAdminClient();

  const { data, error } = await sb
    .from("enderecos_intimacoes")
    .select("id, resultado, observacao, criado_por, anexos, criado_em")
    .eq("devedor_id", devedorId)
    .order("criado_em", { ascending: false });
  if (error || !data) return [];

  return Promise.all(
    data.map(async (row): Promise<IntimacaoEndereco> => {
      const brutos: AnexoBruto[] = Array.isArray(row.anexos) ? row.anexos : [];
      const anexos = await Promise.all(
        brutos
          .filter((a) => typeof a?.path === "string" && a.path.length > 0)
          .map(async (a): Promise<AnexoIntimacao> => {
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
              tipo: "ar",
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
