// Portal do cliente — listagem de devedores rastreados.
// Server Component: filtra por email_contato do credor (regra em casos.ts).
// Em dev/preview, aceita ?eu=email pra simular login.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { listarCasosDoCliente, type CasoListagem } from "@/lib/casos";
import { perfilLogado } from "@/lib/perfis-server";
import { previewEuFromParam } from "@/lib/dev-auth";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { formatBRL, formatStatus, formatTempoRelativo } from "@/lib/format";

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
        <p className="mx-auto mt-3 max-w-[600px] text-base leading-relaxed text-[var(--color-ivory-88)]">
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
  const docLabel = caso.devedor.tipo === "PF" ? "CPF" : "CNPJ";
  return (
    <Link href={`/cliente/casos/${caso.devedor.id}`} className="block">
      <SpotlightCard className="cursor-pointer p-7">
        {/* === BLOCO 1: IDENTIFICAÇÃO === */}
        <header>
          <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
            Devedor
          </span>
          <h3 className="mt-3 font-serif text-[24px] leading-[1.15] text-[var(--color-gold)]">
            {caso.devedor.nome}
          </h3>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
              {caso.devedor.tipo}
            </span>
            <span className="h-3 w-px bg-[var(--color-ivory-22)]" />
            <span className="font-mono text-[12px] text-ivory">
              {docLabel} {caso.devedor.documento}
            </span>
          </div>
        </header>

        <div className="my-6 h-px bg-[var(--color-ivory-12)]" />

        {/* === BLOCO 2: PROCESSO === */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Processo
          </p>
          <p className="mt-2 break-all font-mono text-[15px] text-[var(--color-gold)]">
            {caso.numero_processo ?? "Sem número registrado"}
          </p>
          {caso.valor_credito_brl ? (
            <p className="mt-3 font-mono text-[13px] text-ivory">
              <span className="text-[var(--color-ivory-66)]">Crédito:</span>{" "}
              <span className="tabular-nums">
                {formatBRL(caso.valor_credito_brl)}
              </span>
            </p>
          ) : null}
        </div>

        <div className="my-6 h-px bg-[var(--color-ivory-12)]" />

        {/* === BLOCO 3: STATS BENS === */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-serif text-4xl leading-none text-[var(--color-gold)]">
              {caso.total_bens}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              {caso.total_bens === 1 ? "Bem Encontrado" : "Bens Encontrados"}
            </p>
          </div>
          {caso.valor_estimado_total_brl > 0 ? (
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                Estimado
              </p>
              <p className="mt-1 font-mono text-[16px] tabular-nums text-ivory">
                {formatBRL(caso.valor_estimado_total_brl)}
              </p>
            </div>
          ) : null}
        </div>

        {/* === BLOCO 4: FOOTER === status + última consulta (sem advogado pro cliente) */}
        <div className="mt-6 space-y-3 border-t border-[var(--color-ivory-12)] pt-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex rounded-full border border-[var(--color-signal)]/40 bg-[var(--color-signal-soft)] px-3 py-1 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
              {status.label}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--color-ivory-66)]">
              <Clock className="h-3 w-3" />
              {formatTempoRelativo(caso.ultima_consulta_em)}
            </span>
          </div>
        </div>
      </SpotlightCard>
    </Link>
  );
}
