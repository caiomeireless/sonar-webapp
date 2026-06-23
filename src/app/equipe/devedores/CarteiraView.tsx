"use client";

// Carteira hierárquica do escritório — NÍVEL 1: lista de CLIENTES (credores).
// Cada card/linha = 1 cliente. Click -> drill-down em /equipe/devedores/credor/{id}
// (nível 2, lista os casos daquele cliente).
//
// Toggle Cards/Lista persistido em localStorage chave `sonar.carteira.view`.
// Default: cards.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail, Phone, Hash, Clock } from "lucide-react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { CardStack } from "@/components/ui/CardStack";
import { formatBRL, formatTempoRelativo } from "@/lib/format";
import type { CredorListagem } from "@/lib/devedores";

type Modo = "cards" | "lista";
const STORAGE_KEY = "sonar.carteira.view";

export function CarteiraView({
  credores,
  euQuery,
}: {
  credores: CredorListagem[];
  euQuery: string;
}) {
  // Default = cards (SSR + primeiro render). Hidrata do localStorage no client.
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
            items={credores.map((c) => ({ ...c, id: c.id }))}
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
              <CardCredor credor={item} euQuery={euQuery} active={active} />
            )}
          />
        </div>
      ) : (
        <ListaCredores credores={credores} euQuery={euQuery} />
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
      aria-selected={ativo}
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

function CardCredor({
  credor,
  euQuery,
  active = true,
}: {
  credor: CredorListagem;
  euQuery: string;
  active?: boolean;
}) {
  const docLabel = credor.tipo === "PF" ? "CPF" : "CNPJ";
  // Conteudo do card (compartilhado entre versao ativa/inativa).
  // Quando inativo, baixa opacidade pra dar sensacao de profundidade extra
  // alem do scale ja aplicado pelo CardStack.
  const conteudo = (
    <SpotlightCard
      className={
        "h-full p-7 transition-opacity duration-300 " +
        (active ? "cursor-pointer opacity-100" : "opacity-[0.78]")
      }
    >
        {/* === IDENTIFICAÇÃO === */}
        <header>
          <span className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
            Cliente
          </span>
          <h3 className="mt-3 font-serif text-[26px] leading-[1.15] text-[var(--color-gold)]">
            {credor.nome}
          </h3>

          {/* Chip do documento — separa visualmente do nome */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-ivory-22)] bg-[var(--color-surface-2)]/60 px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
              {credor.tipo}
            </span>
            <span className="h-3 w-px bg-[var(--color-ivory-22)]" />
            <span className="font-mono text-[12px] text-ivory">
              {docLabel} {credor.documento}
            </span>
          </div>
        </header>

        {/* === CONTATO === bloco próprio com ícones */}
        {credor.email_contato || credor.telefone ? (
          <div className="mt-5 space-y-2">
            {credor.email_contato ? (
              <div className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 flex-none text-[var(--color-ivory-66)]" />
                <span className="break-all font-mono text-[12px] text-ivory">
                  {credor.email_contato}
                </span>
              </div>
            ) : null}
            {credor.telefone ? (
              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 flex-none text-[var(--color-ivory-66)]" />
                <span className="font-mono text-[12px] text-ivory">
                  {credor.telefone}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="my-6 h-px bg-[var(--color-ivory-12)]" />

        {/* === STATS === grid 3 colunas, hierarquia clara */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="font-serif text-3xl leading-none text-ivory">
              {credor.total_casos}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              {credor.total_casos === 1 ? "Caso" : "Casos"}
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl leading-none text-ivory">
              {credor.total_devedores}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              {credor.total_devedores === 1 ? "Devedor" : "Devedores"}
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl leading-none text-[var(--color-gold)]">
              {credor.total_bens}
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              {credor.total_bens === 1 ? "Bem" : "Bens"}
            </p>
          </div>
        </div>

        {credor.valor_estimado_total_brl > 0 ? (
          <div className="mt-5 rounded-lg border border-[var(--color-gold)]/25 bg-[var(--color-gold)]/5 px-3.5 py-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              Valor Estimado Total
            </p>
            <p className="mt-1 font-mono text-base font-medium tabular-nums text-[var(--color-gold)]">
              {formatBRL(credor.valor_estimado_total_brl)}
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between border-t border-[var(--color-ivory-12)] pt-4">
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--color-ivory-66)]">
            <Hash className="h-3 w-3" />
            {credor.id}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--color-ivory-66)]">
            <Clock className="h-3 w-3" />
            {formatTempoRelativo(credor.ultima_consulta_em)}
          </span>
        </div>
      </SpotlightCard>
  );

  // Link clicavel SO no card ativo (topo do baralho). Cards de baixo viram
  // <div> pra evitar navegacao acidental — o click neles e' capturado pelo
  // CardStack pra virar ativo.
  if (!active) {
    return <div className="block h-full">{conteudo}</div>;
  }
  return (
    <Link
      href={`/equipe/devedores/credor/${credor.id}${euQuery}`}
      className="block h-full"
    >
      {conteudo}
    </Link>
  );
}

function ListaCredores({
  credores,
  euQuery,
}: {
  credores: CredorListagem[];
  euQuery: string;
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--color-ivory-12)] bg-[var(--color-onyx-soft)]/30">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--color-ivory-12)] text-[var(--color-ivory-66)]">
            <Th>Cliente</Th>
            <Th>Tipo</Th>
            <Th>Doc</Th>
            <Th align="right">Casos</Th>
            <Th align="right">Devedores</Th>
            <Th align="right">Bens</Th>
            <Th align="right">Valor estimado</Th>
            <Th align="right">Última consulta</Th>
          </tr>
        </thead>
        <tbody>
          {credores.map((c) => (
            <tr
              key={c.id}
              className="group border-b border-[var(--color-ivory-12)] last:border-b-0 transition hover:bg-[var(--color-ivory-12)]/20"
            >
              <Td>
                <Link
                  href={`/equipe/devedores/credor/${c.id}${euQuery}`}
                  className="block font-serif text-[21px] leading-tight text-[var(--color-gold)]"
                >
                  {c.nome}
                </Link>
              </Td>
              <Td>
                <span className="font-mono text-[11px] text-[var(--color-ivory-88)]">
                  {c.tipo}
                </span>
              </Td>
              <Td>
                <span className="font-mono text-[11px] text-[var(--color-ivory-88)]">
                  {c.documento}
                </span>
              </Td>
              <Td align="right">
                <span className="font-mono text-[12px] text-ivory">
                  {c.total_casos}
                </span>
              </Td>
              <Td align="right">
                <span className="font-mono text-[12px] text-ivory">
                  {c.total_devedores}
                </span>
              </Td>
              <Td align="right">
                <span className="font-mono text-[18px] text-[var(--color-gold)]">
                  {c.total_bens}
                </span>
              </Td>
              <Td align="right">
                <span className="font-mono text-[12px] text-[var(--color-ivory-88)]">
                  {c.valor_estimado_total_brl > 0
                    ? formatBRL(c.valor_estimado_total_brl)
                    : "—"}
                </span>
              </Td>
              <Td align="right">
                <span className="font-mono text-[11px] text-[var(--color-ivory-66)]">
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
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      className={
        "px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] font-normal " +
        (align === "right" ? "text-right" : "text-left")
      }
    >
      {children}
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
        "px-3 py-2.5 align-middle " + (align === "right" ? "text-right" : "")
      }
    >
      {children}
    </td>
  );
}
