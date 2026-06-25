"use client";

// Client Component que renderiza:
//   - Cabecalho com contagem + botao "+ Adicionar medida"
//   - Scroll horizontal dos cards de medidas (com linha de timeline)
//   - Modal (via createPortal) com formulario de nova medida
//
// Mock: ao submeter o form, adiciona ao estado local SEM persistir no DB.
// Pra demo isso e suficiente; quando virar Server Action real (Sem 5+),
// trocar o `submeter` por chamada server-side + revalidatePath.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  Banknote,
  Building2,
  Car,
  Crosshair,
  FileSearch,
  FileSignature,
  FileText,
  Gavel,
  Mic,
  Search,
  Stamp,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

// Icone por tipo de medida — Lucide. Mapeamento centralizado pra timeline.
// Os tipos "principais" (sisbajud/renajud/infojud/arisp/sniper) seguem o
// brief do timeline; os demais reusam o vocabulario de icones do mesmo set.
const TIPO_ICONE: Record<TipoMedida, LucideIcon> = {
  sisbajud: Banknote,
  infojud: FileSearch,
  renajud: Car,
  arisp: Building2,
  serasajud: Search,
  sniper: Crosshair,
  oficio_cartorio: Stamp,
  oficio_junta: FileSignature,
  peticao_penhora: FileText,
  penhora_efetivada: Gavel,
  audiencia: Mic,
  recurso: Undo2,
  cumprimento_sentenca: Gavel,
  outro: Activity,
};

// Cor + glow do resultado, mapeados nos tokens do design system.
// dotGlow = halo do ponto sobre a linha (mais discreto).
// pillGlow = halo do chip "resultado" (mais brilho pra leitura rapida).
// Aguardando/N/A nao usam glow — ficam neutros.
const RESULTADO_TOKEN: Record<
  ResultadoMedida,
  { cor: string; dotGlow: string | null; pillGlow: string | null }
> = {
  positivo: {
    cor: "var(--color-signal)",
    dotGlow: "0 0 8px rgba(60,255,138,0.6)",
    pillGlow: "0 0 12px rgba(60,255,138,0.55)",
  },
  parcial: {
    cor: "var(--color-gold)",
    dotGlow: "0 0 8px rgba(201,162,74,0.55)",
    pillGlow: "0 0 12px rgba(201,162,74,0.55)",
  },
  negativo: {
    cor: "#DC2626",
    dotGlow: null,
    pillGlow: null,
  },
  aguardando: {
    cor: "var(--color-ivory-66)",
    dotGlow: null,
    pillGlow: null,
  },
  nao_aplica: {
    cor: "var(--color-ivory-66)",
    dotGlow: null,
    pillGlow: null,
  },
};

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

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow">Histórico de medidas tomadas</span>
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

      {/* Timeline vertical ou empty state — extraida como sub-componente
          pra ser reusada na view do cliente (somenteLeitura). */}
      <TimelineMedidasVisual
        medidas={medidas}
        casoNumeroPorId={casoNumeroPorId}
        emptyHint="Nenhuma medida registrada ainda. Use o botão acima pra adicionar."
      />

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
                  As medidas alimentam a timeline horizontal do dossiê.
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

                  {/* Título */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                      Título
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
                      placeholder="Resultado da medida, valores, observações..."
                      className="mt-2 w-full resize-none rounded-lg border border-[var(--color-ivory-22)] bg-[rgba(0,0,0,0.4)] px-3 py-2 text-sm text-ivory placeholder:text-[var(--color-ivory-66)] outline-none transition focus:border-[var(--color-gold)]"
                    />
                  </div>

                  {/* Advogado (auto-preenchido) */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                      Advogado responsável
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
// TimelineMedidasVisual — extraido pra reuso no dossie do cliente.
// Renderiza so a parte visual da timeline (linha + cards), sem form/modal.
// ============================================================
export function TimelineMedidasVisual({
  medidas,
  casoNumeroPorId,
  emptyHint = "Nenhuma medida registrada ainda.",
}: {
  medidas: Medida[];
  casoNumeroPorId: Record<number, string | null>;
  emptyHint?: string;
}) {
  if (medidas.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-[var(--color-ivory-22)] bg-[rgba(5,7,6,0.4)] p-10 text-center">
        <p className="font-mono text-xs text-[var(--color-ivory-66)]">
          {emptyHint}
        </p>
      </div>
    );
  }
  return (
    <div className="relative mt-8 pl-10">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-2 bottom-2 w-px bg-[var(--color-signal)]/30"
      />
      <ol className="m-0 list-none p-0">
        {medidas.map((m) => (
          <CardMedida
            key={m.id}
            medida={m}
            numeroProcesso={casoNumeroPorId[m.caso_id] ?? null}
          />
        ))}
      </ol>
    </div>
  );
}

// ============================================================
// Item de timeline vertical: ponto colorido sobre a linha + card glass a direita.
// O dot e posicionado RELATIVO ao card (que tem padding ~ p-5) e empurrado
// pra esquerda com `-left-[2.05rem]` ate cair em cima da linha vertical em
// `left-3` do container pai (offset = pl-10 do pai - p-5 do card ≈ 2.05rem).
// Cor do ponto e do chip "resultado" mapeada via RESULTADO_TOKEN.
// Icone do tipo via TIPO_ICONE (Lucide).
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
  const resToken = RESULTADO_TOKEN[medida.resultado];
  const Icone = TIPO_ICONE[medida.tipo];

  return (
    <li className="relative mb-6 list-none last:mb-0">
      {/* Ponto colorido sobre a linha vertical */}
      <span
        aria-hidden="true"
        className="absolute -left-[2.05rem] top-3 h-3 w-3 rounded-full"
        style={{
          backgroundColor: resToken.cor,
          boxShadow: resToken.dotGlow ?? "none",
        }}
      />

      <div className="glass p-5 transition hover:border-[var(--color-gold)]/40">
        {/* Topo: data + chip resultado */}
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
            {formatData(medida.data)}
          </span>
          <span
            className="rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{
              color: resToken.cor,
              borderColor: `color-mix(in srgb, ${resToken.cor} 40%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${resToken.cor} 10%, transparent)`,
              boxShadow: resToken.pillGlow ?? "none",
            }}
          >
            {resultadoMeta.label}
          </span>
        </div>

        {/* Titulo com icone do tipo (inline, mono) */}
        <div
          className="mb-2 flex items-center gap-2"
          title={tipoMeta.label}
        >
          <Icone
            className="h-4 w-4 shrink-0 text-[var(--color-ivory-66)]"
            strokeWidth={1.75}
          />
          <h3 className="font-serif text-base leading-snug text-ivory">
            {medida.titulo}
          </h3>
        </div>

        {/* Detalhes */}
        {medida.detalhes ? (
          <p className="text-sm leading-snug text-[var(--color-ivory-88)]">
            {medida.detalhes}
          </p>
        ) : null}

        {/* Advogado responsavel */}
        {medida.advogado_email ? (
          <p
            className="mt-2 truncate font-mono text-xs"
            style={{ color: "var(--color-advogado)" }}
          >
            {medida.advogado_email}
          </p>
        ) : null}

        {/* Numero do processo (subtil, embaixo) */}
        {numeroProcesso ? (
          <p className="mt-1 truncate font-mono text-[11px] text-[var(--color-ivory-66)]">
            {numeroProcesso}
          </p>
        ) : null}
      </div>
    </li>
  );
}
