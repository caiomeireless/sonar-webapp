// 4 KPIs do topo do Painel de Pedidos de Demo.
// Server Component puro — recebe a lista ja pronta e so calcula stats.
//
// Numero "Total" usa cor purpura (#c084fc) — combina com o botao
// "Versao Demo" da landing. Os outros usam accent existente (signal,
// gold, neutral).

import { Mail, CheckCircle2, Clock, Sparkles } from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import type { DemoToken } from "@/lib/demo-tokens";

const TTL_MS = 24 * 60 * 60 * 1000; // 24h — mesmo do lib/demo-tokens

type Props = {
  demos: DemoToken[];
};

export function KPIsDemos({ demos }: Props) {
  const agora = Date.now();
  const total = demos.length;
  const consumidos = demos.filter((d) => d.consumidoEm).length;

  // Pendentes = ainda dentro do TTL e nao consumidos.
  const pendentes = demos.filter((d) => {
    if (d.consumidoEm) return false;
    const criado = new Date(d.criadoEm).getTime();
    return agora - criado <= TTL_MS;
  }).length;

  const ULTIMAS_24H_MS = 24 * 60 * 60 * 1000;
  const ultimas24h = demos.filter((d) => {
    const criado = new Date(d.criadoEm).getTime();
    return agora - criado <= ULTIMAS_24H_MS;
  }).length;

  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {/* Card Total — destaque purpura (cor da Versao Demo) */}
      <CardTotalPurpura titulo="Total" valor={total} icon={<Mail className="h-4 w-4" />} />

      <DashboardCard titulo="Pendentes" accent="gold">
        <div className="flex items-baseline justify-between">
          <p
            className="mt-2 text-2xl font-medium leading-none tabular-nums tracking-tight sm:text-3xl md:text-4xl"
            style={{ color: "var(--color-gold)" }}
          >
            {pendentes}
          </p>
          <Clock className="h-4 w-4 text-[var(--color-gold)]" aria-hidden />
        </div>
        <p className="mt-2 text-xs text-fg-faint">
          Codigo gerado, ainda dentro do prazo
        </p>
      </DashboardCard>

      <DashboardCard titulo="Consumidos" accent="green">
        <div className="flex items-baseline justify-between">
          <p
            className="mt-2 text-2xl font-medium leading-none tabular-nums tracking-tight sm:text-3xl md:text-4xl"
            style={{ color: "var(--color-signal)" }}
          >
            {consumidos}
          </p>
          <CheckCircle2 className="h-4 w-4 text-[var(--color-signal)]" aria-hidden />
        </div>
        <p className="mt-2 text-xs text-fg-faint">
          Visitante entrou no portal demo
        </p>
      </DashboardCard>

      <DashboardCard titulo="Ultimas 24h" accent="neutral">
        <div className="flex items-baseline justify-between">
          <p
            className="mt-2 text-2xl font-medium leading-none tabular-nums tracking-tight sm:text-3xl md:text-4xl"
            style={{ color: "var(--color-fg)" }}
          >
            {ultimas24h}
          </p>
          <Sparkles className="h-4 w-4 text-[var(--color-fg-muted)]" aria-hidden />
        </div>
        <p className="mt-2 text-xs text-fg-faint">
          Pedidos no ultimo dia
        </p>
      </DashboardCard>
    </section>
  );
}

// Card "Total" customizado — usa a paleta purpura da Versao Demo (#c084fc).
// Replica a estrutura do DashboardCard manualmente porque o componente
// nao aceita cor custom no bullet/eyebrow (so signal/gold/neutral).
function CardTotalPurpura({
  titulo,
  valor,
  icon,
}: {
  titulo: string;
  valor: number;
  icon: React.ReactNode;
}) {
  const PURPURA = "#c084fc";
  return (
    <section
      className="glass relative overflow-hidden p-5 text-fg ring-1"
      style={{
        boxShadow: "0 0 0 1px rgba(168,85,247,0.20)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full blur-2xl"
        style={{ background: "rgba(168,85,247,0.16)" }}
      />
      <header className="relative mb-4">
        <div
          className="eyebrow flex items-center gap-2"
          style={{ color: PURPURA }}
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: PURPURA,
              boxShadow: "0 0 10px rgba(168,85,247,0.55)",
            }}
          />
          {titulo}
        </div>
      </header>
      <div className="relative">
        <div className="flex items-baseline justify-between">
          <p
            className="mt-2 text-2xl font-medium leading-none tabular-nums tracking-tight sm:text-3xl md:text-4xl"
            style={{ color: PURPURA }}
          >
            {valor}
          </p>
          <span style={{ color: PURPURA }} aria-hidden>
            {icon}
          </span>
        </div>
        <p className="mt-2 text-xs text-fg-faint">
          Pedidos de demo recebidos
        </p>
      </div>
    </section>
  );
}
