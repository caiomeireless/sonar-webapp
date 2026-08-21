// Aba Início — CONSOLE SONAR v3 (21/08, iteração manual com o Caio):
//   - Fundo TODO PRETO
//   - Cabeçalho em PLACAS METÁLICAS REATIVAS (ref. 21st "metallic business
//     card" — reflexo segue o mouse; ui/PlacaMetalica) com a fonte do
//     wordmark "Sonar" da faixa 1 (Manrope larga — .placa-texto)
//   - METADE DE CIMA do globo da landing girando logo abaixo das placas
//   - PAINEL horizontal de vidro translúcido nascendo na linha de corte do
//     globo, moldura em METAL LÍQUIDO PRATA (mesmo shader do Sincronizar,
//     modo anel) — dados em cores neon variadas, com respiro
//   - Menu radial menor centrado abaixo
import { redirect } from "next/navigation";
import {
  Activity,
  Banknote,
  CheckCircle2,
  Gem,
  Handshake,
  Scale,
  Users,
} from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { obterDadosConsole } from "@/lib/console-inicio";
import { CATEGORIAS_RADAR, type CategoriaRadarChave } from "@/lib/radar";
import { formatBRL, formatData } from "@/lib/format";
import { WireframeGlobe } from "@/components/ui/WireframeGlobe";
import { PlacaMetalica } from "@/components/ui/PlacaMetalica";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";

import { NumeroTicker } from "./_components/NumeroTicker";
import RadialMenor from "./_components/RadialMenor";

export const dynamic = "force-dynamic";

const DIAS_SEMANA = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

// Paleta neon do painel (verde + laranja combinados com vizinhas).
const NEON = {
  verde: "#3CFF8A",
  laranja: "#FF9C41",
  ciano: "#38BDF8",
  violeta: "#C084FC",
  amarelo: "#FFD93D",
  rosa: "#FB7185",
  turquesa: "#2DD4BF",
};

const COR_TIPO_BEM: Record<string, string> = {
  imovel: NEON.laranja,
  veiculo: NEON.ciano,
  empresa: NEON.violeta,
  credito: NEON.amarelo,
  processo: NEON.turquesa,
};
const ROTULO_TIPO_BEM: Record<string, string> = {
  imovel: "Imóvel",
  veiculo: "Veículo",
  empresa: "Empresa",
  credito: "Crédito",
  processo: "Processo",
};

const COR_CATEGORIA: Record<CategoriaRadarChave, string> = {
  bloqueio: NEON.verde,
  veiculos: NEON.laranja,
  expropriacao: NEON.amarelo,
  penhora: NEON.turquesa,
  defesa: NEON.rosa,
  citacao: NEON.violeta,
  pagamento: NEON.ciano,
};

