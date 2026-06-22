"use client";

// Cliente principal da pagina /gerador-peca. Layout responsivo:
//   - Mobile: 1 coluna (configurador acima, preview abaixo)
//   - md+   : 2 colunas (configurador ~35% sticky a esquerda, preview ~65% direita)
//
// Estado:
//   - templateId: preset selecionado (default: primeiro sugerido pelo dossie)
//   - bensSelecionados: Set<number> de ids dos bens marcados (default: todos)
//   - opcoesAtivas: Set<string> de ids de opcoes (resetado quando muda template)
//   - previewUrl: URL do iframe (debounced ~400ms)
//
// Acoes:
//   - "Baixar .docx" via fetch+blob (logica copiada de BotaoBaixarDocx)
//   - "Imprimir / PDF" via iframe.contentWindow.print()
import { useEffect, useMemo, useRef, useState } from "react";
import {
  TEMPLATES,
  type TemplateId,
  type TemplateMeta,
  opcoesPadrao,
} from "@/lib/pecas-templates";
import type { Bem, Dossie } from "@/lib/casos";
import type { TipoBem } from "@/lib/mock-fixtures";
import { formatBRL } from "@/lib/format";

type Props = {
  dossie: Dossie;
  devedorId: number;
  euQuery: string; // "" ou "?eu=..."
  sugeridos: TemplateId[];
};

const TIPO_EMOJI: Record<TipoBem, string> = {
  imovel: "🏠",
  veiculo: "🚗",
  empresa: "🏢",
  processo_credito: "📋",
  endereco: "📍",
  vinculo: "👥",
};

// Templates filtram bens por tipo. Pra cada template, quais tipos de bem
// fazem sentido incluir (os outros ficam ocultos da lista de checkboxes).
// 'penhora-consolidada' aceita tudo — modo "custom" do brief.
const TIPOS_RELEVANTES_POR_TEMPLATE: Record<TemplateId, TipoBem[] | null> = {
  "penhora-imovel": ["imovel"],
  "penhora-veiculo": ["veiculo"],
  "penhora-cotas": ["empresa"],
  "penhora-rosto-autos": ["processo_credito"],
  "penhora-faturamento": ["empresa"],
  "bloqueio-sisbajud": [], // nao depende de bem; lista fica vazia
  "penhora-consolidada": null, // todos os tipos
};

// Categoriza visualmente as opcoes em 2 grupos: "Pedidos" vs "Redacao".
// Mesmo Set<string> de opcoesAtivas — so layout muda.
const IDS_REDACAO = new Set([
  "sigiloso",
  "gratuidade",
  "multa-cpc-523",
  "mencionar-ma-fe",
  "modalidade-reiterada",
]);

function isRedacao(opcaoId: string): boolean {
  return IDS_REDACAO.has(opcaoId);
}

function bensIniciaisParaTemplate(
  dossie: Dossie,
  templateId: TemplateId,
): Set<number> {
  const tiposRel = TIPOS_RELEVANTES_POR_TEMPLATE[templateId];
  if (tiposRel === null) {
    // Modo consolidada — marca todos
    return new Set(dossie.bens.map((b) => b.id));
  }
  if (tiposRel.length === 0) return new Set();
  return new Set(
    dossie.bens.filter((b) => tiposRel.includes(b.tipo)).map((b) => b.id),
  );
}

function bensVisiveisParaTemplate(dossie: Dossie, templateId: TemplateId): Bem[] {
  const tiposRel = TIPOS_RELEVANTES_POR_TEMPLATE[templateId];
  if (tiposRel === null) return dossie.bens;
  if (tiposRel.length === 0) return [];
  return dossie.bens.filter((b) => tiposRel.includes(b.tipo));
}

