"use client";

// Botao "Gerar peca" no dossie + modal de 2 etapas:
//   1) Coluna esquerda: escolhe TIPO de peca (radio, agrupado por categoria).
//   2) Coluna direita: marca OPCOES booleanas especificas do template (checkbox).
// Click em "Gerar peca" navega pra /equipe/devedores/[id]/peca/[template_id]
// com ?opcoes=csv das opcoes ATIVADAS.
// Modal via createPortal pra escapar de containers com backdrop-filter
// (ver memoria portal-para-modal-em-pai-com-backdrop-filter).

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  TEMPLATES,
  type TemplateCategoria,
  type TemplateId,
  type TemplateMeta,
} from "@/lib/pecas-templates";

type Props = {
  devedorId: number;
  euQuery: string;
  /** Quais templates sao sugeridos pelo dossie atual (UI mostra badge). */
  sugeridos: TemplateId[];
};

const CATEGORIA_LABEL: Record<TemplateCategoria, string> = {
  penhora: "Penhora",
  bloqueio: "Bloqueio",
};

// Ordem fixa das categorias no painel esquerdo
const CATEGORIA_ORDEM: TemplateCategoria[] = ["penhora", "bloqueio"];

function defaultOpcoesPara(template: TemplateMeta): Set<string> {
  const ativas = new Set<string>();
  for (const op of template.opcoes) {
    if (op.default) ativas.add(op.id);
  }
  return ativas;
}

function mergeQuery(euQuery: string, opcoesCsv: string): string {
  // euQuery vem como "" ou "?eu=...". Combina com ?opcoes=...
  const partes: string[] = [];
  if (euQuery.startsWith("?")) {
    partes.push(euQuery.slice(1));
  } else if (euQuery.length > 0) {
    partes.push(euQuery);
  }
  if (opcoesCsv.length > 0) {
    partes.push(`opcoes=${encodeURIComponent(opcoesCsv)}`);
  }
  return partes.length > 0 ? `?${partes.join("&")}` : "";
}

