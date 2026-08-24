"use client";

// Intimação / Citação no Endereço (dossiê do devedor). SÓ EQUIPE.
//
// O advogado registra o resultado da tentativa de intimação ou citação do
// devedor no endereço encontrado — resultado (aguardando / êxito / sem
// êxito) + endereço/observação + AR positivo.
// Upload em 2 passos (URL assinada + PUT direto do navegador), porque
// server action na Vercel corta o corpo em ~4.5 MB.
import { useRef, useState } from "react";
import { ClipboardCheck, FileText, MailCheck, UploadCloud, X } from "lucide-react";

import type {
  IntimacaoEndereco,
  ResultadoIntimacao,
} from "@/lib/enderecos-intimacoes";
import {
  criarUploadIntimacaoUrl,
  registrarIntimacaoEndereco,
} from "../intimacoes-actions";

const TIPOS_ARQUIVO = ["application/pdf", "image/jpeg", "image/png"];
const TAMANHO_MAX = 20 * 1024 * 1024; // 20 MB
const MAX_ARQUIVOS = 4;

const TURQUESA = "#2DD4BF";

const RESULTADOS: { valor: ResultadoIntimacao; rotulo: string; cor: string }[] =
  [
    { valor: "aguardando", rotulo: "Aguardando", cor: "#FFD93D" },
    { valor: "exito", rotulo: "Êxito na Intimação/Citação", cor: "#3CFF8A" },
    { valor: "sem_exito", rotulo: "Sem Êxito", cor: "#FB7185" },
  ];

function infoResultado(resultado: ResultadoIntimacao) {
  return RESULTADOS.find((r) => r.valor === resultado) ?? RESULTADOS[0];
}

const labelBase =
  "font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]";

