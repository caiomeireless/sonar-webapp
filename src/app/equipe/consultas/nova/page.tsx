"use client";

// Nova Consulta Pré-Processual — formulário + escolha de busca (mock).
// O usuário preenche os dados do devedor e escolhe COMO consultar:
//   1) Combo Lead    — varredura barata pra screening (Assertiva, BigData, DataJud...)
//   2) Combo Documento — fontes oficiais com fé pública (matrículas, Junta, eDossie)
//   3) Buscas Individuais — checkboxes por API com total dinâmico
//
// Cada opção abre modal de confirmação (custo + advogado responsável,
// estilo idêntico ao AcoesBuscaCardThemis). Após o submit (mock useState),
// redireciona pra lista com aviso de sucesso.
//
// Quando a Sem 2 entregar a tabela `consultas_pre` real, o handler
// `executar()` vira server action e o estado `dadosBasicosOk` vira validação
// no servidor.
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  APIS,
  COMBO_DOC,
  COMBO_LEAD,
  TOTAL_DOC,
  TOTAL_LEAD,
  type ApiSonar,
  formatBRL,
} from "@/lib/sonar-apis";

type ModalKind = "lead" | "doc" | "individual" | null;
type ExecState = "idle" | "executing" | "done";

const SALDO_USADO_INICIAL = 47.2; // mockado, compartilhado com a Themis/dossiê
const LIMITE_MES = 500;

