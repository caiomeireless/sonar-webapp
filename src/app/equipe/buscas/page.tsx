// Central de Buscas — hub que agrupa as três frentes de localização:
// Banco de Dossiês (ex-Banco de Devedores), Buscas Pré-Processuais
// (ex-Consultas Pré-Processuais) e Rotas das Execuções (ex-Fila Themis).
// As rotas antigas continuam valendo — aqui é só a porta de entrada.
import Link from "next/link";
import { ArrowRight, FileSearch, Search, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const CARDS = [
  {
    href: "/equipe/devedores",
    titulo: "Banco de Dossiês",
    descricao:
      "Todos os devedores rastreados com dossiê completo: dados, débitos, bens e mapa patrimonial.",
    Icon: Users,
  },
  {
    href: "/equipe/consultas",
    titulo: "Buscas Pré-Processuais",
    descricao:
      "Antes de processar, descubra se o devedor é solvente — análises de viabilidade preventivas.",
    Icon: Search,
  },
  {
    href: "/equipe/themis",
    titulo: "Rotas das Execuções",
    descricao:
      "A trajetória de cada execução: o que já foi feito, em que fase está e o que falta pra satisfazer o crédito.",
    Icon: FileSearch,
  },
];

export default function CentralDeBuscasPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-12 sm:px-10">
      <header className="title-shield mb-10 text-center">
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Central de Buscas
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Localização de Bens e Devedores
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        {CARDS.map(({ href, titulo, descricao, Icon }) => (
          <Link
            key={href}
            href={href}
            className="glass group flex flex-col p-7 transition hover:border-[var(--color-signal-soft-2)] hover:shadow-[0_0_28px_-12px_rgba(60,255,138,0.45)]"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-signal-soft)]">
              <Icon className="h-6 w-6 text-[var(--color-signal)]" />
            </div>
            <h2 className="mt-5 font-serif text-xl text-ivory transition group-hover:text-[var(--color-signal)]">
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
