"use client";

// Carteira hierárquica do escritório — NÍVEL 1: lista de CLIENTES (credores).
// Cada card/linha = 1 cliente. Click -> drill-down em /equipe/devedores/credor/{id}
// (nível 2, lista os casos daquele cliente).
//
// Toggle Cards/Lista persistido em localStorage chave `sonar.carteira.view`.
// Default: cards.
import Link from "next/link";
import { useEffect, useState } from "react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
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
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {credores.map((c) => (
            <CardCredor key={c.id} credor={c} euQuery={euQuery} />
          ))}
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
}: {
  credor: CredorListagem;
  euQuery: string;
}) {
  const docLabel = credor.tipo === "PF" ? "CPF" : "CNPJ";
  return (
    <Link
      href={`/equipe/devedores/credor/${credor.id}${euQuery}`}
      className="block"
    >
      <SpotlightCard className="cursor-pointer p-6">
        {/* === CLIENTE (topo, grande dourado) === */}
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
          Cliente
        </span>
        <h3 className="mt-2 font-serif text-2xl leading-tight text-[var(--color-gold)]">
          {credor.nome}
        </h3>
        <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
          {credor.tipo === "PF" ? "PF" : "PJ"} · {docLabel} {credor.documento}
        </p>

        {credor.email_contato || credor.telefone ? (
          <p className="mt-2 font-mono text-[11px] leading-snug text-[var(--color-ivory-88)]">
            {credor.email_contato ? (
              <span className="block break-all">{credor.email_contato}</span>
            ) : null}
            {credor.telefone ? (
              <span className="block">{credor.telefone}</span>
            ) : null}
          </p>
        ) : null}

        <div className="my-5 h-px bg-[var(--color-ivory-12)]" />

        {/* === STATS === */}
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl text-ivory">
            {credor.total_casos}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
            {credor.total_casos === 1 ? "caso" : "casos"}
          </span>
        </div>
        <p className="mt-2 font-mono text-xs leading-snug text-[var(--color-ivory-88)]">
          {credor.total_devedores}{" "}
          {credor.total_devedores === 1
            ? "devedor rastreado"
            : "devedores rastreados"}{" "}
          ·{" "}
          <span className="text-[var(--color-gold)]">{credor.total_bens}</span>{" "}
          {credor.total_bens === 1 ? "bem encontrado" : "bens encontrados"}
        </p>

        {credor.valor_estimado_total_brl > 0 ? (
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            Valor estimado total:{" "}
            <span className="text-ivory">
              {formatBRL(credor.valor_estimado_total_brl)}
            </span>
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between border-t border-[var(--color-ivory-12)] pt-5">
          <span className="rounded-full border border-[var(--color-ivory-22)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-88)]">
            #{credor.id}
          </span>
          <span className="font-mono text-xs text-[var(--color-ivory-66)]">
            Última consulta {formatTempoRelativo(credor.ultima_consulta_em)}
          </span>
        </div>
      </SpotlightCard>
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
                  className="block font-serif text-[14px] leading-tight text-[var(--color-gold)]"
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
                <span className="font-mono text-[12px] text-[var(--color-gold)]">
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
