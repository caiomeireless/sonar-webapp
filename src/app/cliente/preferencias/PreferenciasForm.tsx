"use client";

// Form de preferências do cliente — limite mensal de gasto com
// pesquisas pagas. 3 níveis de teto:
//   1. GLOBAL (limite_mensal_brl)
//   2. POR MODO (Combo Lead / Combo Documento)
//   3. POR API individual (Assertiva, BigDataCorp, ARISP, ...)
// Regra: a consulta paga é bloqueada se ESTOURAR qualquer um dos níveis.
// Mais restritivo vence.
import { useMemo, useState, useTransition } from "react";
import { formatBRL } from "@/lib/format";
import { atualizarPreferenciasCliente } from "@/lib/actions/preferencias-actions";
import { APIS } from "@/lib/sonar-apis";

type Props = {
  credorNome: string | null;
  gastoMes: number;
  limiteInicial: number;
  limiteComboLeadInicial: number;
  limiteComboDocInicial: number;
  limitesPorApiInicial: Record<string, number>;
  bloquearInicial: boolean;
  observacoesInicial: string;
};

// Parse "1.234,56" -> 1234.56. Aceita também "1234.56", "1234,56" e
// vazio (devolve 0). Robusto a espaços e prefixos comuns.
function parseBRL(raw: string): number {
  const limpo = (raw ?? "")
    .replace(/R\$\s?/g, "")
    .replace(/\s/g, "")
    .trim();
  if (!limpo) return 0;
  // Se tem ambos separadores, assume "." como milhar e "," como decimal.
  if (limpo.includes(",") && limpo.includes(".")) {
    return Number(limpo.replace(/\./g, "").replace(",", "."));
  }
  // Só vírgula -> decimal.
  if (limpo.includes(",")) {
    return Number(limpo.replace(",", "."));
  }
  // Só ponto -> já é decimal.
  return Number(limpo);
}

