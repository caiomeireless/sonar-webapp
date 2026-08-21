// Aba Início — CONSOLE SONAR v5 (21/08, "cockpit de tela única"):
//   TUDO cabe numa tela só com o nav aberto (lg+: altura travada em
//   100svh - faixa 1, SEM barra de rolagem; mobile volta a rolar).
//   - Fundo: EXATO o da faixa 3 da landing (preto + HeaderParticles gold)
//   - Esquerda: card "Console Sonar · data" (vidro preto, anel líquido CSS
//     LARANJA, escrita laranja neon) sobre o "Boas-Vindas" (moldura de
//     metal líquido prata igual à dos painéis, escrita branca na fonte do
//     wordmark, Title Case) sobre o painel VERTICAL dos números coloridos
//   - Centro: menu radial VERDE NEON dentro de um anel de metal líquido
//     (mesmo shader do Sincronizar) + "Para onde deseja ir?" no wordmark
//   - Direita: Últimas Movimentações (cima) e Últimas Localizações (baixo)
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
import { HeaderParticles } from "@/components/HeaderParticles";
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

const TAM_RADIAL = 330;

function Chip({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em]"
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

// Painel de vidro com a moldura de metal líquido prata (identidade da tela).
function PainelVidro({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BordaLiquidaMetal cor="prata" anel radius={20} className={`block ${className}`}>
      <div
        className="h-full w-full overflow-hidden rounded-[17px] p-4 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012) 30%, rgba(8,12,10,0.55))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {children}
      </div>
    </BordaLiquidaMetal>
  );
}

function TituloPainel({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <h2
      className="font-mono text-[12px] font-semibold uppercase tracking-[0.22em]"
      style={{
        color: cor,
        textShadow: `0 0 12px color-mix(in srgb, ${cor} 50%, transparent)`,
      }}
    >
      {children}
    </h2>
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
    <main className="relative overflow-x-hidden lg:h-[calc(100svh-159px)] lg:overflow-hidden">
      {/* Fundo EXATO da faixa 3 da landing: preto + partículas douradas */}
      <div aria-hidden="true" className="absolute inset-0 bg-black">
        <HeaderParticles />
      </div>

      <div className="relative z-10 flex h-full flex-col gap-4 p-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)_340px] xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        {/* ================= COLUNA ESQUERDA ================= */}
        <div className="flex min-h-0 flex-col gap-4">
          {/* Card Console Sonar — vidro preto, anel líquido LARANJA (CSS,
              igual aos botões), escrita laranja neon */}
          <div
            className="contorno-liquido contorno-liquido--ativo rounded-xl bg-black/70 px-4 py-2.5 backdrop-blur-md"
            style={{ "--ml-c": NEON.laranja } as React.CSSProperties}
          >
            <p
              className="font-mono text-[12px] font-semibold uppercase tracking-[0.2em]"
              style={{
                color: NEON.laranja,
                textShadow: `0 0 12px color-mix(in srgb, ${NEON.laranja} 60%, transparent)`,
              }}
            >
              Console Sonar · {dataLonga}
            </p>
          </div>

          {/* Boas-Vindas — moldura prata igual à dos painéis, escrita
              BRANCA na fonte do wordmark, Title Case */}
          <BordaLiquidaMetal cor="prata" anel radius={16} className="block">
            <div className="rounded-[13px] bg-black/55 px-5 py-3.5 backdrop-blur-xl">
              <h1 className="sonar-wordmark text-[clamp(19px,1.5vw,26px)]">
                Boas-Vindas, {primeiroNome}.
              </h1>
            </div>
          </BordaLiquidaMetal>

          {/* Painel VERTICAL dos números coloridos */}
          <PainelVidro className="min-h-0 flex-1">
            <div className="flex h-full flex-col justify-evenly">
              {ESTATISTICAS.map(({ rotulo, valor, formato, cor, Icon }) => (
                <div key={rotulo} className="flex items-center gap-3 py-1">
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: cor, filter: `drop-shadow(0 0 6px ${cor})` }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 truncate font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ivory-66)]">
                    {rotulo}
                  </span>
                  <span
                    className="text-[15px] font-semibold tabular-nums"
                    style={{
                      color: cor,
                      textShadow: `0 0 14px color-mix(in srgb, ${cor} 55%, transparent)`,
                    }}
                  >
                    <NumeroTicker valor={valor} formato={formato} />
                  </span>
                </div>
              ))}
            </div>
          </PainelVidro>
        </div>

        {/* ================= CENTRO: radial verde + wordmark ================= */}
        <div className="flex min-h-0 flex-col items-center justify-center gap-6">
          <BordaLiquidaMetal
            cor="signal"
            anel
            radius={(TAM_RADIAL + 6) / 2}
            className="block"
          >
            <div className="rounded-full p-[3px]">
              <RadialMenor
                nome={nome}
                fotoUrl={perfil?.fotoUrl ?? null}
                size={TAM_RADIAL}
                paleta="verde"
              />
            </div>
          </BordaLiquidaMetal>
          <p className="sonar-wordmark text-[clamp(17px,1.5vw,25px)]">
            Para onde deseja ir?
          </p>
        </div>

        {/* ================= COLUNA DIREITA ================= */}
        <div className="flex min-h-0 flex-col gap-4">
          {/* Últimas Movimentações (cima) */}
          <PainelVidro className="min-h-0 flex-1">
            <TituloPainel cor={NEON.laranja}>Últimas Movimentações</TituloPainel>
            {dados.movimentacoes.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-ivory-66)]">
                Sem movimentações de alto sinal.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-white/5">
                {dados.movimentacoes.map((a) => (
                  <li key={a.id} className="py-2">
                    <span className="flex items-center gap-2">
                      <Chip cor={COR_CATEGORIA[a.categoria]}>
                        {rotuloCategoria.get(a.categoria) ?? a.categoria}
                      </Chip>
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ivory-66)]">
                        {a.data_andamento ? formatData(a.data_andamento) : "—"}
                      </span>
                    </span>
                    <p className="mt-1 line-clamp-1 text-[12px] text-[var(--color-ivory-88)]">
                      {a.descricao}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PainelVidro>

          {/* Últimas Localizações (embaixo) */}
          <PainelVidro className="min-h-0 flex-1">
            <TituloPainel cor={NEON.verde}>Últimas Localizações</TituloPainel>
            {dados.ultimasLocalizacoes.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-ivory-66)]">
                Nenhum bem localizado ainda.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-white/5">
                {dados.ultimasLocalizacoes.slice(0, 4).map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Chip cor={COR_TIPO_BEM[b.tipo] ?? NEON.verde}>
                        {ROTULO_TIPO_BEM[b.tipo] ?? b.tipo}
                      </Chip>
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] text-ivory">
                          {b.titulo}
                        </span>
                        {b.devedorNome && (
                          <span className="block truncate font-mono text-[10px] text-[var(--color-ivory-66)]">
                            {b.devedorNome}
                          </span>
                        )}
                      </span>
                    </span>
                    <span
                      className="shrink-0 font-mono text-[12px] font-semibold tabular-nums"
                      style={{ color: NEON.verde }}
                    >
                      {b.valorBrl != null ? formatBRL(b.valorBrl) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </PainelVidro>
        </div>
      </div>
    </main>
  );
}