const fmtData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function fmtTamanho(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// ---------------------------------------------------------------------------
// Zona de arrastar-e-soltar (com input file de reserva)
// ---------------------------------------------------------------------------
function ZonaAr({
  arquivos,
  aoAdicionar,
  aoRemover,
  desabilitada,
}: {
  arquivos: File[];
  aoAdicionar: (novos: File[]) => void;
  aoRemover: (indice: number) => void;
  desabilitada: boolean;
}) {
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function receber(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    aoAdicionar(Array.from(lista));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className={labelBase}>AR Positivo</span>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !desabilitada && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !desabilitada) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!desabilitada) setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          if (!desabilitada) receber(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors"
        style={{
          borderColor: arrastando
            ? "rgba(45,212,191,0.7)"
            : "rgba(201,162,74,0.35)",
          background: arrastando
            ? "rgba(45,212,191,0.08)"
            : "rgba(0,0,0,0.45)",
        }}
      >
        <span className="text-[#2DD4BF]" aria-hidden="true">
          <FileText className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
          Arraste aqui ou clique para escolher
        </span>
        <span className="font-mono text-[12px] tracking-wide text-[var(--color-ivory-40)]">
          PDF, JPG ou PNG · até 20 MB · máx. {MAX_ARQUIVOS} arquivos
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,image/jpeg,image/png"
          className="hidden"
          disabled={desabilitada}
          onChange={(e) => {
            receber(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {arquivos.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {arquivos.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-ivory"
              style={{
                borderColor: "rgba(201,162,74,0.25)",
                background: "rgba(0,0,0,0.55)",
              }}
            >
              <UploadCloud
                className="h-4 w-4 shrink-0 text-[#2DD4BF]"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="shrink-0 font-mono text-[12px] text-[var(--color-ivory-40)]">
                {fmtTamanho(f.size)}
              </span>
              <button
                type="button"
                onClick={() => aoRemover(i)}
                disabled={desabilitada}
                aria-label={`Remover ${f.name}`}
                className="shrink-0 rounded p-1 text-[var(--color-ivory-40)] transition-colors hover:text-red-300 disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Painel principal
// ---------------------------------------------------------------------------
export function PainelIntimacoesEndereco({
  devedorId,
  intimacoes,
}: {
  devedorId: number;
  intimacoes: IntimacaoEndereco[];
}) {
  const [resultado, setResultado] = useState<ResultadoIntimacao>("aguardando");
  const [ars, setArs] = useState<File[]>([]);
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function adicionar(novos: File[]) {
    for (const f of novos) {
      if (!TIPOS_ARQUIVO.includes(f.type)) {
        setErro(`"${f.name}": use PDF, JPG ou PNG.`);
        return;
      }
      if (f.size > TAMANHO_MAX) {
        setErro(`"${f.name}": arquivo acima de 20 MB.`);
        return;
      }
    }
    if (ars.length + novos.length > MAX_ARQUIVOS) {
      setErro(`No máximo ${MAX_ARQUIVOS} arquivos por intimação.`);
      return;
    }
    setErro(null);
    setArs((atual) => [...atual, ...novos]);
  }

  // Orquestra o registro: pra cada AR pede a URL assinada, faz o PUT
  // direto no bucket e só então grava a intimação com os paths.
  async function registrar() {
    if (enviando) return;
    setErro(null);
    setEnviando(true);
    try {
      const anexos: {
        path: string;
        nome: string;
        tipo: "ar";
        contentType: string;
      }[] = [];

      for (const arquivo of ars) {
        const r = await criarUploadIntimacaoUrl(devedorId, arquivo.type);
        if ("erro" in r) throw new Error(r.erro);
        const put = await fetch(r.signedUrl, {
          method: "PUT",
          headers: { "content-type": arquivo.type, "x-upsert": "false" },
          body: arquivo,
        });
        if (!put.ok) {
          throw new Error(
            put.status === 413
              ? `"${arquivo.name}" acima do limite de 20 MB do servidor.`
              : `Falha no upload de "${arquivo.name}" (HTTP ${put.status}).`,
          );
        }
        anexos.push({
          path: r.path,
          nome: arquivo.name,
          tipo: "ar",
          contentType: arquivo.type,
        });
      }

      const fd = new FormData();
      fd.set("devedorId", String(devedorId));
      fd.set("resultado", resultado);
      fd.set("observacao", observacao);
      fd.set("anexos", JSON.stringify(anexos));

      const res = await registrarIntimacaoEndereco(fd);
      if ("erro" in res) throw new Error(res.erro);

      setSucesso(true);
      // Navegação dura de propósito: recarrega a lista e zera o formulário.
      window.location.reload();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado ao registrar.");
      setEnviando(false);
    }
  }

  return (
    <section
      className="rounded-2xl p-6"
      style={{
        border: "1px solid rgba(201,162,74,0.28)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.015) 45%, transparent 70%), rgba(20,22,20,0.72)",
      }}
    >
      {/* Cabeçalho */}
      <div className="flex items-center gap-2.5">
        <MailCheck className="h-5 w-5 text-[#2DD4BF]" aria-hidden="true" />
        <h3 className="font-mono text-[12px] uppercase tracking-[0.24em] text-[#2DD4BF]">
          Intimação / Citação no Endereço
        </h3>
      </div>

      <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--color-ivory-66)]">
        Registre se o endereço encontrado teve êxito na intimação ou citação
        do devedor e anexe o AR positivo.
      </p>

      {/* Resultado da intimação */}
      <div className="mt-5 flex flex-col gap-2">
        <span className={labelBase}>Resultado</span>
        <div className="flex flex-wrap gap-2">
          {RESULTADOS.map((r) => {
            const ativo = resultado === r.valor;
            return (
              <button
                key={r.valor}
                type="button"
                onClick={() => setResultado(r.valor)}
                disabled={enviando}
                aria-pressed={ativo}
                className="rounded-full border px-4 py-2 font-mono text-[12px] uppercase tracking-[0.14em] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: ativo ? r.cor : "rgba(201,162,74,0.3)",
                  background: ativo ? `${r.cor}1f` : "rgba(0,0,0,0.45)",
                  color: ativo ? r.cor : "var(--color-ivory-66)",
                }}
              >
                {r.rotulo}
              </button>
            );
          })}
        </div>
      </div>

      {/* Endereço / observação */}
      <label className="mt-5 block">
        <span className={labelBase}>Endereço / Observação (Opcional)</span>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={enviando}
          placeholder="Ex.: Rua das Acácias, 120 — Campinas/SP; AR assinado pelo próprio devedor em 12/08."
          className="mt-2 w-full resize-y rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-ivory placeholder:text-[var(--color-ivory-40)] focus:border-[var(--color-signal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]/30"
        />
      </label>

      {/* AR positivo */}
      <div className="mt-5">
        <ZonaAr
          arquivos={ars}
          aoAdicionar={adicionar}
          aoRemover={(i) =>
            setArs((atual) => atual.filter((_, idx) => idx !== i))
          }
          desabilitada={enviando}
        />
      </div>

      {erro && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}
      {sucesso && (
        <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Intimação registrada — atualizando a página…
        </p>
      )}

      <button
        type="button"
        onClick={registrar}
        disabled={enviando}
        className="btn-neon-signal mt-5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
        {enviando ? "Registrando…" : "Registrar Intimação"}
      </button>

      {/* Intimações já registradas */}
      <div className="mt-7 border-t border-[rgba(201,162,74,0.25)] pt-5">
        <h4 className={labelBase}>Intimações Registradas</h4>

        {intimacoes.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-ivory-40)]">
            Nenhuma intimação registrada ainda para este devedor.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {intimacoes.map((m) => {
              const info = infoResultado(m.resultado);
              return (
                <li
                  key={m.id}
                  className="rounded-xl border px-4 py-3"
                  style={{
                    borderColor: "rgba(201,162,74,0.25)",
                    background: "rgba(0,0,0,0.55)",
                  }}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span
                      className="font-mono text-[12px] uppercase tracking-[0.16em]"
                      style={{ color: TURQUESA }}
                    >
                      {fmtData.format(new Date(m.criadoEm))}
                    </span>
                    <span
                      className="rounded-full border px-2.5 py-0.5 font-mono text-[12px] uppercase tracking-[0.14em]"
                      style={{
                        borderColor: `${info.cor}59`,
                        background: `${info.cor}1a`,
                        color: info.cor,
                      }}
                    >
                      {info.rotulo}
                    </span>
                    <span className="font-mono text-[12px] tracking-wide text-[var(--color-ivory-40)]">
                      por {m.criadoPor}
                    </span>
                  </div>

                  {m.observacao && (
                    <p className="mt-2 text-sm leading-relaxed text-ivory">
                      {m.observacao}
                    </p>
                  )}

                  {m.anexos.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {m.anexos.map((a) =>
                        a.url ? (
                          <a
                            key={a.path}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[12px] tracking-wide text-[#2DD4BF] transition-colors hover:bg-[rgba(45,212,191,0.1)]"
                            style={{ borderColor: "rgba(45,212,191,0.35)" }}
                          >
                            <FileText
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {a.nome}
                          </a>
                        ) : (
                          <span
                            key={a.path}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 font-mono text-[12px] tracking-wide text-[var(--color-ivory-40)]"
                            title="Link temporariamente indisponível — recarregue a página."
                          >
                            <FileText
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {a.nome}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