// Formata número pra input BRL "1.234,56".
function fmtInputBRL(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PreferenciasForm({
  credorNome,
  gastoMes,
  limiteInicial,
  limiteComboLeadInicial,
  limiteComboDocInicial,
  limitesPorApiInicial,
  bloquearInicial,
  observacoesInicial,
}: Props) {
  const [limiteStr, setLimiteStr] = useState(fmtInputBRL(limiteInicial));
  const [limiteLeadStr, setLimiteLeadStr] = useState(
    fmtInputBRL(limiteComboLeadInicial),
  );
  const [limiteDocStr, setLimiteDocStr] = useState(
    fmtInputBRL(limiteComboDocInicial),
  );
  const [bloquear, setBloquear] = useState(bloquearInicial);
  const [observacoes, setObservacoes] = useState(observacoesInicial ?? "");
  // Estado granular por API: 1) quais estão "ativadas" (checkbox) e
  // 2) o valor digitado em cada input (string formato BRL). Iniciamos
  // ativadas todas as APIs que já tem limite definido em DB.
  const [ativadasPorApi, setAtivadasPorApi] = useState<Record<string, boolean>>(
    () => {
      const init: Record<string, boolean> = {};
      for (const id of Object.keys(limitesPorApiInicial)) {
        init[id] = true;
      }
      return init;
    },
  );
  const [valoresPorApiStr, setValoresPorApiStr] = useState<
    Record<string, string>
  >(() => {
    const init: Record<string, string> = {};
    for (const [id, v] of Object.entries(limitesPorApiInicial)) {
      init[id] = fmtInputBRL(v);
    }
    return init;
  });
  const [expandirApis, setExpandirApis] = useState(false);
  const [msg, setMsg] = useState<
    { tipo: "ok" | "erro"; texto: string } | null
  >(null);
  const [pending, startTransition] = useTransition();

  const limiteNum = parseBRL(limiteStr);
  const limiteLeadNum = parseBRL(limiteLeadStr);
  const limiteDocNum = parseBRL(limiteDocStr);
  const semLimite = !limiteNum || limiteNum <= 0;
  const pct = semLimite ? 0 : Math.min(100, (gastoMes / limiteNum) * 100);

  // Cor da barra: verde <= 70%, dourado 70-90%, vermelho > 90%.
  let corBarra = "var(--color-signal)";
  if (!semLimite) {
    if (pct > 90) corBarra = "#FF5A5A";
    else if (pct > 70) corBarra = "var(--color-gold)";
  }

  // Lista de APIs separadas por modo, pra render do acordeão.
  const apisLead = useMemo(() => APIS.filter((a) => a.modo === "lead"), []);
  const apisDoc = useMemo(() => APIS.filter((a) => a.modo === "doc"), []);

  // Monta o objeto { api_id -> limite_brl } pra enviar. Só inclui APIs
  // marcadas (checkbox on). Valor 0 é permitido (significa "bloquear
  // 100% essa API" — útil para Caio desativar eDossie caro, p. ex.).
  function buildLimitesPorApi(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const api of APIS) {
      if (!ativadasPorApi[api.id]) continue;
      const v = parseBRL(valoresPorApiStr[api.id] ?? "");
      if (Number.isFinite(v) && v >= 0) out[api.id] = v;
    }
    return out;
  }

  function toggleApi(id: string) {
    setAtivadasPorApi((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function marcarTodos(modo: "todos" | "nenhum") {
    if (modo === "todos") {
      const next: Record<string, boolean> = {};
      for (const a of APIS) {
        // Só faz sentido marcar APIs pagas — grátis não gera gasto.
        if (a.preco > 0) next[a.id] = true;
      }
      setAtivadasPorApi(next);
    } else {
      setAtivadasPorApi({});
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData();
    fd.set("limite_mensal_brl", String(limiteNum));
    fd.set("limite_combo_lead_brl", String(limiteLeadNum));
    fd.set("limite_combo_doc_brl", String(limiteDocNum));
    fd.set("limites_por_api", JSON.stringify(buildLimitesPorApi()));
    fd.set("bloquear_ao_exceder", bloquear ? "true" : "false");
    fd.set("observacoes", observacoes);
    startTransition(async () => {
      const r = await atualizarPreferenciasCliente(fd);
      if (r.ok) {
        setMsg({ tipo: "ok", texto: "Preferências salvas." });
      } else {
        setMsg({
          tipo: "erro",
          texto: r.error ?? "Não foi possível salvar.",
        });
      }
    });
  }

  return (
    <div className="mt-12 space-y-8">
      {/* === CARD DE GASTO DO MÊS === */}
      <section className="rounded-2xl border border-[var(--color-ivory-12)] bg-white/[0.02] p-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
          Gasto do mês
          {credorNome ? (
            <span className="ml-2 text-[var(--color-gold)]">
              · {credorNome}
            </span>
          ) : null}
        </span>
        <div className="mt-3 flex items-baseline gap-4">
          <span className="font-serif text-[clamp(40px,6vw,64px)] leading-none text-ivory">
            {formatBRL(gastoMes)}
          </span>
          {semLimite ? (
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              de limite ilimitado
            </span>
          ) : (
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              de {formatBRL(limiteNum)}
            </span>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="mt-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-ivory-12)]">
            <div
              className="h-full transition-[width,background-color] duration-500"
              style={{
                width: `${semLimite ? 0 : pct}%`,
                backgroundColor: corBarra,
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
            <span>
              {semLimite ? "Sem limite definido" : `${pct.toFixed(0)}% do teto`}
            </span>
            <span>Renova no dia 1</span>
          </div>
        </div>
      </section>

      {/* === FORM === */}
      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-[var(--color-ivory-12)] bg-white/[0.02] p-8"
      >
        {/* Limite mensal global */}
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
            Limite mensal global (R$)
          </span>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-3 focus-within:border-[var(--color-gold)]">
            <span className="font-mono text-sm text-[var(--color-ivory-66)]">
              R$
            </span>
            <input
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              value={limiteStr}
              onChange={(e) => setLimiteStr(e.target.value)}
              onBlur={() => setLimiteStr(fmtInputBRL(parseBRL(limiteStr)))}
              className="w-full bg-transparent font-serif text-2xl text-ivory outline-none placeholder:text-[var(--color-ivory-22)]"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              / mês
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--color-ivory-66)]">
            Use 0 para não definir um teto. O escritório respeitará o
            valor ao rodar pesquisas pagas no nome dos seus devedores.
          </p>
        </label>

        {/* === LIMITES POR MODO === */}
        <section className="rounded-xl border border-[var(--color-ivory-12)] bg-black/20 p-6">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
              Limites por modo
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
              0 = sem limite (usa o global)
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Combo Lead */}
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-ivory-88)]">
                Combo Lead (mês)
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-3 py-2.5 focus-within:border-[var(--color-gold)]">
                <span className="font-mono text-xs text-[var(--color-ivory-66)]">
                  R$
                </span>
                <input
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,00"
                  value={limiteLeadStr}
                  onChange={(e) => setLimiteLeadStr(e.target.value)}
                  onBlur={() =>
                    setLimiteLeadStr(fmtInputBRL(parseBRL(limiteLeadStr)))
                  }
                  className="w-full bg-transparent font-serif text-lg text-ivory outline-none placeholder:text-[var(--color-ivory-22)]"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--color-ivory-66)]">
                Localizar/priorizar devedor (Assertiva, BigDataCorp, Cenprot...).
              </p>
            </label>

            {/* Combo Documento */}
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-ivory-88)]">
                Combo Documento (mês)
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-3 py-2.5 focus-within:border-[var(--color-gold)]">
                <span className="font-mono text-xs text-[var(--color-ivory-66)]">
                  R$
                </span>
                <input
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,00"
                  value={limiteDocStr}
                  onChange={(e) => setLimiteDocStr(e.target.value)}
                  onBlur={() =>
                    setLimiteDocStr(fmtInputBRL(parseBRL(limiteDocStr)))
                  }
                  className="w-full bg-transparent font-serif text-lg text-ivory outline-none placeholder:text-[var(--color-ivory-22)]"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--color-ivory-66)]">
                Matrícula, certidão, eDossiê — documentos oficiais anexáveis.
              </p>
            </label>
          </div>
        </section>

        {/* === LIMITES GRANULARES POR API === */}
        <section className="rounded-xl border border-[var(--color-ivory-12)] bg-black/20 p-6">
          <button
            type="button"
            onClick={() => setExpandirApis((v) => !v)}
            className="flex w-full items-center justify-between gap-4 text-left"
            aria-expanded={expandirApis ? "true" : "false"}
          >
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
                Limites granulares por API
              </span>
              <span className="mt-1 block text-xs text-[var(--color-ivory-66)]">
                Tetos finos — sobrepõem o limite por modo para APIs caras.
              </span>
            </span>
            <span className="rounded-md border border-[var(--color-ivory-22)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-88)] transition hover:border-[var(--color-gold)]">
              {expandirApis ? "Recolher" : "Expandir"}
            </span>
          </button>

          {expandirApis ? (
            <div className="mt-6 space-y-6">
              {/* Ações rápidas */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => marcarTodos("todos")}
                  className="rounded-md border border-[var(--color-ivory-22)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-88)] transition hover:border-[var(--color-gold)]"
                >
                  Marcar todas pagas
                </button>
                <button
                  type="button"
                  onClick={() => marcarTodos("nenhum")}
                  className="rounded-md border border-[var(--color-ivory-22)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-88)] transition hover:border-[var(--color-gold)]"
                >
                  Desmarcar todas
                </button>
              </div>

              {/* Bloco Lead */}
              <ApisBlock
                titulo="Modo Lead"
                apis={apisLead}
                ativadas={ativadasPorApi}
                valores={valoresPorApiStr}
                onToggle={toggleApi}
                onChangeValor={(id, v) =>
                  setValoresPorApiStr((p) => ({ ...p, [id]: v }))
                }
                onBlurValor={(id) =>
                  setValoresPorApiStr((p) => ({
                    ...p,
                    [id]: fmtInputBRL(parseBRL(p[id] ?? "")),
                  }))
                }
              />

              {/* Bloco Doc */}
              <ApisBlock
                titulo="Modo Documento"
                apis={apisDoc}
                ativadas={ativadasPorApi}
                valores={valoresPorApiStr}
                onToggle={toggleApi}
                onChangeValor={(id, v) =>
                  setValoresPorApiStr((p) => ({ ...p, [id]: v }))
                }
                onBlurValor={(id) =>
                  setValoresPorApiStr((p) => ({
                    ...p,
                    [id]: fmtInputBRL(parseBRL(p[id] ?? "")),
                  }))
                }
              />

              <p className="text-[11px] leading-relaxed text-[var(--color-ivory-66)]">
                Quando uma API está marcada, o limite digitado vale APENAS
                para ela. Use{" "}
                <span className="font-mono text-[var(--color-ivory-88)]">0,00</span>{" "}
                para bloquear 100% (útil pra APIs caras como eDossiê). APIs
                grátis não geram gasto — listadas só como referência.
              </p>
            </div>
          ) : null}
        </section>

        {/* Toggle bloquear */}
        <label className="flex items-start gap-4 rounded-lg border border-[var(--color-ivory-12)] bg-white/[0.02] p-4">
          <button
            type="button"
            role="switch"
            aria-checked={bloquear ? "true" : "false"}
            onClick={() => setBloquear(!bloquear)}
            className={`relative mt-1 h-6 w-11 shrink-0 rounded-full border transition-colors ${
              bloquear
                ? "border-[var(--color-gold)] bg-[var(--color-gold)]/30"
                : "border-[var(--color-ivory-22)] bg-white/5"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full transition-transform ${
                bloquear
                  ? "translate-x-[22px] bg-[var(--color-gold)]"
                  : "translate-x-0.5 bg-[var(--color-ivory-66)]"
              }`}
            />
          </button>
          <span className="block">
            <span className="block text-sm font-medium text-ivory">
              Bloquear consultas que excedam o limite
            </span>
            <span className="mt-1 block text-xs text-[var(--color-ivory-66)]">
              Quando ativado, consultas pagas que ultrapassariam qualquer
              dos três níveis (global, por modo ou por API) são recusadas.
              Caso contrário, apenas geram alerta.
            </span>
          </span>
        </label>

        {/* Observações */}
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-ivory-66)]">
            Observações (opcional)
          </span>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Algum contexto pro escritório?"
            className="mt-2 w-full resize-y rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-3 text-sm text-ivory outline-none placeholder:text-[var(--color-ivory-22)] focus:border-[var(--color-gold)]"
          />
        </label>

        {/* Ações */}
        <div className="flex items-center justify-between gap-4 pt-2">
          {msg ? (
            <span
              role="status"
              className={`font-mono text-xs uppercase tracking-[0.22em] ${
                msg.tipo === "ok"
                  ? "text-[var(--color-signal)]"
                  : "text-[#FF8888]"
              }`}
            >
              {msg.texto}
            </span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-[var(--color-gold)] bg-[var(--color-gold)]/10 px-5 py-2.5 text-sm font-medium text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Salvando..." : "Salvar preferências"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// SUBCOMPONENTE: bloco de APIs por modo, com checkbox + input R$.
// ============================================================
type ApisBlockProps = {
  titulo: string;
  apis: typeof APIS;
  ativadas: Record<string, boolean>;
  valores: Record<string, string>;
  onToggle: (id: string) => void;
  onChangeValor: (id: string, v: string) => void;
  onBlurValor: (id: string) => void;
};

function ApisBlock({
  titulo,
  apis,
  ativadas,
  valores,
  onToggle,
  onChangeValor,
  onBlurValor,
}: ApisBlockProps) {
  return (
    <div>
      <h4 className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-gold)]">
        {titulo}
      </h4>
      <ul className="space-y-1.5">
        {apis.map((api) => {
          const gratis = api.preco <= 0;
          const ativo = !!ativadas[api.id];
          return (
            <li
              key={api.id}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 transition ${
                ativo
                  ? "border-[var(--color-gold)]/40 bg-[var(--color-gold)]/[0.04]"
                  : "border-[var(--color-ivory-12)] bg-white/[0.015]"
              }`}
            >
              {/* Checkbox */}
              {gratis ? (
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--color-ivory-12)] bg-white/5 font-mono text-[10px] text-[var(--color-ivory-66)]">
                  ·
                </span>
              ) : (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={ativo ? "true" : "false"}
                  onClick={() => onToggle(api.id)}
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                    ativo
                      ? "border-[var(--color-gold)] bg-[var(--color-gold)]/30 text-[var(--color-gold)]"
                      : "border-[var(--color-ivory-22)] bg-white/5"
                  }`}
                >
                  {ativo ? (
                    <span className="text-[11px] leading-none">v</span>
                  ) : null}
                </button>
              )}

              {/* Nome + preço unitário */}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ivory">
                  {api.nome}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                  {api.precoLabel} por consulta
                </span>
              </span>

              {/* Input R$ */}
              {gratis ? (
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
                  sem custo
                </span>
              ) : (
                <span
                  className={`flex shrink-0 items-center gap-1.5 rounded border px-2 py-1 ${
                    ativo
                      ? "border-[var(--color-ivory-22)] bg-white/5 focus-within:border-[var(--color-gold)]"
                      : "border-[var(--color-ivory-12)] bg-white/[0.02] opacity-50"
                  }`}
                >
                  <span className="font-mono text-[10px] text-[var(--color-ivory-66)]">
                    R$
                  </span>
                  <input
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0,00"
                    disabled={!ativo}
                    value={valores[api.id] ?? ""}
                    onChange={(e) => onChangeValor(api.id, e.target.value)}
                    onBlur={() => onBlurValor(api.id)}
                    className="w-20 bg-transparent text-right font-mono text-sm text-ivory outline-none placeholder:text-[var(--color-ivory-22)] disabled:cursor-not-allowed"
                  />
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                    /mês
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
