// Feed das medidas mais recentes da plataforma — timeline vertical compacta
// (max 10 itens). Cada item: bolinha colorida do tipo (TIPO_META) +
// "Advogado fez X em Devedor Y" + badge de resultado + tempo relativo.
// Linha inteira é um Link pro caso. Server component — dados já vem
// agregados (FeedMedidaItem[]) da page; nenhum fetch nem estado aqui.

import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { formatTempoRelativo } from "@/lib/format";
import {
  TIPO_META,
  RESULTADO_META,
  type TipoMedida,
} from "@/lib/medidas";
import type { FeedMedidaItem } from "@/lib/dashboard-plataforma";

type Props = {
  dados: FeedMedidaItem[];
};

// Verbo curto por tipo — encaixa em "Advogado <verbo> em Devedor Y".
// Quando não houver entrada, cai no label do TIPO_META com prefixo "fez".
const VERBO_POR_TIPO: Partial<Record<TipoMedida, string>> = {
  sisbajud: "rodou SISBAJUD",
  infojud: "rodou INFOJUD",
  renajud: "rodou RENAJUD",
  arisp: "rodou ARISP",
  serasajud: "rodou SERASAJUD",
  sniper: "rodou SNIPER",
  oficio_cartorio: "expediu ofício ao cartório",
  oficio_junta: "expediu ofício à junta",
  peticao_penhora: "peticionou penhora",
  penhora_efetivada: "efetivou penhora",
  audiencia: "compareceu à audiência",
  recurso: "interpôs recurso",
  cumprimento_sentenca: "abriu cumprimento de sentença",
  outro: "registrou uma medida",
};

function verboMedida(tipo: TipoMedida): string {
  return VERBO_POR_TIPO[tipo] ?? `fez ${TIPO_META[tipo].label.toLowerCase()}`;
}

// FeedMedidaItem só carrega `advogadoEmail` — derivamos um nome de exibição
// a partir do local-part do email (mesma heurística de `nomeOuEmail` sem
// mapa de perfis, já que o componente recebe só o agregado).
function nomeAdvogado(email: string | null): string {
  const e = (email ?? "").trim().toLowerCase();
  if (!e) return "Equipe";
  const local = e.split("@")[0] ?? e;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function hrefDoCaso(casoId: number): string {
  return `/equipe/casos/${casoId}`;
}

export default function FeedMedidasRecentes({ dados }: Props) {
  const itens = dados.slice(0, 10);

  return (
    <DashboardCard
      titulo="Feed de medidas recentes"
      descricao="Últimas providências registradas pela equipe"
      accent="green"
    >
      {itens.length === 0 ? (
        <p className="text-sm text-[var(--color-ivory-66)]">
          Nenhuma medida registrada nas últimas 24h.
        </p>
      ) : (
        <ol className="relative flex flex-col">
          {itens.map((item, idx) => (
            <FeedItem
              key={`${item.casoId}-${item.criadoEm}-${idx}`}
              item={item}
              ehUltimo={idx === itens.length - 1}
            />
          ))}
        </ol>
      )}
    </DashboardCard>
  );
}

type FeedItemProps = {
  item: FeedMedidaItem;
  ehUltimo: boolean;
};

function FeedItem({ item, ehUltimo }: FeedItemProps) {
  const tipoMeta = TIPO_META[item.tipo];
  const resultadoMeta = RESULTADO_META[item.resultado];
  const advogado = nomeAdvogado(item.advogadoEmail);
  const verbo = verboMedida(item.tipo);

  return (
    <li className="relative">
      <Link
        href={hrefDoCaso(item.casoId)}
        className={[
          "group grid grid-cols-[1.25rem_1fr_auto] items-start gap-3",
          "rounded-lg -mx-2 px-2 py-2.5",
          "transition-colors",
          "hover:bg-[var(--color-ivory-12)]",
          "focus-visible:bg-[var(--color-ivory-12)] focus-visible:outline-none",
        ].join(" ")}
      >
        {/* Coluna 1 — bolinha do tipo + traço vertical da timeline */}
        <span className="relative flex h-full justify-center pt-1.5">
          <span
            aria-hidden
            className="relative z-10 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-[var(--color-carbon)]"
            style={{
              background: tipoMeta.cor,
              boxShadow: `0 0 6px ${tipoMeta.cor}66`,
            }}
          />
          {ehUltimo ? null : (
            <span
              aria-hidden
              className="absolute left-1/2 top-4 h-[calc(100%-0.5rem)] w-px -translate-x-1/2 bg-[var(--color-ivory-12)]"
            />
          )}
        </span>

        {/* Coluna 2 — texto principal + linha secundária */}
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-xl leading-snug text-[var(--color-ivory)]">
            <span className="font-medium text-[var(--color-ivory)]">
              {advogado}
            </span>{" "}
            <span className="text-[var(--color-ivory-66)]">{verbo} em</span>{" "}
            <span className="font-serif text-[var(--color-gold)] group-hover:underline">
              {item.devedorNome}
            </span>
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-ivory-66)]">
            <span
              className="font-mono uppercase tracking-[0.18em]"
              style={{ color: tipoMeta.cor }}
            >
              {tipoMeta.label}
            </span>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span>{formatTempoRelativo(item.criadoEm)}</span>
          </div>
        </div>

        {/* Coluna 3 — badge de resultado */}
        <span
          className="shrink-0 mt-0.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em]"
          style={{
            borderColor: `${resultadoMeta.cor}44`,
            background: `${resultadoMeta.cor}14`,
            color: resultadoMeta.cor,
          }}
        >
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: resultadoMeta.cor }}
          />
          {resultadoMeta.label}
        </span>
      </Link>
    </li>
  );
}
