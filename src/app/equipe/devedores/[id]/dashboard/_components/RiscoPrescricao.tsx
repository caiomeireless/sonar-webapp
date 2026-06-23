// KPI hero do risco de prescrição intercorrente (CPC art. 921, parágrafo 4).
// Acentua URGÊNCIA: vermelho/laranja/amarelo conforme statusRisco. A page
// agrega tudo no servidor (data_distribuicao, statusRisco e diasRestantes
// já chegam prontos). Este componente só renderiza.
//
// Mapa de cores (urgência visual, fora da paleta accent padrão do KPIHero):
//   critico (<=90d)  -> vermelho
//   alto    (<=180d) -> laranja
//   medio   (<=365d) -> amarelo
//   baixo   (>365d)  -> gold (acentuado, sem alarme)
//   sem_dados        -> neutral

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { formatData } from "@/lib/format";
import type { RiscoPrescricao as RiscoPrescricaoMetric } from "@/lib/dashboard-caso";

type Props = {
  metrica: RiscoPrescricaoMetric;
};

type UrgenciaStyle = {
  color: string;
  glow: string;
  label: string;
};

const URGENCIA: Record<RiscoPrescricaoMetric["statusRisco"], UrgenciaStyle> = {
  critico: {
    color: "#FF5B5B",
    glow: "0 0 24px rgba(255, 91, 91, 0.35)",
    label: "Crítico",
  },
  alto: {
    color: "#FF8A3D",
    glow: "0 0 20px rgba(255, 138, 61, 0.30)",
    label: "Alto",
  },
  medio: {
    color: "#F4C542",
    glow: "0 0 16px rgba(244, 197, 66, 0.25)",
    label: "Médio",
  },
  baixo: {
    color: "var(--color-gold)",
    glow: "none",
    label: "Baixo",
  },
  sem_dados: {
    color: "var(--color-ivory-66)",
    glow: "none",
    label: "Sem dados",
  },
};

const INFO =
  "Prescrição intercorrente — CPC art. 921, parágrafo 4:\n" +
  "decorridos 5 anos da suspensão sem manifestação útil,\n" +
  "começa a correr o prazo de prescrição intercorrente.\n\n" +
  "Janela = data de distribuição + 5 anos.\n\n" +
  "Faixas de risco:\n" +
  "  <= 90 dias  crítico (ação imediata)\n" +
  "  <= 180 dias alto\n" +
  "  <= 365 dias médio\n" +
  "  > 365 dias  baixo";

export default function RiscoPrescricao({ metrica }: Props) {
  const { statusRisco, diasRestantes, dataDistribuicao } = metrica;
  const estilo = URGENCIA[statusRisco];

  // Estado "sem dados" — card neutro, sem alarme.
  if (statusRisco === "sem_dados" || diasRestantes === null) {
    return (
      <DashboardCard
        titulo="Risco de prescrição"
        accent="neutral"
        info={INFO}
      >
        <div className="flex flex-col gap-2">
          <div className="text-4xl font-medium leading-none tracking-tight text-[var(--color-ivory-66)]">
            —
          </div>
          <p className="text-xs text-[var(--color-ivory-66)]">
            Data de distribuição indisponível
          </p>
        </div>
      </DashboardCard>
    );
  }

  // Já prescreveu? diasRestantes <= 0.
  const prescrito = diasRestantes <= 0;
  const valorPrincipal = prescrito
    ? `${Math.abs(diasRestantes)} dias`
    : `${diasRestantes} dias`;
  const subtitulo = prescrito
    ? "Prazo fatal vencido"
    : "até prescrever";

  // Accent do card segue a severidade — crítico/alto recebem o anel de aviso
  // gold do DashboardCard pra puxar o olho; baixo fica green pra não gritar.
  const cardAccent = statusRisco === "baixo" ? "green" : "gold";

  return (
    <DashboardCard
      titulo="Risco de prescrição"
      accent={cardAccent}
      info={INFO}
    >
      <div className="flex flex-col gap-2">
        <div
          className="text-4xl font-medium leading-none tracking-tight"
          style={{
            color: estilo.color,
            textShadow: estilo.glow,
          }}
        >
          {valorPrincipal}
        </div>
        <p className="text-xs text-[var(--color-ivory-66)]">
          {subtitulo}
          {dataDistribuicao
            ? ` · distribuído em ${formatData(dataDistribuicao)}`
            : ""}
        </p>
        <div
          className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
          style={{
            background: `color-mix(in srgb, ${estilo.color} 14%, transparent)`,
            color: estilo.color,
            border: `1px solid color-mix(in srgb, ${estilo.color} 30%, transparent)`,
          }}
        >
          <span aria-hidden>●</span>
          {estilo.label}
          <span className="text-[var(--color-ivory-66)] normal-case tracking-normal">
            · CPC 921 §4º
          </span>
        </div>
      </div>
    </DashboardCard>
  );
}
