"use client";

// Animação cinematográfica em 3 etapas que reproduz o fluxo real do
// escritório no "sistema interno" (NÃO mencionar Themis na UI):
//
//  Etapa 1 (FILA, ~3s):  Card de um caso parado na fila com 3 botões
//                        (Combo Lead verde, Combo Doc dourado, Individual).
//                        O botão Combo Lead pulsa pra chamar atenção
//                        e um cursor virtual desce até ele.
//  Etapa 2 (CLICK, ~1s): Cursor "clica" no botão Combo Lead — ripple
//                        + flash + scale do botão.
//  Etapa 3 (BUSCA, ~12s): Transição pra tela "Buscando bens" — cards
//                        das 7 fontes acendem em sequência (aguardando
//                        → buscando → concluído).
//  Loop: ao final, volta pra Etapa 1.
//
// Mesma estética visual de SpotlightCard / cards reais. Todos os textos
// referenciam "sistema interno" — nunca o nome real do Themis.

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

// ==============================================================
// DADOS DAS FONTES (etapa 3)
// ==============================================================

type Estado = "aguardando" | "buscando" | "concluido";

type FonteApi = {
  tag: string;
  legenda: string;
  precoCentavos: number;
  achados: number;
};

const FONTES: ReadonlyArray<FonteApi> = [
  { tag: "Assertiva", legenda: "Endereços / Telefones", precoCentavos: 30, achados: 3 },
  { tag: "BigDataCorp", legenda: "Veículos", precoCentavos: 40, achados: 2 },
  { tag: "BigDataCorp", legenda: "Vínculos societários", precoCentavos: 5, achados: 1 },
  { tag: "BigDataCorp", legenda: "Aeronaves / Embarcações", precoCentavos: 5, achados: 0 },
  { tag: "DataJud", legenda: "Processos CNJ", precoCentavos: 0, achados: 4 },
  { tag: "minhareceita", legenda: "CNPJ + Quadro societário", precoCentavos: 0, achados: 1 },
  { tag: "SICAR", legenda: "Imóvel rural", precoCentavos: 0, achados: 0 },
];

// ==============================================================
// CONSTANTES DE TEMPO (ms)
// ==============================================================

const ETAPA_1_FILA_MS = 3200;        // tempo na tela da fila
const ETAPA_2_CLICK_MS = 1200;       // tempo do clique (ripple + flash)
const STAGGER_MS = 1300;             // entre o início de cards consecutivos
const DURACAO_BUSCANDO_MS = 1400;    // tempo "buscando" por card
const PAUSA_FINAL_MS = 2500;         // espera depois de tudo concluído

// Etapa 3: dura o tempo de processar todas as fontes + pausa final
const ETAPA_3_BUSCA_MS =
  FONTES.length * STAGGER_MS + (DURACAO_BUSCANDO_MS - STAGGER_MS) + PAUSA_FINAL_MS;

// ==============================================================
// HELPERS
// ==============================================================

function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function precoLabel(centavos: number): string {
  return centavos === 0 ? "Grátis" : formatBRL(centavos);
}

type Etapa = "fila" | "click" | "busca";

// ==============================================================
// COMPONENTE PRINCIPAL
// ==============================================================

