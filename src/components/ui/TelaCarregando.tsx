// Tela rápida de carregamento da plataforma (ditado 24/08): logo da
// faixa 1 girando 360° em 3D (eixo Y, com perspectiva) + "Carregando"
// pulsando + blur sobre o que estiver atrás. Renderizada pelos
// loading.tsx dos portais — o App Router mostra automaticamente
// enquanto a próxima página carrega.
import { LogoSvg, LogoSymbolStatic } from "@/components/LogoSvg";

export function TelaCarregando() {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-8 bg-black/70 backdrop-blur-xl">
      {/* Perspectiva no pai dá a profundidade do giro. SMIL do LogoSvg não
          pausa por CSS, então sob "reduzir movimento" troca pela variante
          100% estática do rodapé. */}
      <div className="motion-reduce:hidden" style={{ perspective: "1100px" }}>
        <div className="logo-giro-3d">
          <LogoSvg height={112} />
        </div>
      </div>
      <LogoSymbolStatic height={150} className="hidden motion-reduce:block" />

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
