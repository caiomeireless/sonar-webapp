// Central Administrativa — hub das ferramentas de gestão da plataforma:
// Monitor de Custos, Comunicação de Custos (ressarcimento -> BP INTERNAL),
// Notificações, Comunicação de Bugs, Modo de Visualização (ver como
// cliente) e Configurações da Plataforma.
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bug,
  DollarSign,
  Eye,
  Receipt,
  Settings,
} from "lucide-react";

export const dynamic = "force-dynamic";

const CARDS = [
  {
    href: "/equipe/custos",
    titulo: "Monitor de Custos",
    descricao:
      "Gastos com APIs pagas por advogado, cliente e devedor — com teto mensal e filtros.",
    Icon: DollarSign,
  },
  {
    href: "/equipe/comunicacao-custos",
    titulo: "Comunicação de Custos",
    descricao:
      "Pagou pesquisa do bolso (RI Digital, Registro Civil)? Envie o recibo pro financeiro repassar ao cliente.",
    Icon: Receipt,
  },
  {
    href: "/equipe/notificacoes",
    titulo: "Notificações",
    descricao: "Eventos do escritório em ordem cronológica, num só lugar.",
    Icon: Bell,
  },
  {
    href: "/equipe/bugs",
    titulo: "Comunicação de Bugs",
    descricao:
      "Encontrou algo estranho? Registre aqui e acompanhe o status da correção.",
    Icon: Bug,
  },
  {
    href: "/equipe/ver-como",
    titulo: "Modo de Visualização",
    descricao:
      "Veja a plataforma exatamente como um cliente escolhido enxerga o portal dele.",
    Icon: Eye,
  },
  {
    href: "/equipe/configuracoes",
    titulo: "Configurações da Plataforma",
    descricao:
      "Clientes do portal, convites de acesso, usuários e administração geral.",
    Icon: Settings,
  },
];

export default function CentralAdministrativaPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-12 sm:px-10">
      <header className="title-shield mb-10 text-center">
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Central Administrativa
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Gestão da Plataforma
        </p>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map(({ href, titulo, descricao, Icon }) => (
          <Link
            key={href}
            href={href}
            className="glass group flex flex-col p-7 transition hover:border-[var(--color-gold)]/50 hover:shadow-[0_0_28px_-12px_rgba(201,162,74,0.5)]"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-gold)]/12">
              <Icon className="h-6 w-6 text-[var(--color-gold)]" />
            </div>
            <h2 className="mt-5 font-serif text-xl text-ivory transition group-hover:text-[var(--color-gold)]">
              {titulo}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-ivory-66)]">
              {descricao}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-gold)]">
              Abrir <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
