"use client";

// O que a análise devolve, na arte das fichas do Sonar.
//
// A ordem da tela segue a pergunta que o advogado faz ao abrir um processo
// que não é dele: quanto se deve, quanto já se recuperou, em que pé está,
// o que já se tentou, e o que fazer agora.
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleDashed,
  Clock,
  Save,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import { formatBRL, formatData } from "@/lib/format";
import type {
  EstadoCaminho,
  EtapaExecucao,
  FichaAutos,
  MedidaConsolidada,
} from "@/lib/autos/tipos";

import { promoverParaBiblioteca } from "../actions";

const VIDRO_BRILHO =
  "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03)), linear-gradient(115deg, rgba(255,255,255,0.13), rgba(255,255,255,0))";
const BORDA_CADERNO = "rgba(201, 162, 74, 0.28)";

const ESTADO_META: Record<
  EstadoCaminho,
  { label: string; cor: string; icone: typeof Check }
> = {
  positiva: { label: "Resultado positivo", cor: "#3CFF8A", icone: Check },
  parcial: { label: "Parcial", cor: "#F4C542", icone: TrendingUp },
  negativa: { label: "Negativa", cor: "#FF5B5B", icone: X },
  pendente: { label: "Aguardando resposta", cor: "#9ED8FF", icone: Clock },
  indeferida: { label: "Indeferida", cor: "#FB7185", icone: X },
  abandonada: { label: "Pedida e nunca decidida", cor: "#8E866F", icone: CircleDashed },
};

const ETAPA_LABEL: Record<EtapaExecucao, string> = {
  citacao_pendente: "Citação pendente",
  citado_sem_pagamento: "Citado, sem pagamento",
  constricao_em_curso: "Constrição patrimonial em curso",
  expropriacao: "Expropriação",
  suspenso_921: "Suspenso (art. 921)",
  arquivado: "Arquivado",
  extinto: "Extinto",
};

function TituloSetor({ texto }: { texto: string }) {
  return (
    <h2
      className="text-center font-serif text-[clamp(24px,2.5vw,38px)] uppercase leading-[1.1] tracking-[0.08em] text-[var(--color-gold)]"
      style={{
        WebkitTextStroke: "1px rgba(255,255,255,0.55)",
        textShadow: "0 0 18px rgba(201,162,74,0.4)",
      }}
    >
      {texto}
    </h2>
  );
}

function CardNumero({
  rotulo,
  valor,
  nota,
  cor = "var(--color-gold)",
}: {
  rotulo: string;
  valor: string;
  nota?: string;
  cor?: string;
}) {
  return (
    <SpotlightCard
      local
      degrade={VIDRO_BRILHO}
      borda="rgba(232, 228, 214, 0.25)"
      className="overflow-hidden p-7 text-center"
    >
      <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.28em] text-ivory">
        {rotulo}
      </p>
      <p
        className="mt-4 font-serif text-[clamp(30px,2.6vw,44px)] leading-none"
        style={{ color: cor }}
      >
        {valor}
      </p>
      {nota && (
        <p className="mt-3 text-[13px] leading-snug text-[var(--color-ivory-66)]">
          {nota}
        </p>
      )}
    </SpotlightCard>
  );
}

