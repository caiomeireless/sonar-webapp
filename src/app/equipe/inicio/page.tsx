// Aba Início — CONSOLE SONAR v6 (21/08):
//   - Cabeçalho ÚNICO centralizado no topo do centro: "Console Sonar ·
//     data" (verde, 20% menor) + "Boas-Vindas, Nome." (wordmark branco,
//     2x maior), juntos num só card de vidro com moldura prata
//   - Esquerda: painel FINO dos ícones — ícone grande, valor e legenda
//     embaixo, divisórias entre os itens
//   - Centro: menu radial VERDE 2x (até 660px, auto-ajusta pra caber) +
//     "Para onde deseja ir?" num card de vidro preto
//   - Direita: Movimentações e Localizações com textos CENTRALIZADOS e
//     fontes maiores
//   - TODOS os cards com o spotlight da faixa 3 da landing (luz segue o
//     mouse) e fundo com partículas MAIS densas e reativas ao ponteiro
//   - Tela única no desktop (sem rolagem); mobile rola normal
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
import { listarNotificacoesEquipe } from "@/lib/notificacoes";
import { CATEGORIAS_RADAR, type CategoriaRadarChave } from "@/lib/radar";
import { formatBRL, formatData } from "@/lib/format";
import { BordaLiquidaMetal } from "@/components/ui/BordaLiquidaMetal";
import { SimboloSonar } from "@/components/ui/SimboloSonar";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

import { NumeroTicker } from "./_components/NumeroTicker";
import RadialCentro from "./_components/RadialCentro";

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

