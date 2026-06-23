"use client";

// NÍVEL 2 da carteira — lista os CASOS de um cliente específico.
// Cada caso = 1 devedor + 1 processo; click -> dossiê em /equipe/devedores/{devedor_id}.
//
// Toggle Cards/Lista persistido em localStorage chave `sonar.credor.casos.view`.
// Mesmo visual da CarteiraView (consistência entre os 2 níveis).
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, User2, Coins, Clock, Scale } from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { CardDeck } from "@/components/ui/CardDeck";
import { formatBRL, formatTempoRelativo } from "@/lib/format";
import type { CredorComCasos } from "@/lib/devedores";

type CasoRow = CredorComCasos["casos"][number];
type Modo = "cards" | "lista";
const STORAGE_KEY = "sonar.credor.casos.view";

export function CasosCredorView({
  casos,
  euQuery,
}: {
  casos: CasoRow[];
  euQuery: string;
}) {
  const [modo, setModo] = useState<Modo>("cards");
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(STORAGE_KEY);
      if (salvo === "cards" || salvo === "lista") setModo(salvo);
    } catch {
      // ignora
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
        <div className="w-full max-w-[1100px] mx-auto mt-12">
          <CardDeck
            items={casos.map((c) => ({ ...c, id: c.caso_id }))}
            cardWidth={400}
            cardHeight={500}
            visibleCount={4}
            offsetTopPct={8}
            scaleStep={0.05}
            dimStep={0.12}
            showArrows
            showProgress
            loop
            renderCard={(item, { active }) => (
              <CardCaso caso={item} euQuery={euQuery} active={active} />
            )}
          />
        </div>
      ) : (
        <ListaCasos casos={casos} euQuery={euQuery} />
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
      role="tab"
      aria-selected={ativo ? "true" : "false"}
      onClick={onClick}
      className={
        "rounded-md px-4 py-2 font-mono text-[12px] uppercase tracking-[0.28em] transition " +
        (ativo
          ? "bg-[var(--color-gold)]/15 text-[var(--color-gold)] ring-1 ring-[var(--color-gold)]/40"
          : "text-[var(--color-ivory-66)] hover:text-ivory")
      }
    >
      {label}
    </button>
  );
}