export default function NovaConsultaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eu = searchParams.get("eu");
  const linkBase = eu ? `?eu=${encodeURIComponent(eu)}` : "";

  // ============ Dados do devedor ============
  const [tipo, setTipo] = useState<"PF" | "PJ">("PF");
  const [documento, setDocumento] = useState("");
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [valorCausa, setValorCausa] = useState("");
  const [erro, setErro] = useState("");

  // ============ Estado da escolha de busca ============
  const [modal, setModal] = useState<ModalKind>(null);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [execState, setExecState] = useState<ExecState>("idle");
  const saldoUsado = SALDO_USADO_INICIAL;

  const inputBase =
    "w-full rounded-lg border border-[var(--color-ivory-22)] bg-[var(--color-carbon)] px-4 py-3 text-sm text-ivory outline-none transition placeholder:text-[var(--color-ivory-66)] focus:border-[var(--color-signal)] focus:ring-2 focus:ring-[var(--color-signal-12)]";
  const labelBase =
    "block font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]";

  const totalIndividual = APIS.filter((a) => selecionadas.has(a.id)).reduce(
    (s, a) => s + a.preco,
    0,
  );

  const apisDoModal: ApiSonar[] =
    modal === "lead"
      ? COMBO_LEAD
      : modal === "doc"
        ? COMBO_DOC
        : APIS.filter((a) => selecionadas.has(a.id));

  const totalModal = apisDoModal.reduce((s, a) => s + a.preco, 0);
  const saldoDepois = saldoUsado + totalModal;
  const vaiEstourar = saldoDepois > LIMITE_MES;

  function toggleApi(id: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Valida os campos do form ANTES de abrir o modal. Sem CPF/CNPJ ou nome,
  // a consulta não faz sentido — não dá pra cruzar APIs sem identidade.
  function tentarAbrirModal(kind: Exclude<ModalKind, null>) {
    setErro("");
    if (!documento.trim()) {
      setErro("CPF/CNPJ é obrigatório antes de executar a consulta.");
      return;
    }
    if (!nome.trim()) {
      setErro("Nome do devedor é obrigatório antes de executar a consulta.");
      return;
    }
    setModal(kind);
  }

  function fecharModal() {
    if (execState !== "idle") return;
    setModal(null);
  }

  // Mock: spinner por 1.5s, aviso por 1.1s, redireciona pra lista.
  // No real, vira server action que cria a row em `consultas_pre`
  // e redireciona pra detalhe da nova (push pra `/equipe/consultas/${novoId}`).
  function executar() {
    if (execState !== "idle") return;
    setExecState("executing");
    setTimeout(() => {
      setExecState("done");
      setTimeout(() => {
        setModal(null);
        setExecState("idle");
        if (modal === "individual") setSelecionadas(new Set());
        router.push(`/equipe/consultas${linkBase}`);
        router.refresh();
      }, 1100);
    }, 1500);
  }

  return (
    <main className="mx-auto max-w-[820px] px-6 py-16 sm:px-10">
      <Link href={`/equipe/consultas${linkBase}`} className="btn-neon-gold">
        ← Voltar
      </Link>

      <span className="eyebrow mt-6 block !text-[var(--color-signal)]">
        Cruzamento de até 11 APIs · escolha o modo
      </span>
      <h1 className="mt-4 font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.15] tracking-tight text-ivory">
        Nova Consulta Pré-Processual
      </h1>
      <p className="mt-4 max-w-[600px] text-sm leading-relaxed text-[var(--color-ivory-88)]">
        Informe os dados do devedor e escolha o tipo de varredura. O Combo Lead
        é barato e serve para triagem; o Combo Documento traz peças oficiais
        anexáveis; as buscas individuais permitem montar um pacote sob medida.
      </p>

      <form
        onSubmit={(e) => e.preventDefault()}
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
          <span className="eyebrow">Causa em Análise</span>

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
              <span className="font-mono text-[12px] text-[var(--color-ivory-66)]">
                Usado para calcular a relação custo/benefício da execução.
              </span>
            </label>
          </div>
        </section>

        <div className="h-px bg-[var(--color-ivory-12)]" />

        {/* ===== Bloco busca ===== */}
        <section>
          <span className="eyebrow">Modo de Busca</span>

          {erro ? (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {erro}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => tentarAbrirModal("lead")}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-signal)]/85 px-5 py-2.5 text-sm font-semibold text-onyx shadow-[0_4px_24px_rgba(60,255,138,0.28)] ring-1 ring-[var(--color-signal)]/60 transition hover:bg-[var(--color-tip-glow)]/90"
            >
              ⚡ Buscar Tudo (Lead) · ~{formatBRL(TOTAL_LEAD)}
            </button>

            <button
              type="button"
              onClick={() => tentarAbrirModal("doc")}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-gold)] px-5 py-2.5 text-sm font-semibold text-onyx shadow-[0_4px_24px_rgba(201,162,74,0.4)] transition hover:bg-[var(--color-tip-glow)]"
            >
              📄 Buscar Tudo (Combo Documento) · {formatBRL(TOTAL_DOC)}
            </button>

            <button
              type="button"
              onClick={() => setDropdownAberto((a) => !a)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-5 py-2.5 text-sm font-medium text-ivory transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
            >
              Buscas Individuais {dropdownAberto ? "▴" : "▾"}
            </button>
          </div>

          {/* Dropdown individual */}
          {dropdownAberto ? (
            <div className="mt-4 rounded-lg border border-[var(--color-ivory-12)] bg-[rgba(0,0,0,0.4)] p-4">
              <div className="space-y-0.5">
                {APIS.map((api) => {
                  const checked = selecionadas.has(api.id);
                  return (
                    <label
                      key={api.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-2 transition hover:bg-white/5 ${
                        checked ? "bg-white/[0.03]" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleApi(api.id)}
                          className="h-4 w-4 cursor-pointer accent-[var(--color-signal)]"
                        />
                        <span className="truncate text-sm text-ivory">
                          {api.nome}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className="font-mono text-[12px] uppercase tracking-[0.18em]"
                          style={{
                            color:
                              api.preco === 0
                                ? "var(--color-signal)"
                                : "var(--color-gold)",
                          }}
                        >
                          {api.precoLabel}
                        </span>
                        <span
                          className="rounded-full border px-2 py-0.5 font-mono text-[12px] uppercase tracking-[0.18em]"
                          style={{
                            borderColor:
                              api.modo === "doc"
                                ? "var(--color-gold)"
                                : "var(--color-signal)",
                            color:
                              api.modo === "doc"
                                ? "var(--color-gold)"
                                : "var(--color-signal)",
                            opacity: 0.7,
                          }}
                        >
                          {api.modo === "doc" ? "doc" : "lead"}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col items-stretch gap-3 border-t border-[var(--color-ivory-12)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-mono text-xs">
                  <span className="text-[var(--color-ivory-66)]">
                    Total selecionado:{" "}
                  </span>
                  <span className="text-[var(--color-gold)]">
                    {formatBRL(totalIndividual)}
                  </span>
                  <span className="text-[var(--color-ivory-66)]">
                    {" "}
                    · {selecionadas.size}{" "}
                    {selecionadas.size === 1 ? "API" : "APIs"}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={selecionadas.size === 0}
                  onClick={() => tentarAbrirModal("individual")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-signal)]/85 px-5 py-2 text-xs font-semibold text-onyx ring-1 ring-[var(--color-signal)]/60 transition hover:bg-[var(--color-tip-glow)]/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Executar Buscas Selecionadas · {formatBRL(totalIndividual)} →
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </form>

      {/* ============ MODAL DE CONFIRMAÇÃO (mesmo padrão do AcoesBuscaMockadas) ============ */}
      {modal ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={fecharModal}
        >
          <div
            className="w-full max-w-[560px] rounded-xl border border-[var(--color-ivory-22)] bg-[var(--color-carbon)] p-7 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            {execState === "idle" ? (
              <>
                <span className="eyebrow">Confirmar Consulta</span>
                <h3 className="mt-2 font-serif text-2xl text-ivory">
                  {modal === "lead"
                    ? "Combo Lead"
                    : modal === "doc"
                      ? "Combo Documento"
                      : "Consultas Selecionadas"}
                </h3>
                <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
                  Devedor: <span className="text-ivory">{nome || "—"}</span>
                </p>
                {eu ? (
                  <p className="mt-1 font-mono text-xs text-[var(--color-ivory-66)]">
                    Advogado responsável:{" "}
                    <span className="text-[var(--color-advogado)]">{eu}</span>
                  </p>
                ) : null}

                {/* Lista de APIs */}
                <div className="mt-5 max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
                  {apisDoModal.map((api) => (
                    <div
                      key={api.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="truncate text-ivory">{api.nome}</span>
                      <span
                        className="ml-2 whitespace-nowrap font-mono"
                        style={{
                          color:
                            api.preco === 0
                              ? "var(--color-signal)"
                              : "var(--color-gold)",
                        }}
                      >
                        {api.precoLabel}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totais */}
                <div className="mt-5 space-y-2 border-t border-[var(--color-ivory-12)] pt-4">
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-[var(--color-ivory-66)]">
                      Total estimado
                    </span>
                    <span className="font-semibold text-[var(--color-gold)]">
                      {formatBRL(totalModal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[var(--color-ivory-66)]">
                      Saldo do mês após
                    </span>
                    <span className={vaiEstourar ? "text-red-400" : "text-ivory"}>
                      {formatBRL(saldoDepois)} / {formatBRL(LIMITE_MES)}
                    </span>
                  </div>
                </div>

                {modal === "doc" ? (
                  <p className="mt-4 rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-4 py-3 font-mono text-[12px] leading-relaxed text-[var(--color-gold)]">
                    ⚠ Consulta CARA — documentos oficiais com fé pública.
                    Recomenda-se confirmar com sócio antes.
                  </p>
                ) : null}

                {vaiEstourar ? (
                  <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 font-mono text-[12px] text-red-300">
                    ⚠ Esta consulta vai ultrapassar o limite mensal. Só aprove
                    se já conversou com sócio.
                  </p>
                ) : null}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-ivory-66)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={executar}
                    disabled={apisDoModal.length === 0}
                    className={`rounded-lg px-6 py-2 text-xs font-semibold text-onyx transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      modal === "doc"
                        ? "bg-[var(--color-gold)] hover:bg-[var(--color-tip-glow)]"
                        : "bg-[var(--color-signal)] hover:bg-[var(--color-tip-glow)]"
                    }`}
                  >
                    {modal === "doc"
                      ? "Aprovar e Executar →"
                      : "Pagar e Executar →"}
                  </button>
                </div>
              </>
            ) : execState === "executing" ? (
              <div className="py-10 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-gold)] border-t-transparent" />
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.32em] text-[var(--color-gold)]">
                  Consultando {apisDoModal.length}{" "}
                  {apisDoModal.length === 1 ? "fonte" : "fontes"}...
                </p>
                <p className="mt-2 font-mono text-[12px] text-[var(--color-ivory-66)]">
                  Cruzando Assertiva, BigDataCorp, DataJud e demais
                </p>
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-4xl text-[var(--color-signal)]">✓</p>
                <p className="mt-5 font-mono text-xs uppercase tracking-[0.32em] text-[var(--color-signal)]">
                  Consulta concluída
                </p>
                <p className="mt-2 font-mono text-[12px] text-[var(--color-ivory-66)]">
                  {formatBRL(totalModal)} debitado · redirecionando...
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
