// Tela rápida de carregamento da plataforma (ditado 23/08): símbolo verde
// animado (escada + emissor + ondas) + "Carregando" pulsando + blur sobre
// o que estiver atrás. Renderizada pelos loading.tsx dos portais — o App
// Router mostra automaticamente enquanto a próxima página carrega.
import { SimboloSonar } from "@/components/ui/SimboloSonar";

export function TelaCarregando() {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-7 bg-black/70 backdrop-blur-xl">
      {/* SMIL não pausa por CSS: com "reduzir movimento" ativo, troca pela
          variante estática do símbolo. */}
      <SimboloSonar height={128} className="motion-reduce:hidden" />
      <SimboloSonar
        height={128}
        animado={false}
        className="hidden motion-reduce:block"
      />
      <p className="flex items-baseline font-mono text-[13px] uppercase tracking-[0.34em] text-[var(--color-signal)]">
        Carregando
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className="animate-bounce motion-reduce:animate-none"
            style={{ animationDelay: `${i * 160}ms` }}
          >
            .
          </span>
        ))}
      </p>
    </div>
  );
}
