// Tela de fallback (devedor nao encontrado / acesso restrito).
// Generica: aceita titulo, copy, label e href do botao "Voltar".
import Link from "next/link";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export function AcessoNegado({
  eyebrow = "Não encontrado",
  titulo = "Devedor não localizado",
  copy = "O identificador informado não corresponde a nenhum devedor cadastrado.",
  voltarHref,
  voltarLabel = "← Voltar para devedores",
}: {
  eyebrow?: string;
  titulo?: string;
  copy?: string;
  voltarHref: string;
  voltarLabel?: string;
}) {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10">
      <div className="grid place-items-center">
        <SpotlightCard className="max-w-[520px] p-10 text-center">
          <span className="eyebrow !text-[var(--color-gold)]">{eyebrow}</span>
          <h3 className="mt-4 font-serif text-2xl text-ivory">{titulo}</h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">{copy}</p>
          <Link
            href={voltarHref}
            className="mt-6 inline-block rounded-lg border border-[var(--color-ivory-22)] bg-white/5 px-4 py-2 text-xs font-medium text-ivory transition hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          >
            {voltarLabel}
          </Link>
        </SpotlightCard>
      </div>
    </main>
  );
}