function Chip({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-mono text-[12px] uppercase tracking-[0.1em]"
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

// Painel: moldura de metal líquido prata + vidro com spotlight (faixa 3).
function PainelVidro({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <BordaLiquidaMetal cor="prata" anel radius={20} className={`block ${className}`}>
      <SpotlightCard radius={17} className="h-full w-full overflow-hidden p-4">
        {children}
      </SpotlightCard>
    </BordaLiquidaMetal>
  );
}

function TituloPainel({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <h2
      className="text-center font-mono text-[14px] font-semibold uppercase tracking-[0.22em]"
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
  const [dados, avisos] = await Promise.all([
    obterDadosConsole(),
    listarNotificacoesEquipe().then((n) => n.slice(0, 3)).catch(() => []),
  ]);

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
      {/* Fundo: preto puro (partículas removidas a pedido do Caio, 21/08) */}
      <div aria-hidden="true" className="absolute inset-0 bg-black" />

      <div className="relative z-10 flex h-full flex-col gap-4 p-4 lg:grid lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        {/* ================= ESQUERDA: painel FINO dos ícones + avisos ===== */}
        <div className="flex min-h-0 flex-col gap-4">
        <PainelVidro className="min-h-0 flex-1">
          <div className="flex h-full flex-col justify-evenly">
            {ESTATISTICAS.map(({ rotulo, valor, formato, cor, Icon }, i) => (
              <div
                key={rotulo}
                className={`flex flex-col items-center gap-1 py-2 text-center ${
                  i > 0 ? "border-t border-white/8" : ""
                }`}
              >
                <Icon
                  className="h-7 w-7"
                  style={{ color: cor, filter: `drop-shadow(0 0 8px ${cor})` }}
                  aria-hidden="true"
                />
                <span
                  className="text-[15px] font-semibold leading-none tabular-nums"
                  style={{
                    color: cor,
                    textShadow: `0 0 14px color-mix(in srgb, ${cor} 55%, transparent)`,
                  }}
                >
                  <NumeroTicker valor={valor} formato={formato} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ivory-66)]">
                  {rotulo}
                </span>
              </div>
            ))}
          </div>
        </PainelVidro>

        {/* Painel de Avisos da Plataforma */}
        <PainelVidro className="shrink-0">
          <TituloPainel cor={NEON.ciano}>Avisos da Plataforma</TituloPainel>
          {avisos.length === 0 ? (
            <p className="mt-3 text-center text-[12px] text-[var(--color-ivory-66)]">
              Sem avisos no momento.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-white/5">
              {avisos.map((n) => (
                <li key={n.id} className="py-2 text-center">
                  <p className="line-clamp-1 text-[13px] text-ivory">
                    {n.titulo}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ivory-66)]">
                    {n.relativaEm}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </PainelVidro>
        </div>

        {/* ================= CENTRO ================= */}
        <div className="flex min-h-0 flex-col items-center gap-4">
          {/* Cabeçalho único: Console Sonar (verde, menor) + Boas-Vindas
              (wordmark branco, 2x), centralizados no mesmo card */}
          <BordaLiquidaMetal cor="prata" anel radius={18} className="block">
            <SpotlightCard radius={15} className="px-10 py-4 text-center">
              <p
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
                style={{
                  color: NEON.verde,
                  textShadow: `0 0 12px color-mix(in srgb, ${NEON.verde} 60%, transparent)`,
                }}
              >
                Console Sonar · {dataLonga}
              </p>
              <h1 className="sonar-wordmark mt-1.5 text-[clamp(30px,2.8vw,48px)]">
                Boas-Vindas, {primeiroNome}.
              </h1>
            </SpotlightCard>
          </BordaLiquidaMetal>

          {/* Símbolo do logo (escada + emissor com ondas), animado */}
          <SimboloSonar height={100} className="shrink-0" />

          {/* Radial verde 2x (auto-ajusta pra caber na tela) */}
          <RadialCentro nome={nome} fotoUrl={perfil?.fotoUrl ?? null} />

          {/* Frase no card de vidro preto */}
          <SpotlightCard radius={14} className="px-8 py-2.5">
            <p className="sonar-wordmark text-[clamp(17px,1.5vw,25px)]">
              Para onde deseja ir?
            </p>
          </SpotlightCard>
        </div>

        {/* ================= DIREITA ================= */}
        <div className="flex min-h-0 flex-col gap-4">
          {/* Últimas Movimentações (cima) — textos centralizados */}
          <PainelVidro className="min-h-0 flex-1">
            <TituloPainel cor={NEON.laranja}>Últimas Movimentações</TituloPainel>
            {dados.movimentacoes.length === 0 ? (
              <p className="mt-3 text-center text-sm text-[var(--color-ivory-66)]">
                Sem movimentações de alto sinal.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-white/5">
                {dados.movimentacoes.map((a) => (
                  <li key={a.id} className="py-2.5 text-center">
                    <span className="flex items-center justify-center gap-2">
                      <Chip cor={COR_CATEGORIA[a.categoria]}>
                        {rotuloCategoria.get(a.categoria) ?? a.categoria}
                      </Chip>
                      <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--color-ivory-66)]">
                        {a.data_andamento ? formatData(a.data_andamento) : "—"}
                      </span>
                    </span>
                    <p className="mt-1.5 line-clamp-1 text-[14px] text-[var(--color-ivory-88)]">
                      {a.descricao}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </PainelVidro>

          {/* Últimas Localizações (embaixo) — textos centralizados */}
          <PainelVidro className="min-h-0 flex-1">
            <TituloPainel cor={NEON.verde}>Últimas Localizações</TituloPainel>
            {dados.ultimasLocalizacoes.length === 0 ? (
              <p className="mt-3 text-center text-sm text-[var(--color-ivory-66)]">
                Nenhum bem localizado ainda.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-white/5">
                {dados.ultimasLocalizacoes.slice(0, 4).map((b) => (
                  <li key={b.id} className="py-2.5 text-center">
                    <span className="flex items-center justify-center gap-2">
                      <Chip cor={COR_TIPO_BEM[b.tipo] ?? NEON.verde}>
                        {ROTULO_TIPO_BEM[b.tipo] ?? b.tipo}
                      </Chip>
                      <span
                        className="font-mono text-[14px] font-semibold tabular-nums"
                        style={{ color: NEON.verde }}
                      >
                        {b.valorBrl != null ? formatBRL(b.valorBrl) : "—"}
                      </span>
                    </span>
                    <p className="mt-1 truncate text-[14px] text-ivory">
                      {b.titulo}
                    </p>
                    {b.devedorNome && (
                      <p className="truncate font-mono text-[11px] text-[var(--color-ivory-66)]">
                        {b.devedorNome}
                      </p>
                    )}
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
