"use client";

// Nova Consulta Pré-Processual — formulário mock.
// Demo: useState pra simular envio; ao concluir, router.push pra lista.
// Nada é persistido — quando a tabela real chegar (Sem 2), troca o handler
// por uma server action de @/lib/actions.
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function NovaConsultaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eu = searchParams.get("eu");
  const linkBase = eu ? `?eu=${encodeURIComponent(eu)}` : "";

  const [tipo, setTipo] = useState<"PF" | "PJ">("PF");
  const [documento, setDocumento] = useState("");
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [valorCausa, setValorCausa] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const inputBase =
    "w-full rounded-lg border border-[var(--color-ivory-22)] bg-[var(--color-carbon)] px-4 py-3 text-sm text-ivory outline-none transition placeholder:text-[var(--color-ivory-66)] focus:border-[var(--color-signal)] focus:ring-2 focus:ring-[var(--color-signal-12)]";
  const labelBase =
    "block font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!documento.trim()) {
      setErro("CPF/CNPJ é obrigatório.");
      return;
    }
    if (!nome.trim()) {
      setErro("Nome do devedor é obrigatório.");
      return;
    }

    setEnviando(true);
    // Mock: simula o tempo da consulta nas APIs externas (Assertiva, Boa Vista,
    // DataJud). Quando virar real, troca por server action.
    await new Promise((r) => setTimeout(r, 900));
    setEnviando(false);

    router.push(`/equipe/consultas${linkBase}`);
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-[820px] px-6 py-16 sm:px-10">
      <Link href={`/equipe/consultas${linkBase}`} className="btn-neon-gold">
        ← Voltar
      </Link>

      <span className="eyebrow mt-6 block !text-[var(--color-signal)]">
        Custo médio R$ 25–50 dependendo dos cruzamentos
      </span>
      <h1 className="mt-4 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.15] tracking-tight text-ivory">
        Nova Consulta Pré-Processual
      </h1>
      <p className="mt-4 max-w-[600px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
        Informe os dados do devedor. A plataforma cruza Assertiva, Boa Vista,
        Serasa e DataJud para entregar um score de solvência e recomendação
        de execução em segundos.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 flex flex-col gap-8 rounded-xl border border-[var(--color-ivory-12)] bg-[var(--color-carbon)] p-7 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]"
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
                  placeholder={
                    tipo === "PF" ? "000.000.000-00" : "00.000.000/0001-00"
                  }
                  className={inputBase}
                  autoComplete="off"
                  required
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className={labelBase}>Telefone</span>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className={inputBase}
                  autoComplete="off"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className={labelBase}>
                {tipo === "PF" ? "Nome completo" : "Razão social"}
              </span>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={
                  tipo === "PF" ? "Nome do devedor" : "Razão social"
                }
                className={inputBase}
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className={labelBase}>Endereço</span>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número — Bairro, Cidade/UF"
                className={inputBase}
                autoComplete="off"
              />
            </label>
          </div>
        </section>

        <div className="h-px bg-[var(--color-ivory-12)]" />

        {/* ===== Bloco causa ===== */}
        <section>
          <span className="eyebrow">Causa em análise</span>

          <div className="mt-5">
            <label className="flex flex-col gap-2">
              <span className={labelBase}>Valor da causa (BRL)</span>
              <input
                type="text"
                inputMode="decimal"
                value={valorCausa}
                onChange={(e) => setValorCausa(e.target.value)}
                placeholder="0,00"
                className={inputBase}
                autoComplete="off"
              />
              <span className="font-mono text-[11px] text-[var(--color-ivory-66)]">
                Usado para calcular a relação custo/benefício da execução.
              </span>
            </label>
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
            disabled={enviando}
            className="self-start rounded-xl bg-[var(--color-signal)]/85 px-8 py-3.5 text-base font-semibold text-onyx shadow-[0_4px_24px_rgba(60,255,138,0.28)] ring-1 ring-[var(--color-signal)]/60 backdrop-blur-md transition hover:bg-[var(--color-tip-glow)]/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? "Consultando..." : "Realizar Consulta · R$ ~30,00"}
          </button>
        </div>
      </form>
    </main>
  );
}