function montarUrl(opts: {
  base: string;
  euQuery: string;
  opcoesCsv: string;
  bensCsv: string;
}): string {
  const { base, euQuery, opcoesCsv, bensCsv } = opts;
  const partes: string[] = [];
  if (euQuery.startsWith("?")) partes.push(euQuery.slice(1));
  else if (euQuery.length > 0) partes.push(euQuery);
  if (opcoesCsv) partes.push(`opcoes=${encodeURIComponent(opcoesCsv)}`);
  if (bensCsv) partes.push(`bens=${encodeURIComponent(bensCsv)}`);
  return partes.length > 0 ? `${base}?${partes.join("&")}` : base;
}

export function GeradorPecaApp({ dossie, devedorId, euQuery, sugeridos }: Props) {
  // ===== Template selecionado =====
  const idInicial: TemplateId = useMemo(() => {
    const primeiroSug = TEMPLATES.find((t) => sugeridos.includes(t.id));
    return (primeiroSug ?? TEMPLATES[0]).id;
  }, [sugeridos]);
  const [templateId, setTemplateId] = useState<TemplateId>(idInicial);

  const templateMeta: TemplateMeta = useMemo(
    () => TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0],
    [templateId],
  );

  // ===== Opcoes ativas (resetadas ao trocar template) =====
  const [opcoesAtivas, setOpcoesAtivas] = useState<Set<string>>(
    () => opcoesPadrao(templateMeta),
  );

  // ===== Bens selecionados (resetados ao trocar template) =====
  const [bensSelecionados, setBensSelecionados] = useState<Set<number>>(
    () => bensIniciaisParaTemplate(dossie, templateId),
  );

  // Quando o template muda: reaplica defaults de opcoes + recalcula
  // bens-iniciais. Usa effect (em vez de derivar) pra permitir que o
  // user mexa livre depois.
  useEffect(() => {
    setOpcoesAtivas(opcoesPadrao(templateMeta));
    setBensSelecionados(bensIniciaisParaTemplate(dossie, templateMeta.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateMeta.id]);

  // ===== Preview URL (debounced 400ms) =====
  const opcoesCsv = useMemo(
    () => Array.from(opcoesAtivas).join(","),
    [opcoesAtivas],
  );
  const bensCsv = useMemo(
    () =>
      Array.from(bensSelecionados)
        .sort((a, b) => a - b)
        .join(","),
    [bensSelecionados],
  );

  const previewUrlAlvo = useMemo(
    () =>
      montarUrl({
        base: `/equipe/devedores/${devedorId}/peca/${templateId}`,
        euQuery,
        opcoesCsv,
        bensCsv,
      }),
    [devedorId, templateId, euQuery, opcoesCsv, bensCsv],
  );

  const [previewUrl, setPreviewUrl] = useState<string>(previewUrlAlvo);
  useEffect(() => {
    const t = setTimeout(() => setPreviewUrl(previewUrlAlvo), 400);
    return () => clearTimeout(t);
  }, [previewUrlAlvo]);

  // ===== Acoes =====
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  function toggleOpcao(opcaoId: string) {
    setOpcoesAtivas((prev) => {
      const next = new Set(prev);
      if (next.has(opcaoId)) next.delete(opcaoId);
      else next.add(opcaoId);
      return next;
    });
  }

  function toggleBem(bemId: number) {
    setBensSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(bemId)) next.delete(bemId);
      else next.add(bemId);
      return next;
    });
  }

  function marcarTodosBens() {
    setBensSelecionados(
      new Set(bensVisiveisParaTemplate(dossie, templateId).map((b) => b.id)),
    );
  }
  function desmarcarTodosBens() {
    setBensSelecionados(new Set());
  }

  function imprimir() {
    const ifr = iframeRef.current;
    if (!ifr) return;
    try {
      ifr.contentWindow?.focus();
      ifr.contentWindow?.print();
    } catch (e) {
      console.error("[GeradorPecaApp] erro ao imprimir iframe:", e);
      alert("Nao foi possivel imprimir o preview.");
    }
  }

  async function baixarDocx() {
    if (downloading) return;
    setDownloading(true);
    try {
      const url = montarUrl({
        base: `/api/pecas/${devedorId}/${encodeURIComponent(templateId)}/docx`,
        euQuery,
        opcoesCsv,
        bensCsv,
      });
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Falha no download (${res.status})`);
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const disp = res.headers.get("Content-Disposition") ?? "";
      const m = disp.match(/filename="([^"]+)"/i);
      a.download = m?.[1] ?? `peca-${templateId}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error("[GeradorPecaApp] erro baixar docx:", e);
      alert("Erro ao gerar .docx");
    } finally {
      setDownloading(false);
    }
  }

  const bensVisiveis = bensVisiveisParaTemplate(dossie, templateId);

  // ===== Agrupa opcoes em Pedidos vs Redacao (visual) =====
  const opcoesPedidos = templateMeta.opcoes.filter((op) => !isRedacao(op.id));
  const opcoesRedacao = templateMeta.opcoes.filter((op) => isRedacao(op.id));

  return (
    <div className="mx-auto grid max-w-[1600px] gap-6 px-6 py-8 sm:px-10 md:grid-cols-[minmax(0,35fr)_minmax(0,65fr)]">
      {/* ============ COLUNA CONFIGURADOR (esq, sticky em md+) ============ */}
      <aside className="flex flex-col gap-5 md:sticky md:top-6 md:max-h-[calc(100svh-6rem)] md:overflow-y-auto md:pr-2">
        {/* Secao 1 — Preset (radios) */}
        <Card titulo="1. Preset">
          <ul className="space-y-2">
            {TEMPLATES.map((t) => {
              const ativo = t.id === templateId;
              const sugerido = sugeridos.includes(t.id);
              return (
                <li key={t.id}>
                  <label
                    className={`group flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition ${
                      ativo
                        ? "border-[var(--color-gold)] bg-[rgba(201,162,74,0.10)]"
                        : "border-[var(--color-ivory-12)] bg-[rgba(0,0,0,0.3)] hover:border-[var(--color-gold)]/60 hover:bg-[rgba(201,162,74,0.05)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="preset-peca"
                      value={t.id}
                      checked={ativo}
                      onChange={() => setTemplateId(t.id)}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base transition ${
                        ativo
                          ? "bg-[var(--color-gold)]/25"
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
                          <span className="rounded-full border border-[var(--color-signal)]/40 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
                            sugerido
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-[var(--color-ivory-66)]">
                        {t.descricao}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Secao 2 — Bens a incluir */}
        <Card
          titulo="2. Bens a incluir"
          headerExtra={
            bensVisiveis.length > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={marcarTodosBens}
                  className="rounded-md border border-[var(--color-ivory-22)] bg-white/5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ivory transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
                >
                  Marcar todos
                </button>
                <button
                  type="button"
                  onClick={desmarcarTodosBens}
                  className="rounded-md border border-[var(--color-ivory-22)] bg-white/5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ivory transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
                >
                  Desmarcar
                </button>
              </div>
            ) : null
          }
        >
          {bensVisiveis.length === 0 ? (
            <p className="font-mono text-[11px] text-[var(--color-ivory-66)]">
              Esta peca nao depende de bens especificos do dossie — ela e
              gerada a partir do caso/valor da divida.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {bensVisiveis.map((bem) => {
                const ativo = bensSelecionados.has(bem.id);
                return (
                  <li key={bem.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 transition hover:bg-white/5">
                      <CheckboxVisual ativo={ativo} />
                      <input
                        type="checkbox"
                        checked={ativo}
                        onChange={() => toggleBem(bem.id)}
                        className="sr-only"
                      />
                      <span className="flex-1 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span aria-hidden="true">{TIPO_EMOJI[bem.tipo]}</span>
                          <span className="text-ivory">{bem.titulo}</span>
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-[var(--color-ivory-66)]">
                          {bem.valor_estimado_brl !== null
                            ? `${formatBRL(bem.valor_estimado_brl)} · `
                            : ""}
                          {bem.fonte}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Secao 3 — Pedidos (opcoes "pedir-*", "incluir-*", etc) */}
        {opcoesPedidos.length > 0 ? (
          <Card titulo="3. Pedidos">
            <ul className="space-y-2.5">
              {opcoesPedidos.map((op) => (
                <CheckboxLinha
                  key={op.id}
                  label={op.label}
                  hint={op.hint}
                  ativo={opcoesAtivas.has(op.id)}
                  onToggle={() => toggleOpcao(op.id)}
                />
              ))}
            </ul>
          </Card>
        ) : null}

        {/* Secao 4 — Redacao (opcoes de estilo / regime processual) */}
        {opcoesRedacao.length > 0 ? (
          <Card titulo="4. Redacao">
            <ul className="space-y-2.5">
              {opcoesRedacao.map((op) => (
                <CheckboxLinha
                  key={op.id}
                  label={op.label}
                  hint={op.hint}
                  ativo={opcoesAtivas.has(op.id)}
                  onToggle={() => toggleOpcao(op.id)}
                />
              ))}
            </ul>
          </Card>
        ) : null}
      </aside>

      {/* ============ COLUNA PREVIEW (dir) ============ */}
      <section className="flex flex-col gap-4">
        {/* Barra de acoes — sticky no topo do preview */}
        <div className="sticky top-2 z-10 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(10,12,11,0.85)] px-4 py-3 backdrop-blur-md">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
            Preview ao vivo · {templateMeta.nome}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={imprimir}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-3 py-1.5 text-[11px] font-medium text-ivory transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
            >
              🖨 Imprimir / PDF
            </button>
            <button
              type="button"
              onClick={baixarDocx}
              disabled={downloading}
              aria-busy={downloading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-gold)] px-4 py-1.5 text-[11px] font-semibold text-onyx shadow-[0_4px_16px_rgba(201,162,74,0.3)] transition hover:bg-[var(--color-tip-glow)] disabled:cursor-wait disabled:opacity-70"
            >
              {downloading ? (
                <>
                  <span
                    aria-hidden
                    className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-onyx/40 border-t-onyx"
                  />
                  Gerando…
                </>
              ) : (
                <>📄 Baixar .docx</>
              )}
            </button>
          </div>
        </div>

        {/* Container do iframe (fundo carbon pra dar contraste com a peca branca) */}
        <div className="rounded-xl border border-[var(--color-ivory-12)] bg-[var(--color-carbon)] p-3 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.9)]">
          <iframe
            ref={iframeRef}
            key={previewUrl /* re-mount on URL change pra evitar history pollution */}
            src={previewUrl}
            title={`Preview ${templateMeta.nome}`}
            className="h-[80svh] w-full rounded-lg border-0 bg-white"
          />
        </div>
      </section>
    </div>
  );
}

// ============================================================
// SUBCOMPONENTES
// ============================================================

function Card({
  titulo,
  headerExtra,
  children,
}: {
  titulo: string;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.5)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-gold)]">
          {titulo}
        </h2>
        {headerExtra}
      </div>
      {children}
    </div>
  );
}

function CheckboxVisual({ ativo }: { ativo: boolean }) {
  return (
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
  );
}

function CheckboxLinha({
  label,
  hint,
  ativo,
  onToggle,
}: {
  label: string;
  hint?: string;
  ativo: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-start gap-2.5">
        <CheckboxVisual ativo={ativo} />
        <input
          type="checkbox"
          checked={ativo}
          onChange={onToggle}
          className="sr-only"
        />
        <span className="flex-1">
          <span className="block text-xs text-ivory">{label}</span>
          {hint ? (
            <span className="mt-0.5 block font-mono text-[10px] text-[var(--color-ivory-66)]">
              {hint}
            </span>
          ) : null}
        </span>
      </label>
    </li>
  );
}
