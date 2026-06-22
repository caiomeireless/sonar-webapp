"use client";

// Client Component que renderiza:
//   - Cabecalho com contagem + botao "+ Adicionar medida"
//   - Scroll horizontal dos cards de medidas (com linha de timeline)
//   - Modal (via createPortal) com formulario de nova medida
//
// Mock: ao submeter o form, adiciona ao estado local SEM persistir no DB.
// Pra demo isso e suficiente; quando virar Server Action real (Sem 5+),
// trocar o `submeter` por chamada server-side + revalidatePath.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatData } from "@/lib/format";
import {
  type Medida,
  type ResultadoMedida,
  type TipoMedida,
  RESULTADO_META,
  RESULTADOS_ORDEM,
  TIPO_META,
  TIPOS_ORDEM,
} from "@/lib/medidas";

type CasoOption = {
  id: number;
  numero_processo: string | null;
  credor_nome: string;
};

type Props = {
  casos: CasoOption[];
  casoNumeroPorId: Record<number, string | null>;
  advogadoEmail: string | null;
  medidasIniciais: Medida[];
};

const HOJE = (() => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
})();

export function AdicionarMedidaForm({
  casos,
  casoNumeroPorId,
  advogadoEmail,
  medidasIniciais,
}: Props) {
  // Estado local com as medidas — comeca com as do banco + as que o usuario
  // adicionar via modal mock. Ordena por data DESC sempre que muda.
  const [medidas, setMedidas] = useState<Medida[]>(() =>
    [...medidasIniciais].sort((a, b) =>
      a.data > b.data ? -1 : a.data < b.data ? 1 : 0,
    ),
  );

  const [modalAberto, setModalAberto] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Form state
  const [formCasoId, setFormCasoId] = useState<number>(casos[0]?.id ?? 0);
  const [formData, setFormData] = useState<string>(HOJE);
  const [formTipo, setFormTipo] = useState<TipoMedida>("sisbajud");
  const [formResultado, setFormResultado] =
    useState<ResultadoMedida>("aguardando");
  const [formTitulo, setFormTitulo] = useState<string>("");
  const [formDetalhes, setFormDetalhes] = useState<string>("");

  // Refs pra autofocus + reset ao abrir o modal.
  const tituloRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (modalAberto) {
      // Reset campos editaveis (mantem o caso e a data pra agilizar batidas em sequencia).
      setFormTipo("sisbajud");
      setFormResultado("aguardando");
      setFormTitulo("");
      setFormDetalhes("");
      setTimeout(() => tituloRef.current?.focus(), 50);
    }
  }, [modalAberto]);

  const podeSubmeter =
    formCasoId > 0 &&
    formData.length === 10 &&
    formTitulo.trim().length > 0;

  function submeter() {
    if (!podeSubmeter) return;
    // Gera id local negativo pra nao colidir com ids reais do DB.
    const idLocal = -1 * (Date.now() % 1_000_000);
    const nova: Medida = {
      id: idLocal,
      caso_id: formCasoId,
      data: formData,
      tipo: formTipo,
      resultado: formResultado,
      titulo: formTitulo.trim(),
      detalhes: formDetalhes.trim() || null,
      advogado_email: advogadoEmail,
      criado_em: new Date().toISOString(),
    };
    setMedidas((prev) =>
      [nova, ...prev].sort((a, b) =>
        a.data > b.data ? -1 : a.data < b.data ? 1 : 0,
      ),
    );
    setModalAberto(false);
  }

  const totalCasos = casos.length;

  // Linha de timeline conectando os cards: posicionada absoluta dentro
  // do container scrollavel. Renderizada com 1px de altura e largura
  // calculada pelo numero de cards.
  const linhaWidth = useMemo(() => {
    // cada card 280px + gap 16px; deixa uma margem extra pro fim da linha.
    return Math.max(0, medidas.length * (280 + 16) - 16);
  }, [medidas.length]);

  return (
    <>
      {/* Cabecalho */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow">Historico de medidas tomadas</span>
          <p className="mt-2 font-mono text-xs text-[var(--color-ivory-66)]">
            {medidas.length}{" "}
            {medidas.length === 1
              ? "medida registrada"
              : "medidas registradas"}
            {" "}nos {totalCasos}{" "}
            {totalCasos === 1 ? "caso vinculado" : "casos vinculados"}
          </p>
        </div>

        <button
          type="button"
          disabled={totalCasos === 0}
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-gold)]/50 bg-[rgba(201,162,74,0.08)] px-4 py-2 text-sm font-medium text-[var(--color-gold)] transition hover:border-[var(--color-gold)] hover:bg-[rgba(201,162,74,0.16)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Adicionar medida
        </button>
      </div>

      {/* Timeline scrollavel ou empty state */}
      {medidas.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-[var(--color-ivory-22)] bg-[rgba(5,7,6,0.4)] p-10 text-center">
          <p className="font-mono text-xs text-[var(--color-ivory-66)]">
            Nenhuma medida registrada ainda. Use o botao acima pra adicionar.
          </p>
        </div>
      ) : (
        <div className="relative mt-6 overflow-x-auto pb-2">
          {/* Linha horizontal de timeline conectando os centros dos cards */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-[90px] h-px"
            style={{
              width: `${linhaWidth}px`,
              background:
                "linear-gradient(to right, transparent 0%, var(--color-gold) 8%, var(--color-gold) 92%, transparent 100%)",
              opacity: 0.35,
            }}
          />
          <div className="relative flex items-stretch gap-4 pr-4">
            {medidas.map((m) => (
              <CardMedida
                key={m.id}
                medida={m}
                numeroProcesso={casoNumeroPorId[m.caso_id] ?? null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal de adicionar medida (createPortal pra escapar de containers com backdrop-filter) */}
      {modalAberto && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
              onClick={() => setModalAberto(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[560px] rounded-xl border border-[var(--color-ivory-22)] bg-[var(--color-carbon)] p-7 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.9)]"
              >
                <span className="eyebrow">Nova medida</span>
                <h3 className="mt-2 font-serif text-2xl text-ivory">
                  Registrar medida tomada
                </h3>
                <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
                  As medidas alimentam a timeline horizontal do dossie.
                </p>

                <div className="mt-5 grid gap-4">
                  {/* Caso */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                      Caso
                    </label>
                    <select
                      value={formCasoId}
                      onChange={(e) =>
                        setFormCasoId(Number.parseInt(e.target.value, 10))
                      }
                      className="mt-2 w-full rounded-lg border border-[var(--color-ivory-22)] bg-[rgba(0,0,0,0.4)] px-3 py-2 text-sm text-ivory outline-none transition focus:border-[var(--color-gold)]"
                    >
                      {casos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.numero_processo ?? "Sem processo"} — {c.credor_nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Data + Tipo lado-a-lado */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                        Data
                      </label>
                      <input
                        type="date"
                        value={formData}
                        onChange={(e) => setFormData(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-[var(--color-ivory-22)] bg-[rgba(0,0,0,0.4)] px-3 py-2 text-sm text-ivory outline-none transition focus:border-[var(--color-gold)]"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                        Tipo
                      </label>
                      <select
                        value={formTipo}
                        onChange={(e) =>
                          setFormTipo(e.target.value as TipoMedida)
                        }
                        className="mt-2 w-full rounded-lg border border-[var(--color-ivory-22)] bg-[rgba(0,0,0,0.4)] px-3 py-2 text-sm text-ivory outline-none transition focus:border-[var(--color-gold)]"
                      >
                        {TIPOS_ORDEM.map((t) => (
                          <option key={t} value={t}>
                            {TIPO_META[t].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Resultado */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                      Resultado
                    </label>
                    <select
                      value={formResultado}
                      onChange={(e) =>
                        setFormResultado(e.target.value as ResultadoMedida)
                      }
                      className="mt-2 w-full rounded-lg border border-[var(--color-ivory-22)] bg-[rgba(0,0,0,0.4)] px-3 py-2 text-sm text-ivory outline-none transition focus:border-[var(--color-gold)]"
                    >
                      {RESULTADOS_ORDEM.map((r) => (
                        <option key={r} value={r}>
                          {RESULTADO_META[r].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Titulo */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                      Titulo
                    </label>
                    <input
                      ref={tituloRef}
                      type="text"
                      value={formTitulo}
                      onChange={(e) => setFormTitulo(e.target.value)}
                      placeholder="Ex: SISBAJUD inicial"
                      className="mt-2 w-full rounded-lg border border-[var(--color-ivory-22)] bg-[rgba(0,0,0,0.4)] px-3 py-2 text-sm text-ivory placeholder:text-[var(--color-ivory-66)] outline-none transition focus:border-[var(--color-gold)]"
                    />
                  </div>

                  {/* Detalhes */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                      Detalhes
                    </label>
                    <textarea
                      value={formDetalhes}
                      onChange={(e) => setFormDetalhes(e.target.value)}
                      rows={3}
                      placeholder="Resultado da medida, valores, observacoes..."
                      className="mt-2 w-full resize-none rounded-lg border border-[var(--color-ivory-22)] bg-[rgba(0,0,0,0.4)] px-3 py-2 text-sm text-ivory placeholder:text-[var(--color-ivory-66)] outline-none transition focus:border-[var(--color-gold)]"
                    />
                  </div>

                  {/* Advogado (auto-preenchido) */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                      Advogado responsavel
                    </label>
                    <p className="mt-2 font-mono text-xs text-ivory">
                      {advogadoEmail ?? "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-ivory-66)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={submeter}
                    disabled={!podeSubmeter}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-gold)] bg-[var(--color-gold)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-carbon)] transition hover:bg-[var(--color-tip-glow)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Adicionar
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

// ============================================================
// Card de medida — usado dentro do scroll horizontal.
// ============================================================
function CardMedida({
  medida,
  numeroProcesso,
}: {
  medida: Medida;
  numeroProcesso: string | null;
}) {
  const tipoMeta = TIPO_META[medida.tipo];
  const resultadoMeta = RESULTADO_META[medida.resultado];
  return (
    <div
      className="flex h-[180px] w-[280px] shrink-0 flex-col rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.55)] p-4 transition hover:border-[var(--color-gold)]/60 hover:bg-[rgba(5,7,6,0.75)]"
      style={{ boxShadow: `inset 0 1px 0 ${tipoMeta.cor}22` }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-[var(--color-gold)]">
          {formatData(medida.data)}
        </span>
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em]"
          style={{
            color: resultadoMeta.cor,
            borderColor: resultadoMeta.cor,
            borderWidth: 1,
            borderStyle: "solid",
            backgroundColor: `${resultadoMeta.cor}10`,
          }}
        >
          {resultadoMeta.label}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]"
          style={{
            color: tipoMeta.cor,
            backgroundColor: `${tipoMeta.cor}1a`,
            borderColor: `${tipoMeta.cor}55`,
            borderWidth: 1,
            borderStyle: "solid",
          }}
        >
          {tipoMeta.label}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 font-serif text-sm leading-tight text-ivory">
        {medida.titulo}
      </p>

      <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-[var(--color-ivory-66)]">
        {medida.detalhes || "Sem detalhes."}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span className="truncate font-mono text-[9px] text-[var(--color-ivory-66)]">
          {medida.advogado_email ? `por ${medida.advogado_email}` : "por —"}
        </span>
        {numeroProcesso ? (
          <span className="truncate font-mono text-[9px] text-[var(--color-ivory-66)]">
            {numeroProcesso}
          </span>
        ) : null}
      </div>
    </div>
  );
}
