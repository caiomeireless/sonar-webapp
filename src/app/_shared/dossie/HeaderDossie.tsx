// Header da FICHA DO DEVEDOR (reforma 25/08, ditado do Caio):
// SEM card atrás, SEM ícone PF/PJ, eyebrow "Ficha do Devedor", nome
// vermelho com contorno branco e etiquetas na ordem: tipo → em quantos
// processos aparece → débito ativo → última medida.
// O atalho Dashboard Analítico saiu da visão da EQUIPE (o dashboard vive
// no fim da própria ficha) mas continua opcional pro portal do CLIENTE.
import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { formatData } from "@/lib/format";

export type DevedorHeader = {
  id: number;
  nome: string;
  tipo: "PF" | "PJ";
  documento: string;
  data_nascimento?: string | null;
  nome_mae?: string | null;
  criado_em: string;
  ultima_consulta_em?: string | null;
};

export function HeaderDossie({
  devedor,
  statusLabel,
  statusColor,
  processos,
  ultimaMedidaEm,
  dashboardHref,
}: {
  devedor: DevedorHeader;
  statusLabel: string;
  statusColor: string;
  /** Em quantos processos o devedor aparece (etiqueta 2). */
  processos?: number;
  /** Data da última medida tomada (etiqueta 4). */
  ultimaMedidaEm?: string | null;
  /** Atalho pro dashboard — SÓ o portal do cliente usa. */
  dashboardHref?: string | null;
}) {
  return (
    <header className="mt-10 text-center">
      <div className="inline-flex items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-block h-px w-10 bg-[var(--color-signal)] opacity-60 sm:w-14"
        />
        <span className="font-mono font-medium uppercase tracking-[0.34em] text-[14px] text-[var(--color-signal)]">
          Ficha do Devedor
        </span>
        <span
          aria-hidden="true"
          className="inline-block h-px w-10 bg-[var(--color-signal)] opacity-60 sm:w-14"
        />
      </div>

      <h1
        className="nome-devedor mt-4 break-words font-serif text-[clamp(28px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.06em] text-[var(--color-devedor)]"
        style={{ WebkitTextStroke: "1px rgba(255,255,255,0.6)" }}
      >
        {devedor.nome}
      </h1>

      {/* Etiquetas — sempre da esquerda pra direita nesta ordem. */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <BadgeFicha
          label={devedor.tipo === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
          color="var(--color-gold)"
        />
        {typeof processos === "number" ? (
          <BadgeFicha
            label={`Aparece em ${processos} ${processos === 1 ? "Processo" : "Processos"}`}
            color="var(--color-ivory-88)"
          />
        ) : null}
        <BadgeFicha label={`Débito ${statusLabel}`} color={statusColor} dot />
        <BadgeFicha
          label={
            ultimaMedidaEm
              ? `Última Medida ${formatData(ultimaMedidaEm)}`
              : "Sem Medida Registrada"
          }
          color="var(--color-ivory-66)"
        />
      </div>

      {dashboardHref ? (
        <Link href={dashboardHref} className="btn-neon-signal group mt-6">
          <BarChart3 className="h-5 w-5" aria-hidden="true" />
          Dashboard Analítico
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </header>
  );
}

function BadgeFicha({
  label,
  color,
  dot = false,
}: {
  label: string;
  color: string;
  dot?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[12px] uppercase tracking-[0.22em]"
      style={{
        borderColor: color,
        color,
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      ) : null}
      {label}
    </span>
  );
}