/** Uma parada da trilha. A barra à esquerda carrega a cor do estado. */
function ParadaCaminho({ medida }: { medida: MedidaConsolidada }) {
  const meta = ESTADO_META[medida.estado];
  const Icone = meta.icone;
  const atipica = medida.classe === "atipica";

  return (
    <li className="relative pl-10">
      {/* trilho + marcador */}
      <span
        aria-hidden="true"
        className="absolute left-[11px] top-7 h-[calc(100%-12px)] w-px bg-[var(--color-ivory-12)]"
      />
      <span
        className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border"
        style={{
          borderColor: `color-mix(in srgb, ${meta.cor} 55%, transparent)`,
          background: `color-mix(in srgb, ${meta.cor} 12%, transparent)`,
          color: meta.cor,
        }}
      >
        <Icone className="h-3.5 w-3.5" aria-hidden="true" />
      </span>

      <div className="pb-7">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-[15px] font-medium text-ivory">
            {medida.titulo}
          </span>
          <span
            className="inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{
              borderColor: atipica
                ? "rgba(192,132,252,0.45)"
                : "rgba(60,255,138,0.45)",
              color: atipica ? "#C084FC" : "var(--color-signal)",
              background: atipica
                ? "rgba(192,132,252,0.12)"
                : "rgba(60,255,138,0.10)",
            }}
          >
            {atipica ? "Atípica" : "Típica"}
          </span>
          <span
            className="font-mono text-[12px] uppercase tracking-[0.18em]"
            style={{ color: meta.cor }}
          >
            {meta.label}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-ivory-40)]">
          {medida.requeridaEm && <span>Requerida {formatData(medida.requeridaEm)}</span>}
          {medida.deferidaEm && <span>Deferida {formatData(medida.deferidaEm)}</span>}
          {medida.cumpridaEm && <span>Cumprida {formatData(medida.cumpridaEm)}</span>}
          {medida.paginas.length > 0 && (
            <span className="text-[var(--color-gold)]/80">
              fls. {medida.paginas.slice(0, 6).join(", ")}
              {medida.paginas.length > 6 ? "…" : ""}
            </span>
          )}
        </div>

        {(medida.valorBloqueadoBrl || medida.valorLiberadoBrl) && (
          <p className="mt-2 text-sm text-[var(--color-ivory-88)]">
            {medida.valorBloqueadoBrl ? (
              <>Bloqueado {formatBRL(medida.valorBloqueadoBrl)}</>
            ) : null}
            {medida.valorBloqueadoBrl && medida.valorLiberadoBrl ? " · " : null}
            {medida.valorLiberadoBrl ? (
              <span className="text-[var(--color-signal)]">
                Levantado {formatBRL(medida.valorLiberadoBrl)}
              </span>
            ) : null}
          </p>
        )}

        {medida.bemAtingido && (
          <p className="mt-1 text-sm text-[var(--color-ivory-66)]">
            {medida.bemAtingido}
          </p>
        )}
        {medida.observacao && (
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-ivory-66)]">
            {medida.observacao}
          </p>
        )}
      </div>
    </li>
  );
}

