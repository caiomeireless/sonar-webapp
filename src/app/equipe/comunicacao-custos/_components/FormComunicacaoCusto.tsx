"use client";

// Formulário da Comunicação de Custos — selects dependentes (sistema ->
// tipo) + validação leve no cliente. A validação de verdade acontece na
// server action; aqui só evitamos ida e volta óbvia (arquivo grande, tipo
// errado, campo vazio).
import { useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";

import { ORIGENS_CUSTO, type OrigemCusto } from "@/lib/custos-tipos";
import { criarUploadCustoUrl, enviarComunicacaoCusto } from "../actions";

export type CredorOpcao = { id: number; nome: string; documento: string };

const TIPOS_ARQUIVO = ["application/pdf", "image/jpeg", "image/png"];
const TAMANHO_MAX = 20 * 1024 * 1024;

const inputBase =
  "mt-2 w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-3 text-sm text-ivory placeholder:text-[var(--color-ivory-40)] focus:border-[var(--color-signal)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]/30";
const labelBase =
  "font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]";

export function FormComunicacaoCusto({ credores }: { credores: CredorOpcao[] }) {
  const [origem, setOrigem] = useState<OrigemCusto>("ri_digital");
  const [credorSel, setCredorSel] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const origemMeta = useMemo(
    () => ORIGENS_CUSTO.find((o) => o.chave === origem)!,
    [origem],
  );

  function validarLocal(): string | null {
    const form = formRef.current;
    if (!form) return null;
    const fd = new FormData(form);

    const valor = String(fd.get("valor") ?? "").trim();
    if (!valor) return "Informe o valor pago.";
    if (!fd.get("data_gasto")) return "Informe a data do gasto.";

    if (origem === "outro" && !String(fd.get("tipo_outro") ?? "").trim()) {
      return "Descreva o tipo da pesquisa no campo livre.";
    }
    if (
      credorSel === "outro" &&
      !String(fd.get("cliente_outro") ?? "").trim()
    ) {
      return "Informe o nome do cliente.";
    }
    if (!credorSel) return "Escolha o cliente a quem repassar o custo.";

    const recibo = fd.get("recibo");
    if (!(recibo instanceof File) || recibo.size === 0) {
      return "Anexe o recibo do pagamento.";
    }
    for (const [campo, rotulo] of [
      ["recibo", "Recibo"],
      ["resultado", "Resultado"],
    ] as const) {
      const f = fd.get(campo);
      if (f instanceof File && f.size > 0) {
        if (!TIPOS_ARQUIVO.includes(f.type)) return `${rotulo}: use PDF, JPG ou PNG.`;
        if (f.size > TAMANHO_MAX) return `${rotulo}: arquivo acima de 20 MB.`;
      }
    }
    return null;
  }

  // Upload em 2 passos (o arquivo NUNCA passa pela server action — a Vercel
  // corta request em ~4.5 MB): pede URL assinada, faz PUT direto no bucket
  // do BP e só então registra a ficha com os paths.
  async function aoSubmeter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const msg = validarLocal();
    if (msg) {
      setErro(msg);
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const form = formRef.current!;
      const fd = new FormData(form);
      const recibo = fd.get("recibo") as File;
      const resultadoRaw = fd.get("resultado");
      const resultado =
        resultadoRaw instanceof File && resultadoRaw.size > 0
          ? resultadoRaw
          : null;

      async function subir(
        f: File,
        rotulo: "recibo" | "resultado",
      ): Promise<string> {
        const r = await criarUploadCustoUrl(f.type, rotulo);
        if ("erro" in r) throw new Error(r.erro);
        const put = await fetch(r.signedUrl, {
          method: "PUT",
          headers: { "content-type": f.type, "x-upsert": "false" },
          body: f,
        });
        if (!put.ok) {
          throw new Error(
            put.status === 413
              ? `${rotulo === "recibo" ? "Recibo" : "Resultado"} acima do limite de 20 MB do servidor.`
              : `Falha no upload do ${rotulo} (HTTP ${put.status}).`,
          );
        }
        return r.path;
      }

      const reciboPath = await subir(recibo, "recibo");
      const resultadoPath = resultado
        ? await subir(resultado, "resultado")
        : null;

      const envio = new FormData();
      for (const campo of [
        "origem",
        "tipo",
        "tipo_outro",
        "valor",
        "data_gasto",
        "credor_id",
        "cliente_outro",
        "processo_ref",
        "descricao",
      ]) {
        envio.set(campo, String(fd.get(campo) ?? ""));
      }
      envio.set("recibo_path", reciboPath);
      envio.set("recibo_nome", recibo.name);
      envio.set("recibo_mime", recibo.type);
      envio.set("recibo_tamanho", String(recibo.size));
      if (resultado && resultadoPath) {
        envio.set("resultado_path", resultadoPath);
        envio.set("resultado_nome", resultado.name);
        envio.set("resultado_mime", resultado.type);
        envio.set("resultado_tamanho", String(resultado.size));
      }

      const res = await enviarComunicacaoCusto(envio);
      if (res && "erro" in res) throw new Error(res.erro);
      // Navegação dura de propósito: recarrega a lista e zera o formulário.
      window.location.href = "/equipe/comunicacao-custos?ok=1";
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado ao enviar.");
      setEnviando(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={aoSubmeter} className="flex flex-col gap-5">
      {/* Sistema + tipo */}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelBase}>Sistema da Pesquisa</span>
          <select
            name="origem"
            value={origem}
            onChange={(e) => setOrigem(e.target.value as OrigemCusto)}
            className={inputBase}
          >
            {ORIGENS_CUSTO.map((o) => (
              <option key={o.chave} value={o.chave}>
                {o.rotulo}
                {o.site ? ` (${o.site})` : ""}
              </option>
            ))}
          </select>
        </label>

        {origem === "outro" ? (
          <label className="block">
            <span className={labelBase}>Tipo da Pesquisa</span>
            <input
              type="text"
              name="tipo_outro"
              maxLength={120}
              placeholder="Ex.: Certidão de protesto"
              className={inputBase}
            />
          </label>
        ) : (
          <label className="block">
            <span className={labelBase}>Tipo da Pesquisa</span>
            <select name="tipo" className={inputBase} key={origem}>
              {origemMeta.tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Valor + data */}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelBase}>Valor Pago (R$)</span>
          <input
            type="text"
            name="valor"
            inputMode="decimal"
            placeholder="Ex.: 89,90"
            className={inputBase}
          />
        </label>
        <label className="block">
          <span className={labelBase}>Data do Gasto</span>
          <input type="date" name="data_gasto" className={inputBase} />
        </label>
      </div>

      {/* Cliente */}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelBase}>Cliente (Repasse do Custo)</span>
          <select
            name="credor_id"
            value={credorSel}
            onChange={(e) => setCredorSel(e.target.value)}
            className={inputBase}
          >
            <option value="">Escolha o cliente…</option>
            {credores.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nome}
              </option>
            ))}
            <option value="outro">Outro (digitar o nome)</option>
          </select>
        </label>

        {credorSel === "outro" ? (
          <label className="block">
            <span className={labelBase}>Nome do Cliente</span>
            <input
              type="text"
              name="cliente_outro"
              maxLength={160}
              placeholder="Cliente não listado"
              className={inputBase}
            />
          </label>
        ) : (
          <label className="block">
            <span className={labelBase}>Processo ou Pasta (Opcional)</span>
            <input
              type="text"
              name="processo_ref"
              maxLength={120}
              placeholder="Ex.: 0001234-56.2024.8.26.0100"
              className={inputBase}
            />
          </label>
        )}
      </div>

      {/* Quando cliente = outro, o campo de processo desce pra cá */}
      {credorSel === "outro" && (
        <label className="block sm:max-w-[calc(50%-10px)]">
          <span className={labelBase}>Processo ou Pasta (Opcional)</span>
          <input
            type="text"
            name="processo_ref"
            maxLength={120}
            placeholder="Ex.: 0001234-56.2024.8.26.0100"
            className={inputBase}
          />
        </label>
      )}

      {/* Descrição */}
      <label className="block">
        <span className={labelBase}>Observações (Opcional)</span>
        <textarea
          name="descricao"
          rows={3}
          maxLength={2000}
          placeholder="Contexto do gasto — ex.: matrícula pedida pra instruir penhora."
          className={`${inputBase} resize-y`}
        />
      </label>

      {/* Anexos */}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelBase}>Recibo do Pagamento (Obrigatório)</span>
          <input
            type="file"
            name="recibo"
            accept=".pdf,image/jpeg,image/png"
            className={`${inputBase} file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-signal-soft)] file:px-3 file:py-1.5 file:font-mono file:text-[12px] file:uppercase file:tracking-[0.16em] file:text-[var(--color-signal)]`}
          />
        </label>
        <label className="block">
          <span className={labelBase}>Resultado da Pesquisa (Opcional)</span>
          <input
            type="file"
            name="resultado"
            accept=".pdf,image/jpeg,image/png"
            className={`${inputBase} file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-signal-soft)] file:px-3 file:py-1.5 file:font-mono file:text-[12px] file:uppercase file:tracking-[0.16em] file:text-[var(--color-signal)]`}
          />
        </label>
      </div>
      <p className="-mt-3 font-mono text-[12px] tracking-wide text-[var(--color-ivory-40)]">
        PDF, JPG ou PNG · até 20 MB por arquivo
      </p>

      {erro && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="btn-neon-signal self-start disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {enviando ? "Enviando ao Financeiro…" : "Enviar ao Financeiro"}
      </button>
    </form>
  );
}
