// Aba Início — CONSOLE SONAR v2 (21/08, desenhada À MÃO com o Caio):
//   - Cabeçalho em PLACAS DE METAL escovado ("Console Sonar · data" e
//     "Boas-Vindas, Nome.")
//   - MONITOR DE RADAR NAVAL em CSS (ref.: foto ONWA KR-1901 do Caio) com
//     os dados dentro: últimas localizações, últimas movimentações e o
//     painel de números da plataforma em caixinhas de fósforo verde
//   - GLOBO da landing (WireframeGlobe) girando ATRÁS do monitor —
//     localizador de patrimônios global
//   - Fundo EXATO da faixa 2 (hero) da landing page
//   - Menu radial menor à direita
import { redirect } from "next/navigation";

import { perfilLogado } from "@/lib/perfis-server";
import { obterDadosConsole } from "@/lib/console-inicio";
import { CATEGORIAS_RADAR } from "@/lib/radar";
import { formatBRL, formatData } from "@/lib/format";
import { WireframeGlobe } from "@/components/ui/WireframeGlobe";
import RadialHub from "@/components/ui/RadialHub";
import { ITENS_RADIAL_EQUIPE } from "@/components/ui/itens-radial-equipe";

import { NumeroTicker } from "./_components/NumeroTicker";

export const dynamic = "force-dynamic";

// Fundo EXATO da faixa 2 (hero) da landing — copiado literal de app/page.tsx.
const FUNDO_FAIXA_2 =
  "radial-gradient(ellipse 55% 50% at 90% 12%, rgba(60, 255, 138, 0.14) 0%, transparent 70%), linear-gradient(to right, #000000 0%, #000000 50%, #0a3024 100%)";

const DIAS_SEMANA = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

const ROTULO_TIPO_BEM: Record<string, string> = {
  imovel: "Imóvel",
  veiculo: "Veículo",
  empresa: "Empresa",
  credito: "Crédito",
  processo: "Processo",
};

// Placa de metal escovado com parafusos nos cantos.
function PlacaMetal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`placa-metal inline-block ${className}`}>
      <span className="placa-parafuso left-1.5 top-1.5" aria-hidden="true" />
      <span className="placa-parafuso right-1.5 top-1.5" aria-hidden="true" />
      <span className="placa-parafuso bottom-1.5 left-1.5" aria-hidden="true" />
      <span className="placa-parafuso bottom-1.5 right-1.5" aria-hidden="true" />
      {children}
    </div>
  );
}

// Linha rótulo/valor do painel verde (estilo KR-1901).
function LinhaPainel({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-2.5 py-1.5">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-signal)]/75">
        {rotulo}
      </span>
      <span className="font-mono text-[13px] font-semibold tabular-nums text-[var(--color-signal)]">
        {children}
      </span>
    </div>
  );
}

