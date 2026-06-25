// Dashboard do Cliente — wrapper sobre dashboard-plataforma filtrado
// pelos credor_id(s) do cliente logado. Reusa 100% das agregacoes.
//
// O cliente ve UM credor (ele mesmo) ou MAIS (quando ele tem multiplas
// empresas no escritorio). A query resolve credor_id(s) por email_contato
// e passa pro filtro credores: number[] do dashboard-plataforma.

import { createAdminClient } from "@/lib/supabase/admin";
import {
  obterDadosDashboardPlataforma,
  type DashboardPlataforma,
} from "@/lib/dashboard-plataforma";

const DEMO_CLIENTE_EMAIL = "cliente.demo@battaglia.com.br";

// Resolve quais credor_id(s) o cliente loga deve enxergar.
// Cliente real: linhas em `credores` com email_contato = emailCliente.
// Cliente demo: empresta os credores que tem casos (mesmo fallback do
// listarCasosDoCliente — pra demo nunca aparecer vazia).
async function resolverCredorIdsDoCliente(
  emailCliente: string,
): Promise<number[]> {
  const sb = createAdminClient();
  const email = emailCliente.toLowerCase().trim();

  const { data: credores } = await sb
    .from("credores")
    .select("id")
    .eq("email_contato", email);

  let credorIds = (credores ?? []).map((c) => c.id as number);

  if (email === DEMO_CLIENTE_EMAIL) {
    const { data: credoresComCasos } = await sb
      .from("casos")
      .select("credor_id")
      .order("credor_id", { ascending: true })
      .limit(50);
    const idsComCasos = Array.from(
      new Set((credoresComCasos ?? []).map((c) => c.credor_id as number)),
    );
    if (idsComCasos.length > 0) credorIds = idsComCasos;
  }

  return credorIds;
}

export interface DashboardCliente extends DashboardPlataforma {
  // marcador semantico — esta versao ja vem filtrada pelo escopo do cliente.
  // Mesma forma do DashboardPlataforma pros componentes reusarem direto.
  ehVazio: boolean;
}

export async function obterDadosDashboardCliente(
  emailCliente: string,
): Promise<DashboardCliente> {
  const credorIds = await resolverCredorIdsDoCliente(emailCliente);

  if (credorIds.length === 0) {
    // Sem credores vinculados ao email — devolve estrutura vazia
    // pra UI mostrar empty state ao inves de quebrar.
    const vazio = await obterDadosDashboardPlataforma({ credores: [-1] });
    return { ...vazio, ehVazio: true };
  }

  const dados = await obterDadosDashboardPlataforma({ credores: credorIds });
  return { ...dados, ehVazio: dados.kpisGerais.casosAtivosTotal === 0 };
}
