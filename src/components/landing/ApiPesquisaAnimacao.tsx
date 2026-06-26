"use client";

// Animação inline que simula a sequência de pesquisas de patrimônio
// disparadas no fundo do Sonar. Cada API entra em "loading" por 1.4s,
// faz uma transição de 0.4s pra "done", e a próxima começa logo em
// seguida. Quando todas terminam, espera 2.5s e reinicia o ciclo.
//
// Visual estilo console/terminal: bordas finas, fundo onyx, barra de
// progresso preenchendo da esquerda pra direita, contador acumulando
// no rodapé.

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Check,
  Database,
  FileText,
  Inbox,
  MapPin,
  Search,
  type LucideIcon,
} from "lucide-react";

// --------------------------------------------------------------
// Tipagem
// --------------------------------------------------------------

type Estado = "idle" | "loading" | "done";

type TipoApi =
  | "fila-interna"
  | "assertiva"
  | "bigdatacorp"
  | "arisp"
  | "cenprot"
  | "edossie"
  | "junta";

type ApiDef = {
  tipo: TipoApi;
  rotulo: string;
  icone: LucideIcon;
  /** Quando true, marca uma etapa interna do escritorio (nao uma API
   * paga). Usado pra separar visualmente a primeira linha das demais. */
  interno?: boolean;
};

// Lista fixa de etapas exibidas na animação. A ordem aqui também é a
// ordem em que elas são acionadas no ciclo. A primeira linha eh o
// "sistema interno do escritorio" (fila de execucoes recebida via
// integracao com o nosso sistema de gestao). Depois passa pras APIs
// pagas que rodam patrimonio.
const APIS: ReadonlyArray<ApiDef> = [
  {
    tipo: "fila-interna",
    rotulo: "Sistema interno · recebendo execução",
    icone: Inbox,
    interno: true,
  },
  { tipo: "assertiva", rotulo: "Assertiva", icone: Building2 },
  { tipo: "bigdatacorp", rotulo: "BigDataCorp", icone: Database },
  { tipo: "arisp", rotulo: "ARISP — matrículas SP", icone: MapPin },
  { tipo: "cenprot", rotulo: "Cenprot — protestos", icone: AlertTriangle },
  { tipo: "edossie", rotulo: "eDossiê — carga tributária", icone: FileText },
  { tipo: "junta", rotulo: "Junta Comercial", icone: Briefcase },
];

// --------------------------------------------------------------
// Constantes de tempo (ms)
// --------------------------------------------------------------

const DURACAO_LOADING_MS = 1400; // tempo na fase "loading"
const DURACAO_SUCCESS_MS = 400; // animação curta marcando "done"
const PAUSA_REINICIO_MS = 2500; // pausa antes de reiniciar o ciclo

// --------------------------------------------------------------
// Componente
// --------------------------------------------------------------

