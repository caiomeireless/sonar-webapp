"use client";

// Retoma uma análise parada SEM precisar do PDF: se todos os lotes já estão
// gravados, roda as duas etapas da consolidação direto do banco e abre a
// ficha. Se faltam lotes, diz quantos — e aí o caminho é arrastar o mesmo
// arquivo de novo.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { estadoRetomada } from "../actions";

async function postar(url: string, corpo: unknown): Promise<unknown> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!r.ok) {
    const j = (await r.json().catch(() => null)) as { erro?: string } | null;
    throw new Error(j?.erro ?? `Falha na requisição (${r.status}).`);
  }
  return r.json();
}

export function BotaoRetomar({
  analiseId,
  euDev,
}: {
  analiseId: number;
  euDev: string | null;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<
    "parado" | "conferindo" | "fatos" | "juizo" | "erro"
  >("parado");
  const [aviso, setAviso] = useState<string | null>(null);

  async function retomar() {
    setAviso(null);
    try {
      setEstado("conferindo");
      const r = await estadoRetomada(analiseId);
      if (!r) throw new Error("Análise não encontrada.");
      if (r.lotesLidos < r.totalLotes) {
        setEstado("parado");
        setAviso(
          `${r.lotesLidos} de ${r.totalLotes} lotes lidos — arraste o mesmo PDF de novo para continuar.`,
        );
        return;
      }
      if (!r.temFatos) {
        setEstado("fatos");
        await postar("/api/autos/consolidar-fatos", { analiseId });
      }
      setEstado("juizo");
      await postar("/api/autos/consolidar-juizo", { analiseId });

      const eu = euDev ? `&eu=${encodeURIComponent(euDev)}` : "";
      router.push(`/equipe/autos?analise=${analiseId}${eu}`);
      router.refresh();
    } catch (e) {
      setEstado("erro");
      setAviso(e instanceof Error ? e.message : "Falha ao retomar.");
    }
  }

  const ocupado =
    estado === "conferindo" || estado === "fatos" || estado === "juizo";

  return (
    <span className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={() => void retomar()}
        disabled={ocupado}
        className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,162,74,0.45)] bg-[rgba(201,162,74,0.10)] px-3 py-1 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-gold)] transition hover:bg-[rgba(201,162,74,0.18)] disabled:opacity-60"
      >
        <RotateCcw
          className={`h-3.5 w-3.5 ${ocupado ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {estado === "conferindo" && "Conferindo"}
        {estado === "fatos" && "Apurando os fatos"}
        {estado === "juizo" && "Julgando"}
        {(estado === "parado" || estado === "erro") && "Retomar"}
      </button>
      {aviso && (
        <span
          className="max-w-[320px] text-right text-[12px] leading-snug"
          style={{ color: estado === "erro" ? "#FF5B5B" : "#F4C542" }}
        >
          {aviso}
        </span>
      )}
    </span>
  );
}
