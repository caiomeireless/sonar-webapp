// Portal do cliente — pagina de Preferencias.
// Server Component: confirma papel CLIENTE, carrega credor associado,
// preferencias atuais (ou null se nao definiu) e gasto do mes corrente.
// Renderiza o Client Component <PreferenciasForm/> com o estado inicial.
import { redirect } from "next/navigation";
import { perfilLogado } from "@/lib/perfis-server";
import { perfilAtual, ehCliente } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  obterPreferenciasDoCliente,
  gastoDoMesAtual,
} from "@/lib/preferencias";
import { PreferenciasForm } from "./PreferenciasForm";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function PreferenciasPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfilSessao = await perfilLogado();
  const eu = devEuFromParam(params.eu) ?? perfilSessao?.email ?? null;

  if (!eu) redirect("/login");

  // No dev/preview, o ?eu= pode ser de qualquer perfil — recarrega pra
  // verificar o papel real desse email.
  const perfil = await perfilAtual(eu);

  // Esta pagina e EXCLUSIVA do cliente. Equipe vai pra /equipe.
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
      <span className="eyebrow">Preferencias</span>
      <h1 className="mt-4 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.15] tracking-tight text-ivory">
        Preferencias
      </h1>
      <p className="mt-6 max-w-[640px] text-base leading-relaxed text-[var(--color-ivory-88)]">
        Defina o limite mensal de gasto com pesquisas patrimoniais. O
        escritorio respeita esse teto ao rodar consultas pagas no nome
        dos seus devedores.
      </p>

      {credorId === null ? (
        <div className="mt-12 rounded-2xl border border-[var(--color-ivory-22)] bg-white/[0.02] p-10 text-center">
          <span className="eyebrow !text-[var(--color-signal)]">Aguardando</span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">
            Nenhum credor vinculado ao seu email
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            Quando o escritorio associar seu email a um credor, voce podera
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
