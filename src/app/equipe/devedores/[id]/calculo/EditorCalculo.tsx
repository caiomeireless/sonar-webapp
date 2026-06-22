"use client";

// Editor completo de calculo do debito judicial (Client Component).
// Inspirado no fluxo do Debit do escritorio: parametros, valores e
// "o que incluir". O calculo continua MOCK (formulas representativas);
// Sem 5+ substitui por BACEN/TJSP/Selic Lei 14.905/2024.

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";

// ────────────────────────────────────────────────────────────────────────
// Helpers monetarios e de data
// ────────────────────────────────────────────────────────────────────────

const fmtBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatBRL(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return fmtBRL.format(v);
}

function parseValorBR(input: string): number {
  const limpo = (input ?? "").trim().replace(/\s+/g, "").replace(/R\$/gi, "");
  if (!limpo) return NaN;
  if (limpo.includes(",")) {
    const norm = limpo.replace(/\./g, "").replace(",", ".");
    return Number(norm);
  }
  return Number(limpo);
}

function sanitizeValorInput(raw: string): string {
  return raw.replace(/[^\d.,]/g, "");
}

function hojeISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDataBR(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

// ────────────────────────────────────────────────────────────────────────
// Fatores MOCK
// ────────────────────────────────────────────────────────────────────────

const FATOR_CORRECAO_MOCK = 2.139; // TJSP acumulado
const FATOR_JUROS_MOCK = 1.4353; // Lei 14.905/24 — ~143% acumulado
const ALIQUOTA_HONORARIOS = 0.1;
const ALIQUOTA_MULTA = 0.1;

const INDICES = [
  "Tabela TJSP",
  "IGP-M (FGV)",
  "INPC",
  "IPCA-E",
] as const;

type Indice = (typeof INDICES)[number];

// ────────────────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────────────────

type Linha = {
  id: string;
  descricao: string;
  data: string; // ISO
  valor: string; // input string
};

type Inclusoes = {
  jurosMoratorios: boolean;
  jurosCompensatorios: boolean;
  multa: boolean;
  multaArt523: boolean;
  honorarios: boolean;
  honorariosSucumbencia: boolean;
  custas: boolean;
};

type Resultado = {
  valorOriginalTotal: number;
  correcao: number;
  juros: number;
  honorarios: number;
  multa: number;
  custas: number;
  subtotal: number;
  total: number;
  linhas: Array<{
    descricao: string;
    data: string;
    valor: number;
    corrigido: number;
  }>;
};

// ────────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────────

type Props = {
  devedorId: number;
  imprimirHref: string;
};

// ────────────────────────────────────────────────────────────────────────
// Componente
// ────────────────────────────────────────────────────────────────────────

function novaLinha(seed = 0): Linha {
  return {
    id: `linha-${Date.now()}-${seed}-${Math.floor(Math.random() * 1e6)}`,
    descricao: "",
    data: hojeISO(),
    valor: "",
  };
}

export function EditorCalculo({ devedorId: _devedorId, imprimirHref }: Props) {
  // ── Secao 1 ── Configuracao
  const [indice, setIndice] = useState<Indice>("Tabela TJSP");
  const [usarSelicEC113, setUsarSelicEC113] = useState(true);
  const [dataAtualizacao, setDataAtualizacao] = useState(hojeISO());
  const [proRata, setProRata] = useState<"sim" | "nao">("nao");
  const [indicesNegativos, setIndicesNegativos] = useState<"sim" | "nao">(
    "sim",
  );

  // ── Secao 2 ── Linhas de valor
  const [linhas, setLinhas] = useState<Linha[]>([novaLinha(0)]);

  // ── Secao 3 ── O que incluir
  const [inclusoes, setInclusoes] = useState<Inclusoes>({
    jurosMoratorios: true,
    jurosCompensatorios: false,
    multa: false,
    multaArt523: true,
    honorarios: false,
    honorariosSucumbencia: true,
    custas: false,
  });

  // Estado de calculo
  const [calculando, setCalculando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // ── Derivados ────────────────────────────────────────────────────────
  const linhasComCorrecao = useMemo(
    () =>
      linhas.map((l) => {
        const v = parseValorBR(l.valor);
        const corrigido = Number.isFinite(v) ? v * FATOR_CORRECAO_MOCK : 0;
        return { ...l, valorNum: v, corrigido };
      }),
    [linhas],
  );

  // ── Handlers ─────────────────────────────────────────────────────────
  function setLinha(id: string, patch: Partial<Linha>) {
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );
  }

  function adicionarLinha() {
    setLinhas((prev) => [...prev, novaLinha(prev.length)]);
  }

  function removerLinha(id: string) {
    setLinhas((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.id !== id)));
  }

  function toggleInclusao(key: keyof Inclusoes) {
    setInclusoes((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function limpar() {
    setIndice("Tabela TJSP");
    setUsarSelicEC113(true);
    setDataAtualizacao(hojeISO());
    setProRata("nao");
    setIndicesNegativos("sim");
    setLinhas([novaLinha(0)]);
    setInclusoes({
      jurosMoratorios: true,
      jurosCompensatorios: false,
      multa: false,
      multaArt523: true,
      honorarios: false,
      honorariosSucumbencia: true,
      custas: false,
    });
    setResultado(null);
    setErro(null);
    setCalculando(false);
  }

  function calcular() {
    setErro(null);

    const linhasValidas = linhasComCorrecao.filter(
      (l) => Number.isFinite(l.valorNum) && l.valorNum > 0,
    );
    if (linhasValidas.length === 0) {
      setErro(
        "Adicione ao menos uma linha com valor valido (ex: 1.234,56).",
      );
      return;
    }

    setCalculando(true);
    setResultado(null);

    window.setTimeout(() => {
      const valorOriginalTotal = linhasValidas.reduce(
        (acc, l) => acc + l.valorNum,
        0,
      );
      const correcao = linhasValidas.reduce((acc, l) => acc + l.corrigido, 0);
      const juros = inclusoes.jurosMoratorios
        ? correcao * (FATOR_JUROS_MOCK - 1)
        : 0;
      const base = correcao + juros;
      const honorarios = inclusoes.honorariosSucumbencia
        ? base * ALIQUOTA_HONORARIOS
        : 0;
      const multa = inclusoes.multaArt523 ? base * ALIQUOTA_MULTA : 0;
      const custas = inclusoes.custas ? 350 : 0;
      const subtotal = correcao + juros + honorarios + multa + custas;
      const total = subtotal;

      setResultado({
        valorOriginalTotal,
        correcao,
        juros,
        honorarios,
        multa,
        custas,
        subtotal,
        total,
        linhas: linhasValidas.map((l) => ({
          descricao: l.descricao || "Verba",
          data: l.data,
          valor: l.valorNum,
          corrigido: l.corrigido,
        })),
      });
      setCalculando(false);
    }, 1500);
  }

  // ── Estilos repetidos ────────────────────────────────────────────────
  const labelClasse =
    "block font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-ivory-66)]";
  const inputClasse =
    "mt-1.5 block w-full rounded-lg border border-[var(--color-ivory-22)] bg-[rgba(0,0,0,0.4)] px-3 py-2 font-mono text-sm text-ivory placeholder:text-[var(--color-ivory-66)] focus:border-[var(--color-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--color-gold)]";
  const cardClasse =
    "rounded-xl border border-[var(--color-ivory-12)] bg-[rgba(5,7,6,0.65)] p-6 backdrop-blur-md";

  return (
    <div className="space-y-6">
      {/* ============ SECAO 1 — CONFIGURACAO ============ */}
      <section className={cardClasse}>
        <SecaoHeader numero="01" titulo="Configuracao" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="cfg-indice" className={labelClasse}>
              Indice de correcao monetaria
            </label>
            <select
              id="cfg-indice"
              value={indice}
              onChange={(e) => setIndice(e.target.value as Indice)}
              className={inputClasse}
            >
              {INDICES.map((i) => (
                <option key={i} value={i} className="bg-onyx text-ivory">
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cfg-data" className={labelClasse}>
              Data de atualizacao
            </label>
            <input
              id="cfg-data"
              type="date"
              value={dataAtualizacao}
              onChange={(e) => setDataAtualizacao(e.target.value)}
              className={inputClasse}
            />
          </div>

          <div className="flex items-end">
            <label className="mt-1.5 flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-ivory-22)] bg-[rgba(0,0,0,0.4)] px-3 py-2.5">
              <input
                type="checkbox"
                checked={usarSelicEC113}
                onChange={(e) => setUsarSelicEC113(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[var(--color-gold)]"
              />
              <span className="text-sm text-ivory">
                Usar SELIC a partir de 12/2021{" "}
                <span className="text-[var(--color-ivory-66)]">(EC 113)</span>
              </span>
            </label>
          </div>

          <RadioPar
            id="cfg-prorata"
            label="Calculo pro-rata?"
            value={proRata}
            onChange={(v) => setProRata(v)}
          />

          <RadioPar
            id="cfg-negativos"
            label="Utilizar indices negativos"
            value={indicesNegativos}
            onChange={(v) => setIndicesNegativos(v)}
          />
        </div>
      </section>

      {/* ============ SECAO 2 — VALORES ============ */}
      <section className={cardClasse}>
        <SecaoHeader numero="02" titulo="Valores" />

        <div className="mt-6 overflow-hidden rounded-lg border border-[var(--color-ivory-12)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.03)] font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                <th className="px-3 py-2.5 text-left">Descricao</th>
                <th className="px-3 py-2.5 text-left">Data</th>
                <th className="px-3 py-2.5 text-right">Valor (R$)</th>
                <th className="px-3 py-2.5 text-right">Valor corrigido</th>
                <th className="px-3 py-2.5 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-ivory-12)]">
              {linhasComCorrecao.map((l, i) => (
                <tr
                  key={l.id}
                  className={i % 2 === 0 ? "bg-[rgba(0,0,0,0.25)]" : ""}
                >
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      placeholder="Verba principal"
                      value={l.descricao}
                      onChange={(e) =>
                        setLinha(l.id, { descricao: e.target.value })
                      }
                      className="block w-full rounded-md border border-[var(--color-ivory-12)] bg-[rgba(0,0,0,0.4)] px-2 py-1.5 font-mono text-xs text-ivory placeholder:text-[var(--color-ivory-66)] focus:border-[var(--color-gold)] focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="date"
                      value={l.data}
                      onChange={(e) =>
                        setLinha(l.id, { data: e.target.value })
                      }
                      className="block w-full rounded-md border border-[var(--color-ivory-12)] bg-[rgba(0,0,0,0.4)] px-2 py-1.5 font-mono text-xs text-ivory focus:border-[var(--color-gold)] focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="1.234,56"
                      value={l.valor}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setLinha(l.id, {
                          valor: sanitizeValorInput(e.target.value),
                        })
                      }
                      className="block w-full rounded-md border border-[var(--color-ivory-12)] bg-[rgba(0,0,0,0.4)] px-2 py-1.5 text-right font-mono text-xs text-ivory placeholder:text-[var(--color-ivory-66)] focus:border-[var(--color-gold)] focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-[var(--color-gold)]">
                    {Number.isFinite(l.valorNum) && l.valorNum > 0
                      ? formatBRL(l.corrigido)
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removerLinha(l.id)}
                      disabled={linhas.length === 1}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-ivory-22)] bg-white/5 font-mono text-sm text-[var(--color-ivory-66)] transition hover:border-red-400/60 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Remover linha"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={adicionarLinha}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/20"
          >
            + Adicionar linha
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
            {linhas.length}{" "}
            {linhas.length === 1 ? "linha" : "linhas"}
          </span>
        </div>
      </section>

      {/* ============ SECAO 3 — O QUE INCLUIR ============ */}
      <section className={cardClasse}>
        <SecaoHeader numero="03" titulo="O que incluir" />

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <CheckboxOpcao
            id="inc-juros-mor"
            label="Juros moratorios"
            descricao="Lei 14.905/24 (Selic)"
            checked={inclusoes.jurosMoratorios}
            onChange={() => toggleInclusao("jurosMoratorios")}
          />
          <CheckboxOpcao
            id="inc-juros-comp"
            label="Juros compensatorios"
            descricao="quando previstos em titulo"
            checked={inclusoes.jurosCompensatorios}
            onChange={() => toggleInclusao("jurosCompensatorios")}
          />
          <CheckboxOpcao
            id="inc-multa"
            label="Multa"
            descricao="contratual ou legal"
            checked={inclusoes.multa}
            onChange={() => toggleInclusao("multa")}
          />
          <CheckboxOpcao
            id="inc-multa-523"
            label="Multa art. 523 NCPC (10%)"
            descricao="cumprimento de sentenca"
            checked={inclusoes.multaArt523}
            onChange={() => toggleInclusao("multaArt523")}
          />
          <CheckboxOpcao
            id="inc-honorarios"
            label="Honorarios"
            descricao="contratuais"
            checked={inclusoes.honorarios}
            onChange={() => toggleInclusao("honorarios")}
          />
          <CheckboxOpcao
            id="inc-honorarios-suc"
            label="Honorarios sucumbencia (10%)"
            descricao="art. 85 §2 CPC"
            checked={inclusoes.honorariosSucumbencia}
            onChange={() => toggleInclusao("honorariosSucumbencia")}
          />
          <CheckboxOpcao
            id="inc-custas"
            label="Custas"
            descricao="processuais"
            checked={inclusoes.custas}
            onChange={() => toggleInclusao("custas")}
          />
        </div>
      </section>

      {/* ============ ACOES ============ */}
      {erro ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 font-mono text-[11px] text-red-300">
          ⚠ {erro}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={calcular}
          disabled={calculando}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-gold)] px-5 py-2.5 text-sm font-semibold text-onyx shadow-[0_4px_24px_rgba(201,162,74,0.4)] transition hover:bg-[var(--color-tip-glow)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {calculando ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-onyx border-t-transparent" />
              Calculando...
            </>
          ) : (
            <>Calcular →</>
          )}
        </button>
        <a
          href={imprimirHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-gold)]/50 bg-[var(--color-gold)]/10 px-4 py-2 text-xs font-medium text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/20"
        >
          🖨 Imprimir PDF
        </a>
        <button
          type="button"
          onClick={limpar}
          disabled={calculando}
          className="rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-ivory-66)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpar
        </button>
      </div>

      {/* ============ RESULTADO ============ */}
      {resultado ? (
        <ResultadoTabela resultado={resultado} dataAtualizacao={dataAtualizacao} />
      ) : null}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ────────────────────────────────────────────────────────────────────────

function SecaoHeader({ numero, titulo }: { numero: string; titulo: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-gold)]">
        {numero}
      </span>
      <h3 className="font-serif text-xl text-ivory">{titulo}</h3>
    </div>
  );
}

function RadioPar({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: "sim" | "nao";
  onChange: (v: "sim" | "nao") => void;
}) {
  return (
    <div>
      <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-ivory-66)]">
        {label}
      </span>
      <div className="mt-1.5 flex gap-2">
        {(["sim", "nao"] as const).map((opt) => {
          const ativo = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={ativo}
              id={`${id}-${opt}`}
              className={
                ativo
                  ? "flex-1 rounded-lg border border-[var(--color-gold)] bg-[var(--color-gold)]/15 px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-gold)]"
                  : "flex-1 rounded-lg border border-[var(--color-ivory-22)] bg-[rgba(0,0,0,0.4)] px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-ivory-66)] transition hover:border-[var(--color-gold)]/40"
              }
            >
              {opt === "sim" ? "Sim" : "Nao"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckboxOpcao({
  id,
  label,
  descricao,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  descricao: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className={
        checked
          ? "flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/8 px-3 py-2.5"
          : "flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(0,0,0,0.4)] px-3 py-2.5"
      }
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 cursor-pointer accent-[var(--color-gold)]"
      />
      <div className="flex-1">
        <span className="block text-sm text-ivory">{label}</span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
          {descricao}
        </span>
      </div>
    </label>
  );
}

function ResultadoTabela({
  resultado,
  dataAtualizacao,
}: {
  resultado: Resultado;
  dataAtualizacao: string;
}) {
  const {
    valorOriginalTotal,
    correcao,
    juros,
    honorarios,
    multa,
    custas,
    total,
    linhas,
  } = resultado;

  return (
    <section className="rounded-xl border border-[var(--color-gold)]/30 bg-[rgba(5,7,6,0.7)] p-6 backdrop-blur-md">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-gold)]">
          Resultado da atualizacao
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
          calculado para {formatDataBR(dataAtualizacao)}
        </span>
      </div>

      {/* Tabela de linhas com correcao */}
      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--color-ivory-12)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[rgba(255,255,255,0.03)] font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              <th className="px-3 py-2.5 text-left">Descricao</th>
              <th className="px-3 py-2.5 text-left">Data origem</th>
              <th className="px-3 py-2.5 text-right">Valor original</th>
              <th className="px-3 py-2.5 text-right">Valor corrigido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-ivory-12)]">
            {linhas.map((l, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? "bg-[rgba(0,0,0,0.25)]" : ""}
              >
                <td className="px-3 py-2.5 text-ivory">{l.descricao}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-[var(--color-ivory-66)]">
                  {formatDataBR(l.data)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-ivory">
                  {formatBRL(l.valor)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-[var(--color-gold)]">
                  {formatBRL(l.corrigido)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quadro resumo */}
      <div className="mt-6 overflow-hidden rounded-lg border border-[var(--color-ivory-12)]">
        <div className="border-b border-[var(--color-ivory-12)] bg-[rgba(255,255,255,0.02)] px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-ivory-66)]">
            Resumo
          </span>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-[var(--color-ivory-12)]">
            <ResumoLinha label="Valor original" valor={valorOriginalTotal} />
            <ResumoLinha label="Correcao monetaria" valor={correcao} />
            {juros > 0 ? (
              <ResumoLinha label="Juros moratorios" valor={juros} />
            ) : null}
            {honorarios > 0 ? (
              <ResumoLinha
                label="Honorarios sucumbencia (10%)"
                valor={honorarios}
              />
            ) : null}
            {multa > 0 ? (
              <ResumoLinha label="Multa art. 523 NCPC (10%)" valor={multa} />
            ) : null}
            {custas > 0 ? (
              <ResumoLinha label="Custas processuais" valor={custas} />
            ) : null}
            <tr className="bg-[rgba(201,162,74,0.1)]">
              <td className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-gold)]">
                Total devido
              </td>
              <td className="px-4 py-3 text-right font-mono text-base font-semibold text-[var(--color-gold)]">
                {formatBRL(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-6 font-mono text-[10px] leading-relaxed text-[var(--color-ivory-66)]">
        ⓘ Calculo MOCK — fatores fixos pra demo. Sem 5+ substitui por tabela
        TJSP real (BACEN/TJ-SP) + Selic conforme Lei 14.905/2024.
      </p>
    </section>
  );
}

function ResumoLinha({ label, valor }: { label: string; valor: number }) {
  return (
    <tr>
      <td className="px-4 py-2.5 text-sm text-ivory">{label}</td>
      <td className="px-4 py-2.5 text-right font-mono text-sm text-ivory">
        {formatBRL(valor)}
      </td>
    </tr>
  );
}
