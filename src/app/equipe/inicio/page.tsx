// Aba Início — CONSOLE SONAR v9 "dashboard calmo" (22/08):
// O Caio pediu pra DESPOLUIR mantendo todas as informações numa tela só.
// Decisões de design:
//   - UM material só: vidro quieto (borda branca 10%, blur) + spotlight
//     no hover — as molduras de metal líquido saíram desta tela (seguem
//     nos botões da plataforma); símbolo verde removido.
//   - Cor neon SÓ nos números; títulos, rótulos e bordas neutros.
//   - Chips-pílula viraram pontos coloridos discretos.
//   - Sincronizações viraram uma LINHA do cabeçalho (sem painel próprio).
//   - Hierarquia: cabeçalho → régua de 7 indicadores → área principal
//     (Movimentações | Localizações | Radial + consumo de APIs).
//   - Tela única no desktop (sem rolagem); mobile rola normal.
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

// Neon SÓ nos números — o resto da tela é neutro.
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

// Ponto colorido discreto (substitui os chips-pílula).
function Ponto({ cor }: { cor: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: cor, boxShadow: `0 0 5px ${cor}` }}
    />
  );
}

// Painel de vidro quieto — material único da tela.
function Painel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SpotlightCard radius={16} className={`overflow-hidden ${className}`}>
      {children}
    </SpotlightCard>
  );
}

function TituloPainel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
      {children}
    </h2>
  );
}

// Rosca compacta do consumo de APIs vs a cota Assertiva (R$600).
// Fonte: registro próprio de custos — a Assertiva não expõe via API.
function DonutCusto({ gasto, teto }: { gasto: number; teto: number }) {
  const frac = teto > 0 ? Math.min(1, gasto / teto) : 0;
  const restante = Math.max(0, teto - gasto);
  const cor =
    frac >= 0.85 ? NEON.rosa : frac >= 0.6 ? NEON.laranja : NEON.verde;
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[88px] w-[88px] shrink-0">
        <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
          <circle
            cx="44"
            cy="44"
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="9"
          />
          <circle
            cx="44"
            cy="44"
            r={R}
            fill="none"
            stroke={cor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${frac * C} ${C}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[16px] font-semibold tabular-nums"
            style={{ color: cor }}
          >
            {Math.round(frac * 100)}%
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold tabular-nums" style={{ color: cor }}>
          {formatBRL(gasto)}
        </p>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-ivory-66)]">
          gasto no mês · {formatBRL(restante)} livres
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-ivory-40)]">
          cota Assertiva R$ {teto}
        </p>
      </div>
    </div>
  );
}

