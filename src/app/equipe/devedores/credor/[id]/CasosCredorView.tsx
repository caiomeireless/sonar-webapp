"use client";

// NIVEL 2 da carteira — lista os CASOS de um cliente especifico.
// Cada caso = 1 devedor + 1 processo; click -> dossie em /equipe/devedores/{devedor_id}.
//
// Toggle Cards/Lista persistido em localStorage chave `sonar.credor.casos.view`.
// Mesmo visual da CarteiraView (consistencia entre os 2 niveis).
import Link from "next/link";
import { useEffect, useState } from "react";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
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
          aria-label="Visualizacao"
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
          {casos.map((c) => (
            <CardCaso key={c.caso_id} caso={c} euQuery={euQuery} />
          ))}
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

function CardCaso({
  caso,
  euQuery,
}: {
  caso: CasoRow;
  euQuery: string;
}) {
  const docLabel = caso.devedor.tipo === "PF" ? "CPF" : "CNPJ";
  return (
    <Link
      href={`/equipe/devedores/${caso.devedor.id}${euQuery}`}
      className="block"
    >
      <SpotlightCard className="cursor-pointer p-6">
        {/* === DEVEDOR (topo, destaque dourado) === */}
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
          Devedor
        </span>
        <h3 className="mt-2 font-serif text-xl leading-tight text-[var(--color-gold)]">
          {caso.devedor.nome}
        </h3>
        <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
          {caso.devedor.tipo === "PF" ? "PF" : "PJ"} · {docLabel}{" "}
          {caso.devedor.documento}
        </p>

        <div className="my-5 h-px bg-[var(--color-ivory-12)]" />

        {/* === PROCESSO === */}
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
          Processo
        </span>
        <p className="mt-2 break-all font-mono text-sm leading-tight text-[var(--color-gold)]">
          {caso.numero_processo ?? "—"}
        </p>
        {caso.valor_credito_brl ? (
          <p className="mt-1 font-mono text-xs text-[var(--color-ivory-88)]">
            Credito:{" "}
            <span className="text-ivory">
              {formatBRL(caso.valor_credito_brl)}
            </span>
          </p>
        ) : null}

        <div className="my-5 h-px bg-[var(--color-ivory-12)]" />

        {/* === BENS / STATS === */}
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl text-[var(--color-gold)]">
            {caso.total_bens}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
            {caso.total_bens === 1 ? "bem encontrado" : "bens encontrados"}
          </span>
        </div>
        {caso.valor_estimado_brl > 0 ? (
          <p className="mt-2 text-sm text-[var(--color-ivory-88)]">
            Estimado:{" "}
            <span className="text-ivory">
              {formatBRL(caso.valor_estimado_brl)}
            </span>
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between border-t border-[var(--color-ivory-12)] pt-5">
          <span className="rounded-full border border-[var(--color-ivory-22)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-88)]">
            {caso.status}
          </span>
          <span className="font-mono text-xs text-[var(--color-ivory-66)]">
            {formatTempoRelativo(caso.ultima_consulta_em)}
          </span>
        </div>

        {/* Advogado responsavel */}
        <div className="mt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
            Adv. responsavel:{" "}
            {caso.responsavel_email ? (
              <span className="text-[var(--color-ivory-88)] normal-case tracking-normal">
                {caso.responsavel_email}
              </span>
            ) : (
              <span className="text-[var(--color-ivory-66)] italic normal-case tracking-normal">
                sem responsavel atribuido
              </span>
            )}
          </span>
        </div>
      </SpotlightCard>
    </Link>
  );
}

function ListaCasos({
  casos,
  euQuery,
}: {
  casos: CasoRow[];
  euQuery: string;
}) {
  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--color-ivory-12)] bg-[var(--color-onyx-soft)]/30">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--color-ivory-12)] text-[var(--color-ivory-66)]">
            <Th>Devedor</Th>
            <Th>Doc</Th>
            <Th>Processo</Th>
            <Th>Status</Th>
            <Th>Advogado</Th>
            <Th align="right">Bens</Th>
            <Th align="right">Valor estimado</Th>
            <Th align="right">Ultima consulta</Th>
          </tr>
        </thead>
        <tbody>
          {casos.map((c) => (
            <tr
              key={c.caso_id}
              className="group border-b border-[var(--color-ivory-12)] last:border-b-0 transition hover:bg-[var(--color-ivory-12)]/20"
            >
              <Td>
                <Link
                  href={`/equipe/devedores/${c.devedor.id}${euQuery}`}
                  className="block font-serif text-[13px] leading-tight text-[var(--color-gold)]"
                >
                  {c.devedor.nome}
                </Link>
              </Td>
              <Td>
                <span className="font-mono text-[11px] text-[var(--color-ivory-88)]">
                  {c.devedor.tipo}
                  <span className="mx-1 text-[var(--color-ivory-66)]">·</span>
                  {c.devedor.documento}
                </span>
              </Td>
              <Td>
                <Link
                  href={`/equipe/devedores/${c.devedor.id}${euQuery}`}
                  className="block break-all font-mono text-[11px] text-[var(--color-gold)]"
                >
                  {c.numero_processo ?? "—"}
                </Link>
              </Td>
              <Td>
                <span className="font-mono text-[11px] text-[var(--color-ivory-88)]">
                  {c.status}
                </span>
              </Td>
              <Td>
                {c.responsavel_email ? (
                  <span className="font-mono text-[11px] text-[var(--color-ivory-88)]">
                    {c.responsavel_email}
                  </span>
                ) : (
                  <span className="font-mono text-[11px] italic text-[var(--color-ivory-66)]">
                    —
                  </span>
                )}
              </Td>
              <Td align="right">
                <span className="font-mono text-[12px] text-[var(--color-gold)]">
                  {c.total_bens}
                </span>
              </Td>
              <Td align="right">
                <span className="font-mono text-[12px] text-[var(--color-ivory-88)]">
                  {c.valor_estimado_brl > 0
                    ? formatBRL(c.valor_estimado_brl)
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
