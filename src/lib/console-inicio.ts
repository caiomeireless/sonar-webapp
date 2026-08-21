// Dados do Console Sonar (aba Início) — queries LEVES de propósito: o
// console abre a cada visita, então nada de agregação pesada aqui (o
// dashboard completo vive em /equipe, cacheado). Tudo resiliente: qualquer
// falha vira zero/lista vazia sem derrubar a página.
import { createAdminClient } from "@/lib/supabase/admin";
import { listarRadar, type ItemRadar } from "@/lib/radar";

// Cota mensal consumível do contrato Assertiva (Q-19312-1).
export const TETO_ASSERTIVA_BRL = 600;

export type BlipRadar = {
  id: number;
  /** Ângulo em graus (0-360) — espalhado pelo ângulo áureo, determinístico. */
  angulo: number;
  /** Distância do centro, fração do raio externo (0.74–0.97). */
  raioFrac: number;
  rotulo: string;
  capturadoEm: string;
};

export type DadosConsole = {
  patrimonioBrl: number;
  totalBens: number;
  casosAtivos: number;
  devedores: number;
  capturas7d: number;
  gastoMesBrl: number;
  tetoMesBrl: number;
  /** Últimos andamentos de alto sinal (Diário de Bordo). */
  diario: ItemRadar[];
  /** Contatos no mostrador do radar. */
  blips: BlipRadar[];
};

const VAZIO: DadosConsole = {
  patrimonioBrl: 0,
  totalBens: 0,
  casosAtivos: 0,
  devedores: 0,
  capturas7d: 0,
  gastoMesBrl: 0,
  tetoMesBrl: TETO_ASSERTIVA_BRL,
  diario: [],
  blips: [],
};

export async function obterDadosConsole(): Promise<DadosConsole> {
  try {
    const sb = createAdminClient();
    const seteDias = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [bens, casos, devedores, capturas, custosMes, radar] =
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
          .from("devedores")
          .select("id", { count: "exact", head: true })
          .eq("eh_demo", false),
        sb
          .from("andamentos")
          .select("id", { count: "exact", head: true })
          .gte("capturado_em", seteDias),
        sb
          .from("custos")
          .select("custo")
          .gte("criado_em", inicioMes.toISOString())
          .limit(1000),
        listarRadar({ pagina: 1 }),
      ]);

    const patrimonioBrl = (bens.data ?? []).reduce(
      (acc, b) => acc + (Number(b.valor_estimado_brl) || 0),
      0,
    );
    const gastoMesBrl = (custosMes.data ?? []).reduce(
      (acc, c) => acc + (Number(c.custo) || 0),
      0,
    );

    const itensRadar = radar.erro ? [] : radar.itens;
    // Blip determinístico por id: ângulo áureo espalha sem aleatoriedade
    // (mesma página, mesmos pontos — nada "pula" a cada render).
    const blips: BlipRadar[] = itensRadar.slice(0, 12).map((a) => ({
      id: a.id,
      angulo: (a.id * 137.5) % 360,
      raioFrac: 0.74 + ((a.id * 53) % 24) / 100,
      rotulo: a.descricao.slice(0, 120),
      capturadoEm: a.capturado_em,
    }));

    return {
      patrimonioBrl,
      totalBens: (bens.data ?? []).length,
      casosAtivos: casos.count ?? 0,
      devedores: devedores.count ?? 0,
      capturas7d: capturas.count ?? 0,
      gastoMesBrl,
      tetoMesBrl: TETO_ASSERTIVA_BRL,
      diario: itensRadar.slice(0, 8),
      blips,
    };
  } catch {
    return VAZIO;
  }
}
