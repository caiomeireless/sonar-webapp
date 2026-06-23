"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarDevedorECaso } from "@/lib/actions/devedores-actions";

type Credor = { id: number; nome: string; documento: string };

type Props = {
  credores: Credor[];
  euQuery: string;
};

export function NovoDevedorForm({ credores, euQuery }: Props) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"PF" | "PJ">("PF");
  const [documento, setDocumento] = useState("");
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [credorId, setCredorId] = useState<string>(
    credores[0] ? String(credores[0].id) : "",
  );
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [valorCredito, setValorCredito] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const inputBase =
    "w-full rounded-lg border border-[var(--color-ivory-22)] bg-[var(--color-carbon)] px-4 py-3 text-sm text-ivory outline-none transition placeholder:text-[var(--color-ivory-66)] focus:border-[var(--color-signal)] focus:ring-2 focus:ring-[var(--color-signal-12)]";
  const labelBase =
    "block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!documento.trim()) {
      setErro("Documento (CPF/CNPJ) é obrigatório.");
      return;
    }
    if (!nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }
    if (!credorId) {
      setErro("Selecione um credor.");
      return;
    }

    const credorIdNum = Number.parseInt(credorId, 10);
    if (!Number.isFinite(credorIdNum)) {
      setErro("Credor inválido.");
      return;
    }

    let valorBRL: number | null = null;
    if (valorCredito.trim()) {
      // Parse de moeda BR: "1.234,56" -> 1234.56. Remove separadores de
      // milhar (.) e troca decimal (,) por ponto. Sem isso, "1.234,56"
      // virava 1.23 silenciosamente (bug grave de corrupção de dados).
      const limpo = valorCredito
        .replace(/[^0-9,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
      const n = Number.parseFloat(limpo);
      if (!Number.isFinite(n)) {
        setErro("Valor do crédito inválido.");
        return;
      }
      valorBRL = n;
    }

    setEnviando(true);
    const resultado = await criarDevedorECaso({
      tipo,
      documento: documento.trim(),
      nome: nome.trim(),
      data_nascimento: dataNascimento.trim() || null,
      credor_id: credorIdNum,
      numero_processo: numeroProcesso.trim() || null,
      valor_credito_brl: valorBRL,
    });
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.error);
      return;
    }

    router.push(`/equipe/devedores/${resultado.devedor_id}${euQuery}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-8 rounded-xl border border-[var(--color-ivory-12)] bg-[var(--color-carbon)] p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]"
    >
      {/* ===== Bloco devedor ===== */}
      <section>
        <span className="eyebrow">Devedor</span>

        <div className="mt-5 flex flex-col gap-4">
          <fieldset>
            <legend className={labelBase}>Tipo</legend>
            <div className="mt-2 flex gap-3">
              {(["PF", "PJ"] as const).map((t) => (
                <label
                  key={t}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] transition ${
                    tipo === t
                      ? "border-[var(--color-signal)] bg-[var(--color-signal)]/10 text-[var(--color-signal)]"
                      : "border-[var(--color-ivory-22)] text-[var(--color-ivory-88)] hover:border-[var(--color-ivory-66)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={t}
                    checked={tipo === t}
                    onChange={() => setTipo(t)}
                    className="sr-only"
                  />
                  {t === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={labelBase}>
                {tipo === "PF" ? "CPF" : "CNPJ"}
              </span>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder={tipo === "PF" ? "000.000.000-00" : "00.000.000/0001-00"}
                className={inputBase}
                autoComplete="off"
                required
              />
            </label>

            {tipo === "PF" ? (
              <label className="flex flex-col gap-2">
                <span className={labelBase}>Data de nascimento</span>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className={inputBase}
                />
              </label>
            ) : (
              <div />
            )}
          </div>

          <label className="flex flex-col gap-2">
            <span className={labelBase}>Nome / Razão social</span>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={tipo === "PF" ? "Nome completo" : "Razão social"}
              className={inputBase}
              required
            />
          </label>
        </div>
      </section>

      <div className="h-px bg-[var(--color-ivory-12)]" />

      {/* ===== Bloco vínculo / caso ===== */}
      <section>
        <span className="eyebrow">Vínculo com credor</span>

        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className={labelBase}>Credor</span>
            <select
              value={credorId}
              onChange={(e) => setCredorId(e.target.value)}
              className={inputBase}
              required
            >
              {credores.length === 0 ? (
                <option value="">Nenhum credor cadastrado</option>
              ) : (
                credores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} — {c.documento}
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className={labelBase}>Número do processo (opcional)</span>
              <input
                type="text"
                value={numeroProcesso}
                onChange={(e) => setNumeroProcesso(e.target.value)}
                placeholder="0000000-00.0000.0.00.0000"
                className={inputBase}
                autoComplete="off"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelBase}>Valor do crédito (BRL)</span>
              <input
                type="text"
                inputMode="decimal"
                value={valorCredito}
                onChange={(e) => setValorCredito(e.target.value)}
                placeholder="0,00"
                className={inputBase}
                autoComplete="off"
              />
            </label>
          </div>
        </div>
      </section>

      {/* ===== Submit ===== */}
      <div className="flex flex-col gap-3">
        {erro ? (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {erro}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={enviando || credores.length === 0}
          className="self-start rounded-lg bg-[var(--color-signal)]/85 px-8 py-3 text-sm font-semibold text-onyx shadow-[0_4px_24px_rgba(60,255,138,0.28)] ring-1 ring-[var(--color-signal)]/60 backdrop-blur-md transition hover:bg-[var(--color-tip-glow)]/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? "Cadastrando..." : "Cadastrar devedor"}
        </button>
      </div>
    </form>
  );
}
