"use client";

// Filtros do Dashboard da Plataforma. URL params como estado:
//   ?periodo=30d &advogados=a@x.com,b@y.com &credores=1,2 &status=ativo,pausado
// Auto-aplica ao mudar (router.push -> server re-renderiza).

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { PeriodoChave, StatusCaso } from "@/lib/dashboard-plataforma";
import { SelectorChips } from "@/components/ui/SelectorChips";

type AdvogadoOpcao = { email: string; nome: string };
type CredorOpcao = { id: number; nome: string };

const PERIODOS: { chave: PeriodoChave; rotulo: string }[] = [
  { chave: "tudo", rotulo: "Tudo" },
  { chave: "7d", rotulo: "7 dias" },
  { chave: "30d", rotulo: "30 dias" },
  { chave: "90d", rotulo: "90 dias" },
  { chave: "mes", rotulo: "Este mês" },
  { chave: "ano", rotulo: "Este ano" },
];

const STATUS: { chave: StatusCaso; rotulo: string }[] = [
  { chave: "ativo", rotulo: "Ativos" },
  { chave: "pausado", rotulo: "Pausados" },
  { chave: "encerrado", rotulo: "Encerrados" },
  { chave: "satisfeito", rotulo: "Satisfeitos" },
];

export default function FiltrosPlataforma({
  advogados,
  credores,
}: {
  advogados: AdvogadoOpcao[];
  credores: CredorOpcao[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Lê estado atual da URL
  const atual = useMemo(() => {
    const periodo = (sp.get("periodo") || "tudo") as PeriodoChave;
    const advs = (sp.get("advogados") || "").split(",").filter(Boolean);
    const creds = (sp.get("credores") || "")
      .split(",")
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n));
    const status = (sp.get("status") || "").split(",").filter(Boolean) as StatusCaso[];
    return { periodo, advs, creds, status };
  }, [sp]);

  function aplicar(novoParcial: {
    periodo?: PeriodoChave;
    advs?: string[];
    creds?: number[];
    status?: StatusCaso[];
  }) {
    const params = new URLSearchParams();
    const periodo = novoParcial.periodo ?? atual.periodo;
    const advs = novoParcial.advs ?? atual.advs;
    const creds = novoParcial.creds ?? atual.creds;
    const status = novoParcial.status ?? atual.status;

    if (periodo && periodo !== "tudo") params.set("periodo", periodo);
    if (advs.length) params.set("advogados", advs.join(","));
    if (creds.length) params.set("credores", creds.join(","));
    if (status.length) params.set("status", status.join(","));

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/equipe?${qs}` : "/equipe", { scroll: false });
    });
  }

  const filtrosAtivos =
    atual.periodo !== "tudo" ||
    atual.advs.length > 0 ||
    atual.creds.length > 0 ||
    atual.status.length > 0;

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  return (
    <div
      className="glass mb-6 flex flex-wrap items-center gap-4 p-4"
      data-pending={pending ? "1" : "0"}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Período */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory)]">
            Período
          </span>
          <SelectorChips
            opcoes={PERIODOS.map((p) => ({ valor: p.chave, rotulo: p.rotulo }))}
            selecionados={[atual.periodo]}
            mode="single"
            accent="gold"
            onChange={(novos) =>
              aplicar({ periodo: (novos[0] ?? "tudo") as PeriodoChave })
            }
          />
        </div>

        {/* Advogado */}
        <DropdownMulti
          rotulo="Advogado"
          opcoes={advogados.map((a) => ({ valor: a.email, rotulo: a.nome }))}
          selecionados={atual.advs}
          onMudar={(novos) => aplicar({ advs: novos })}
          onToggle={(v) => aplicar({ advs: toggle(atual.advs, v) })}
        />

        {/* Cliente */}
        <DropdownMulti
          rotulo="Cliente"
          opcoes={credores.map((c) => ({ valor: String(c.id), rotulo: c.nome }))}
          selecionados={atual.creds.map(String)}
          onMudar={(novos) =>
            aplicar({ creds: novos.map(Number).filter((n) => !Number.isNaN(n)) })
          }
          onToggle={(v) => {
            const n = Number(v);
            if (Number.isNaN(n)) return;
            aplicar({ creds: toggle(atual.creds, n) });
          }}
        />

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory)]">
            Status
          </span>
          <SelectorChips
            opcoes={STATUS.map((s) => ({ valor: s.chave, rotulo: s.rotulo }))}
            selecionados={atual.status}
            mode="multi"
            accent="signal"
            onChange={(novos) => aplicar({ status: novos as StatusCaso[] })}
          />
        </div>

        {filtrosAtivos && (
          <button
            type="button"
            onClick={() =>
              aplicar({ periodo: "tudo", advs: [], creds: [], status: [] })
            }
            className="ml-auto rounded-md border border-[var(--color-ivory-22)] px-2.5 py-1 text-xs text-[var(--color-ivory-88)] transition hover:bg-white/5"
          >
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}

function DropdownMulti({
  rotulo,
  opcoes,
  selecionados,
  onToggle,
  onMudar,
}: {
  rotulo: string;
  opcoes: { valor: string; rotulo: string }[];
  selecionados: string[];
  onToggle: (valor: string) => void;
  onMudar: (novos: string[]) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const label =
    selecionados.length === 0
      ? "Todos"
      : selecionados.length === 1
        ? (opcoes.find((o) => o.valor === selecionados[0])?.rotulo ?? selecionados[0])
        : `${selecionados.length} selecionados`;

  return (
    <div className="relative flex items-center gap-1">
      <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory)]">
        {rotulo}
      </span>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className={
          "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition " +
          (selecionados.length > 0
            ? "bg-[var(--color-signal)] text-onyx"
            : "border border-[var(--color-ivory-22)] bg-transparent text-[var(--color-ivory-88)] hover:bg-white/5")
        }
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      {aberto && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setAberto(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute left-0 top-full z-20 mt-1 max-h-[280px] w-[260px] overflow-y-auto rounded-lg border border-[var(--color-ivory-12)] bg-[var(--color-carbon)] p-2 shadow-2xl">
            {selecionados.length > 0 && (
              <button
                type="button"
                onClick={() => onMudar([])}
                className="mb-1 w-full rounded px-2 py-1 text-left text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)] hover:bg-white/5"
              >
                Limpar
              </button>
            )}
            {opcoes.length === 0 ? (
              <p className="px-2 py-2 text-xs text-[var(--color-ivory-66)]">
                Nenhuma opção
              </p>
            ) : (
              opcoes.map((o) => {
                const sel = selecionados.includes(o.valor);
                return (
                  <button
                    key={o.valor}
                    type="button"
                    onClick={() => onToggle(o.valor)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-ivory transition hover:bg-white/5"
                  >
                    <span
                      className={
                        "flex h-3.5 w-3.5 flex-none items-center justify-center rounded border " +
                        (sel
                          ? "border-[var(--color-signal)] bg-[var(--color-signal)]"
                          : "border-[var(--color-ivory-22)]")
                      }
                    >
                      {sel && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5l2.5 2.5L8.5 2" stroke="#0A0C0B" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{o.rotulo}</span>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
