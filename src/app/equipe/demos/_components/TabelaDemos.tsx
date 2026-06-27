// Tabela cronologica dos pedidos de demo da landing.
// Server Component — recebe a lista ja consultada.
//
// Estrutura espelha o padrao do /equipe/custos:
//  - header JetBrains 11px uppercase tracking 0.20em + fg-muted
//  - linhas separadas por border-line/50
//  - nomes em font-mono, e-mails em font-mono menor
//  - status como pill colorido (espelho do rotuloStatusBug)
//
// Sem acoes destrutivas — so leitura.

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { DemoToken } from "@/lib/demo-tokens";

const TTL_MS = 24 * 60 * 60 * 1000; // 24h

type StatusInfo = { label: string; color: string };

// Decide o status do token a partir do consumidoEm + criadoEm.
function statusDemo(d: DemoToken): StatusInfo {
  if (d.consumidoEm) {
    return { label: "Consumido", color: "var(--color-signal)" };
  }
  const criado = new Date(d.criadoEm).getTime();
  if (Date.now() - criado > TTL_MS) {
    // Gold escuro pra "expirado" — usa color-mix pra abafar o dourado vivo.
    return { label: "Expirado", color: "color-mix(in srgb, var(--color-gold) 70%, #000)" };
  }
  return { label: "Pendente", color: "#c084fc" };
}

// Tempo relativo customizado: "ha 2 min" / "hoje 14:32" / "ontem 18:15" /
// data DD/MM/YYYY. O helper global formatTempoRelativo nao tem granularidade
// de minutos (so dias), entao tem um aqui.
function formatQuando(iso: string): string {
  const ts = new Date(iso);
  if (Number.isNaN(ts.getTime())) return "—";

  const agora = new Date();
  const diffMs = agora.getTime() - ts.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `ha ${diffMin} min`;

  const hh = String(ts.getHours()).padStart(2, "0");
  const mm = String(ts.getMinutes()).padStart(2, "0");

  // Mesmo dia?
  const mesmoDia =
    ts.getFullYear() === agora.getFullYear() &&
    ts.getMonth() === agora.getMonth() &&
    ts.getDate() === agora.getDate();
  if (mesmoDia) return `hoje ${hh}:${mm}`;

  // Ontem?
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  const foiOntem =
    ts.getFullYear() === ontem.getFullYear() &&
    ts.getMonth() === ontem.getMonth() &&
    ts.getDate() === ontem.getDate();
  if (foiOntem) return `ontem ${hh}:${mm}`;

  const dd = String(ts.getDate()).padStart(2, "0");
  const mes = String(ts.getMonth() + 1).padStart(2, "0");
  const yyyy = ts.getFullYear();
  return `${dd}/${mes}/${yyyy}`;
}

function truncar(s: string | null, max: number): { texto: string; cortado: boolean } {
  const t = (s ?? "").trim();
  if (!t) return { texto: "—", cortado: false };
  if (t.length <= max) return { texto: t, cortado: false };
  return { texto: t.slice(0, max).trimEnd() + "…", cortado: true };
}

function PillTipo({ tipo }: { tipo: DemoToken["tipo"] }) {
  const cor =
    tipo === "equipe" ? "var(--color-signal)" : "var(--color-devedor)";
  const label = tipo === "equipe" ? "EQUIPE" : "CLIENTE";
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em]"
      style={{
        color: cor,
        backgroundColor: `color-mix(in srgb, ${cor} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${cor} 45%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}

function PillStatus({ status }: { status: StatusInfo }) {
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em]"
      style={{
        color: status.color,
        backgroundColor: `color-mix(in srgb, ${status.color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${status.color} 45%, transparent)`,
      }}
    >
      {status.label}
    </span>
  );
}

type Props = {
  demos: DemoToken[];
};

export function TabelaDemos({ demos }: Props) {
  return (
    <DashboardCard titulo="Solicitações recentes" accent="neutral">
      {demos.length === 0 ? (
        <p className="py-10 text-center text-sm italic text-[var(--color-ivory-66)]">
          Quando alguém pedir uma demo na landing, o pedido aparece aqui.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left font-mono text-[11px] uppercase tracking-[0.20em] text-[var(--color-fg-muted)]">
                <th className="py-3 pr-4">Quando</th>
                <th className="py-3 pr-4">Tipo</th>
                <th className="py-3 pr-4">Nome</th>
                <th className="py-3 pr-4">E-mail</th>
                <th className="py-3 pr-4">Motivo</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {demos.map((d) => {
                const motivo = truncar(d.motivo, 60);
                const st = statusDemo(d);
                return (
                  <tr
                    key={d.codigo}
                    className="border-b border-[var(--color-line)]/50"
                  >
                    <td className="py-3 pr-4 font-mono text-[12px] uppercase tracking-[0.06em] text-[var(--color-fg-muted)]">
                      {formatQuando(d.criadoEm)}
                    </td>
                    <td className="py-3 pr-4">
                      <PillTipo tipo={d.tipo} />
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm uppercase tracking-[0.06em] text-[var(--color-fg)]">
                      {d.nomeVisitante || "—"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[12px] text-[var(--color-ivory-88)]">
                      {d.emailVisitante || "—"}
                    </td>
                    <td
                      className="py-3 pr-4 text-sm text-[var(--color-ivory-88)]"
                      title={motivo.cortado ? (d.motivo ?? "") : undefined}
                    >
                      {motivo.texto}
                    </td>
                    <td className="py-3 pr-4">
                      <PillStatus status={st} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
