// Comunicação de Custos — o advogado comunica um custo extra de pesquisa
// (RI Digital, Registro Civil...) com recibo anexado; o registro cai direto
// na Central Financeira do BP INTERNAL, onde o financeiro repassa ao
// cliente. Aqui cada um vê e acompanha SÓ as próprias comunicações.
import { redirect } from "next/navigation";
import { CheckCircle2, Receipt } from "lucide-react";

import { ehEquipe } from "@/lib/perfis";
import { perfilLogadoReal } from "@/lib/perfis-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bpConfigurado, listarMinhasComunicacoes } from "@/lib/bp-financeiro";
import { ORIGENS_CUSTO, rotuloStatusCusto } from "@/lib/custos-tipos";
import { formatBRL, formatData } from "@/lib/format";

import {
  FormComunicacaoCusto,
  type CredorOpcao,
} from "./_components/FormComunicacaoCusto";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ ok?: string }>;
};

async function listarCredoresOpcoes(): Promise<CredorOpcao[]> {
  try {
    const sb = createAdminClient();
    const { data } = await sb
      .from("credores")
      .select("id, nome, documento")
      .eq("eh_demo", false)
      .order("nome", { ascending: true })
      .limit(1000);
    return (data ?? []) as CredorOpcao[];
  } catch {
    return [];
  }
}

export default async function ComunicacaoCustosPage({ searchParams }: Props) {
  const perfil = await perfilLogadoReal();
  if (!ehEquipe(perfil) || !perfil) redirect("/login");
  const params = (await searchParams) ?? {};
  const sucesso = params.ok === "1";

  const configurado = bpConfigurado();
  const [credores, minhas] = configurado
    ? await Promise.all([
        listarCredoresOpcoes(),
        listarMinhasComunicacoes(perfil.email),
      ])
    : [[], []];

  const rotuloOrigem = new Map(ORIGENS_CUSTO.map((o) => [o.chave, o.rotulo]));

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10">
      {/* ============ HEADER ============ */}
      <header className="title-shield mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <Receipt className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Comunicação de Custos
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Ressarcimento de Pesquisas Pagas
        </p>
        <p className="mx-auto mt-3 max-w-[680px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
          Pagou uma pesquisa do bolso (RI Digital, Registro Civil...)? Registre
          aqui com o recibo. O envio cai direto na Central Financeira do BP
          INTERNAL, e o financeiro cuida do repasse ao cliente.
        </p>
      </header>

      {/* ============ BANNERS ============ */}
      {sucesso && (
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-[var(--color-signal)]/45 bg-[var(--color-signal-soft)] px-5 py-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-signal)]" />
          <div>
            <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-[var(--color-signal)]">
              Enviado ao Financeiro
            </p>
            <p className="mt-1 text-sm text-[var(--color-ivory-88)]">
              Sua comunicação chegou na Central Financeira do BP INTERNAL. O
              andamento aparece na lista abaixo.
            </p>
          </div>
        </div>
      )}
      {!configurado ? (
        <div className="glass mx-auto max-w-[560px] p-10 text-center">
          <h3 className="font-serif text-2xl text-ivory">
            Integração em Configuração
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            A ponte com a Central Financeira do BP INTERNAL ainda não foi
            configurada neste ambiente (variáveis BP_SUPABASE_URL e
            BP_SUPABASE_SERVICE_ROLE_KEY). Avise o Caio.
          </p>
        </div>
      ) : (
        <>
          {/* ============ FORMULÁRIO ============ */}
          <section className="glass mx-auto max-w-[860px] p-7">
            <h2 className="mb-5 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Comunicar Novo Custo
            </h2>
            <FormComunicacaoCusto credores={credores} />
          </section>

          {/* ============ MINHAS COMUNICAÇÕES ============ */}
          <section className="mx-auto mt-10 max-w-[860px]">
            <h2 className="mb-4 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Minhas Comunicações
            </h2>
            {minhas.length === 0 ? (
              <p className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-5 py-4 text-sm text-[var(--color-ivory-66)]">
                Você ainda não comunicou nenhum custo.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {minhas.map((c) => {
                  const st = rotuloStatusCusto(c.status);
                  return (
                    <article
                      key={c.id}
                      className="glass-flat flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-ivory">
                          {c.tipo}{" "}
                          <span className="text-[var(--color-ivory-66)]">
                            · {rotuloOrigem.get(c.origem) ?? c.origem}
                          </span>
                        </p>
                        <p className="mt-1 truncate font-mono text-[12px] tracking-wide text-[var(--color-ivory-66)]">
                          {formatData(c.data_gasto)} · {c.cliente_nome}
                          {c.processo_ref ? ` · ${c.processo_ref}` : ""}
                        </p>
                        {c.status_obs && (
                          <p className="mt-1 text-[13px] text-[var(--color-ivory-66)]">
                            Financeiro: {c.status_obs}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-mono text-[13px] text-ivory">
                          {formatBRL(c.valor_brl)}
                        </span>
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[12px] uppercase tracking-[0.14em]"
                          style={{
                            color: st.color,
                            backgroundColor: `color-mix(in srgb, ${st.color} 14%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${st.color} 45%, transparent)`,
                          }}
                        >
                          {st.label}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
