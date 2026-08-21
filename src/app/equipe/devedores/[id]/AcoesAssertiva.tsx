"use client";

// Botões de pesquisa paga Assertiva no dossiê — SÓ EQUIPE (o dossiê do
// cliente não renderiza este componente).
// Fluxo [[sonar-consultas-pagas-sob-demanda]]: botão mostra o preço,
// clique abre modal de confirmação com o custo explícito, "Confirmar e
// Consultar" dispara a Server Action e o resultado aparece inline.
//
// Modal via createPortal(document.body): o dossiê tem ancestrais com
// backdrop-filter, que prendem position:fixed ([[portal-para-modal-em-
// pai-com-backdrop-filter]]).

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import {
  Car,
  CheckCircle2,
  Landmark,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";

import {
  atualizarTribunaisAction,
  buscarVeiculosAction,
  enriquecerDevedorAction,
  type EstadoAssertiva,
} from "./assertiva-actions";

type Props = {
  devedorId: number;
  /** Preços vindos do server (env) — R$. 0 = preço não configurado. */
  custoLocalizeBrl: number;
  custoVeiculosBrl: number;
  /** true quando ASSERTIVA_CLIENT_ID/SECRET estão no ambiente. */
  credenciaisOk: boolean;
  /** true quando GITHUB_TOKEN está no ambiente (raspagem sob demanda). */
  crawlOk: boolean;
};

function formatPreco(v: number): string {
  if (v <= 0) return "preço a configurar";
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function Resultado({ estado }: { estado: EstadoAssertiva }) {
  if (!estado) return null;
  const Icone = estado.ok ? CheckCircle2 : XCircle;
  const cor = estado.ok ? "var(--color-signal)" : "#DC2626";
  return (
    <div
      className="mt-4 flex items-start gap-2 rounded-xl border px-4 py-3"
      style={{
        borderColor: `color-mix(in srgb, ${cor} 45%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${cor} 10%, transparent)`,
      }}
    >
      <Icone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: cor }} />
      <p className="text-sm" style={{ color: cor }}>
        {estado.mensagem}
      </p>
    </div>
  );
}

type ConsultaMeta = {
  kind: "localize" | "veiculos";
  titulo: string;
  descricao: string;
  custo: number;
};