export function FichaResultado({
  ficha,
  analiseId,
  credores,
}: {
  ficha: FichaAutos;
  analiseId: number;
  credores: { id: number; nome: string }[];
}) {
  const [credorId, setCredorId] = useState<number | "">("");
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  const executado = ficha.partes.find((p) => p.polo === "executado");
  const exequente = ficha.partes.find((p) => p.polo === "exequente");
  const { debito, satisfacao, chanceExito, proximaMovimentacao } = ficha;

  const corChance =
    chanceExito.faixa === "alta"
      ? "var(--color-signal)"
      : chanceExito.faixa === "media"
        ? "#F4C542"
        : "#FF5B5B";

  async function confirmar() {
    if (credorId === "") {
      setAviso({ ok: false, texto: "Escolha de qual cliente é este processo." });
      return;
    }
    setSalvando(true);
    const r = await promoverParaBiblioteca(analiseId, Number(credorId));
    setAviso({ ok: r.ok, texto: r.mensagem });
    setSalvando(false);
  }

  return (
    <div className="flex flex-col gap-14">
      {/* ============ CABEÇALHO: QUEM É O DEVEDOR ============ */}
      <header className="text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.32em] text-[var(--color-signal)]">
          Lido dos autos
        </p>
        <h1
          className="nome-devedor mt-4 break-words font-serif text-[clamp(28px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.06em] text-[var(--color-devedor)]"
          style={{ WebkitTextStroke: "1px rgba(255,255,255,0.6)" }}
        >
          {executado?.nome ?? "Executado não identificado"}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {executado?.documento && (
            <span className="inline-flex items-center rounded-full border border-[var(--color-line-strong)] px-3 py-1 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              {executado.documento}
            </span>
          )}
          {ficha.identificacao.numeroCnj && (
            <span className="inline-flex items-center rounded-full border border-[rgba(201,162,74,0.45)] bg-[rgba(201,162,74,0.10)] px-3 py-1 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-gold)]">
              {ficha.identificacao.numeroCnj}
            </span>
          )}
          <span className="inline-flex items-center rounded-full border border-[rgba(60,255,138,0.45)] bg-[rgba(60,255,138,0.10)] px-3 py-1 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
            {ETAPA_LABEL[ficha.etapa]}
          </span>
        </div>
        {exequente && (
          <p className="mt-4 text-sm text-[var(--color-ivory-66)]">
            Exequente:{" "}
            <span className="text-[var(--color-cliente)]">{exequente.nome}</span>
          </p>
        )}
      </header>

      {/* ============ OS QUATRO NÚMEROS ============ */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardNumero
          rotulo="Débito Atualizado"
          valor={formatBRL(debito.saldoBrl ?? debito.valorAtualizadoBrl)}
          nota={
            debito.fechaConta
              ? debito.dataBase
                ? `Base ${formatData(debito.dataBase)}`
                : undefined
              : "Os autos não fecham a conta"
          }
          cor="var(--color-devedor)"
        />
        <CardNumero
          rotulo="Já Satisfeito"
          valor={formatBRL(satisfacao.valorSatisfeitoBrl)}
          nota={
            satisfacao.percentualSobreSaldo !== null
              ? `${satisfacao.percentualSobreSaldo.toFixed(1)}% do saldo`
              : "Valor efetivamente levantado"
          }
          cor="var(--color-signal)"
        />
        <CardNumero
          rotulo="Constrito, Não Convertido"
          valor={formatBRL(satisfacao.valorPenhoradoNaoConvertidoBrl)}
          nota="Penhorado e ainda sem praça"
          cor="#F4C542"
        />
        <CardNumero
          rotulo="Chance de Êxito"
          valor={`${chanceExito.score}`}
          nota={`Faixa ${chanceExito.faixa}`}
          cor={corChance}
        />
      </section>

      {/* ============ POR QUE ESSA CHANCE ============ */}
      <section className="flex flex-col gap-6">
        <TituloSetor texto="De Onde Vem a Chance de Êxito" />
        <SpotlightCard local claro borda={BORDA_CADERNO} className="p-6 sm:p-8">
          <p className="text-sm leading-relaxed text-[var(--color-ivory-66)]">
            O número não é um palpite: é a soma dos fatores abaixo. Discorde de
            um fator específico se for o caso — cada linha diz o peso e o porquê.
          </p>
          <ul className="mt-6 flex flex-col divide-y divide-[rgba(201,162,74,0.16)]">
            {chanceExito.fatores.map((f, i) => (
              <li key={i} className="flex items-start gap-4 py-4">
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    borderColor: f.favoravel
                      ? "rgba(60,255,138,0.45)"
                      : "rgba(255,91,91,0.45)",
                    background: f.favoravel
                      ? "rgba(60,255,138,0.10)"
                      : "rgba(255,91,91,0.10)",
                    color: f.favoravel ? "var(--color-signal)" : "#FF5B5B",
                  }}
                >
                  {f.favoravel ? (
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-ivory">{f.fator}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-ivory-66)]">
                    {f.explicacao}
                  </p>
                </div>
                <span
                  className="shrink-0 font-mono text-[13px] tabular-nums"
                  style={{ color: f.favoravel ? "var(--color-signal)" : "#FF5B5B" }}
                >
                  {f.favoravel ? "+" : "−"}
                  {Math.abs(f.peso)}
                </span>
              </li>
            ))}
          </ul>
        </SpotlightCard>
      </section>

      {/* ============ O CAMINHO ============ */}
      <section className="flex flex-col gap-6">
        <TituloSetor texto="O Caminho Já Percorrido" />
        <p className="text-center text-sm text-[var(--color-ivory-66)]">
          {ficha.medidasRealizadas.length} medidas encontradas nos autos, na
          ordem em que aconteceram.
        </p>
        <SpotlightCard local claro borda={BORDA_CADERNO} className="p-6 sm:p-8">
          {ficha.medidasRealizadas.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-ivory-66)]">
              Nenhuma medida de constrição foi localizada nestes autos.
            </p>
          ) : (
            <ol className="flex flex-col">
              {ficha.medidasRealizadas
                .slice()
                .sort((a, b) => a.ordem - b.ordem)
                .map((m) => (
                  <ParadaCaminho key={`${m.ordem}-${m.especie}`} medida={m} />
                ))}
            </ol>
          )}
        </SpotlightCard>
      </section>

      {/* ============ O QUE FALTA ============ */}
      <section className="flex flex-col gap-6">
        <TituloSetor texto="O Que Ainda Falta Fazer" />
        <div className="grid gap-4 md:grid-cols-2">
          {ficha.medidasFaltantes
            .slice()
            .sort((a, b) => a.prioridade - b.prioridade)
            .map((m, i) => {
              const atipica = m.classe === "atipica";
              return (
                <SpotlightCard
                  key={`${m.especie}-${i}`}
                  local
                  claro
                  borda={
                    atipica ? "rgba(192,132,252,0.35)" : "rgba(60,255,138,0.28)"
                  }
                  className="flex h-full flex-col p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
                      Prioridade {m.prioridade}
                    </span>
                    <span
                      className="inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em]"
                      style={{
                        borderColor: atipica
                          ? "rgba(192,132,252,0.45)"
                          : "rgba(60,255,138,0.45)",
                        color: atipica ? "#C084FC" : "var(--color-signal)",
                        background: atipica
                          ? "rgba(192,132,252,0.12)"
                          : "rgba(60,255,138,0.10)",
                      }}
                    >
                      {atipica ? "Atípica" : "Típica"}
                    </span>
                  </div>

                  <h3 className="mt-3 font-serif text-xl text-ivory">
                    {m.titulo}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                    {m.porQueCabe}
                  </p>

                  <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-gold)]/80">
                    {m.fundamentoLegal}
                  </p>
                  <p
                    className="mt-2 font-mono text-[12px] uppercase tracking-[0.18em]"
                    style={{
                      color: m.prontaParaPedir
                        ? "var(--color-signal)"
                        : "#F4C542",
                    }}
                  >
                    {m.prontaParaPedir
                      ? "Pronta para pedir"
                      : `Depende de: ${m.dependeDe ?? "diligência prévia"}`}
                  </p>
                </SpotlightCard>
              );
            })}
        </div>
      </section>

      {/* ============ PRÓXIMA MOVIMENTAÇÃO ============ */}
      <section className="flex flex-col gap-6">
        <TituloSetor texto="A Próxima Movimentação" />
        <SpotlightCard
          local
          claro
          degrade="linear-gradient(0deg, rgba(58,42,10,0.6), rgba(58,42,10,0.6))"
          className="p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-serif text-2xl text-ivory">
              {proximaMovimentacao.titulo}
            </h3>
            <span
              className="inline-flex rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em]"
              style={{
                borderColor:
                  proximaMovimentacao.urgencia === "alta"
                    ? "rgba(255,91,91,0.5)"
                    : "rgba(201,162,74,0.45)",
                color:
                  proximaMovimentacao.urgencia === "alta"
                    ? "#FF5B5B"
                    : "var(--color-gold)",
              }}
            >
              Urgência {proximaMovimentacao.urgencia}
            </span>
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-ivory-88)]">
            {proximaMovimentacao.explicacao}
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                Fundamentos
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {proximaMovimentacao.fundamentos.map((f, i) => (
                  <li key={i} className="text-sm text-[var(--color-ivory-88)]">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                Pedidos
              </p>
              <ol className="mt-3 flex flex-col gap-2">
                {proximaMovimentacao.pedidos.map((p, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm text-[var(--color-ivory-88)]"
                  >
                    <span className="text-[var(--color-signal)]">{i + 1}.</span>
                    {p}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </SpotlightCard>
      </section>

      {/* ============ ALERTAS ============ */}
      {ficha.alertas.length > 0 && (
        <section className="flex flex-col gap-4">
          {ficha.alertas.map((a, i) => {
            const cor =
              a.gravidade === "critico"
                ? "#FF5B5B"
                : a.gravidade === "atencao"
                  ? "#F4C542"
                  : "var(--color-ivory-66)";
            return (
              <SpotlightCard
                key={i}
                local
                borda={`color-mix(in srgb, ${cor} 40%, transparent)`}
                className="flex items-start gap-4 p-5"
              >
                <AlertTriangle
                  className="mt-0.5 h-5 w-5 shrink-0"
                  style={{ color: cor }}
                  aria-hidden="true"
                />
                <div>
                  <p
                    className="font-mono text-[12px] uppercase tracking-[0.24em]"
                    style={{ color: cor }}
                  >
                    {a.titulo}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                    {a.descricao}
                  </p>
                </div>
              </SpotlightCard>
            );
          })}
        </section>
      )}

      {/* ============ O QUE OS AUTOS NÃO RESPONDEM ============ */}
      {ficha.lacunas.length > 0 && (
        <section className="flex flex-col gap-4">
          <TituloSetor texto="O Que Os Autos Não Responderam" />
          <SpotlightCard local claro borda={BORDA_CADERNO} className="p-6">
            <ul className="flex flex-col gap-2">
              {ficha.lacunas.map((l, i) => (
                <li
                  key={i}
                  className="text-sm leading-relaxed text-[var(--color-ivory-66)]"
                >
                  {l}
                </li>
              ))}
            </ul>
          </SpotlightCard>
        </section>
      )}

      {/* ============ CONFERÊNCIA E GRAVAÇÃO ============ */}
      <section className="flex flex-col gap-6">
        <TituloSetor texto="Conferir e Gravar na Biblioteca" />
        <SpotlightCard
          local
          claro
          degrade="linear-gradient(0deg, rgba(10,48,28,0.7), rgba(10,48,28,0.7))"
          className="p-6 sm:p-8"
        >
          <p className="text-[15px] leading-relaxed text-[var(--color-ivory-88)]">
            Nada acima entrou na base ainda. Confira o que a leitura apurou e,
            se estiver certo, escolha de qual cliente é este processo para
            gravar o dossiê, as medidas e o débito.
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <label className="flex min-w-[280px] flex-1 flex-col gap-2">
              <span className="font-mono text-[12px] uppercase tracking-[0.24em] text-[var(--color-gold)]/80">
                Cliente (credor) deste processo
              </span>
              <select
                value={credorId}
                onChange={(e) =>
                  setCredorId(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 text-base text-ivory focus:border-[var(--color-signal)] focus:outline-none"
              >
                <option value="">Escolha o cliente…</option>
                {credores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>

            <BordaLiquidaMetal cor="signal" radius={14} className="inline-flex">
              <button
                type="button"
                onClick={confirmar}
                disabled={salvando}
                className="inline-flex h-full w-full items-center gap-2.5 rounded-[11px] bg-[rgba(60,255,138,0.10)] px-5 py-3 text-sm font-medium text-[var(--color-signal)] transition hover:bg-[rgba(60,255,138,0.18)] disabled:opacity-50"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {salvando ? "Gravando…" : "Confirmar e gravar"}
              </button>
            </BordaLiquidaMetal>
          </div>

          {aviso && (
            <p
              className="mt-5 flex items-center gap-2 text-sm"
              style={{ color: aviso.ok ? "var(--color-signal)" : "#FF5B5B" }}
            >
              {aviso.ok ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              )}
              {aviso.texto}
            </p>
          )}

          {!debito.fechaConta && debito.oQueFalta && (
            <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-[#F4C542]">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Atenção ao débito: {debito.oQueFalta}
            </p>
          )}
        </SpotlightCard>
      </section>
    </div>
  );
}
