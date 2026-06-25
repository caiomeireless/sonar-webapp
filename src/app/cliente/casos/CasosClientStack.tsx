"use client";

// Wrapper Client do CardStack pra rota /cliente/casos (page e' Server Component).
// Toggle Cards/Lista persistido em localStorage chave `sonar.casos-cliente.view`.
// Default: cards.
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, Hash, User2, FileText, Coins } from "lucide-react";

import { CardStack } from "@/components/ui/CardStack";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import type { CasoListagem } from "@/lib/casos";
import { formatBRL, formatStatus, formatTempoRelativo } from "@/lib/format";

type Modo = "cards" | "lista";
const STORAGE_KEY = "sonar.casos-cliente.view";

type Props = {
  casos: CasoListagem[];
};

export function CasosClientStack({ casos }: Props) {
  // Default = cards. Hidrata do localStorage no client.
  const [modo, setModo] = useState<Modo>("cards");
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(STORAGE_KEY);
      if (salvo === "cards" || salvo === "lista") setModo(salvo);
    } catch {
      // ignora SecurityError / quota
    }
    setHidratado(true);
  }, []);

  function trocar(m: Modo) {
    setModo(m);
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignora
    }
  }

  // Propaga ?eu= em modo visualizacao pra que o Link do card/linha preserve
  // o email efetivo. Sem isso, admin em modo visualizacao cai em
  // 'Acesso nao autorizado' ao clicar.
  const sp = useSearchParams();
  const euParam = sp.get("eu");
  const qsEu = euParam ? `?eu=${encodeURIComponent(euParam)}` : "";

  const items = casos.map((c) => ({ id: c.caso_id, caso: c }));

  return (
    <>
      <div className="mt-8 flex justify-end">
        <div
          role="tablist"
          aria-label="Visualização"
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-ivory-12)] bg-[var(--color-onyx-soft)]/40 p-1"
        >
          <ToggleBtn
            ativo={modo === "cards"}
            onClick={() => trocar("cards")}
            label="Cards"
          />
          <ToggleBtn
            ativo={modo === "lista"}
            onClick={() => trocar("lista")}
            label="Lista"
          />
        </div>
      </div>

      {modo === "cards" || !hidratado ? (
        <div className="mx-auto mt-12 w-full max-w-[1100px] min-h-[600px]">
          <CardStack
            items={items}
            cardWidth={440}
            cardHeight={540}
            overlap={0.30}
            spreadDeg={14}
            perspectivePx={1800}
            depthPx={80}
            tiltXDeg={3}
            activeLiftPx={14}
            activeScale={1.04}
            inactiveScale={0.94}
            springStiffness={280}
            springDamping={28}
            maxVisible={5}
            loop
            showArrows
            showDots
            renderCard={(item, { active }) => (
              <CardCaso caso={item.caso} active={active} qsEu={qsEu} />
            )}
          />
        </div>
      ) : (
        <ListaCasos casos={casos} qsEu={qsEu} />
      )}
    </>
  );
}

