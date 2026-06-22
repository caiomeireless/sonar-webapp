// Portal do cliente — listagem de devedores rastreados.
// Server Component: filtra por email_contato do credor (regra em casos.ts).
// Em dev/preview, aceita ?eu=email pra simular login.
import Link from "next/link";
import { redirect } from "next/navigation";
import { listarCasosDoCliente, type CasoListagem } from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { devEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { formatBRL, formatStatus, formatTempoRelativo } from "@/lib/format";

type Props = {
  searchParams?: Promise<{ eu?: string | string[] }>;
};

export default async function CasosClientePage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  const eu = devEuFromParam(params.eu) ?? perfil?.email ?? null;

  if (!eu) redirect("/login");

  const casos = await listarCasosDoCliente(eu);

  return (
    <main className="relative mx-auto max-w-[1400px] px-6 py-16 sm:px-10">
      <span className="eyebrow">Casos rastreados</span>
      <h1 className="mt-4 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.15] tracking-tight text-ivory">
        Devedores em busca
      </h1>
      <p className="mt-6 max-w-[600px] text-base leading-relaxed text-[var(--color-ivory-88)]">
        {casos.length === 0
          ? "Nenhum devedor sob monitoramento ate o momento."
          : `${casos.length} ${
              casos.length === 1 ? "devedor monitorado" : "devedores monitorados"
            } pelo escritorio.`}
      </p>

      {casos.length === 0 ? (
        <div className="mt-12 grid place-items-center">
          <SpotlightCard className="max-w-[520px] p-10 text-center">
            <span className="eyebrow !text-[var(--color-signal)]">Aguardando</span>
            <h3 className="mt-4 font-serif text-2xl text-ivory">
              Nenhum caso atribuido ao seu email
            </h3>
            <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
              Assim que o escritorio vincular um caso ao seu endereco de contato,
              ele aparecera aqui.
            </p>
          </SpotlightCard>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {casos.map((caso) => (
            <CardCaso key={caso.caso_id} caso={caso} />
          ))}
        </div>
      )}
    </main>
  );
}

function CardCaso({ caso }: { caso: CasoListagem }) {
  const status = formatStatus(caso.status);
  return (
    <Link href={`/cliente/casos/${caso.devedor.id}`} className="block">
      <SpotlightCard className="cursor-pointer p-6">
        {/* === PROCESSO (topo) === */}
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
            Processo
          </span>
          <span className="font-mono text-[10px] tracking-[0.32em] text-[var(--color-gold)]">
            #{caso.caso_id}
          </span>
        </div>
        <p className="mt-2 font-mono text-sm leading-tight text-ivory">
          {caso.numero_processo ?? "Sem numero registrado"}
        </p>
        <p className="mt-2 text-sm text-[var(--color-ivory-88)]">
          Credito:{" "}
          <span className="text-ivory">{formatBRL(caso.valor_credito_brl)}</span>
        </p>

        <div className="my-5 h-px bg-[var(--color-ivory-12)]" />

        {/* === DEVEDOR (embaixo) === */}
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
          Devedor
        </span>
        <h3 className="mt-2 font-serif text-xl leading-tight text-ivory">
          {caso.devedor.nome}
        </h3>
        <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
          {caso.devedor.tipo === "PF" ? "Pessoa Fisica" : "Pessoa Juridica"} ·{" "}
          {caso.devedor.documento}
        </p>

        <div className="my-5 h-px bg-[var(--color-ivory-12)]" />

        {/* === RESULTADO (bens) === */}
        <div>
          <span className="font-serif text-3xl text-[var(--color-gold)]">
            {caso.total_bens}
          </span>
          <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
            {caso.total_bens === 1 ? "bem encontrado" : "bens encontrados"}
          </span>
        </div>
        {caso.valor_estimado_total_brl > 0 ? (
          <p className="mt-2 text-sm text-[var(--color-ivory-88)]">
            Estimado:{" "}
            <span className="text-ivory">
              {formatBRL(caso.valor_estimado_total_brl)}
            </span>
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between border-t border-[var(--color-ivory-12)] pt-5">
          <span
            className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.32em]"
            style={{ borderColor: status.color, color: status.color }}
          >
            {status.label}
          </span>
          <span className="font-mono text-xs text-[var(--color-ivory-66)]">
            {formatTempoRelativo(caso.ultima_consulta_em)}
          </span>
        </div>
      </SpotlightCard>
    </Link>
  );
}
