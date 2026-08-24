"use client";

// Campo CPF/CNPJ da Identificação — versão EDITÁVEL (só equipe; o dossiê
// do cliente usa o CampoFicha comum). Visual copiado do CampoFicha:
// linha de ficha com rótulo mono dourado + valor grande + border-b.
//
// Sem documento cadastrado, além da edição manual aparece a busca paga
// "Buscar CPF por Nome" (Assertiva nome-endereco). Regra
// [[sonar-consultas-pagas-sob-demanda]]: botão com preço explícito +
// modal de confirmação antes de gastar.
//
// Modal via createPortal(document.body): o dossiê tem ancestrais com
// backdrop-filter, que prendem position:fixed ([[portal-para-modal-em-
// pai-com-backdrop-filter]]).

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Search, X, XCircle } from "lucide-react";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";

import type { CandidatoNome } from "@/lib/assertiva";
import {
  aplicarDocumentoCandidato,
  atualizarDocumentoDevedor,
  buscarCpfPorNomeAction,
} from "../documento-actions";

const VIOLETA = "#C084FC";

type Props = {
  devedorId: number;
  tipo: "PF" | "PJ";
  documento: string | null;
  /** true quando ASSERTIVA_CLIENT_ID/SECRET estão no ambiente. */
  credenciaisOk: boolean;
  /** Preço da busca por nome (R$, env ASSERTIVA_CUSTO_NOME_BRL). */
  custoNomeBrl: number;
};

