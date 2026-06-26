// Funcao de seed dos dados demo (apresentacao 2026-06-26).
// Idempotente: pode rodar varias vezes sem duplicar nada (UPSERT por ID
// nas tabelas com ID controlado + DELETE+INSERT nos bens_encontrados,
// que nao tem chave natural).
//
// Como rodar: GET /api/seed-demo (dev e prod). Devolve JSON com os IDs.

import { createAdminClient } from "@/lib/supabase/admin";
import {
  CREDORES_DEMO,
  DEVEDORES_DEMO,
  CASOS_DEMO,
  BENS_DEMO,
  MEDIDAS_DEMO,
  PERFIL_CLIENTE_DEMO,
  PERFIS_EQUIPE_DEMO,
  PREFERENCIAS_DEMO,
} from "./mock-fixtures";

export interface SeedResult {
  perfil_cliente: string;
  responsavel_email_usado: string | null;
  credor_ids: number[];
  devedor_ids: number[];
  caso_ids: number[];
  total_bens: number;
  total_medidas: number;
}

export async function seedDemoData(): Promise<SeedResult> {
  const sb = createAdminClient();

  // 1. Acha QUALQUER perfil admin no banco — usar como responsavel dos casos.
  //    Necessario porque casos.responsavel_email FK -> perfis.email, e nao
  //    sabemos qual email o usuario semeou em 001_perfis.sql.
  const { data: admins } = await sb
    .from("perfis")
    .select("email")
    .eq("papel", "admin")
    .limit(1);
  const responsavelEmail = (admins?.[0]?.email as string | undefined) ?? null;

  // 2. Perfil cliente demo (papel='cliente').
  {
    const { error } = await sb.from("perfis").upsert(
      {
        email: PERFIL_CLIENTE_DEMO.email,
        nome: PERFIL_CLIENTE_DEMO.nome,
        papel: PERFIL_CLIENTE_DEMO.papel,
        acessos: PERFIL_CLIENTE_DEMO.acessos,
      },
      { onConflict: "email" },
    );
    if (error) throw new Error(`Erro ao semear perfil cliente: ${error.message}`);
  }

  // 2.b Perfis de equipe demo (Paulo, Remo, Igor, Hugo, Fabiane, Katia).
  // INSERT com ignoreDuplicates: se ja existir, deixa do jeito que esta
  // (preserva o papel/acessos que o Caio configurou manualmente).
  for (const p of PERFIS_EQUIPE_DEMO) {
    const { error } = await sb.from("perfis").upsert(
      {
        email: p.email,
        nome: p.nome,
        papel: p.papel,
        acessos: p.acessos,
      },
      { onConflict: "email", ignoreDuplicates: true },
    );
    if (error) {
      console.warn(`[seed] perfil equipe ${p.email}: ${error.message}`);
    }
  }

  // 3. Credores (forca ids 1, 2, 3 — predictable URL no /app).
  //    Inclui clientes "cross" (credor 2 e 3) que perseguem o mesmo devedor
  //    do credor 1 — alimenta o alerta de cross-detection no dossie.
  for (const cr of CREDORES_DEMO) {
    const { error } = await sb.from("credores").upsert(
      {
        id: cr.id,
        tipo: cr.tipo,
        documento: cr.documento,
        nome: cr.nome,
        email_contato: cr.email_contato,
        telefone: cr.telefone,
        observacoes: cr.observacoes,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(`Erro ao semear credor ${cr.id}: ${error.message}`);
  }

  // 4. Devedores (forca ids 1, 2, 3) — atualiza ultima_consulta_em pra now.
  // rg/email/telefone/redes_sociais ainda nao tem coluna no banco; sao
  // enriquecidos in-memory em obterDossie pra os ids demo (1, 2, 3).
  for (const d of DEVEDORES_DEMO) {
    const { error } = await sb.from("devedores").upsert(
      {
        id: d.id,
        tipo: d.tipo,
        documento: d.documento,
        nome: d.nome,
        data_nascimento: d.data_nascimento,
        nome_mae: d.nome_mae,
        ultima_consulta_em: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(`Erro ao semear devedor ${d.id}: ${error.message}`);
  }

  // 5. Casos — responsavel_email so se houver admin no banco.
  for (const c of CASOS_DEMO) {
    const { error } = await sb.from("casos").upsert(
      {
        id: c.id,
        credor_id: c.credor_id,
        devedor_id: c.devedor_id,
        numero_processo: c.numero_processo,
        valor_credito_brl: c.valor_credito_brl,
        status: c.status,
        responsavel_email: responsavelEmail,
        observacoes: c.observacoes,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(`Erro ao semear caso ${c.id}: ${error.message}`);
  }

  // 6. Bens: DELETE + INSERT (sem chave natural — UPSERT seria fragil).
  {
    const { error: delErr } = await sb
      .from("bens_encontrados")
      .delete()
      .in("devedor_id", DEVEDORES_DEMO.map((d) => d.id));
    if (delErr) throw new Error(`Erro ao limpar bens: ${delErr.message}`);

    const { error: insErr } = await sb.from("bens_encontrados").insert(BENS_DEMO);
    if (insErr) throw new Error(`Erro ao inserir bens: ${insErr.message}`);
  }

  // 6.b Medidas tomadas: DELETE + INSERT idempotente.
  // Preserva o advogado_email do mock SE o perfil existir no banco
  // (Paulo, Remo, Igor, Hugo, Fabiane, Katia — pra o grafico
  // "Atividade da Equipe" mostrar carteira distribuida). Cai pro
  // responsavelEmail se o perfil ainda nao foi liberado (evita FK
  // violation).
  {
    const casoIds = CASOS_DEMO.map((c) => c.id);
    const { error: delErr } = await sb
      .from("medidas_tomadas")
      .delete()
      .in("caso_id", casoIds);
    if (delErr) {
      console.warn(`[seed] medidas_tomadas indisponivel (migration 004 nao rodou?): ${delErr.message}`);
    } else {
      // Le todos perfis pra checar FK antes de inserir.
      const { data: perfis } = await sb.from("perfis").select("email");
      const emailsValidos = new Set(
        (perfis ?? []).map((p) => (p.email as string).toLowerCase()),
      );

      const { error: insErr } = await sb.from("medidas_tomadas").insert(
        MEDIDAS_DEMO.map((m) => {
          const emailMock = (m.advogado_email ?? "").toLowerCase().trim();
          const advogadoEmail =
            emailMock && emailsValidos.has(emailMock)
              ? emailMock
              : responsavelEmail;
          return {
            id: m.id,
            caso_id: m.caso_id,
            data: m.data,
            tipo: m.tipo,
            resultado: m.resultado,
            titulo: m.titulo,
            detalhes: m.detalhes,
            advogado_email: advogadoEmail,
          };
        }),
      );
      if (insErr) throw new Error(`Erro ao inserir medidas: ${insErr.message}`);
    }
  }

  // 6.c Preferencias por cliente: DELETE + INSERT idempotente.
  // Tabela 005 — pode nao existir ainda; degrada gracioso sem quebrar o seed.
  try {
    const credorIdsPref = PREFERENCIAS_DEMO.map((p) => p.credor_id);
    const { error: delErr } = await sb
      .from("preferencias_cliente")
      .delete()
      .in("credor_id", credorIdsPref);
    if (delErr) {
      console.warn(`[seed] preferencias_cliente indisponivel (migration 005 nao rodou?): ${delErr.message}`);
    } else {
      const { error: insErr } = await sb.from("preferencias_cliente").insert(
        PREFERENCIAS_DEMO.map((p) => ({
          credor_id: p.credor_id,
          limite_mensal_brl: p.limite_mensal_brl,
          // Limites granulares (migration 005 estendida em jun/2026).
          limite_combo_lead_brl: p.limite_combo_lead_brl,
          limite_combo_doc_brl: p.limite_combo_doc_brl,
          limites_por_api: p.limites_por_api,
          bloquear_ao_exceder: p.bloquear_ao_exceder,
          observacoes: p.observacoes,
        })),
      );
      if (insErr) {
        console.warn(`[seed] preferencias_cliente: erro ao inserir: ${insErr.message}`);
      }
    }
  } catch (e) {
    console.warn(`[seed] preferencias_cliente: excecao: ${(e as Error).message}`);
  }

  // 7. Resync das sequences pra novos inserts nao colidirem com ids 1/2/3.
  //    Necessario porque o UPSERT com id explicito nao avanca a sequence.
  //    Faz via RPC (precisa ser SQL plain — supabase-js nao expoe setval).
  //    Pra demo, comentado — se quisermos UI de criar devedor, descomentar.
  // await sb.rpc("setval_seqs_demo");

  return {
    perfil_cliente: PERFIL_CLIENTE_DEMO.email,
    responsavel_email_usado: responsavelEmail,
    credor_ids: CREDORES_DEMO.map((c) => c.id),
    devedor_ids: DEVEDORES_DEMO.map((d) => d.id),
    caso_ids: CASOS_DEMO.map((c) => c.id),
    total_bens: BENS_DEMO.length,
    total_medidas: MEDIDAS_DEMO.length,
  };
}