export default async function InicioPage() {
  const perfil = await perfilLogado();
  if (!perfil && process.env.NODE_ENV === "production") redirect("/login");

  const nome = perfil?.nome?.trim() || perfil?.email || "Equipe";
  const primeiroNome = nome.split(" ")[0];
  const dados = await obterDadosConsole();

  const agora = new Date();
  const dataLonga = `${DIAS_SEMANA[agora.getDay()]}, ${formatData(agora.toISOString())}`;
  const rotuloCategoria = new Map(
    CATEGORIAS_RADAR.map((c) => [c.chave, c.rotulo]),
  );

  return (
    <main className="relative min-h-[calc(100svh-160px)] overflow-hidden">
      {/* Fundo exato da faixa 2 da landing */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: FUNDO_FAIXA_2 }}
      />

      <div className="relative z-10 mx-auto max-w-[1560px] px-6 py-10 sm:px-10">
        {/* ===== Cabeçalho: placas de metal ===== */}
        <header className="flex flex-col items-center gap-3 text-center">
          <PlacaMetal className="px-6 py-2">
            <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-[var(--color-signal)]">
              Console Sonar · {dataLonga}
            </p>
          </PlacaMetal>
          <PlacaMetal className="px-10 py-3">
            <h1 className="font-serif text-[clamp(20px,2.6vw,34px)] uppercase tracking-[0.06em] text-[var(--color-gold)]">
              Boas-Vindas, {primeiroNome}.
            </h1>
          </PlacaMetal>
        </header>

        {/* ===== Palco: globo atrás + monitor na frente | radial à direita ===== */}
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_320px]">
          <div className="relative">
            {/* Globo terrestre girando atrás do monitor (o mesmo da landing) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[-120px] z-0 hidden h-[640px] w-[980px] -translate-x-1/2 md:block"
            >
              <WireframeGlobe
                width={980}
                height={640}
                globeCenterX={490}
                globeCenterY={300}
              />
            </div>

            {/* ===== O MONITOR (ref.: ONWA KR-1901) ===== */}
            <div className="monitor-carcaca relative z-10 mx-auto w-full max-w-[900px] p-5 sm:p-7">
              {/* Parafusos laterais da carcaça */}
              <span className="placa-parafuso left-2.5 top-1/3" aria-hidden="true" />
              <span className="placa-parafuso left-2.5 top-2/3" aria-hidden="true" />
              <span className="placa-parafuso right-2.5 top-1/3" aria-hidden="true" />
              <span className="placa-parafuso right-2.5 top-2/3" aria-hidden="true" />

              {/* Marca no canto superior esquerdo */}
              <p className="mb-3 font-mono text-[12px] font-semibold uppercase tracking-[0.3em] text-[var(--color-ivory-88)]">
                Sonar<span className="text-[var(--color-gold)]">®</span>
              </p>

              {/* Tela */}
              <div className="monitor-tela crt-scan overflow-hidden p-4 sm:p-5">
                <div className="grid gap-5 md:grid-cols-[1fr_250px]">
                  {/* --- Coluna esquerda: artes --- */}
                  <div className="min-w-0">
                    {/* Últimas Localizações */}
                    <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.24em] text-[var(--color-signal)]">
                      Últimas Localizações
                    </p>
                    {dados.ultimasLocalizacoes.length === 0 ? (
                      <p className="mt-2 font-mono text-[12px] text-[var(--color-signal)]/60">
                        Nenhum bem localizado ainda.
                      </p>
                    ) : (
                      <ul className="mt-2 flex flex-col">
                        {dados.ultimasLocalizacoes.map((b) => (
                          <li
                            key={b.id}
                            className="flex items-baseline justify-between gap-3 border-b border-[var(--color-signal)]/15 py-1.5 last:border-b-0"
                          >
                            <span className="min-w-0">
                              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-gold)]">
                                {ROTULO_TIPO_BEM[b.tipo] ?? b.tipo}
                              </span>{" "}
                              <span className="font-mono text-[12px] text-[var(--color-signal)]">
                                {b.titulo}
                              </span>
                              {b.devedorNome && (
                                <span className="block truncate font-mono text-[11px] text-[var(--color-signal)]/55">
                                  {b.devedorNome}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 font-mono text-[12px] font-semibold tabular-nums text-[var(--color-signal)]">
                              {b.valorBrl != null ? formatBRL(b.valorBrl) : "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Últimas Movimentações */}
                    <p className="mt-5 font-mono text-[12px] font-semibold uppercase tracking-[0.24em] text-[var(--color-signal)]">
                      Últimas Movimentações
                    </p>
                    {dados.movimentacoes.length === 0 ? (
                      <p className="mt-2 font-mono text-[12px] text-[var(--color-signal)]/60">
                        Sem movimentações de alto sinal.
                      </p>
                    ) : (
                      <ul className="mt-2 flex flex-col">
                        {dados.movimentacoes.map((a) => (
                          <li
                            key={a.id}
                            className="border-b border-[var(--color-signal)]/15 py-1.5 last:border-b-0"
                          >
                            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-gold)]">
                              {a.data_andamento ? formatData(a.data_andamento) : "—"}{" "}
                              · {rotuloCategoria.get(a.categoria) ?? a.categoria}
                            </span>
                            <span className="mt-0.5 line-clamp-1 font-mono text-[12px] text-[var(--color-signal)]/85">
                              {a.descricao}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* --- Painel direito: caixinhas estilo KR-1901 --- */}
                  <div className="flex flex-col gap-3">
                    <section className="monitor-caixa">
                      <p className="monitor-caixa-titulo px-2.5 py-1 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-signal)]">
                        Patrimônio
                      </p>
                      <LinhaPainel rotulo="Bens Localizados">
                        <NumeroTicker valor={dados.totalBens} formato="int" />
                      </LinhaPainel>
                      <LinhaPainel rotulo="Valores Encontrados">
                        <NumeroTicker valor={dados.patrimonioBrl} formato="brl" />
                      </LinhaPainel>
                    </section>

                    <section className="monitor-caixa">
                      <p className="monitor-caixa-titulo px-2.5 py-1 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-signal)]">
                        Execuções
                      </p>
                      <LinhaPainel rotulo="Casos Ativos">
                        <NumeroTicker valor={dados.casosAtivos} formato="int" />
                      </LinhaPainel>
                      <LinhaPainel rotulo="Quitações">
                        <NumeroTicker valor={dados.quitados} formato="int" />
                      </LinhaPainel>
                      <LinhaPainel rotulo="Com Acordo">
                        <NumeroTicker valor={dados.casosComAcordo} formato="int" />
                      </LinhaPainel>
                    </section>

                    <section className="monitor-caixa">
                      <p className="monitor-caixa-titulo px-2.5 py-1 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-signal)]">
                        Rastreio
                      </p>
                      <LinhaPainel rotulo="Devedores">
                        <NumeroTicker valor={dados.devedores} formato="int" />
                      </LinhaPainel>
                      <LinhaPainel rotulo="Capturas 7d">
                        <NumeroTicker valor={dados.capturas7d} formato="int" />
                      </LinhaPainel>
                    </section>
                  </div>
                </div>
              </div>

              {/* Placa de modelo + botoeira decorativa (homenagem ao KR-1901) */}
              <div className="mt-4 flex items-center justify-between">
                <span className="flex items-center gap-2" aria-hidden="true">
                  <span className="h-3 w-3 rounded-full bg-[#b3261e] shadow-[0_0_6px_rgba(255,61,90,0.8)]" />
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full border border-black/50 bg-[radial-gradient(circle_at_35%_30%,#565c5e,#2a2f31_60%)]"
                    />
                  ))}
                </span>
                <PlacaMetal className="px-4 py-1">
                  <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-ivory-88)]">
                    KR-1901
                  </span>
                </PlacaMetal>
              </div>
            </div>
          </div>

          {/* ===== Menu radial menor ===== */}
          <div className="flex justify-center lg:justify-end">
            <RadialHub
              itens={ITENS_RADIAL_EQUIPE}
              nome={nome}
              fotoUrl={perfil?.fotoUrl ?? null}
              size={300}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
