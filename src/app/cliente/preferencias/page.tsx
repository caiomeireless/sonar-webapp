// Portal do cliente — página de Preferências.
// Server Component: confirma papel CLIENTE, carrega credor associado,
// preferências atuais (ou null se não definiu) e gasto do mês corrente.
// Renderiza o Client Component <PreferenciasForm/> com o estado inicial.
import { redirect } from "next/navigation";
import { perfilLogado } from "@/lib/perfis-server";
import { perfilAtual, ehCliente } from "@/lib/perfis";
import { previewEuFromParam } from "@/lib/dev-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  obterPreferenciasDoCliente,
  gastoDoMesAtual,
} from "@/lib/preferencias";
import { PreferenciasForm } from "./PreferenciasForm";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function PreferenciasPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfilSessao = await perfilLogado();
  const eu = previewEuFromParam(params.eu, perfilSessao) ?? perfilSessao?.email ?? null;

  if (!eu) redirect("/login");

  // No dev/preview, o ?eu= pode ser de qualquer perfil — recarrega pra
  // verificar o papel real desse email.
  const perfil = await perfilAtual(eu);

  // Esta página é EXCLUSIVA do cliente. Equipe vai pra /equipe.
  if (!ehCliente(perfil)) {
    redirect("/equipe");
  }

  // Acha o credor vinculado a este cliente.
  const sb = createAdminClient();
  const { data: credor } = await sb
    .from("credores")
    .select("id, nome")
    .eq("email_contato", eu.toLowerCase().trim())
    .maybeSingle();

  const credorNome = (credor?.nome as string | undefined) ?? null;
  const credorId = (credor?.id as number | undefined) ?? null;

  const preferencias = await obterPreferenciasDoCliente(eu);
  const gastoMes = credorId !== null ? await gastoDoMesAtual(credorId) : 0;

  return (
    <main className="relative mx-auto max-w-[920px] px-6 py-16 sm:px-10">
      <header className="title-shield mb-6 text-center">
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Preferências
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Preferências
        </p>
        <p className="mx-auto mt-3 max-w-[640px] text-base leading-relaxed text-[var(--color-signal)]">
          Defina o limite mensal de gasto com pesquisas patrimoniais. O
          escritório respeita esse teto ao rodar consultas pagas no nome
          dos seus devedores.
        </p>
      </header>

      {credorId === null ? (
        <div className="mt-12 rounded-2xl border border-[var(--color-ivory-22)] bg-white/[0.02] p-10 text-center">
          <span className="eyebrow !text-[var(--color-signal)]">Aguardando</span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Nenhum credor vinculado ao seu email
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            Quando o escritório associar seu email a um credor, você poderá
            definir o limite mensal de gasto aqui.
          </p>
        </div>
      ) : (
        <PreferenciasForm
          credorNome={credorNome}
          gastoMes={gastoMes}
          limiteInicial={preferencias?.limite_mensal_brl ?? 0}
          limiteComboLeadInicial={preferencias?.limite_combo_lead_brl ?? 0}
          limiteComboDocInicial={preferencias?.limite_combo_doc_brl ?? 0}
          limitesPorApiInicial={preferencias?.limites_por_api ?? {}}
          bloquearInicial={preferencias?.bloquear_ao_exceder ?? true}
          observacoesInicial={preferencias?.observacoes ?? ""}
        />
      )}
    </main>
  );
}
