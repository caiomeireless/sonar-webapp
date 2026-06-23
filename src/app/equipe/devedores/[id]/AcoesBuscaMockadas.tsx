"use client";

// Barra de ações de busca paga no DOSSIÊ — MOCK pra demo (Dia 4-5).
// Mostra os 3 modos: Combo Lead, Combo Documento, Individual (checkbox).
// Cada clique abre modal com breakdown de custos -> spinner 1.5s -> toast.
// Diferente do card Themis (que NAVEGA pra animação), aqui o feedback é
// inline porque o dossiê já está aberto.
//
// Quando a Sem 2 entregar a Server Action `executarConsultaPaga` real,
// substituir o handler `executar()` por chamada de verdade. UI fica.

import { useState } from "react";
import {
  APIS,
  COMBO_DOC,
  COMBO_LEAD,
  TOTAL_DOC,
  TOTAL_LEAD,
  formatBRL,
} from "@/lib/sonar-apis";

const SALDO_USADO_INICIAL = 47.20;
const LIMITE_MES = 500;

type ModalKind = "lead" | "doc" | "individual" | null;
type ExecState = "idle" | "executing" | "done";

export function AcoesBuscaMockadas({ devedorNome }: { devedorNome: string }) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [execState, setExecState] = useState<ExecState>("idle");
  const [saldoUsado, setSaldoUsado] = useState(SALDO_USADO_INICIAL);
  const [toast, setToast] = useState<string | null>(null);

  const totalIndividual = APIS.filter((a) => selecionadas.has(a.id)).reduce(
    (s, a) => s + a.preco,
    0,
  );

  const apisDoModal =
    modal === "lead"
      ? COMBO_LEAD
      : modal === "doc"
        ? COMBO_DOC
        : APIS.filter((a) => selecionadas.has(a.id));

  const totalModal = apisDoModal.reduce((s, a) => s + a.preco, 0);
  const percSaldo = Math.min(100, (saldoUsado / LIMITE_MES) * 100);
  const saldoDepois = saldoUsado + totalModal;
  const vaiEstourar = saldoDepois > LIMITE_MES;

  function toggleApi(id: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function executar() {
    if (execState !== "idle") return;
    setExecState("executing");
    setTimeout(() => {
      setExecState("done");
      setTimeout(() => {
        setSaldoUsado((s) => Math.min(LIMITE_MES, s + totalModal));
        const n = apisDoModal.length;
        const total = totalModal;
        setModal(null);
        setExecState("idle");
        if (modal === "individual") setSelecionadas(new Set());
        setToast(
          `Concluído — ${n} ${n === 1 ? "consulta executada" : "consultas executadas"} · ${formatBRL(total)} debitado`,
        );
        setTimeout(() => setToast(null), 4500);
      }, 1100);
    }, 1500);
  }

  function fecharModal() {
    if (execState !== "idle") return;
    setModal(null);
  }

  return (
    <>
      {/* ============ BARRA DE AÇÕES ============ */}
      <div className="rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.55)] p-5 backdrop-blur-md">
        {/* Cabeçalho da barra */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
              Ações de busca
            </span>
            <p className="mt-1 text-xs text-[var(--color-ivory-66)]">
              Visível apenas para a equipe · toda consulta paga é logada no monitor
            </p>
          </div>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
              Saldo do mês
            </span>
            <span className="font-mono text-xs">
              <span className="text-[var(--color-gold)]">
                {formatBRL(saldoUsado)}
              </span>
              <span className="text-[var(--color-ivory-66)]">
                {" "}
                / {formatBRL(LIMITE_MES)}
              </span>
            </span>
            <div className="h-1 w-36 overflow-hidden rounded-full bg-[var(--color-ivory-12)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${percSaldo}%`,
                  background:
                    percSaldo > 80
                      ? "var(--color-gold)"
                      : "var(--color-signal)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Botões principais */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setModal("lead")}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-signal)]/85 px-5 py-2.5 text-sm font-semibold text-onyx shadow-[0_4px_24px_rgba(60,255,138,0.28)] ring-1 ring-[var(--color-signal)]/60 transition hover:bg-[var(--color-tip-glow)]/90"
          >
            ⚡ Buscar tudo (lead) · ~{formatBRL(TOTAL_LEAD)}
          </button>

          <button
            type="button"
            onClick={() => setModal("doc")}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-gold)] px-5 py-2.5 text-sm font-semibold text-onyx shadow-[0_4px_24px_rgba(201,162,74,0.4)] transition hover:bg-[var(--color-tip-glow)]"
          >
            📄 Buscar tudo (com prova) · {formatBRL(TOTAL_DOC)}
          </button>

          <button
            type="button"
            onClick={() => setDropdownAberto((a) => !a)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-5 py-2.5 text-sm font-medium text-ivory transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            Buscas individuais {dropdownAberto ? "▴" : "▾"}
          </button>
        </div>

        {/* Dropdown individual */}
        {dropdownAberto ? (
          <div className="mt-4 rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(0,0,0,0.4)] p-4">
            <div className="space-y-0.5">
              {APIS.map((api) => {
                const checked = selecionadas.has(api.id);
                return (
                  <label
                    key={api.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-2 transition hover:bg-white/5 ${
                      checked ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleApi(api.id)}
                        className="h-4 w-4 cursor-pointer accent-[var(--color-signal)]"
                      />
                      <span className="truncate text-sm text-ivory">
                        {api.nome}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className="font-mono text-[10px] uppercase tracking-[0.18em]"
                        style={{
                          color:
                            api.preco === 0
                              ? "var(--color-signal)"
                              : "var(--color-gold)",
                        }}
                      >
                        {api.precoLabel}
                      </span>
                      <span
                        className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em]"
                        style={{
                          borderColor:
                            api.modo === "doc"
                              ? "var(--color-gold)"
                              : "var(--color-signal)",
                          color:
                            api.modo === "doc"
                              ? "var(--color-gold)"
                              : "var(--color-signal)",
                          opacity: 0.7,
                        }}
                      >
                        {api.modo === "doc" ? "doc" : "lead"}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col items-stretch gap-3 border-t border-[var(--color-ivory-12)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono text-xs">
                <span className="text-[var(--color-ivory-66)]">
                  Total selecionado:{" "}
                </span>
                <span className="text-[var(--color-gold)]">
                  {formatBRL(totalIndividual)}
                </span>
                <span className="text-[var(--color-ivory-66)]">
                  {" "}
                  · {selecionadas.size}{" "}
                  {selecionadas.size === 1 ? "API" : "APIs"}
                </span>
              </span>
              <button
                type="button"
                disabled={selecionadas.size === 0}
                onClick={() => setModal("individual")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-signal)]/85 px-5 py-2 text-xs font-semibold text-onyx ring-1 ring-[var(--color-signal)]/60 transition hover:bg-[var(--color-tip-glow)]/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Executar selecionados →
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ============ MODAL ============ */}
      {modal ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={fecharModal}
        >
          <div
            className="w-full max-w-[560px] rounded-xl border border-[var(--color-ivory-22)] bg-[var(--color-carbon)] p-7 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            {execState === "idle" ? (
              <>
                <span className="eyebrow">Confirmar consulta</span>
                <h3 className="mt-2 font-serif text-2xl text-ivory">
                  {modal === "lead"
                    ? "Combo lead"
                    : modal === "doc"
                      ? "Combo documento"
                      : "Consultas selecionadas"}
                </h3>
                <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
                  Devedor: <span className="text-ivory">{devedorNome}</span>
                </p>

                {/* Lista de APIs */}
                <div className="mt-5 max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
                  {apisDoModal.map((api) => (
                    <div
                      key={api.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="truncate text-ivory">{api.nome}</span>
                      <span
                        className="ml-2 whitespace-nowrap font-mono"
                        style={{
                          color:
                            api.preco === 0
                              ? "var(--color-signal)"
                              : "var(--color-gold)",
                        }}
                      >
                        {api.precoLabel}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totais */}
                <div className="mt-5 space-y-2 border-t border-[var(--color-ivory-12)] pt-4">
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-[var(--color-ivory-66)]">
                      Total estimado
                    </span>
                    <span className="font-semibold text-[var(--color-gold)]">
                      {formatBRL(totalModal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[var(--color-ivory-66)]">
                      Saldo do mês após
                    </span>
                    <span className={vaiEstourar ? "text-red-400" : "text-ivory"}>
                      {formatBRL(saldoDepois)} / {formatBRL(LIMITE_MES)}
                    </span>
                  </div>
                </div>

                {/* Alerta combo doc */}
                {modal === "doc" ? (
                  <p className="mt-4 rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-[var(--color-gold)]">
                    ⚠ Consulta CARA — documentos oficiais com fé pública. Recomenda-se confirmar com sócio antes.
                  </p>
                ) : null}

                {vaiEstourar ? (
                  <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 font-mono text-[11px] text-red-300">
                    ⚠ Esta consulta vai ultrapassar o limite mensal. Só aprove se já conversou com sócio.
                  </p>
                ) : null}

                {/* Botões */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-ivory-66)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={executar}
                    className={`rounded-lg px-6 py-2 text-xs font-semibold text-onyx transition ${
                      modal === "doc"
                        ? "bg-[var(--color-gold)] hover:bg-[var(--color-tip-glow)]"
                        : "bg-[var(--color-signal)] hover:bg-[var(--color-tip-glow)]"
                    }`}
                  >
                    {modal === "doc"
                      ? "Aprovar e executar"
                      : "Pagar e executar"}
                  </button>
                </div>
              </>
            ) : execState === "executing" ? (
              <div className="py-10 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-gold)] border-t-transparent" />
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.32em] text-[var(--color-gold)]">
                  Consultando {apisDoModal.length}{" "}
                  {apisDoModal.length === 1 ? "fonte" : "fontes"}...
                </p>
                <p className="mt-2 font-mono text-[11px] text-[var(--color-ivory-66)]">
                  Registrando em custos
                </p>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-4xl text-[var(--color-signal)]">✓</p>
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.32em] text-[var(--color-signal)]">
                  Consultas concluídas
                </p>
                <p className="mt-2 font-mono text-[11px] text-[var(--color-ivory-66)]">
                  {formatBRL(totalModal)} debitado · dados já atualizados no
                  dossiê
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ============ TOAST ============ */}
      {toast ? (
        <div className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2 rounded-lg border border-[var(--color-signal)]/40 bg-[var(--color-carbon)] px-5 py-3 font-mono text-xs text-[var(--color-signal)] shadow-[0_8px_32px_rgba(60,255,138,0.2)]">
          ✓ {toast}
        </div>
      ) : null}
    </>
  );
}