export default async function InicioPage() {
  const perfil = await perfilLogado();
  if (!perfil && process.env.NODE_ENV === "production") redirect("/login");

  const nome = perfil?.nome?.trim() || perfil?.email || "Equipe";
  const primeiroNome = nome.split(" ")[0];
  const [dados, avisos] = await Promise.all([
    obterDadosConsole(),
    listarNotificacoesEquipe().then((n) => n.slice(0, 2)).catch(() => []),
  ]);

  const agora = new Date();
  const dataLonga = `${DIAS_SEMANA[agora.getDay()]}, ${formatData(agora.toISOString())}`;
  const rotuloCategoria = new Map(
    CATEGORIAS_RADAR.map((c) => [c.chave, c.rotulo]),
  );
  const sync = dados.sincronizacao;

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
      {/* Fundo: degradê verde escuro → preto (mantido da v8) */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(60,255,138,0.13) 0%, rgba(24,90,52,0.09) 24%, #020a06 55%, #000000 100%), #000000",
        }}
      />

      <div className="relative z-10 mx-auto flex h-full max-w-[1480px] flex-col gap-4 p-4 lg:px-10 lg:py-5">
        {/* ============ CABEÇALHO: boas-vindas + status de sync ============ */}
        <Painel className="flex shrink-0 flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.26em]"
              style={{ color: NEON.verde }}
            >
              Console Sonar · {dataLonga}
            </p>
            <h1 className="sonar-wordmark mt-1 text-[clamp(22px,2vw,32px)]">
              Boas-Vindas, {primeiroNome}.
            </h1>
          </div>
          {/* Sincronizações — uma linha discreta, sem painel próprio */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ivory-66)]">
            <span className="flex items-center gap-1.5">
              <Ponto cor={sync.themisOk === false ? NEON.rosa : NEON.verde} />
              Themis {sync.themisEm ? formatData(sync.themisEm) : "—"}
            </span>
            <span>
              e-SAJ {sync.esajUltima ? formatData(sync.esajUltima) : "—"}
            </span>
            <span>
              eproc {sync.eprocUltima ? formatData(sync.eprocUltima) : "—"}
            </span>
            <span>
              {sync.totalAndamentos.toLocaleString("pt-BR")} andamentos no
              acervo
            </span>
          </div>
        </Painel>

        {/* ============ AVISOS — faixa fina, SÓ quando existir aviso ====== */}
        {avisos.length > 0 && (
          <Painel className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-6 py-2.5">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: NEON.amarelo }}>
              Avisos
            </span>
            {avisos.map((n) => (
              <span key={n.id} className="flex min-w-0 items-center gap-2 text-[13px] text-[var(--color-ivory-88)]">
                <Ponto cor={NEON.amarelo} />
                <span className="truncate">{n.titulo}</span>
                <span className="shrink-0 font-mono text-[11px] uppercase text-[var(--color-ivory-40)]">
                  {n.relativaEm}
                </span>
              </span>
            ))}
          </Painel>
        )}

        {/* ============ RÉGUA DE INDICADORES ============ */}
        <Painel className="shrink-0 px-2 py-3">
          <div className="grid grid-cols-2 gap-y-3 divide-white/8 sm:grid-cols-4 lg:grid-cols-7 lg:divide-x">
            {ESTATISTICAS.map(({ rotulo, valor, formato, cor, Icon }) => (
              <div
                key={rotulo}
                className="flex flex-col items-center gap-1 px-2 text-center"
              >
                <span
                  className="text-[clamp(17px,1.3vw,22px)] font-semibold leading-none tabular-nums"
                  style={{ color: cor }}
                >
                  <NumeroTicker valor={valor} formato={formato} />
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ivory-66)]">
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: cor }}
                    aria-hidden="true"
                  />
                  {rotulo}
                </span>
              </div>
            ))}
          </div>
        </Painel>

        {/* ============ ÁREA PRINCIPAL ============ */}
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_1fr_400px]">
          {/* Últimas Movimentações */}
          <Painel className="flex min-h-0 flex-col p-5">
            <TituloPainel>Últimas Movimentações</TituloPainel>
            {dados.movimentacoes.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--color-ivory-66)]">
                Sem movimentações de alto sinal.
              </p>
            ) : (
              <ul className="mt-2 min-h-0 divide-y divide-white/5 overflow-hidden">
                {dados.movimentacoes.map((a) => (
                  <li key={a.id} className="py-3">
                    <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ivory-66)]">
                      <Ponto cor={COR_CATEGORIA[a.categoria]} />
                      {rotuloCategoria.get(a.categoria) ?? a.categoria}
                      <span className="text-[var(--color-ivory-40)]">
                        {a.data_andamento ? formatData(a.data_andamento) : ""}
                      </span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--color-ivory-88)]">
                      {a.descricao}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Painel>

          {/* Últimas Localizações */}
          <Painel className="flex min-h-0 flex-col p-5">
            <TituloPainel>Últimas Localizações</TituloPainel>
            {dados.ultimasLocalizacoes.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--color-ivory-66)]">
                Nenhum bem localizado ainda.
              </p>
            ) : (
              <ul className="mt-2 min-h-0 divide-y divide-white/5 overflow-hidden">
                {dados.ultimasLocalizacoes.slice(0, 5).map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ivory-66)]">
                        <Ponto cor={COR_TIPO_BEM[b.tipo] ?? NEON.verde} />
                        {ROTULO_TIPO_BEM[b.tipo] ?? b.tipo}
                      </span>
                      <span className="mt-1 block truncate text-[13px] text-ivory">
                        {b.titulo}
                      </span>
                      {b.devedorNome && (
                        <span className="block truncate font-mono text-[11px] text-[var(--color-ivory-40)]">
                          {b.devedorNome}
                        </span>
                      )}
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
          </Painel>

          {/* Radial (herói da navegação) + consumo de APIs */}
          <div className="flex min-h-0 flex-col gap-4">
            <Painel className="flex min-h-0 flex-1 flex-col items-center justify-center p-4">
              <RadialCentro nome={nome} fotoUrl={perfil?.fotoUrl ?? null} />
              <p className="sonar-wordmark mt-2 shrink-0 text-[clamp(15px,1.2vw,20px)]">
                Para onde deseja ir?
              </p>
            </Painel>
            <Painel className="shrink-0 p-5">
              <TituloPainel>Consumo de APIs</TituloPainel>
              <div className="mt-3">
                <DonutCusto gasto={dados.gastoMesBrl} teto={dados.tetoMesBrl} />
              </div>
            </Painel>
          </div>
        </div>
      </div>
    </main>
  );
}
