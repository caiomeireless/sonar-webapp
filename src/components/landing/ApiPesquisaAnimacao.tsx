"use client";

// Animação inline que reproduz a tela "Fila do sistema interno" do Sonar
// (a mesma tela que o advogado vê quando dispara uma busca de patrimônio
// pelo painel interno do escritório). Cards das 7 fontes pagas/grátis
// acendem em sequência: AGUARDANDO → BUSCANDO... → CONCLUÍDO.
//
// Substitui o console minimalista antigo. Mesma estética da AnimacaoBusca
// real, mas em loop infinito pra ser usada como showcase na landing.

import { useEffect, useMemo, useState } from "react";

// --------------------------------------------------------------
// Tipagem e dados das fontes
// --------------------------------------------------------------

type Estado = "aguardando" | "buscando" | "concluido";

type FonteApi = {
  /** Tag curta exibida no canto superior esquerdo do card. */
  tag: string;
  /** Descrição curta, abaixo da tag — o que essa fonte traz. */
  legenda: string;
  /** Preço em centavos pra montar o label e definir cor (grátis = signal). */
  precoCentavos: number;
  /** Quantos "achados" essa fonte gera (mostrado quando concluída). */
  achados: number;
};

// As 7 fontes do combo "lead" do Sonar, na mesma ordem em que aparecem
// no painel interno. Total: R$ 0,80.
const FONTES: ReadonlyArray<FonteApi> = [
  {
    tag: "Assertiva",
    legenda: "Endereços / Telefones",
    precoCentavos: 30,
    achados: 3,
  },
  {
    tag: "BigDataCorp",
    legenda: "Veículos",
    precoCentavos: 40,
    achados: 2,
  },
  {
    tag: "BigDataCorp",
    legenda: "Vínculos societários",
    precoCentavos: 5,
    achados: 1,
  },
  {
    tag: "BigDataCorp",
    legenda: "Aeronaves / Embarcações",
    precoCentavos: 5,
    achados: 0,
  },
  {
    tag: "DataJud",
    legenda: "Processos CNJ",
    precoCentavos: 0,
    achados: 4,
  },
  {
    tag: "minhareceita",
    legenda: "CNPJ + Quadro societário",
    precoCentavos: 0,
    achados: 1,
  },
  {
    tag: "SICAR",
    legenda: "Imóvel rural",
    precoCentavos: 0,
    achados: 0,
  },
];

// --------------------------------------------------------------
// Constantes de tempo (ms)
// --------------------------------------------------------------

const DURACAO_BUSCANDO_MS = 1600; // tempo que cada card fica "buscando"
const STAGGER_MS = 1600;          // intervalo entre o início de cards consecutivos
const PAUSA_REINICIO_MS = 3000;   // espera depois de tudo concluído

// --------------------------------------------------------------
// Helpers
// --------------------------------------------------------------

function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function precoLabel(centavos: number): string {
  return centavos === 0 ? "Grátis" : formatBRL(centavos);
}

// --------------------------------------------------------------
// Componente principal
// --------------------------------------------------------------

