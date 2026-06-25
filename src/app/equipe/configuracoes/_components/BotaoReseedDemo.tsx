"use client";

// Botao admin pra re-rodar /api/seed-demo. So funciona se a env var
// ALLOW_DEMO_SEED=true estiver setada (rota retorna 404 senao). Util
// principalmente pra apresentacao: reseta credores/devedores/casos/
// bens/medidas pros valores de demo, com os advogados certos
// (Paulo/Remo/Filipe) preservados das medidas mock.

import { useState } from "react";
import { Database, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Estado =
  | { tipo: "ocioso" }
  | { tipo: "rodando" }
  | { tipo: "ok"; total_medidas: number; total_bens: number }
  | { tipo: "erro"; mensagem: string };

export default function BotaoReseedDemo() {
  const [estado, setEstado] = useState<Estado>({ tipo: "ocioso" });

  async function disparar() {
    if (
      !window.confirm(
        "Re-semear dados de demonstracao? Isso APAGA e recria credores, " +
          "devedores, casos, bens e medidas mock. Acoes reais cadastradas " +
          "manualmente NAO sao afetadas.",
      )
    ) {
      return;
    }
    setEstado({ tipo: "rodando" });
    try {
      const res = await fetch("/api/seed-demo", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        total_medidas?: number;
        total_bens?: number;
      };
      if (res.status === 404) {
        setEstado({
          tipo: "erro",
          mensagem:
            "Rota desativada. Configure ALLOW_DEMO_SEED=true nas variaveis de ambiente da Vercel e faca redeploy.",
        });
        return;
      }
      if (!res.ok || !body.ok) {
        setEstado({
          tipo: "erro",
          mensagem: body.error ?? `Erro HTTP ${res.status}`,
        });
        return;
      }
      setEstado({
        tipo: "ok",
        total_medidas: body.total_medidas ?? 0,
        total_bens: body.total_bens ?? 0,
      });
    } catch (e) {
      setEstado({
        tipo: "erro",
        mensagem: e instanceof Error ? e.message : "Falha desconhecida",
      });
    }
  }

  return (
    <div className="glass p-6">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-gold)]/10">
          <Database className="h-5 w-5 text-[var(--color-gold)]" />
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-xl text-ivory">Re-semear Demo</h2>
          <p className="mt-1.5 text-sm text-[var(--color-ivory-66)]">
            Recria os dados de demonstracao (3 clientes, 3 devedores, casos,
            bens, medidas mock). Idempotente — pode rodar varias vezes. Use
            quando o gr&aacute;fico &quot;Atividade da Equipe&quot; estiver mostrando s&oacute;
            um advogado ou os dados parecerem fora do esperado.
          </p>

          <button
            type="button"
            onClick={disparar}
            disabled={estado.tipo === "rodando"}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-4 py-2.5 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {estado.tipo === "rodando" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rodando…
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                Disparar seed
              </>
            )}
          </button>

          {estado.tipo === "ok" ? (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--color-signal)]/40 bg-[var(--color-signal)]/10 p-3 text-sm text-[var(--color-signal)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                Seed concluido. {estado.total_medidas} medidas e{" "}
                {estado.total_bens} bens inseridos. O gr&aacute;fico &quot;Atividade da
                Equipe&quot; ja deve mostrar Paulo, Remo e Filipe ao recarregar o
                painel.
              </div>
            </div>
          ) : null}

          {estado.tipo === "erro" ? (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--color-devedor)]/40 bg-[var(--color-devedor)]/10 p-3 text-sm text-[var(--color-devedor)]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>{estado.mensagem}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
