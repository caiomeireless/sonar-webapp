"use client";

// Imóveis — pesquisa manual RI Digital (dossiê do devedor). SÓ EQUIPE.
//
// Não existe API de matrículas: o advogado pesquisa manualmente no RI
// Digital e registra aqui — data + observação + print do resultado +
// PDFs das matrículas encontradas. Upload em 2 passos (URL assinada +
// PUT direto do navegador), porque server action na Vercel corta o
// corpo em ~4.5 MB.
import { useRef, useState } from "react";
import {
  Building2,
  Camera,
  ClipboardCheck,
  FileText,
  UploadCloud,
  X,
} from "lucide-react";

import type {
  PesquisaImovel,
  TipoAnexoImovel,
} from "@/lib/imoveis-pesquisas";
import {
  criarUploadImovelUrl,
  registrarPesquisaImovel,
} from "../imoveis-actions";

const TIPOS_ARQUIVO = ["application/pdf", "image/jpeg", "image/png"];
const TAMANHO_MAX = 20 * 1024 * 1024; // 20 MB
const MAX_ARQUIVOS = 6;

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
function ZonaArquivos({
  titulo,
  dica,
  icone,
  arquivos,
  aoAdicionar,
  aoRemover,
  desabilitada,
}: {
  titulo: string;
  dica: string;
  icone: React.ReactNode;
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
      <span className={labelBase}>{titulo}</span>
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
            ? "rgba(56,189,248,0.7)"
            : "rgba(201,162,74,0.35)",
          background: arrastando
            ? "rgba(56,189,248,0.08)"
            : "rgba(0,0,0,0.45)",
        }}
      >
        <span className="text-[#38BDF8]" aria-hidden="true">
          {icone}
        </span>
        <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
          Arraste aqui ou clique para escolher
        </span>
        <span className="font-mono text-[12px] tracking-wide text-[var(--color-ivory-40)]">
          {dica}
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
                className="h-4 w-4 shrink-0 text-[#38BDF8]"
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
export function PainelImoveisManual({
  devedorId,
  pesquisas,
}: {
  devedorId: number;
  pesquisas: PesquisaImovel[];
}) {
  const [prints, setPrints] = useState<File[]>([]);
  const [matriculas, setMatriculas] = useState<File[]>([]);
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function validarNovos(novos: File[], jaEscolhidos: number): string | null {
    for (const f of novos) {
      if (!TIPOS_ARQUIVO.includes(f.type)) {
        return `"${f.name}": use PDF, JPG ou PNG.`;
      }
      if (f.size > TAMANHO_MAX) {
        return `"${f.name}": arquivo acima de 20 MB.`;
      }
    }
    if (jaEscolhidos + novos.length > MAX_ARQUIVOS) {
      return `No máximo ${MAX_ARQUIVOS} arquivos por pesquisa.`;
    }
    return null;
  }

  function adicionar(zona: TipoAnexoImovel, novos: File[]) {
    const total = prints.length + matriculas.length;
    const msg = validarNovos(novos, total);
    if (msg) {
      setErro(msg);
      return;
    }
    setErro(null);
    if (zona === "print") setPrints((atual) => [...atual, ...novos]);
    else setMatriculas((atual) => [...atual, ...novos]);
  }

  // Orquestra o registro: pra cada arquivo pede a URL assinada, faz o PUT
  // direto no bucket e só então grava a pesquisa com os paths.
  async function registrar() {
    if (enviando) return;
    if (prints.length + matriculas.length === 0 && !observacao.trim()) {
      setErro("Anexe o print da pesquisa ou escreva uma observação.");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const fila: { arquivo: File; tipo: TipoAnexoImovel }[] = [
        ...prints.map((arquivo) => ({ arquivo, tipo: "print" as const })),
        ...matriculas.map((arquivo) => ({
          arquivo,
          tipo: "matricula" as const,
        })),
      ];

      const anexos: {
        path: string;
        nome: string;
        tipo: TipoAnexoImovel;
        contentType: string;
      }[] = [];

      for (const { arquivo, tipo } of fila) {
        const r = await criarUploadImovelUrl(devedorId, arquivo.type, tipo);
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
          tipo,
          contentType: arquivo.type,
        });
      }

      const fd = new FormData();
      fd.set("devedorId", String(devedorId));
      fd.set("observacao", observacao);
      fd.set("anexos", JSON.stringify(anexos));

      const res = await registrarPesquisaImovel(fd);
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
        border: "1px solid rgba(201,162,74,0.25)",
        backgroundColor: "#000",
        backgroundImage:
          "repeating-linear-gradient(180deg, transparent 0 27px, rgba(201,162,74,0.14) 27px 28px)",
      }}
    >
      {/* Cabeçalho */}
      <div className="flex items-center gap-2.5">
        <Building2 className="h-5 w-5 text-[#38BDF8]" aria-hidden="true" />
        <h3 className="font-mono text-[12px] uppercase tracking-[0.24em] text-[#38BDF8]">
          Imóveis · Pesquisa Manual (RI Digital)
        </h3>
      </div>

      <p className="mt-3 max-w-prose text-sm leading-relaxed text-[var(--color-ivory-66)]">
        Matrículas de imóveis não têm API: a pesquisa é feita manualmente no
        RI Digital e registrada aqui — anexe o print do resultado e os PDFs
        das matrículas encontradas.
      </p>

      {/* Zonas de upload */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <ZonaArquivos
          titulo="Print do Resultado"
          dica="PDF, JPG ou PNG · até 20 MB"
          icone={<Camera className="h-6 w-6" aria-hidden="true" />}
          arquivos={prints}
          aoAdicionar={(novos) => adicionar("print", novos)}
          aoRemover={(i) =>
            setPrints((atual) => atual.filter((_, idx) => idx !== i))
          }
          desabilitada={enviando}
        />
        <ZonaArquivos
          titulo="PDFs de Matrículas"
          dica="PDF, JPG ou PNG · até 20 MB"
          icone={<FileText className="h-6 w-6" aria-hidden="true" />}
          arquivos={matriculas}
          aoAdicionar={(novos) => adicionar("matricula", novos)}
          aoRemover={(i) =>
            setMatriculas((atual) => atual.filter((_, idx) => idx !== i))
          }
          desabilitada={enviando}
        />
      </div>

      {/* Observação */}
      <label className="mt-5 block">
        <span className={labelBase}>Observação (Opcional)</span>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={enviando}
          placeholder="Ex.: pesquisado no RI Digital pelo CPF — 2 matrículas em Campinas, nada em SP capital."
          className="mt-2 w-full resize-y rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-ivory placeholder:text-[var(--color-ivory-40)] focus:border-[var(--color-signal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]/30"
        />
      </label>

      {erro && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}
      {sucesso && (
        <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Pesquisa registrada — atualizando a página…
        </p>
      )}

      <button
        type="button"
        onClick={registrar}
        disabled={enviando}
        className="btn-neon-signal mt-5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
        {enviando ? "Registrando…" : "Registrar Pesquisa"}
      </button>

      {/* Pesquisas já registradas */}
      <div className="mt-7 border-t border-[rgba(201,162,74,0.25)] pt-5">
        <h4 className={labelBase}>Pesquisas Registradas</h4>

        {pesquisas.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-ivory-40)]">
            Nenhuma pesquisa registrada ainda para este devedor.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {pesquisas.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border px-4 py-3"
                style={{
                  borderColor: "rgba(201,162,74,0.25)",
                  background: "rgba(0,0,0,0.55)",
                }}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#38BDF8]">
                    {fmtData.format(new Date(p.pesquisadoEm))}
                  </span>
                  <span className="font-mono text-[12px] tracking-wide text-[var(--color-ivory-40)]">
                    por {p.criadoPor}
                  </span>
                </div>

                {p.observacao && (
                  <p className="mt-2 text-sm leading-relaxed text-ivory">
                    {p.observacao}
                  </p>
                )}

                {p.anexos.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {p.anexos.map((a) =>
                      a.url ? (
                        <a
                          key={a.path}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[12px] tracking-wide text-[#38BDF8] transition-colors hover:bg-[rgba(56,189,248,0.1)]"
                          style={{ borderColor: "rgba(56,189,248,0.35)" }}
                        >
                          {a.tipo === "print" ? (
                            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <FileText
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          )}
                          {a.nome}
                        </a>
                      ) : (
                        <span
                          key={a.path}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 font-mono text-[12px] tracking-wide text-[var(--color-ivory-40)]"
                          title="Link temporariamente indisponível — recarregue a página."
                        >
                          {a.tipo === "print" ? (
                            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <FileText
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          )}
                          {a.nome}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