function ToggleBtn({
  ativo,
  onClick,
  label,
}: {
  ativo: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo ? "true" : "false"}
      onClick={onClick}
      className={
        "rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] transition " +
        (ativo
          ? "bg-[var(--color-gold)]/15 text-[var(--color-gold)] ring-1 ring-[var(--color-gold)]/40"
          : "text-[var(--color-ivory-66)] hover:text-ivory")
      }
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// CardCaso — replica visual do card antigo, agora com prop `active` + qsEu.
// ---------------------------------------------------------------------------

function CardCaso({ caso, active, qsEu }: { caso: CasoListagem; active: boolean; qsEu: string }) {
  const status = formatStatus(caso.status);
  const docLabel = caso.devedor.tipo === "PF" ? "CPF" : "CNPJ";

  const conteudo = (
    <div
      data-active={active}
      className="h-full opacity-[0.78] transition-opacity duration-300 data-[active=true]:opacity-100"
    >
      <SpotlightCard className="h-full cursor-pointer p-7">
        {/* === BLOCO 1: IDENTIFICAÇÃO === */}
        <header>
          <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-devedor)]">
            Devedor
          </span>
          <h3 className="nome-devedor mt-3 font-serif text-[24px] leading-[1.15] text-[var(--color-devedor)]">
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
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Pasta #{caso.caso_id}
          </p>
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

  if (!active) {
    return <div className="block h-full">{conteudo}</div>;
  }

  return (
    <Link href={`/cliente/casos/${caso.devedor.id}${qsEu}`} className="block h-full">
      {conteudo}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// ListaCasos — modo lista. Tabela compacta com colunas chave.
// ---------------------------------------------------------------------------

function ListaCasos({ casos, qsEu }: { casos: CasoListagem[]; qsEu: string }) {
  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-1)]">
      <table className="w-full border-collapse text-left text-base">
        <thead>
          <tr className="border-b border-[var(--color-line)] text-[var(--color-ivory)]">
            <Th icon={<User2 className="h-3.5 w-3.5" />}>Devedor</Th>
            <Th>Documento</Th>
            <Th icon={<Hash className="h-3.5 w-3.5" />}>Pasta</Th>
            <Th icon={<FileText className="h-3.5 w-3.5" />}>Processo</Th>
            <Th>Status</Th>
            <Th align="right">Bens</Th>
            <Th align="right" icon={<Coins className="h-3.5 w-3.5" />}>
              Valor Estimado
            </Th>
            <Th align="right" icon={<Clock className="h-3.5 w-3.5" />}>
              Última Consulta
            </Th>
          </tr>
        </thead>
        <tbody>
          {casos.map((c, i) => {
            const status = formatStatus(c.status);
            return (
              <tr
                key={c.caso_id}
                className={
                  "group border-b border-[var(--color-line)] transition hover:bg-[var(--color-surface-2)] " +
                  (i % 2 === 1 ? "bg-[var(--color-surface-2)]/30" : "")
                }
              >
                <Td>
                  <Link
                    href={`/cliente/casos/${c.devedor.id}${qsEu}`}
                    className="nome-devedor block font-serif text-2xl leading-tight text-[var(--color-devedor)] hover:underline"
                  >
                    {c.devedor.nome}
                  </Link>
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 font-mono text-sm text-ivory">
                    <span className="rounded-full bg-[var(--color-signal-soft)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
                      {c.devedor.tipo}
                    </span>
                    {c.devedor.documento}
                  </span>
                </Td>
                <Td>
                  <span className="font-mono text-sm tabular-nums text-[var(--color-gold)]">
                    #{c.caso_id}
                  </span>
                </Td>
                <Td>
                  <Link
                    href={`/cliente/casos/${c.devedor.id}${qsEu}`}
                    className="block break-all font-mono text-base text-[var(--color-gold)] hover:underline"
                  >
                    {c.numero_processo ?? "—"}
                  </Link>
                </Td>
                <Td>
                  <span className="inline-flex rounded-full border border-[var(--color-signal)]/40 bg-[var(--color-signal-soft)] px-2.5 py-1 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
                    {status.label}
                  </span>
                </Td>
                <Td align="right">
                  <span className="font-serif text-2xl text-[var(--color-gold)]">
                    {c.total_bens}
                  </span>
                </Td>
                <Td align="right">
                  <span className="whitespace-nowrap font-mono text-base tabular-nums text-ivory">
                    {c.valor_estimado_total_brl > 0
                      ? formatBRL(c.valor_estimado_total_brl)
                      : "—"}
                  </span>
                </Td>
                <Td align="right">
                  <span className="font-mono text-sm text-[var(--color-ivory-88)]">
                    {formatTempoRelativo(c.ultima_consulta_em)}
                  </span>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  align,
  icon,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  icon?: React.ReactNode;
}) {
  return (
    <th
      className={
        "px-4 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)] " +
        (align === "right" ? "text-right" : "text-left")
      }
    >
      <span className={"inline-flex items-center gap-1.5 " + (align === "right" ? "justify-end" : "")}>
        {icon}
        {children}
      </span>
    </th>
  );
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td className={"px-4 py-3 " + (align === "right" ? "text-right" : "text-left")}>
      {children}
    </td>
  );
}
