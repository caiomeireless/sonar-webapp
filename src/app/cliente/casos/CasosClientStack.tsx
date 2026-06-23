"use client";

// Wrapper Client do CardStack pra rota /cliente/casos (page e' Server Component).
// O CardStack ja' e' "use client"; precisamos do wrapper porque o renderCard
// passa um componente React no inline, e usar Link/CardCaso aqui mantem a
// chamada longe da fronteira do server.
import Link from "next/link";
import { Clock } from "lucide-react";

import { CardStack } from "@/components/ui/CardStack";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import type { CasoListagem } from "@/lib/casos";
import { formatBRL, formatStatus, formatTempoRelativo } from "@/lib/format";

type Props = {
  casos: CasoListagem[];
};

export function CasosClientStack({ casos }: Props) {
  // Briefing: aplicar tuning visual de leque 3D (overlap/spread/tilt/etc).
  const items = casos.map((c) => ({ id: c.caso_id, caso: c }));

  return (
    <div className="mx-auto mt-12 w-full max-w-[1100px]">
      <CardStack
        items={items}
        cardWidth={380}
        cardHeight={460}
        overlap={0.32}
        spreadDeg={18}
        perspectivePx={1200}
        depthPx={110}
        tiltXDeg={6}
        activeLiftPx={14}
        activeScale={1.04}
        inactiveScale={0.9}
        springStiffness={280}
        springDamping={28}
        maxVisible={5}
        loop
        showArrows
        showDots
        renderCard={(item, { active }) => (
          <CardCaso caso={item.caso} active={active} />
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardCaso — replica visual do card antigo, agora com prop `active`.
// Quando inactive, opacity 0.78 e link desabilitado (so' click no CardStack
// ativa o card do topo).
// ---------------------------------------------------------------------------

function CardCaso({ caso, active }: { caso: CasoListagem; active: boolean }) {
  const status = formatStatus(caso.status);
  const docLabel = caso.devedor.tipo === "PF" ? "CPF" : "CNPJ";

  // SpotlightCard nao aceita prop `style` — envelopo numa div que controla
  // a opacity quando o card esta' inativo (briefing: opacity 0.78).
  // Uso data-active + Tailwind arbitrary pra nao deixar inline style no JSX.
  const conteudo = (
    <div
      data-active={active}
      className="h-full opacity-[0.78] transition-opacity duration-300 data-[active=true]:opacity-100"
    >
      <SpotlightCard className="h-full cursor-pointer p-7">
      {/* === BLOCO 1: IDENTIFICAÇÃO === */}
      <header>
        <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
          Devedor
        </span>
        <h3 className="mt-3 font-serif text-[24px] leading-[1.15] text-[var(--color-gold)]">
          {caso.devedor.nome}
        </h3>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
            {caso.devedor.tipo}
          </span>
          <span className="h-3 w-px bg-[var(--color-ivory-22)]" />
          <span className="font-mono text-[12px] text-ivory">
            {docLabel} {caso.devedor.documento}
          </span>
        </div>
      </header>

      <div className="my-6 h-px bg-[var(--color-ivory-12)]" />

      {/* === BLOCO 2: PROCESSO === */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          Processo
        </p>
        <p className="mt-2 break-all font-mono text-[15px] text-[var(--color-gold)]">
          {caso.numero_processo ?? "Sem número registrado"}
        </p>
        {caso.valor_credito_brl ? (
          <p className="mt-3 font-mono text-[13px] text-ivory">
            <span className="text-[var(--color-ivory-66)]">Crédito:</span>{" "}
            <span className="tabular-nums">
              {formatBRL(caso.valor_credito_brl)}
            </span>
          </p>
        ) : null}
      </div>

      <div className="my-6 h-px bg-[var(--color-ivory-12)]" />

      {/* === BLOCO 3: STATS BENS === */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-serif text-4xl leading-none text-[var(--color-gold)]">
            {caso.total_bens}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            {caso.total_bens === 1 ? "Bem Encontrado" : "Bens Encontrados"}
          </p>
        </div>
        {caso.valor_estimado_total_brl > 0 ? (
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Estimado
            </p>
            <p className="mt-1 font-mono text-[16px] tabular-nums text-ivory">
              {formatBRL(caso.valor_estimado_total_brl)}
            </p>
          </div>
        ) : null}
      </div>

      {/* === BLOCO 4: FOOTER === */}
      <div className="mt-6 space-y-3 border-t border-[var(--color-ivory-12)] pt-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex rounded-full border border-[var(--color-signal)]/40 bg-[var(--color-signal-soft)] px-3 py-1 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
            {status.label}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--color-ivory-66)]">
            <Clock className="h-3 w-3" />
            {formatTempoRelativo(caso.ultima_consulta_em)}
          </span>
        </div>
      </div>
      </SpotlightCard>
    </div>
  );

  // Link interno desabilitado quando inactive — so' click no CardStack ativa
  // o card. Quando active, o Link captura o click normalmente.
  if (!active) {
    return <div className="block h-full">{conteudo}</div>;
  }

  return (
    <Link href={`/cliente/casos/${caso.devedor.id}`} className="block h-full">
      {conteudo}
    </Link>
  );
}
