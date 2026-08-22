// Dados do Console Sonar (aba Início, v2 "monitor") — queries LEVES de
// propósito: o console abre a cada visita, então nada de agregação pesada
// (o dashboard completo vive em /equipe). Tudo resiliente: falha vira
// zero/lista vazia sem derrubar a página.
import { createAdminClient } from "@/lib/supabase/admin";
import { listarRadar, type ItemRadar } from "@/lib/radar";

export type LocalizacaoRecente = {
  id: number;
  tipo: string;
  titulo: string;
  valorBrl: number | null;
  fonte: string | null;
  quando: string | null;
  devedorId: number | null;
  devedorNome: string | null;
};

export type SincronizacaoConsole = {
  /** Última sync do Themis (sync_themis_log). */
  themisEm: string | null;
  themisOk: boolean | null;
  /** Última captura dos robôs por fonte. */
  esajUltima: string | null;
  eprocUltima: string | null;
  /** Acervo total de andamentos capturados. */
  totalAndamentos: number;
};

export type DadosConsole = {
  patrimonioBrl: number;
  totalBens: number;
  casosAtivos: number;
  devedores: number;
  capturas7d: number;
  /** Casos com crédito satisfeito (encerrados por quitação). */
  quitados: number;
  /** Casos com acordo/pagamento detectado nos andamentos dos robôs. */
  casosComAcordo: number;
  /** Gasto do mês com APIs pagas (registro próprio — a Assertiva NÃO expõe
      o consumo da conta via API; conferido nos swaggers em 21/08). */
  gastoMesBrl: number;
  tetoMesBrl: number;
  sincronizacao: SincronizacaoConsole;
  ultimasLocalizacoes: LocalizacaoRecente[];
  movimentacoes: ItemRadar[];
};

/** Cota mensal consumível do contrato Assertiva (Q-19312-1). */
export const TETO_ASSERTIVA_BRL = 600;

const VAZIO: DadosConsole = {
  patrimonioBrl: 0,
  totalBens: 0,
  casosAtivos: 0,
  devedores: 0,
  capturas7d: 0,
  quitados: 0,
  casosComAcordo: 0,
  gastoMesBrl: 0,
  tetoMesBrl: TETO_ASSERTIVA_BRL,
  sincronizacao: {
    themisEm: null,
    themisOk: null,
    esajUltima: null,
    eprocUltima: null,
    totalAndamentos: 0,
  },
  ultimasLocalizacoes: [],
  movimentacoes: [],
};

// Palavras de acordo/pagamento (mesmo vocabulário da categoria "pagamento"
// do Radar) — conta CASOS distintos com esse sinal.
const CLAUSULA_ACORDO = [
  "acordo homologado",
  "homologação de acordo",
  "homologacao de acordo",
  "acordo de parcelamento",
]
  .map((p) => `descricao.ilike.%${p}%`)
  .join(",");

export async function obterDadosConsole(): Promise<DadosConsole> {
  try {
    const sb = createAdminClient();
    const seteDias = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const ultimaCaptura = (fonte: string) =>
      sb
        .from("andamentos")
        .select("capturado_em")
        .eq("fonte", fonte)
        .order("capturado_em", { ascending: false })
        .limit(1);

    const [
      bens,
      casos,
      quitados,
      devedores,
      capturas,
      acordos,
      recentes,
      radar,
      custosMes,
      syncThemis,
      esajUlt,
      eprocUlt,
      totalAnd,
    ] =
      await Promise.all([
        sb
          .from("bens_encontrados")
          .select("valor_estimado_brl")
          .eq("ativo", true)
          .limit(1000),
        sb
          .from("casos")
          .select("id", { count: "exact", head: true })
          .eq("status", "ativo")
          .eq("eh_demo", false),
        sb
          .from("casos")
          .select("id", { count: "exact", head: true })
          .eq("status", "satisfeito")
          .eq("eh_demo", false),
        sb
          .from("devedores")
          .select("id", { count: "exact", head: true })
          .eq("eh_demo", false),
        sb
          .from("andamentos")
          .select("id", { count: "exact", head: true })
          .gte("capturado_em", seteDias),
        sb
          .from("andamentos")
          .select("caso_id")
          .or(CLAUSULA_ACORDO)
          .not("caso_id", "is", null)
          .limit(1000),
        sb
          .from("bens_encontrados")
          .select(
            "id, tipo, titulo, valor_estimado_brl, fonte, fonte_consultada_em, devedor:devedores(id, nome)",
          )
          .eq("ativo", true)
          .order("fonte_consultada_em", { ascending: false, nullsFirst: false })
          .limit(6),
        listarRadar({ pagina: 1 }),
        sb
          .from("custos")
          .select("custo")
          .gte("criado_em", inicioMes.toISOString())
          .limit(1000),
        sb
          .from("sync_themis_log")
          .select("iniciado_em, ok")
          .order("id", { ascending: false })
          .limit(1),
        ultimaCaptura("esaj-tjsp"),
        ultimaCaptura("eproc-tjsp"),
        sb.from("andamentos").select("id", { count: "exact", head: true }),
      ]);

    const patrimonioBrl = (bens.data ?? []).reduce(
      (acc, b) => acc + (Number(b.valor_estimado_brl) || 0),
      0,
    );
    const casosComAcordo = new Set(
      (acordos.data ?? []).map((a) => a.caso_id as number),
    ).size;

    const ultimasLocalizacoes: LocalizacaoRecente[] = (recentes.data ?? []).map(
      (b) => {
        const devedor = b.devedor as unknown as {
          id: number;
          nome: string;
        } | null;
        return {
          id: b.id as number,
          tipo: (b.tipo as string) ?? "",
          titulo: (b.titulo as string) ?? "Bem localizado",
          valorBrl:
            b.valor_estimado_brl != null ? Number(b.valor_estimado_brl) : null,
          fonte: (b.fonte as string | null) ?? null,
          quando: (b.fonte_consultada_em as string | null) ?? null,
          devedorId: devedor?.id ?? null,
          devedorNome: devedor?.nome ?? null,
        };
      },
    );

    const gastoMesBrl = (custosMes.data ?? []).reduce(
      (acc, c) => acc + (Number(c.custo) || 0),
      0,
    );
    const themis = (syncThemis.data ?? [])[0] ?? null;

    return {
      patrimonioBrl,
      totalBens: (bens.data ?? []).length,
      casosAtivos: casos.count ?? 0,
      devedores: devedores.count ?? 0,
      capturas7d: capturas.count ?? 0,
      quitados: quitados.count ?? 0,
      casosComAcordo,
      gastoMesBrl,
      tetoMesBrl: TETO_ASSERTIVA_BRL,
      sincronizacao: {
        themisEm: (themis?.iniciado_em as string | null) ?? null,
        themisOk: themis ? Boolean(themis.ok) : null,
        esajUltima:
          ((esajUlt.data ?? [])[0]?.capturado_em as string | null) ?? null,
        eprocUltima:
          ((eprocUlt.data ?? [])[0]?.capturado_em as string | null) ?? null,
        totalAndamentos: totalAnd.count ?? 0,
      },
      ultimasLocalizacoes,
      movimentacoes: radar.erro ? [] : radar.itens.slice(0, 4),
    };
  } catch {
    return VAZIO;
  }
}
