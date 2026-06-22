// Helpers de formatacao usados no portal do cliente.
// Sem libs externas — Intl.NumberFormat + calculo manual de tempo relativo.

// Formato monetario BRL: SEMPRE com 2 casas decimais (vírgula de centavos).
// Instrucao Caio 2026-06-22: "todo valor em R$, na plataforma e na peca,
// sempre virgula de centavos". Sem mais maximumFractionDigits: 0.
export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Tempo relativo em PT-BR: "hoje", "ontem", "ha 2 dias", "ha 1 semana",
// "ha 3 semanas". Se mais de 30 dias, devolve data ISO curta (DD/MM/YYYY).
export function formatTempoRelativo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ts = new Date(iso);
  if (Number.isNaN(ts.getTime())) return "—";

  const agora = new Date();
  const diffMs = agora.getTime() - ts.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias <= 0) return "hoje";
  if (diffDias === 1) return "ontem";
  if (diffDias < 7) return `ha ${diffDias} dias`;
  if (diffDias < 14) return "ha 1 semana";
  if (diffDias < 30) return `ha ${Math.floor(diffDias / 7)} semanas`;

  const dd = String(ts.getDate()).padStart(2, "0");
  const mm = String(ts.getMonth() + 1).padStart(2, "0");
  const yyyy = ts.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Documento (CPF/CNPJ) — assume que ja veio formatado do banco; so trim.
export function formatDocumento(_tipo: "PF" | "PJ", doc: string): string {
  return (doc ?? "").trim();
}

// Data curta DD/MM/YYYY.
export function formatData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ts = new Date(iso);
  if (Number.isNaN(ts.getTime())) return "—";
  const dd = String(ts.getDate()).padStart(2, "0");
  const mm = String(ts.getMonth() + 1).padStart(2, "0");
  const yyyy = ts.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Status de caso -> label + cor (token CSS) para badge.
export function formatStatus(status: string): { label: string; color: string } {
  const s = (status ?? "").toLowerCase().trim();
  switch (s) {
    case "ativo":
      return { label: "Ativo", color: "var(--color-signal)" };
    case "pausado":
      return { label: "Pausado", color: "var(--color-gold)" };
    case "encerrado":
      return { label: "Encerrado", color: "var(--color-ivory-66)" };
    case "satisfeito":
      return { label: "Satisfeito", color: "var(--color-gold)" };
    default:
      return { label: status || "—", color: "var(--color-ivory-66)" };
  }
}
