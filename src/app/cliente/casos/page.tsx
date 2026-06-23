// Portal do cliente — listagem de devedores rastreados.
// Server Component: filtra por email_contato do credor (regra em casos.ts).
// Em dev/preview, aceita ?eu=email pra simular login.
import { redirect } from "next/navigation";
import { listarCasosDoCliente } from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { previewEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { CasosClientStack } from "./CasosClientStack";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function CasosClientePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  const eu = previewEuFromParam(params.eu, perfil) ?? perfil?.email ?? null;

  if (!eu) redirect("/login");

  const casos = await listarCasosDoCliente(eu);

  return (
    <main className="relative mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
      <header className="title-shield mb-6 text-center">
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Devedores em Busca
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Casos Rastreados
        </p>
        <p className="mx-auto mt-3 max-w-[600px] text-base leading-relaxed text-[var(--color-signal)]">
          {casos.length === 0
            ? "Nenhum devedor sob monitoramento até o momento."
            : `${casos.length} ${
                casos.length === 1 ? "devedor monitorado" : "devedores monitorados"
              } pelo escritório.`}
        </p>
      </header>

      {casos.length === 0 ? (
        <div className="mt-12 grid place-items-center">
          <SpotlightCard className="max-w-[520px] p-10 text-center">
            <span className="eyebrow !text-[var(--color-signal)]">Aguardando</span>
            <h3 className="mt-4 font-serif text-2xl text-ivory">
              Nenhum caso atribuído ao seu email
            </h3>
            <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
              Assim que o escritório vincular um caso ao seu endereço de contato,
              ele aparecerá aqui.
            </p>
          </SpotlightCard>
        </div>
      ) : (
        // CardStack 3D fan (substituiu o grid md:grid-cols-2 lg:grid-cols-3).
        // Server -> Client boundary mora no CasosClientStack ("use client").
        <CasosClientStack casos={casos} />
      )}
    </main>
  );
}