export default function ApiPesquisaAnimacao() {
  // Estado de cada fonte.
  const [estados, setEstados] = useState<Estado[]>(() =>
    FONTES.map(() => "aguardando"),
  );
  // Ciclo atual — incrementa a cada reinício pra resetar timers.
  const [ciclo, setCiclo] = useState(0);

  // Total monetário do combo (somatório dos preços).
  const custoTotalCentavos = useMemo(
    () => FONTES.reduce((acc, f) => acc + f.precoCentavos, 0),
    [],
  );

  // Quantas fontes já concluíram.
  const concluidas = estados.filter((e) => e === "concluido").length;
  const total = FONTES.length;
  // Progresso linear (0–100) baseado em concluídas + meia barra pra
  // quem tá buscando, pra ficar suave.
  const buscando = estados.filter((e) => e === "buscando").length;
  const progresso = Math.min(
    100,
    ((concluidas + buscando * 0.5) / total) * 100,
  );

  // Loop principal: agenda as transições de cada card.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    FONTES.forEach((_, indice) => {
      const inicioBuscando = indice * STAGGER_MS;
      const inicioConcluido = inicioBuscando + DURACAO_BUSCANDO_MS;

      // aguardando → buscando
      timers.push(
        setTimeout(() => {
          setEstados((anterior) => {
            const proximo = [...anterior];
            proximo[indice] = "buscando";
            return proximo;
          });
        }, inicioBuscando),
      );

      // buscando → concluido
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

    // Reinício após pausa.
    const totalCiclo =
      FONTES.length * STAGGER_MS +
      (DURACAO_BUSCANDO_MS - STAGGER_MS) +
      PAUSA_REINICIO_MS;

    timers.push(
      setTimeout(() => {
        setEstados(FONTES.map(() => "aguardando"));
        setCiclo((c) => c + 1);
      }, totalCiclo),
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [ciclo]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
      style={{
        background: "var(--color-onyx)",
        borderColor: "var(--color-line)",
        boxShadow: "0 30px 80px -40px rgba(201,162,74,0.25)",
      }}
    >
      {/* Glow sutil de ouro ao fundo, igual à tela real. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(201,162,74,0.18), transparent 60%)",
        }}
      />

      {/* ----------------------------------------------------- */}
      {/* TOPO — eyebrow + subtítulo (sem mencionar Themis)      */}
      {/* ----------------------------------------------------- */}
      <div className="relative flex flex-col items-center text-center">
        <span
          className="eyebrow"
          style={{ color: "var(--color-ivory-66)" }}
        >
          Fila do sistema interno
        </span>
        <p
          className="mt-1 font-mono text-[10px] uppercase tracking-[0.32em]"
          style={{ color: "var(--color-ivory-66)" }}
        >
          Execuções aguardando rastreamento patrimonial
        </p>
      </div>

      {/* ----------------------------------------------------- */}
      {/* CARD CENTRAL — devedor + barra de progresso             */}
      {/* ----------------------------------------------------- */}
      <div className="relative mt-8 flex flex-col items-center text-center">
        <span
          className="eyebrow"
          style={{ color: "var(--color-signal)" }}
        >
          Buscando bens
        </span>

        <h3
          className="nome-devedor mt-3 font-serif text-[clamp(20px,2.4vw,32px)] font-medium uppercase leading-[1.05] tracking-[0.06em]"
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

        {/* Barra horizontal de progresso (signal → gold) */}
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

      {/* ----------------------------------------------------- */}
      {/* GRID DAS 7 FONTES                                      */}
      {/* ----------------------------------------------------- */}
      <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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

// --------------------------------------------------------------
// Card individual de fonte
// --------------------------------------------------------------

type CardFonteProps = {
  fonte: FonteApi;
  estado: Estado;
};

function CardFonte({ fonte, estado }: CardFonteProps) {
  const isAguardando = estado === "aguardando";
  const isBuscando = estado === "buscando";
  const isConcluido = estado === "concluido";

  // Cor do preço: grátis vira signal (verde), pago vira gold (ouro).
  const corPreco =
    fonte.precoCentavos === 0
      ? "var(--color-signal)"
      : "var(--color-gold)";

  // Container — três variantes visuais conforme estado.
  const classeContainer = isAguardando
    ? "border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.5)] opacity-50"
    : isBuscando
      ? "border-[var(--color-gold)] bg-[rgba(201,162,74,0.08)] shadow-[0_0_32px_rgba(201,162,74,0.35)] ring-1 ring-[var(--color-gold)]/30"
      : "border-[var(--color-signal)]/45 bg-[rgba(60,255,138,0.04)]";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-3 transition-all duration-500 ${classeContainer}`}
    >
      {/* Pulso radial dourado por trás quando "buscando" */}
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

      {/* Header: tag da fonte (esq.) + preço (dir.) */}
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

      {/* Legenda — o que essa fonte traz */}
      <p
        className="relative mt-2 font-mono text-[10px] leading-tight"
        style={{ color: "var(--color-ivory-66)" }}
      >
        {fonte.legenda}
      </p>

      {/* Rodapé do card: dot + status */}
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