export function AcoesAssertiva({
  devedorId,
  custoLocalizeBrl,
  custoVeiculosBrl,
  credenciaisOk,
  crawlOk,
}: Props) {
  const [confirmando, setConfirmando] = useState<ConsultaMeta | null>(null);
  const [modalTribunais, setModalTribunais] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [estadoLocalize, localizeAction, localizePendente] = useActionState(
    enriquecerDevedorAction,
    null,
  );
  const [estadoVeiculos, veiculosAction, veiculosPendente] = useActionState(
    buscarVeiculosAction,
    null,
  );
  const [estadoTribunais, tribunaisAction, tribunaisPendente] = useActionState(
    atualizarTribunaisAction,
    null,
  );

  // Fecha os modais quando a action termina (o estado muda).
  useEffect(() => {
    if (estadoLocalize || estadoVeiculos) setConfirmando(null);
    if (estadoTribunais) setModalTribunais(false);
  }, [estadoLocalize, estadoVeiculos, estadoTribunais]);

  const pendente = localizePendente || veiculosPendente || tribunaisPendente;

  const consultas: ConsultaMeta[] = [
    {
      kind: "localize",
      titulo: "Enriquecer Dados",
      descricao:
        "Assertiva Localiza — endereços, telefones, e-mails, RG, nascimento e participações societárias.",
      custo: custoLocalizeBrl,
    },
    {
      kind: "veiculos",
      titulo: "Buscar Veículos",
      descricao:
        "Assertiva Veículos — frota registrada no CPF/CNPJ (placa, marca, modelo, ano, restrições).",
      custo: custoVeiculosBrl,
    },
  ];

  return (
    <div>
      {!credenciaisOk ? (
        <p className="mb-4 rounded-xl border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-4 py-3 text-sm text-[var(--color-gold)]">
          Credenciais da Assertiva ainda não configuradas no ambiente
          (ASSERTIVA_CLIENT_ID / ASSERTIVA_CLIENT_SECRET). Os botões ficam
          desativados até lá.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {consultas.map((c) => (
          <button
            key={c.kind}
            type="button"
            disabled={!credenciaisOk || pendente}
            onClick={() => setConfirmando(c)}
            className="group flex flex-1 items-center justify-between gap-3 rounded-xl border border-[var(--color-signal-soft-2)] bg-[var(--color-signal-soft)] px-5 py-4 text-left transition hover:bg-[var(--color-signal)]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center gap-3">
              {c.kind === "localize" ? (
                <Sparkles className="h-5 w-5 text-[var(--color-signal)]" aria-hidden="true" />
              ) : (
                <Car className="h-5 w-5 text-[var(--color-signal)]" aria-hidden="true" />
              )}
              <span>
                <span className="block text-sm font-semibold text-[var(--color-signal)]">
                  {c.titulo}
                </span>
                <span className="block font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
                  Assertiva · {formatPreco(c.custo)}
                </span>
              </span>
            </span>
          </button>
        ))}

        {/* Raspagem dos tribunais — GRATUITA (Playwright no GH Actions,
            zero tokens de IA). Dourado pra diferenciar das pagas; a borda
            metal líquido (shader) é o destaque pedido pelo Caio em 21/08. */}
        <BordaLiquidaMetal cor="gold" radius={14} className="flex flex-1">
          <button
            type="button"
            disabled={pendente}
            onClick={() => setModalTribunais(true)}
            title={
              crawlOk
                ? undefined
                : "GITHUB_TOKEN não configurado — o disparo remoto fica indisponível"
            }
            className="group flex h-full w-full items-center justify-between gap-3 rounded-[11px] bg-[var(--color-gold)]/10 px-5 py-4 text-left transition hover:bg-[var(--color-gold)]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center gap-3">
              <Landmark className="h-5 w-5 text-[var(--color-gold)]" aria-hidden="true" />
              <span>
                <span className="block text-sm font-semibold text-[var(--color-gold)]">
                  Atualizar dos Tribunais
                </span>
                <span className="block font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
                  Raspagem · Grátis
                </span>
              </span>
            </span>
          </button>
        </BordaLiquidaMetal>
      </div>

      <Resultado estado={estadoLocalize} />
      <Resultado estado={estadoVeiculos} />
      <Resultado estado={estadoTribunais} />

      {/* Modal dos tribunais — filtro por fonte + disparo gratuito */}
      {mounted && modalTribunais
        ? createPortal(
            <div
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Atualizar dos tribunais"
            >
              <div
                className="absolute inset-0 bg-[var(--color-onyx)]/70 backdrop-blur-sm"
                onClick={() => (!pendente ? setModalTribunais(false) : null)}
                aria-hidden="true"
              />
              <div className="relative w-full max-w-[460px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-solid)] p-7 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-xl text-ivory">
                    Atualizar dos Tribunais
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalTribunais(false)}
                    disabled={pendente}
                    aria-label="Fechar"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-ivory-66)] transition hover:text-[var(--color-ivory)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                  Aciona os robôs de captura de andamentos nos sistemas dos
                  tribunais. Os movimentos novos chegam em 15 a 30 minutos na
                  seção Andamentos Processuais.
                </p>

                <form action={tribunaisAction} className="mt-5">
                  <input type="hidden" name="devedorId" value={devedorId} />
                  <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                    Tribunais a Consultar
                  </p>
                  <div className="mt-3 space-y-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 transition hover:border-[var(--color-gold)]/45">
                      <input
                        type="checkbox"
                        name="tribunal"
                        value="esaj"
                        defaultChecked
                        className="mt-1 h-4 w-4 accent-[var(--color-gold)]"
                      />
                      <span>
                        <span className="block text-sm font-medium text-ivory">
                          e-SAJ TJSP
                        </span>
                        <span className="block text-xs text-[var(--color-ivory-66)]">
                          Processos físicos antigos e digitais legados
                        </span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 transition hover:border-[var(--color-gold)]/45">
                      <input
                        type="checkbox"
                        name="tribunal"
                        value="eproc"
                        defaultChecked
                        className="mt-1 h-4 w-4 accent-[var(--color-gold)]"
                      />
                      <span>
                        <span className="block text-sm font-medium text-ivory">
                          eproc TJSP
                        </span>
                        <span className="block text-xs text-[var(--color-ivory-66)]">
                          Processos novos do TJSP (sistema atual)
                        </span>
                      </span>
                    </label>
                    <p className="pt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ivory-40)]">
                      Outros tribunais (DataJud CNJ) chegam no próximo sprint
                    </p>
                  </div>

                  <div className="mt-5 rounded-xl border border-[var(--color-signal-soft-2)] bg-[var(--color-signal-soft)] px-4 py-3">
                    <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
                      Custo: Grátis
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-ivory-88)]">
                      Robôs próprios do escritório — sem consumo de créditos de
                      API nem tokens de IA.
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setModalTribunais(false)}
                      disabled={pendente}
                      className="rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-sm text-[var(--color-ivory-66)] transition hover:text-[var(--color-ivory)]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={pendente || !crawlOk}
                      className="btn-neon-gold disabled:opacity-50"
                    >
                      {tribunaisPendente ? "Acionando…" : "Acionar Robôs"}
                    </button>
                  </div>
                  {!crawlOk ? (
                    <p className="mt-3 text-xs text-[var(--color-gold)]">
                      GITHUB_TOKEN não configurado no ambiente — peça ao admin
                      pra habilitar o disparo remoto.
                    </p>
                  ) : null}
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* Modal de confirmação — portal pro body */}
      {mounted && confirmando
        ? createPortal(
            <div
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label={`Confirmar ${confirmando.titulo}`}
            >
              <div
                className="absolute inset-0 bg-[var(--color-onyx)]/70 backdrop-blur-sm"
                onClick={() => (!pendente ? setConfirmando(null) : null)}
                aria-hidden="true"
              />
              <div className="relative w-full max-w-[440px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-solid)] p-7 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-xl text-ivory">
                    {confirmando.titulo}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setConfirmando(null)}
                    disabled={pendente}
                    aria-label="Fechar"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-line)] text-[var(--color-ivory-66)] transition hover:text-[var(--color-ivory)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                  {confirmando.descricao}
                </p>

                <div className="mt-5 rounded-xl border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-4 py-3">
                  <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                    Custo desta consulta
                  </p>
                  <p className="mt-1 font-serif text-2xl text-[var(--color-gold)]">
                    {formatPreco(confirmando.custo)}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-[var(--color-ivory-66)]">
                    Documento já consultado antes sai do cache, sem custo.
                  </p>
                </div>

                <form
                  action={
                    confirmando.kind === "localize" ? localizeAction : veiculosAction
                  }
                  className="mt-6 flex items-center justify-end gap-3"
                >
                  <input type="hidden" name="devedorId" value={devedorId} />
                  <button
                    type="button"
                    onClick={() => setConfirmando(null)}
                    disabled={pendente}
                    className="rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-sm text-[var(--color-ivory-66)] transition hover:text-[var(--color-ivory)]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pendente}
                    className="btn-neon-signal disabled:opacity-50"
                  >
                    {pendente ? "Consultando…" : "Confirmar e Consultar"}
                  </button>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