export default function ApiPesquisaAnimacao() {
  // Estado de cada API por índice.
  const [estados, setEstados] = useState<Estado[]>(() =>
    APIS.map(() => "idle"),
  );
  // Contador acumulado de "bens encontrados".
  const [bens, setBens] = useState(0);
  // Chave do ciclo atual — incrementa a cada reinício pra resetar
  // animações internas (barras, contador, etc).
  const [ciclo, setCiclo] = useState(0);

  // Quantidade aleatória de bens por API, sorteada uma vez por ciclo
  // pra manter consistência entre reinícios sem virar puramente
  // determinístico. A primeira etapa eh interna (recebimento do caso)
  // e nao gera bens — incremento fixo em 0.
  const incrementos = useMemo(() => {
    return APIS.map((a) =>
      a.interno ? 0 : Math.floor(Math.random() * 3) + 1,
    ); // 1..3 pras APIs, 0 pra etapa interna
    // ciclo entra como dep abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ciclo]);

  // Loop principal: encadeia setTimeouts pra cada API na sequência.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    APIS.forEach((_, indice) => {
      const inicioLoading =
        indice * (DURACAO_LOADING_MS + DURACAO_SUCCESS_MS);
      const inicioDone = inicioLoading + DURACAO_LOADING_MS;

      // Marca essa API como loading.
      timers.push(
        setTimeout(() => {
          setEstados((anterior) => {
            const proximo = [...anterior];
            proximo[indice] = "loading";
            return proximo;
          });
        }, inicioLoading),
      );

      // Marca como done e soma o incremento ao contador.
      timers.push(
        setTimeout(() => {
          setEstados((anterior) => {
            const proximo = [...anterior];
            proximo[indice] = "done";
            return proximo;
          });
          setBens((anterior) => anterior + incrementos[indice]);
        }, inicioDone),
      );
    });

    // Reinício do ciclo.
    const totalCiclo =
      APIS.length * (DURACAO_LOADING_MS + DURACAO_SUCCESS_MS) +
      PAUSA_REINICIO_MS;

    timers.push(
      setTimeout(() => {
        setEstados(APIS.map(() => "idle"));
        setBens(0);
        setCiclo((c) => c + 1);
      }, totalCiclo),
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [ciclo, incrementos]);

  // Quantas APIs já terminaram (pra eyebrow do header).
  const concluidas = estados.filter((e) => e === "done").length;
  const total = APIS.length;
  const tudoPronto = concluidas === total;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-6 shadow-[0_30px_80px_-40px_rgba(255,193,7,0.25)]"
      style={{
        background: "var(--color-onyx)",
        borderColor: "var(--color-line)",
      }}
    >
      {/* halo sutil de signal no canto superior, pra dar sensação de "ativo" */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--color-signal)" }}
      />

      {/* Header do console */}
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="grid h-9 w-9 place-items-center rounded-lg"
            style={{
              background: "var(--color-surface-2, rgba(255,255,255,0.04))",
              border: "1px solid var(--color-line)",
            }}
          >
            <motion.span
              animate={
                tudoPronto
                  ? { scale: 1, opacity: 1 }
                  : { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
              }
              transition={{
                duration: 1.4,
                repeat: tudoPronto ? 0 : Infinity,
                ease: "easeInOut",
              }}
              className="inline-flex"
              style={{ color: "var(--color-signal)" }}
            >
              <Search size={16} strokeWidth={2.2} />
            </motion.span>
          </span>
          <div className="flex flex-col">
            <span
              className="eyebrow"
              style={{ color: "var(--color-signal)" }}
            >
              Pesquisa em andamento
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-ivory, #f5efe6)" }}
            >
              Processando execução…
            </span>
          </div>
        </div>

        {/* contador de etapas concluídas (1 fila interna + 6 APIs) */}
        <div
          className="font-mono text-[12px] uppercase tracking-[0.22em]"
          style={{ color: "var(--color-ivory-66, rgba(245,239,230,0.66))" }}
        >
          {concluidas}/{total} etapas
        </div>
      </div>

      {/* Linhas das etapas: 1 fila interna + 6 APIs.
          Apos a primeira linha (interna), inserimos um pequeno separador
          com label "Aciona pesquisas externas" pra contar a historia
          visualmente — o caso chega pela fila e dispara o leque de APIs.
          Usamos <div> simples em vez de <ul> pra poder intercalar o
          separador sem violar a regra "ul so aceita li como filho direto"
          ou "role=list precisa de role=listitem nos filhos". */}
      <div className="relative mt-6 flex flex-col gap-3">
        {APIS.flatMap((api, indice) => {
          const linha = (
            <LinhaApi
              key={api.tipo}
              api={api}
              estado={estados[indice]}
              ciclo={ciclo}
            />
          );
          if (!api.interno) return [linha];
          // Apos a linha interna, insere o divisor de fluxo.
          const divisor = (
            <div
              key={`${api.tipo}-divisor`}
              className="flex items-center gap-2 py-0.5 pl-11"
              role="presentation"
            >
              <span
                aria-hidden="true"
                className="h-px flex-1"
                style={{ background: "var(--color-line)" }}
              />
              <span
                className="font-mono text-[10px] uppercase tracking-[0.22em]"
                style={{
                  color: "var(--color-ivory-66, rgba(245,239,230,0.66))",
                }}
              >
                Aciona pesquisas externas
              </span>
              <span
                aria-hidden="true"
                className="h-px flex-1"
                style={{ background: "var(--color-line)" }}
              />
            </div>
          );
          return [linha, divisor];
        })}
      </div>

      {/* Rodapé: contador de bens encontrados */}
      <div
        className="relative mt-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
        style={{
          borderColor: "var(--color-line)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <span
          className="eyebrow"
          style={{ color: "var(--color-ivory-66, rgba(245,239,230,0.66))" }}
        >
          Bens encontrados
        </span>
        <span
          className="font-mono text-2xl font-semibold tabular-nums"
          style={{ color: "var(--color-gold, #ffc107)" }}
        >
          <AnimatePresence mode="popLayout">
            <motion.span
              key={bens}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="inline-block"
            >
              {bens.toString().padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </div>
  );
}

// --------------------------------------------------------------
// Linha de uma API
// --------------------------------------------------------------

type LinhaApiProps = {
  api: ApiDef;
  estado: Estado;
  ciclo: number;
};

function LinhaApi({ api, estado, ciclo }: LinhaApiProps) {
  const Icone = api.icone;

  // Cor principal do texto/ícone conforme estado.
  const cor =
    estado === "idle"
      ? "var(--color-ivory-40, rgba(245,239,230,0.4))"
      : "var(--color-signal)";

  // Cor do rótulo: idle fica acinzentado, ativo/concluído fica claro.
  const corRotulo =
    estado === "idle"
      ? "var(--color-ivory-66, rgba(245,239,230,0.66))"
      : "var(--color-ivory, #f5efe6)";

  return (
    <div
      className="grid items-center gap-3"
      style={{ gridTemplateColumns: "auto 1fr auto auto" }}
    >
      {/* ícone da API */}
      <span
        className="grid h-8 w-8 place-items-center rounded-lg transition-colors"
        style={{
          background:
            estado === "idle"
              ? "rgba(255,255,255,0.02)"
              : "rgba(255,193,7,0.08)",
          border: "1px solid var(--color-line)",
          color: cor,
        }}
      >
        <Icone size={15} strokeWidth={2} />
      </span>

      {/* rótulo da API */}
      <span
        className="text-sm transition-colors"
        style={{ color: corRotulo }}
      >
        {api.rotulo}
      </span>

      {/* barra de progresso */}
      <div
        className="relative h-[3px] w-32 overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <motion.div
          // Chave inclui o ciclo pra resetar a barra a cada reinício.
          key={`${api.tipo}-${ciclo}-${estado}`}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: "var(--color-signal)" }}
          initial={{ width: estado === "done" ? "100%" : "0%" }}
          animate={{
            width:
              estado === "loading"
                ? "100%"
                : estado === "done"
                  ? "100%"
                  : "0%",
          }}
          transition={{
            duration:
              estado === "loading"
                ? DURACAO_LOADING_MS / 1000
                : DURACAO_SUCCESS_MS / 1000,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* dot de status */}
      <Status estado={estado} />
    </div>
  );
}

// --------------------------------------------------------------
// Indicador de status (dot cinza / dot signal pulsante / check verde)
// --------------------------------------------------------------

function Status({ estado }: { estado: Estado }) {
  if (estado === "idle") {
    return (
      <span
        aria-label="Aguardando"
        className="block h-2 w-2 rounded-full"
        style={{ background: "rgba(245,239,230,0.18)" }}
      />
    );
  }

  if (estado === "loading") {
    return (
      <span
        aria-label="Pesquisando"
        className="relative block h-2 w-2 rounded-full"
        style={{ background: "var(--color-signal)" }}
      >
        <span
          className="absolute inset-0 animate-ping rounded-full"
          style={{ background: "var(--color-signal)", opacity: 0.55 }}
        />
      </span>
    );
  }

  // done
  return (
    <motion.span
      aria-label="Concluído"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="grid h-4 w-4 place-items-center rounded-full"
      style={{ background: "var(--color-signal)", color: "var(--color-onyx)" }}
    >
      <Check size={11} strokeWidth={3} />
    </motion.span>
  );
}
