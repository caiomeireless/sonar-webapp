// Faixa horizontal de KPIs sobre andamentos capturados nos sistemas dos
// tribunais (e-SAJ, eproc, DataJud). Mostra o valor da automacao de sync
// do GH Actions (Ter+Sex) — destaca total acumulado, ultimos 30d e
// distribuicao por fonte.
//
// Server Component. Recebe dados ja agregados de obterDadosDashboardPlataforma.

import type { KpisAndamentosGlobal } from "@/lib/dashboard-plataforma";

function formatNumero(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(n);
}

function Numero({
  rotulo,
  valor,
  hint,
}: {
  rotulo: string;
  valor: string | number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
        {rotulo}
      </span>
      <span className="font-serif text-2xl text-[var(--color-gold)]">{valor}</span>
      {hint ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export default function KPIAndamentosCapturados({
  dados,
}: {
  dados: KpisAndamentosGlobal;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] p-5 sm:p-6">
      <div className="relative pl-4">
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-6 w-1 rounded-full bg-[var(--color-signal)]"
        />
        <h3 className="font-mono text-[13px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
          Andamentos Capturados nos Tribunais
        </h3>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
          Sincronização automática · Terça e Sexta
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Numero
          rotulo="Total Acumulado"
          valor={formatNumero(dados.total)}
        />
        <Numero
          rotulo="Últimos 30 Dias"
          valor={formatNumero(dados.ultimos_30d)}
        />
        <Numero
          rotulo="Via e-SAJ TJSP"
          valor={formatNumero(dados.por_esaj)}
        />
        <Numero
          rotulo="Via eproc TJSP"
          valor={formatNumero(dados.por_eproc)}
          hint={
            dados.por_datajud > 0
              ? `+ ${formatNumero(dados.por_datajud)} via DataJud`
              : undefined
          }
        />
      </div>
    </div>
  );
}
