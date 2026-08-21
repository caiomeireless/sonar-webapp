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

// Resolve quais credor_id(s) o cliente logado deve enxergar.
// Cliente real: linhas em `credores` com email_contato = emailCliente.
// (Fallback do cliente demo REMOVIDO em 08/08 — misturava dados reais
// de outros credores na visão demo.)
async function resolverCredorIdsDoCliente(
  emailCliente: string,
): Promise<number[]> {
  const sb = createAdminClient();
  const email = emailCliente.toLowerCase().trim();

  const { data: credores } = await sb
    .from("credores")
    .select("id")
    .eq("email_contato", email);

  return (credores ?? []).map((c) => c.id as number);
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