export default function ApiPesquisaAnimacao() {
  const [etapa, setEtapa] = useState<Etapa>("fila");
  const [ciclo, setCiclo] = useState(0);

  // Etapa 3 — estados das fontes
  const [estados, setEstados] = useState<Estado[]>(() =>
    FONTES.map(() => "aguardando"),
  );

  const custoTotalCentavos = useMemo(
    () => FONTES.reduce((acc, f) => acc + f.precoCentavos, 0),
    [],
  );

  // Loop entre etapas
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Etapa 1 → Etapa 2
    timers.push(
      setTimeout(() => setEtapa("click"), ETAPA_1_FILA_MS),
    );
    // Etapa 2 → Etapa 3 (reseta estados das fontes)
    timers.push(
      setTimeout(() => {
        setEstados(FONTES.map(() => "aguardando"));
        setEtapa("busca");
      }, ETAPA_1_FILA_MS + ETAPA_2_CLICK_MS),
    );

    // Agenda transições aguardando → buscando → concluido pra cada fonte
    const inicioBusca = ETAPA_1_FILA_MS + ETAPA_2_CLICK_MS;
    FONTES.forEach((_, indice) => {
      const inicioBuscando = inicioBusca + indice * STAGGER_MS;
      const inicioConcluido = inicioBuscando + DURACAO_BUSCANDO_MS;
      timers.push(
        setTimeout(() => {
          setEstados((anterior) => {
            const proximo = [...anterior];
            proximo[indice] = "buscando";
            return proximo;
          });
        }, inicioBuscando),
      );
      timers.push(
        setTimeout(() => {
          setEstados((anterior) => {
            const proximo = [...anterior];
            proximo[indice] = "concluido";
            return proximo;
          });
        }, inicioConcluido),
      );
    });

    // Volta pra Etapa 1 e reinicia ciclo
    const totalCiclo = inicioBusca + ETAPA_3_BUSCA_MS;
    timers.push(
      setTimeout(() => {
        setEtapa("fila");
        setCiclo((c) => c + 1);
      }, totalCiclo),
    );

    return () => timers.forEach((t) => clearTimeout(t));
  }, [ciclo]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
      style={{
        background: "var(--color-onyx)",
        borderColor: "var(--color-line)",
        boxShadow: "0 30px 80px -40px rgba(201,162,74,0.25)",
        minHeight: 620,
      }}
    >
      {/* Glow sutil de ouro ao fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(201,162,74,0.18), transparent 60%)",
        }}
      />

      {/* Eyebrow muda conforme etapa pra contextualizar */}
      <div className="relative mb-6 flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {etapa === "busca" ? (
            <motion.div
              key="topo-busca"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              <span className="eyebrow" style={{ color: "var(--color-signal)" }}>
                Buscando bens
              </span>
              <p
                className="mt-1 font-mono text-[10px] uppercase tracking-[0.32em]"
                style={{ color: "var(--color-ivory-66)" }}
              >
                Consultando 7 fontes em paralelo
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="topo-fila"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              <span className="eyebrow" style={{ color: "var(--color-ivory-66)" }}>
                Fila do sistema interno
              </span>
              <p
                className="mt-1 font-mono text-[10px] uppercase tracking-[0.32em]"
                style={{ color: "var(--color-ivory-66)" }}
              >
                Execuções aguardando rastreamento patrimonial
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {etapa === "fila" || etapa === "click" ? (
            <motion.div
              key="palco-fila"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <CenaFila etapa={etapa} />
            </motion.div>
          ) : (
            <motion.div
              key="palco-busca"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <CenaBusca
                estados={estados}
                custoTotalCentavos={custoTotalCentavos}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==============================================================
// CENA — FILA (etapas 1 e 2)
// ==============================================================
// Card do processo + 3 botões (Combo Lead pulsando) + cursor virtual.

function CenaFila({ etapa }: { etapa: Etapa }) {
  const isClicando = etapa === "click";

  return (
    <div className="relative mx-auto max-w-[640px]">
      {/* Card do processo */}
      <div
        className="relative overflow-hidden rounded-2xl border p-6"
        style={{
          background: "rgba(5,7,6,0.85)",
          borderColor: "var(--color-ivory-22)",
          boxShadow: "0 0 0 1px rgba(201,162,74,0.10), 0 20px 60px -30px rgba(0,0,0,0.7)",
        }}
      >
        {/* Linha topo: tipo + tempo */}
        <div className="flex items-center justify-between">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.28em]"
            style={{ color: "var(--color-gold)" }}
          >
            Pessoa Física
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.28em]"
            style={{ color: "var(--color-ivory-66)" }}
          >
            Aguardando há 14 min
          </span>
        </div>

        {/* Nome do devedor */}
        <h3
          className="nome-devedor mt-3 font-serif text-[22px] font-medium uppercase leading-[1.1] tracking-[0.04em]"
          style={{ color: "var(--color-devedor)" }}
        >
          Carlos Eduardo Mendes Albuquerque
        </h3>

        {/* Linha dados */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px]"
          style={{ color: "var(--color-ivory-66)" }}
        >
          <span>CPF 111.222.333-44</span>
          <span>Proc. 1004722-18.2024.8.26.0100</span>
        </div>

        {/* Linha crédito + credor */}
        <div
          className="mt-4 grid grid-cols-2 gap-4 border-t pt-4"
          style={{ borderColor: "var(--color-ivory-12)" }}
        >
          <div>
            <div
              className="font-mono text-[10px] uppercase tracking-[0.28em]"
              style={{ color: "var(--color-ivory-66)" }}
            >
              Crédito
            </div>
            <div
              className="mt-1 font-mono text-[15px] font-semibold"
              style={{ color: "var(--color-gold)" }}
            >
              R$ 482.300,00
            </div>
          </div>
          <div>
            <div
              className="font-mono text-[10px] uppercase tracking-[0.28em]"
              style={{ color: "var(--color-ivory-66)" }}
            >
              Credor
            </div>
            <div
              className="mt-1 font-mono text-[12px]"
              style={{ color: "var(--color-ivory)" }}
            >
              Indústrias Atlântica S/A
            </div>
          </div>
        </div>

        {/* Stats: aguardando bens */}
        <div
          className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1"
          style={{
            borderColor: "var(--color-ivory-22)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-ivory-66)" }}
          />
          <span
            className="font-mono text-[10px] uppercase tracking-[0.28em]"
            style={{ color: "var(--color-ivory-66)" }}
          >
            Aguardando rastreamento
          </span>
        </div>

        {/* Linha de botões */}
        <div
          className="relative mt-6 flex flex-wrap items-center gap-3 border-t pt-5"
          style={{ borderColor: "var(--color-ivory-12)" }}
        >
          {/* Botão Combo Lead — pulsa na etapa fila, "clica" na etapa click */}
          <BotaoComboLead etapa={etapa} />

          <BotaoSecundario texto="Combo Doc · R$ 8,00" cor="gold" />
          <BotaoSecundario texto="Individual" cor="ivory" />
        </div>
      </div>

      {/* Cursor virtual */}
      <CursorVirtual etapa={etapa} />

      {/* Flash de luz quando clica */}
      <AnimatePresence>
        {isClicando ? (
          <motion.div
            key="flash"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, times: [0, 0.4, 1] }}
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                "radial-gradient(circle at 30% 92%, rgba(60,255,138,0.65), transparent 60%)",
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ==============================================================
// BOTÃO COMBO LEAD — pulso suave + ripple no click
// ==============================================================

function BotaoComboLead({ etapa }: { etapa: Etapa }) {
  const isClicando = etapa === "click";

  return (
    <motion.div
      className="relative"
      animate={
        etapa === "fila"
          ? { scale: [1, 1.05, 1] }
          : isClicando
            ? { scale: [1.05, 0.94, 1.02, 1] }
            : { scale: 1 }
      }
      transition={
        etapa === "fila"
          ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.6, ease: "easeOut" }
      }
    >
      {/* Halo pulsante por trás do botão (sempre visível na etapa fila) */}
      {etapa === "fila" ? (
        <motion.div
          aria-hidden="true"
          className="absolute -inset-2 rounded-xl"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(60,255,138,0.35), transparent 70%)",
          }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

      {/* Ripple ao clicar */}
      <AnimatePresence>
        {isClicando ? (
          <motion.span
            key="ripple"
            aria-hidden="true"
            initial={{ scale: 0.6, opacity: 0.55 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "rgba(60,255,138,0.5)" }}
          />
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        disabled
        className="relative inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition"
        style={{
          background: "rgba(60,255,138,0.85)",
          color: "var(--color-onyx)",
          boxShadow: "0 4px 24px rgba(60,255,138,0.28)",
        }}
      >
        ⚡ Combo Lead · R$ 0,80
      </button>
    </motion.div>
  );
}

function BotaoSecundario({
  texto,
  cor,
}: {
  texto: string;
  cor: "gold" | "ivory";
}) {
  if (cor === "gold") {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold"
        style={{
          background: "var(--color-gold)",
          color: "var(--color-onyx)",
          boxShadow: "0 4px 18px rgba(201,162,74,0.22)",
          opacity: 0.85,
        }}
      >
        {texto}
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled
      className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold"
      style={{
        borderColor: "var(--color-ivory-22)",
        color: "var(--color-ivory)",
        background: "transparent",
        opacity: 0.85,
      }}
    >
      {texto}
    </button>
  );
}

// ==============================================================
// CURSOR VIRTUAL — desce no canto sup. direito até o botão Combo Lead
// ==============================================================

function CursorVirtual({ etapa }: { etapa: Etapa }) {
  // Posicionamento relativo ao card (que tem max-w 640px e botão à esq.)
  // Etapa fila: cursor desce de cima-direita até o botão (canto inf. esq.)
  // Etapa click: cursor "pressiona" (translateY pequeno + scale).

  if (etapa === "busca") return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute"
      initial={{ left: "78%", top: "8%", opacity: 0 }}
      animate={
        etapa === "fila"
          ? { left: "16%", top: "84%", opacity: [0, 1, 1] }
          : { left: "16%", top: "86%", opacity: 1, scale: 0.85 }
      }
      transition={
        etapa === "fila"
          ? { duration: 2.4, ease: "easeInOut", times: [0, 0.3, 1] }
          : { duration: 0.25, ease: "easeOut" }
      }
      style={{ width: 22, height: 22 }}
    >
      {/* SVG cursor estilo macOS */}
      <svg viewBox="0 0 24 24" width="22" height="22">
        <path
          d="M3 2 L3 17 L8 13 L11 20 L14 19 L11 12 L17 12 Z"
          fill="#FAF7F0"
          stroke="#050706"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    </motion.div>
  );
}

// ==============================================================
// CENA — BUSCA (etapa 3)
// ==============================================================
// Mesmo grid de 7 fontes que estava antes, com progresso global.

function CenaBusca({
  estados,
  custoTotalCentavos,
}: {
  estados: Estado[];
  custoTotalCentavos: number;
}) {
  const total = FONTES.length;
  const concluidas = estados.filter((e) => e === "concluido").length;
  const buscando = estados.filter((e) => e === "buscando").length;
  const progresso = Math.min(
    100,
    ((concluidas + buscando * 0.5) / total) * 100,
  );

  return (
    <div>
      {/* Cabeçalho do devedor + barra de progresso */}
      <div className="flex flex-col items-center text-center">
        <h3
          className="nome-devedor font-serif text-[clamp(20px,2.4vw,30px)] font-medium uppercase leading-[1.05] tracking-[0.06em]"
          style={{ color: "var(--color-devedor)" }}
        >
          Carlos Eduardo Mendes Albuquerque
        </h3>

        <p
          className="mt-3 font-mono text-xs"
          style={{ color: "var(--color-ivory-66)" }}
        >
          Pessoa Física · CPF 111.222.333-44
        </p>

        <p
          className="mt-2 font-mono text-[10px] uppercase tracking-[0.32em]"
          style={{ color: "var(--color-gold)" }}
        >
          Combo lead · 7 consultas · {formatBRL(custoTotalCentavos)}
        </p>

        <div className="mt-6 w-full max-w-[560px]">
          <div
            className="relative h-1 overflow-hidden rounded-full"
            style={{ background: "var(--color-ivory-12)" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progresso}%`,
                background:
                  "linear-gradient(90deg, var(--color-signal), var(--color-gold))",
                transition: "width 0.35s ease-out",
                boxShadow: "0 0 12px rgba(201,162,74,0.4)",
              }}
            />
          </div>
          <p
            className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.32em]"
            style={{ color: "var(--color-ivory-66)" }}
          >
            {Math.round(progresso)}% · {concluidas} de {total} fontes
          </p>
        </div>
      </div>

      {/* Grid das 7 fontes */}
      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {FONTES.map((fonte, indice) => (
          <CardFonte
            key={`${fonte.tag}-${fonte.legenda}`}
            fonte={fonte}
            estado={estados[indice]}
          />
        ))}
      </div>
    </div>
  );
}

// ==============================================================
// CARD INDIVIDUAL DE FONTE
// ==============================================================

type CardFonteProps = {
  fonte: FonteApi;
  estado: Estado;
};

function CardFonte({ fonte, estado }: CardFonteProps) {
  const isAguardando = estado === "aguardando";
  const isBuscando = estado === "buscando";
  const isConcluido = estado === "concluido";

  const corPreco =
    fonte.precoCentavos === 0
      ? "var(--color-signal)"
      : "var(--color-gold)";

  const classeContainer = isAguardando
    ? "border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.5)] opacity-50"
    : isBuscando
      ? "border-[var(--color-gold)] bg-[rgba(201,162,74,0.08)] shadow-[0_0_32px_rgba(201,162,74,0.35)] ring-1 ring-[var(--color-gold)]/30"
      : "border-[var(--color-signal)]/45 bg-[rgba(60,255,138,0.04)]";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-3 transition-all duration-500 ${classeContainer}`}
    >
      {isBuscando ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-pulse"
          style={{
            background:
              "radial-gradient(circle at center, rgba(201,162,74,0.18), transparent 70%)",
          }}
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-2">
        <span
          className="font-mono text-[11px] uppercase tracking-[0.18em]"
          style={{ color: "var(--color-ivory)" }}
        >
          {fonte.tag}
        </span>
        <span
          className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: corPreco }}
        >
          {precoLabel(fonte.precoCentavos)}
        </span>
      </div>

      <p
        className="relative mt-2 font-mono text-[10px] leading-tight"
        style={{ color: "var(--color-ivory-66)" }}
      >
        {fonte.legenda}
      </p>

      <div className="relative mt-4 flex items-center gap-2">
        {isAguardando ? (
          <>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--color-ivory-22)" }}
            />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: "var(--color-ivory-66)" }}
            >
              Aguardando
            </span>
          </>
        ) : isBuscando ? (
          <>
            <span
              className="relative inline-block h-2 w-2 rounded-full"
              style={{ background: "var(--color-gold)" }}
            >
              <span
                className="absolute inset-0 animate-ping rounded-full"
                style={{ background: "var(--color-gold)", opacity: 0.6 }}
              />
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: "var(--color-gold)" }}
            >
              Buscando...
            </span>
          </>
        ) : (
          <>
            <span
              className="font-mono text-base font-semibold leading-none"
              style={{ color: "var(--color-signal)" }}
            >
              ✓
            </span>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: isConcluido ? "var(--color-ivory)" : "var(--color-ivory-66)" }}
            >
              {fonte.achados === 0
                ? "Sem resultados"
                : `${fonte.achados} ${fonte.achados === 1 ? "achado" : "achados"}`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
