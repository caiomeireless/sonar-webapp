// Bloco de Andamentos Processuais do dossie. Server component, sem fetch
// proprio — recebe a lista pronta (lib/andamentos.ts) e renderiza:
//
// - 4 KPIs no topo (total, 30d, 90d, ultima movimentacao)
// - Lista agrupada por numero_processo (ordem cronologica desc dentro do grupo)
// - Empty state com explicacao do sync Ter+Sex se nao houver nada
//
// Reaproveita tipografia/cores do design system (var(--color-*)).
import type { Andamento, EstatisticasAndamentos, FonteAndamento } from "@/lib/andamentos";
import { formatData } from "@/lib/format";

const ROTULO_FONTE: Record<FonteAndamento, string> = {
  datajud: "DataJud CNJ",
  "esaj-tjsp": "e-SAJ TJSP",
  "eproc-tjsp": "eproc TJSP",
  pje: "PJe",
  projudi: "Projudi",
  manual: "Manual",
};

// Classes Tailwind por fonte — literals pra o JIT detectar.
const CLASSES_FONTE: Record<FonteAndamento, string> = {
  datajud: "border-[rgba(120,168,220,0.32)] bg-[rgba(120,168,220,0.32)]",
  "esaj-tjsp": "border-[rgba(201,162,74,0.28)] bg-[rgba(201,162,74,0.28)]",
  "eproc-tjsp": "border-[rgba(146,198,112,0.28)] bg-[rgba(146,198,112,0.28)]",
  pje: "border-[rgba(180,140,220,0.28)] bg-[rgba(180,140,220,0.28)]",
  projudi: "border-[rgba(220,160,120,0.28)] bg-[rgba(220,160,120,0.28)]",
  manual: "border-[rgba(234,231,220,0.20)] bg-[rgba(234,231,220,0.10)]",
};

function ChipFonte({ fonte }: { fonte: FonteAndamento }) {
  const cls = CLASSES_FONTE[fonte] ?? CLASSES_FONTE.manual;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ivory ${cls}`}
    >
      {ROTULO_FONTE[fonte] ?? fonte}
    </span>
  );
}

function KpiCard({
  rotulo,
  valor,
  hint,
}: {
  rotulo: string;
  valor: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
        {rotulo}
      </p>
      <p className="mt-1 font-serif text-2xl text-[var(--color-gold)]">{valor}</p>
      {hint ? (
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AndamentosProcessuais({
  andamentos,
  estatisticas,
}: {
  andamentos: Andamento[];
  estatisticas: EstatisticasAndamentos;
}) {
  // Agrupa por numero_processo, preservando ordem cronologica desc.
  const grupos = new Map<string, Andamento[]>();
  for (const a of andamentos) {
    const k = a.numero_processo;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(a);
  }

  const fonteRotulo = estatisticas.fonte_mais_ativa
    ? ROTULO_FONTE[estatisticas.fonte_mais_ativa]
    : "—";

  return (
    <div>
      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard rotulo="Total" valor={estatisticas.total} />
        <KpiCard rotulo="Últimos 30 dias" valor={estatisticas.ultimos_30d} />
        <KpiCard rotulo="Últimos 90 dias" valor={estatisticas.ultimos_90d} />
        <KpiCard
          rotulo="Última Movimentação"
          valor={
            estatisticas.ultima_data ? formatData(estatisticas.ultima_data) : "—"
          }
          hint={
            estatisticas.fonte_mais_ativa
              ? `${fonteRotulo} (${estatisticas.fonte_mais_ativa_count} andamentos)`
              : undefined
          }
        />
      </div>

      {/* Lista — cada processo abre retraido. Clica na seta pra expandir. */}
      {andamentos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[var(--color-ivory-22)] bg-[rgba(5,7,6,0.35)] px-6 py-10 text-center">
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Sem Andamentos Capturados
          </p>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            Os crawlers e-SAJ e eproc rodam às terças e sextas. Andamentos novos
            aparecerão aqui assim que a próxima execução automática terminar.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {Array.from(grupos.entries()).map(([numero, lista]) => {
            // Data do andamento mais recente do processo (pra exibir no header
            // retraido — preview rapida sem precisar abrir).
            const ultimoData = lista[0]?.data_andamento ?? lista[0]?.capturado_em;
            return (
              <details
                key={numero}
                className="group rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.35)] open:bg-[rgba(5,7,6,0.55)]"
              >
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-[rgba(5,7,6,0.45)]">
                  <div className="flex items-center gap-3">
                    {/* Chevron rotaciona com group-open. SVG inline pra nao
                        depender de lucide-react aqui (server component). */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4 text-[var(--color-gold)] transition-transform duration-200 group-open:rotate-90"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <h3 className="font-mono text-[13px] uppercase tracking-[0.18em] text-[var(--color-gold)]">
                      {numero}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {ultimoData ? (
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                        Última {formatData(ultimoData)}
                      </span>
                    ) : null}
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-88)]">
                      {lista.length} {lista.length === 1 ? "andamento" : "andamentos"}
                    </span>
                  </div>
                </summary>
                <ul className="space-y-2 border-t border-[var(--color-ivory-12)] px-4 pb-4 pt-4">
                  {lista.map((a) => {
                    const data = a.data_andamento ?? a.capturado_em;
                    return (
                      <li
                        key={a.id}
                        className="rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.45)] px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                            {formatData(data)}
                          </span>
                          <ChipFonte fonte={a.fonte} />
                          {a.tribunal ? (
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                              · {a.tribunal}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-snug text-[var(--color-ivory-88)]">
                          {a.descricao}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