export function BotaoGerarPeca({ devedorId, euQuery, sugeridos }: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Template selecionado (id) — default: primeiro sugerido, senao primeiro da lista.
  const idInicial: TemplateId = useMemo(() => {
    const primeiroSugerido = TEMPLATES.find((t) => sugeridos.includes(t.id));
    return (primeiroSugerido ?? TEMPLATES[0]).id;
  }, [sugeridos]);

  const [selecionadoId, setSelecionadoId] = useState<TemplateId>(idInicial);

  // Estado das opcoes: map templateId -> Set de opcoes ativas.
  // Inicia preenchido com defaults pra cada template (assim trocar de template
  // nao perde o que o user marcou em outro).
  const [opcoesPorTemplate, setOpcoesPorTemplate] = useState<
    Record<TemplateId, Set<string>>
  >(() => {
    const acc = {} as Record<TemplateId, Set<string>>;
    for (const t of TEMPLATES) {
      acc[t.id] = defaultOpcoesPara(t);
    }
    return acc;
  });

  // Quando reabrir o modal, garante que o template default reflete sugeridos atuais.
  useEffect(() => {
    if (aberto) setSelecionadoId(idInicial);
  }, [aberto, idInicial]);

  const templateSelecionado = useMemo(
    () => TEMPLATES.find((t) => t.id === selecionadoId) ?? TEMPLATES[0],
    [selecionadoId],
  );

  function toggleOpcao(templateId: TemplateId, opcaoId: string) {
    setOpcoesPorTemplate((prev) => {
      const next = new Set(prev[templateId]);
      if (next.has(opcaoId)) next.delete(opcaoId);
      else next.add(opcaoId);
      return { ...prev, [templateId]: next };
    });
  }

  function gerar() {
    const ativas = opcoesPorTemplate[selecionadoId];
    const csv = Array.from(ativas).join(",");
    const query = mergeQuery(euQuery, csv);
    router.push(
      `/equipe/devedores/${devedorId}/peca/${selecionadoId}${query}`,
    );
  }

  // Agrupa templates por categoria (mantendo ordem fixa)
  const porCategoria = useMemo(() => {
    const map = new Map<TemplateCategoria, TemplateMeta[]>();
    for (const cat of CATEGORIA_ORDEM) map.set(cat, []);
    for (const t of TEMPLATES) {
      const arr = map.get(t.categoria);
      if (arr) arr.push(t);
      else map.set(t.categoria, [t]);
    }
    return map;
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-gold)]/40 bg-[rgba(201,162,74,0.08)] px-6 py-4 text-sm font-medium text-[var(--color-gold)] transition hover:border-[var(--color-gold)] hover:bg-[rgba(201,162,74,0.14)] sm:w-auto"
      >
        📄 Gerar peça a partir deste dossiê
      </button>

      {aberto && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
              onClick={() => setAberto(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[920px] rounded-xl border border-[var(--color-ivory-22)] bg-[var(--color-carbon)] p-7 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.9)]"
              >
                <span className="eyebrow">Gerar peça</span>
                <h3 className="mt-2 font-serif text-2xl text-ivory">
                  Escolha o tipo de peça e ajuste as opções
                </h3>
                <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
                  A peça será gerada com timbre do escritório, dados do caso e bens encontrados já preenchidos.
                </p>

                <div className="mt-6 grid gap-6 sm:grid-cols-1 md:grid-cols-[1fr_1fr]">
                  {/* COLUNA ESQUERDA — tipo de peça por categoria */}
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
                      Tipo de peça
                    </div>
                    <div className="mt-3 space-y-5">
                      {CATEGORIA_ORDEM.map((cat) => {
                        const itens = porCategoria.get(cat) ?? [];
                        if (itens.length === 0) return null;
                        return (
                          <div key={cat}>
                            <div className="font-serif text-xs uppercase tracking-[0.18em] text-[var(--color-gold)]/80">
                              {CATEGORIA_LABEL[cat]}
                            </div>
                            <div className="mt-2 space-y-2">
                              {itens.map((t) => {
                                const ativo = t.id === selecionadoId;
                                const sugerido = sugeridos.includes(t.id);
                                return (
                                  <label
                                    key={t.id}
                                    className={`group flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition ${
                                      ativo
                                        ? "border-[var(--color-gold)] bg-[rgba(201,162,74,0.08)]"
                                        : "border-[var(--color-ivory-12)] bg-[rgba(0,0,0,0.3)] hover:border-[var(--color-gold)]/60 hover:bg-[rgba(201,162,74,0.05)]"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="template-peca"
                                      value={t.id}
                                      checked={ativo}
                                      onChange={() => setSelecionadoId(t.id)}
                                      className="sr-only"
                                    />
                                    <span
                                      className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base transition ${
                                        ativo
                                          ? "bg-[var(--color-gold)]/20"
                                          : "bg-[var(--color-ivory-12)]"
                                      }`}
                                      aria-hidden="true"
                                    >
                                      {t.emoji}
                                    </span>
                                    <span className="flex-1">
                                      <span className="flex items-center gap-2">
                                        <span className="font-serif text-sm text-ivory">
                                          {t.nome}
                                        </span>
                                        {sugerido ? (
                                          <span className="rounded-full border border-[var(--color-signal)]/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
                                            sugerido
                                          </span>
                                        ) : null}
                                      </span>
                                      <span className="mt-1 block text-xs leading-relaxed text-[var(--color-ivory-66)]">
                                        {t.descricao}
                                      </span>
                                    </span>
                                    <span
                                      className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${
                                        ativo
                                          ? "border-[var(--color-gold)] bg-[var(--color-gold)]"
                                          : "border-[var(--color-ivory-22)]"
                                      }`}
                                      aria-hidden="true"
                                    >
                                      {ativo ? (
                                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-carbon)]" />
                                      ) : null}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* COLUNA DIREITA — opções do template selecionado */}
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
                      Opções desta peça
                    </div>
                    <div className="mt-3 rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(0,0,0,0.2)] p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ivory-12)] text-base"
                          aria-hidden="true"
                        >
                          {templateSelecionado.emoji}
                        </span>
                        <span className="font-serif text-sm text-ivory">
                          {templateSelecionado.nome}
                        </span>
                      </div>
                      {templateSelecionado.opcoes.length === 0 ? (
                        <p className="mt-3 font-mono text-xs text-[var(--color-ivory-66)]">
                          Esta peça não tem opções adicionais.
                        </p>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {templateSelecionado.opcoes.map((op) => {
                            const ativo = opcoesPorTemplate[
                              templateSelecionado.id
                            ].has(op.id);
                            return (
                              <label
                                key={op.id}
                                className="flex cursor-pointer items-start gap-3"
                              >
                                <span
                                  className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                    ativo
                                      ? "border-[var(--color-gold)] bg-[var(--color-gold)]"
                                      : "border-[var(--color-ivory-22)] bg-transparent"
                                  }`}
                                  aria-hidden="true"
                                >
                                  {ativo ? (
                                    <svg
                                      viewBox="0 0 12 12"
                                      className="h-3 w-3 text-[var(--color-carbon)]"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polyline points="2.5,6.5 5,9 9.5,3.5" />
                                    </svg>
                                  ) : null}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={ativo}
                                  onChange={() =>
                                    toggleOpcao(templateSelecionado.id, op.id)
                                  }
                                  className="sr-only"
                                />
                                <span className="flex-1">
                                  <span className="block text-xs text-ivory">
                                    {op.label}
                                  </span>
                                  {op.hint ? (
                                    <span className="mt-0.5 block font-mono text-[10px] text-[var(--color-ivory-66)]">
                                      {op.hint}
                                    </span>
                                  ) : null}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAberto(false)}
                    className="rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-ivory-66)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={gerar}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-gold)] bg-[var(--color-gold)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-carbon)] transition hover:bg-[var(--color-tip-glow)]"
                  >
                    Gerar peca →
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
