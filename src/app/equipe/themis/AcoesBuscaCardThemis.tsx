"use client";

// Acoes de busca no card de processo da Themis.
// 3 botoes: Combo Lead, Combo Documento, Buscas Individuais.
// Cada um abre modal -> "Pagar e executar" submete form -> Server Action
// redireciona pra /equipe/themis/busca/[id]?modo=&apis= -> animacao
// cinematografica adapta os cards as APIs envolvidas.
//
// IMPORTANTE: o modal usa createPortal porque o componente vive dentro
// de <SpotlightCard>, que tem backdrop-filter — isso cria um stacking
// context e prende `position: fixed` dentro do card. Sem o portal, o
// modal aparece confinado em cada card (bug visivel nos cards de baixo).
//
// Modo MOCK pra demo: nao faz chamada real. Quando Sem 2 entregar,
// `executarConsultaPaga` substitui o redirect e os custos viram reais.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  APIS,
  COMBO_DOC,
  COMBO_LEAD,
  IDS_COMBO_DOC,
  IDS_COMBO_LEAD,
  TOTAL_DOC,
  TOTAL_LEAD,
  type ApiSonar,
  formatBRL,
} from "@/lib/sonar-apis";
import { iniciarBuscaCombo } from "@/lib/actions/themis-actions";

type ModalKind = "lead" | "doc" | "individual" | null;

const SALDO_USADO = 47.2; // mockado (compartilhado com o dossie)
const LIMITE_MES = 500;

type Props = {
  devedorId: number;
  eu: string;
  jaRastreado: boolean;
};

export function AcoesBuscaCardThemis({ devedorId, eu, jaRastreado }: Props) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [dropdownAberto, setDropdownAberto] = useState(false);
  // Portal precisa de `document.body` — so monta no client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalIndividual = APIS.filter((a) => selecionadas.has(a.id)).reduce(
    (s, a) => s + a.preco,
    0,
  );

  const apisDoModal: ApiSonar[] =
    modal === "lead"
      ? COMBO_LEAD
      : modal === "doc"
        ? COMBO_DOC
        : APIS.filter((a) => selecionadas.has(a.id));

  const idsDoModal: string =
    modal === "lead"
      ? IDS_COMBO_LEAD
      : modal === "doc"
        ? IDS_COMBO_DOC
        : Array.from(selecionadas).join(",");

  const totalModal = apisDoModal.reduce((s, a) => s + a.preco, 0);
  const saldoDepois = SALDO_USADO + totalModal;
  const vaiEstourar = saldoDepois > LIMITE_MES;

  function toggleApi(id: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* ============ BOTOES PRINCIPAIS ============ */}
      <div className="mt-6 flex flex-col items-stretch gap-3 border-t border-[var(--color-ivory-12)] pt-6">
        <div className="flex flex-wrap items-center gap-3">
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

          {jaRastreado ? (
            <a
              href={`/equipe/devedores/${devedorId}${eu ? `?eu=${encodeURIComponent(eu)}` : ""}`}
              className="ml-auto inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)] transition hover:text-[var(--color-gold)]"
            >
              Ver dossie atual →
            </a>
          ) : null}
        </div>

        {/* Dropdown individual */}
        {dropdownAberto ? (
          <div className="mt-2 rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(0,0,0,0.4)] p-4">
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

      {/* ============ MODAL DE CONFIRMACAO (via portal pra escapar do
           backdrop-filter do SpotlightCard pai) ============ */}
      {modal && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
              onClick={() => setModal(null)}
            >
              <form
                action={iniciarBuscaCombo}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[560px] rounded-xl border border-[var(--color-ivory-22)] bg-[var(--color-carbon)] p-7 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.9)]"
              >
            {/* Hidden inputs pro Server Action */}
            <input type="hidden" name="devedor_id" value={devedorId} />
            <input type="hidden" name="eu" value={eu} />
            <input type="hidden" name="modo" value={modal} />
            <input type="hidden" name="apis" value={idsDoModal} />

            <span className="eyebrow">Confirmar consulta</span>
            <h3 className="mt-2 font-serif text-2xl text-ivory">
              {modal === "lead"
                ? "Combo lead"
                : modal === "doc"
                  ? "Combo documento"
                  : "Consultas selecionadas"}
            </h3>
            <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
              Em sequencia: confirmar → animacao cinematografica → dossie atualizado
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
                  Saldo do mes apos
                </span>
                <span className={vaiEstourar ? "text-red-400" : "text-ivory"}>
                  {formatBRL(saldoDepois)} / {formatBRL(LIMITE_MES)}
                </span>
              </div>
            </div>

            {/* Alerta combo doc */}
            {modal === "doc" ? (
              <p className="mt-4 rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-[var(--color-gold)]">
                ⚠ Consulta CARA — documentos oficiais com fe publica. Recomenda-se confirmar com socio antes.
              </p>
            ) : null}

            {vaiEstourar ? (
              <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 font-mono text-[11px] text-red-300">
                ⚠ Esta consulta vai ultrapassar o limite mensal. So aprove se ja conversou com socio.
              </p>
            ) : null}

            {/* Botoes */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-ivory-66)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={apisDoModal.length === 0}
                className={`rounded-lg px-6 py-2 text-xs font-semibold text-onyx transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  modal === "doc"
                    ? "bg-[var(--color-gold)] hover:bg-[var(--color-tip-glow)]"
                    : "bg-[var(--color-signal)] hover:bg-[var(--color-tip-glow)]"
                }`}
              >
                {modal === "doc"
                  ? "Aprovar e executar →"
                  : "Pagar e executar →"}
              </button>
            </div>
          </form>
        </div>,
            document.body,
          )
        : null}
    </>
  );
}