// ============================================================
// CARDS — hierarquia visual em 4 blocos (igual carteira nivel 1)
// ============================================================
function CardCaso({
  caso,
  euQuery,
  active = true,
}: {
  caso: CasoRow;
  euQuery: string;
  active?: boolean;
}) {
  const docLabel = caso.devedor.tipo === "PF" ? "CPF" : "CNPJ";
  // Conteudo do card (compartilhado entre versao ativa/inativa).
  const conteudo = (
    <SpotlightCard
      className={
        "h-full p-7 transition-opacity duration-300 " +
        (active ? "cursor-pointer opacity-100" : "opacity-70")
      }
    >
        {/* === DEVEDOR === */}
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

        {/* === PROCESSO === */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            Processo
          </p>
          <p className="mt-2 break-all font-mono text-[15px] text-[var(--color-gold)]">
            {caso.numero_processo ?? "—"}
          </p>
          {caso.valor_credito_brl ? (
            <p className="mt-3 font-mono text-[13px] text-ivory">
              <span className="text-[var(--color-ivory-66)]">Crédito:</span>{" "}
              <span className="tabular-nums">{formatBRL(caso.valor_credito_brl)}</span>
            </p>
          ) : null}
        </div>

        <div className="my-6 h-px bg-[var(--color-ivory-12)]" />

        {/* === STATS BENS === */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-serif text-4xl leading-none text-[var(--color-gold)]">
              {caso.total_bens}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              {caso.total_bens === 1 ? "Bem Encontrado" : "Bens Encontrados"}
            </p>
          </div>
          {caso.valor_estimado_brl > 0 ? (
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                Estimado
              </p>
              <p className="mt-1 font-mono text-[16px] tabular-nums text-ivory">
                {formatBRL(caso.valor_estimado_brl)}
              </p>
            </div>
          ) : null}
        </div>

        {/* === FOOTER === status + ultima consulta + advogado */}
        <div className="mt-6 space-y-3 border-t border-[var(--color-ivory-12)] pt-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex rounded-full border border-[var(--color-signal)]/40 bg-[var(--color-signal-soft)] px-3 py-1 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
              {caso.status}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--color-ivory-66)]">
              <Clock className="h-3 w-3" />
              {formatTempoRelativo(caso.ultima_consulta_em)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="h-3.5 w-3.5 flex-none text-[var(--color-ivory-66)]" />
            {caso.responsavel_email ? (
              <span className="break-all font-mono text-[12px] text-ivory">
                {caso.responsavel_email}
              </span>
            ) : (
              <span className="font-mono text-[12px] italic text-[var(--color-ivory-66)]">
                sem responsável atribuído
              </span>
            )}
          </div>
        </div>
      </SpotlightCard>
  );

  // Link clicavel SO no card ativo (topo do baralho). Cards de baixo ficam
  // como <div> pra evitar navegacao acidental.
  if (!active) {
    return <div className="block h-full">{conteudo}</div>;
  }
  return (
    <Link
      href={`/equipe/devedores/${caso.devedor.id}${euQuery}`}
      className="block h-full"
    >
      {conteudo}
    </Link>
  );
}

// ============================================================
// LISTA — tabela com fontes maiores, padding generoso, chips
// ============================================================
function ListaCasos({
  casos,
  euQuery,
}: {
  casos: CasoRow[];
  euQuery: string;
}) {
  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-1)]">
      <table className="w-full border-collapse text-left text-base">
        <thead>
          <tr className="border-b border-[var(--color-line)] text-[var(--color-ivory)]">
            <Th icon={<User2 className="h-3.5 w-3.5" />}>Devedor</Th>
            <Th>Documento</Th>
            <Th icon={<FileText className="h-3.5 w-3.5" />}>Processo</Th>
            <Th>Status</Th>
            <Th icon={<Scale className="h-3.5 w-3.5" />}>Advogado</Th>
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
          {casos.map((c, i) => (
            <tr
              key={c.caso_id}
              className={
                "group border-b border-[var(--color-line)] transition hover:bg-[var(--color-surface-2)] " +
                (i % 2 === 1 ? "bg-[var(--color-surface-2)]/30" : "")
              }
            >
              <Td>
                <Link
                  href={`/equipe/devedores/${c.devedor.id}${euQuery}`}
                  className="block font-serif text-2xl leading-tight text-[var(--color-gold)] hover:underline"
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
                <Link
                  href={`/equipe/devedores/${c.devedor.id}${euQuery}`}
                  className="block break-all font-mono text-2xl text-[var(--color-gold)] hover:underline"
                >
                  {c.numero_processo ?? "—"}
                </Link>
              </Td>
              <Td>
                <span className="inline-flex rounded-full border border-[var(--color-signal)]/40 bg-[var(--color-signal-soft)] px-2.5 py-1 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-signal)]">
                  {c.status}
                </span>
              </Td>
              <Td>
                {c.responsavel_email ? (
                  <span className="break-all font-mono text-sm text-ivory">
                    {c.responsavel_email}
                  </span>
                ) : (
                  <span className="font-mono text-sm italic text-[var(--color-ivory-66)]">
                    —
                  </span>
                )}
              </Td>
              <Td align="right">
                <span className="font-serif text-3xl text-[var(--color-gold)]">
                  {c.total_bens}
                </span>
              </Td>
              <Td align="right">
                <span className="font-mono text-base tabular-nums text-ivory">
                  {c.valor_estimado_brl > 0
                    ? formatBRL(c.valor_estimado_brl)
                    : "—"}
                </span>
              </Td>
              <Td align="right">
                <span className="font-mono text-sm text-[var(--color-ivory-88)]">
                  {formatTempoRelativo(c.ultima_consulta_em)}
                </span>
              </Td>
            </tr>
          ))}
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
  align?: "right";
  icon?: React.ReactNode;
}) {
  return (
    <th
      className={
        "px-5 py-5 font-mono text-[12px] uppercase tracking-[0.22em] font-normal " +
        (align === "right" ? "text-right" : "text-left")
      }
    >
      <span
        className={
          "inline-flex items-center gap-1.5 " +
          (align === "right" ? "flex-row-reverse" : "")
        }
      >
        {icon ? (
          <span className="text-[var(--color-signal)]/70">{icon}</span>
        ) : null}
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
  align?: "right";
}) {
  return (
    <td
      className={
        "px-5 py-5 align-middle " + (align === "right" ? "text-right" : "")
      }
    >
      {children}
    </td>
  );
}