function formatPreco(v: number): string {
  if (v <= 0) return "preço a configurar";
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

// Máscara de exibição pros documentos dos candidatos (chegam só dígitos).
function formatDocumento(digitos: string): string {
  if (digitos.length === 11) {
    return digitos.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  if (digitos.length === 14) {
    return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }
  return digitos;
}

export function CampoDocumentoEditavel({
  devedorId,
  tipo,
  documento,
  credenciaisOk,
  custoNomeBrl,
}: Props) {
  const temDocumento = Boolean(documento && documento.trim() !== "");

  // Edição inline
  const [editando, setEditando] = useState(false);
  const [valorInput, setValorInput] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  // Busca por nome (modal)
  const [modalBusca, setModalBusca] = useState(false);
  const [aplicandoDoc, setAplicandoDoc] = useState<string | null>(null);
  const [erroAplicar, setErroAplicar] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [estadoBusca, buscaAction, buscaPendente] = useActionState(
    buscarCpfPorNomeAction,
    null,
  );

  const ocupado = salvando || buscaPendente || aplicandoDoc !== null;

  async function salvarManual() {
    setErroSalvar(null);
    setSalvando(true);
    const resultado = await atualizarDocumentoDevedor(devedorId, valorInput);
    if ("erro" in resultado) {
      setErroSalvar(resultado.erro);
      setSalvando(false);
      return;
    }
    window.location.reload();
  }

  async function usarCandidato(candidato: CandidatoNome) {
    setErroAplicar(null);
    setAplicandoDoc(candidato.documento);
    const resultado = await aplicarDocumentoCandidato(devedorId, candidato.documento);
    if ("erro" in resultado) {
      setErroAplicar(resultado.erro);
      setAplicandoDoc(null);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="border-b border-[rgba(201,162,74,0.16)] pb-4 last:border-b-0 last:pb-0 [&:not(:first-child)]:pt-4">
      <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
        {tipo === "PF" ? "CPF" : "CNPJ"}
      </p>

      {editando ? (
        <div className="mt-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={valorInput}
              onChange={(e) => setValorInput(e.target.value)}
              disabled={salvando}
              autoFocus
              inputMode="numeric"
              placeholder="11 dígitos (CPF) ou 14 (CNPJ)"
              aria-label={tipo === "PF" ? "Editar CPF" : "Editar CNPJ"}
              className="w-full max-w-[260px] rounded-xl border border-[var(--color-gold)]/40 bg-[var(--color-surface-2)] px-3.5 py-2.5 text-lg text-ivory outline-none transition placeholder:text-[var(--color-ivory-40)] focus:border-[var(--color-gold)]"
            />
            <button
              type="button"
              onClick={salvarManual}
              disabled={salvando}
              className="rounded-xl border border-[var(--color-gold)]/45 bg-[var(--color-gold)]/10 px-4 py-2.5 text-sm font-medium text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditando(false);
                setErroSalvar(null);
              }}
              disabled={salvando}
              className="rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-sm text-[var(--color-ivory-66)] transition hover:text-[var(--color-ivory)] disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
          {erroSalvar ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-[#DC2626]">
              <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {erroSalvar}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
          {temDocumento ? (
            <span className="text-xl leading-snug text-ivory">{documento}</span>
          ) : (
            <span className="text-xl leading-snug text-[var(--color-gold)]/90">
              Sem documento cadastrado
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setValorInput(documento ?? "");
              setErroSalvar(null);
              setEditando(true);
            }}
            aria-label={tipo === "PF" ? "Editar CPF" : "Editar CNPJ"}
            title="Editar documento"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-ivory-66)] transition hover:border-[var(--color-gold)]/45 hover:text-[var(--color-gold)]"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Sem documento: busca paga por NOME (estilo dos botões de consulta,
          violeta = Assertiva Localize). */}
      {!temDocumento && !editando ? (
        <div className="mt-3">
          <BordaLiquidaMetal cor="violeta" radius={12} className="inline-flex">
            <button
              type="button"
              disabled={!credenciaisOk || ocupado}
              onClick={() => setModalBusca(true)}
              className="flex items-center gap-3 rounded-[9px] px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: "rgba(192, 132, 252, 0.10)" }}
            >
              <Search className="h-4 w-4" style={{ color: VIOLETA }} aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold" style={{ color: VIOLETA }}>
                  Buscar CPF por Nome
                </span>
                <span className="block font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
                  Assertiva · {formatPreco(custoNomeBrl)}
                </span>
              </span>
            </button>
          </BordaLiquidaMetal>
          {!credenciaisOk ? (
            <p className="mt-2 text-xs text-[var(--color-gold)]">
              Credenciais da Assertiva não configuradas no ambiente — a busca
              por nome fica indisponível.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Modal de confirmação + candidatos — portal pro body */}
      {mounted && modalBusca
        ? createPortal(
            <div
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Buscar CPF por nome"
            >
              <div
                className="absolute inset-0 bg-[var(--color-onyx)]/70 backdrop-blur-sm"
                onClick={() => (!ocupado ? setModalBusca(false) : null)}
                aria-hidden="true"
              />
              <div className="relative w-full max-w-[480px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-solid)] p-7 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-xl text-ivory">
                    Buscar CPF por Nome
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalBusca(false)}
                    disabled={ocupado}
                    aria-label="Fechar"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-ivory-66)] transition hover:text-[var(--color-ivory)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {estadoBusca?.ok ? (
                  /* -------- Resultado: candidatos encontrados -------- */
                  <div className="mt-3">
                    <p className="text-sm leading-relaxed text-[var(--color-ivory-88)]">
                      {estadoBusca.mensagem}{" "}
                      {estadoBusca.candidatos.length > 0
                        ? "Confira os dados e escolha o registro certo do devedor."
                        : ""}
                    </p>
                    {estadoBusca.candidatos.length > 0 ? (
                      <div className="mt-4 max-h-[320px] space-y-2 overflow-y-auto pr-1">
                        {estadoBusca.candidatos.map((c) => (
                          <div
                            key={c.documento}
                            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ivory">
                                {c.nome}
                              </p>
                              <p
                                className="mt-0.5 font-mono text-[12px] tracking-[0.08em]"
                                style={{ color: VIOLETA }}
                              >
                                {c.tipo === "cpf" ? "CPF" : "CNPJ"}{" "}
                                {formatDocumento(c.documento)}
                              </p>
                              {[
                                [c.cidade, c.uf].filter(Boolean).join("/"),
                                c.nascimento ? `Nasc. ${c.nascimento}` : "",
                              ].filter(Boolean).length > 0 ? (
                                <p className="mt-0.5 text-xs text-[var(--color-ivory-66)]">
                                  {[
                                    [c.cidade, c.uf].filter(Boolean).join("/"),
                                    c.nascimento ? `Nasc. ${c.nascimento}` : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => usarCandidato(c)}
                              disabled={ocupado}
                              className="shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-50"
                              style={{
                                color: VIOLETA,
                                borderColor: "rgba(192, 132, 252, 0.50)",
                                backgroundColor: "rgba(192, 132, 252, 0.12)",
                              }}
                            >
                              {aplicandoDoc === c.documento
                                ? "Aplicando…"
                                : c.tipo === "cpf"
                                  ? "Usar este CPF"
                                  : "Usar este CNPJ"}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {erroAplicar ? (
                      <p className="mt-3 flex items-center gap-1.5 text-sm text-[#DC2626]">
                        <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {erroAplicar}
                      </p>
                    ) : null}
                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setModalBusca(false)}
                        disabled={ocupado}
                        className="rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-sm text-[var(--color-ivory-66)] transition hover:text-[var(--color-ivory)]"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* -------- Confirmação (preço explícito) -------- */
                  <div className="mt-3">
                    <p className="text-sm leading-relaxed text-[var(--color-ivory-88)]">
                      Assertiva Localize — busca pessoas e empresas vinculadas
                      ao nome do devedor e devolve o documento (CPF/CNPJ) de
                      cada registro, com cidade e nascimento pra conferência.
                    </p>

                    <div className="mt-5 rounded-xl border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-4 py-3">
                      <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                        Custo desta consulta
                      </p>
                      <p className="mt-1 font-serif text-2xl text-[var(--color-gold)]">
                        {formatPreco(custoNomeBrl)}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-[var(--color-ivory-66)]">
                        Busca por nome não tem cache — cada disparo é cobrado.
                      </p>
                    </div>

                    {estadoBusca && !estadoBusca.ok ? (
                      <p className="mt-4 flex items-start gap-1.5 text-sm text-[#DC2626]">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {estadoBusca.mensagem}
                      </p>
                    ) : null}

                    <form
                      action={buscaAction}
                      className="mt-6 flex items-center justify-end gap-3"
                    >
                      <input type="hidden" name="devedorId" value={devedorId} />
                      <button
                        type="button"
                        onClick={() => setModalBusca(false)}
                        disabled={ocupado}
                        className="rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-sm text-[var(--color-ivory-66)] transition hover:text-[var(--color-ivory)]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={ocupado}
                        className="btn-neon-signal disabled:opacity-50"
                      >
                        {buscaPendente ? "Buscando…" : "Confirmar e Buscar"}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