function Chip({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em]"
      style={{
        color: cor,
        backgroundColor: `color-mix(in srgb, ${cor} 13%, transparent)`,
        border: `1px solid color-mix(in srgb, ${cor} 45%, transparent)`,
      }}
    >
      {children}
    </span>
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

  const ESTATISTICAS: {
    rotulo: string;
    valor: number;
    formato: "brl" | "int";
    cor: string;
    Icon: typeof Gem;
  }[] = [
    { rotulo: "Bens Localizados", valor: dados.totalBens, formato: "int", cor: NEON.verde, Icon: Gem },
    { rotulo: "Valores Encontrados", valor: dados.patrimonioBrl, formato: "brl", cor: NEON.laranja, Icon: Banknote },
    { rotulo: "Casos Ativos", valor: dados.casosAtivos, formato: "int", cor: NEON.ciano, Icon: Scale },
    { rotulo: "Quitações", valor: dados.quitados, formato: "int", cor: NEON.violeta, Icon: CheckCircle2 },
    { rotulo: "Com Acordo", valor: dados.casosComAcordo, formato: "int", cor: NEON.amarelo, Icon: Handshake },
    { rotulo: "Devedores", valor: dados.devedores, formato: "int", cor: NEON.rosa, Icon: Users },
    { rotulo: "Capturas 7d", valor: dados.capturas7d, formato: "int", cor: NEON.turquesa, Icon: Activity },
  ];

  return (
    <main className="relative min-h-[calc(100svh-160px)] overflow-hidden">
      {/* Fundo TODO preto */}
      <div aria-hidden="true" className="absolute inset-0 bg-black" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 pb-14 pt-10 sm:px-10">
        {/* ===== Placas metálicas ===== */}
        <header className="relative z-20 flex flex-col items-center gap-4 text-center">
          <PlacaMetalica metal="prata" className="px-7 py-2.5">
            <p className="placa-texto text-[13px]">
              Console Sonar · {dataLonga}
            </p>
          </PlacaMetalica>
          <PlacaMetalica metal="gold" className="px-10 py-4 sm:px-14">
            <h1 className="placa-texto text-[clamp(18px,2.4vw,30px)]">
              Boas-Vindas, {primeiroNome}.
            </h1>
          </PlacaMetalica>
        </header>

        {/* ===== Metade de cima do globo ===== */}
        <div
          aria-hidden="true"
          className="relative mt-6 h-[320px] overflow-hidden"
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-[640px] w-[1040px] -translate-x-1/2">
            <WireframeGlobe
              width={1040}
              height={640}
              globeCenterX={520}
              globeCenterY={320}
            />
          </div>
        </div>

        {/* ===== Painel de vidro com moldura de metal líquido PRATA ===== */}
        <BordaLiquidaMetal
          cor="prata"
          anel
          radius={24}
          className="relative z-10 -mt-1 block"
        >
          <div
            className="rounded-[21px] px-7 py-9 backdrop-blur-xl sm:px-12"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015) 30%, rgba(10,14,12,0.5))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            {/* --- Linha de estatísticas neon --- */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4 xl:grid-cols-7">
              {ESTATISTICAS.map(({ rotulo, valor, formato, cor, Icon }) => (
                <div
                  key={rotulo}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: cor, filter: `drop-shadow(0 0 7px ${cor})` }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[clamp(20px,1.6vw,26px)] font-semibold leading-none"
                    style={{
                      color: cor,
                      textShadow: `0 0 18px color-mix(in srgb, ${cor} 55%, transparent)`,
                    }}
                  >
                    <NumeroTicker valor={valor} formato={formato} />
                  </span>
                  <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
                    {rotulo}
                  </span>
                </div>
              ))}
            </div>

            <div className="my-9 h-px bg-white/10" />

            {/* --- Últimas localizações + movimentações --- */}
            <div className="grid gap-10 md:grid-cols-2">
              <section>
                <h2
                  className="font-mono text-[13px] font-semibold uppercase tracking-[0.26em]"
                  style={{ color: NEON.verde, textShadow: `0 0 14px color-mix(in srgb, ${NEON.verde} 50%, transparent)` }}
                >
                  Últimas Localizações
                </h2>
                {dados.ultimasLocalizacoes.length === 0 ? (
                  <p className="mt-4 text-sm text-[var(--color-ivory-66)]">
                    Nenhum bem localizado ainda.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-white/5">
                    {dados.ultimasLocalizacoes.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <Chip cor={COR_TIPO_BEM[b.tipo] ?? NEON.verde}>
                            {ROTULO_TIPO_BEM[b.tipo] ?? b.tipo}
                          </Chip>
                          <span className="min-w-0">
                            <span className="block truncate text-sm text-ivory">
                              {b.titulo}
                            </span>
                            {b.devedorNome && (
                              <span className="block truncate font-mono text-[11px] text-[var(--color-ivory-66)]">
                                {b.devedorNome}
                              </span>
                            )}
                          </span>
                        </span>
                        <span
                          className="shrink-0 font-mono text-[13px] font-semibold tabular-nums"
                          style={{ color: NEON.verde }}
                        >
                          {b.valorBrl != null ? formatBRL(b.valorBrl) : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h2
                  className="font-mono text-[13px] font-semibold uppercase tracking-[0.26em]"
                  style={{ color: NEON.laranja, textShadow: `0 0 14px color-mix(in srgb, ${NEON.laranja} 50%, transparent)` }}
                >
                  Últimas Movimentações
                </h2>
                {dados.movimentacoes.length === 0 ? (
                  <p className="mt-4 text-sm text-[var(--color-ivory-66)]">
                    Sem movimentações de alto sinal.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-white/5">
                    {dados.movimentacoes.map((a) => (
                      <li key={a.id} className="py-3">
                        <span className="flex items-center gap-3">
                          <Chip cor={COR_CATEGORIA[a.categoria]}>
                            {rotuloCategoria.get(a.categoria) ?? a.categoria}
                          </Chip>
                          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ivory-66)]">
                            {a.data_andamento ? formatData(a.data_andamento) : "—"}
                          </span>
                        </span>
                        <p className="mt-1.5 line-clamp-1 text-sm text-[var(--color-ivory-88)]">
                          {a.descricao}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </BordaLiquidaMetal>

        {/* ===== Menu radial menor ===== */}
        <div className="mt-12 flex justify-center">
          <RadialMenor
            nome={nome}
            fotoUrl={perfil?.fotoUrl ?? null}
            size={300}
          />
        </div>
      </div>
    </main>
  );
}
