// Dashboard da Plataforma — entry point do portal da equipe.
//
// Server Component:
//   - Checa sessão (perfilLogado): não equipe → /login
//   - Agrega tudo no servidor (obterDadosDashboardPlataforma)
//   - Layout grid 12-col Tailwind, mobile cai pra 1 coluna
//
// Decisão do Caio: funcionário vê TUDO (valores, equipe inteira). A
// página apenas roteia + monta o grid; cada card é responsável pelo
// próprio chrome via DashboardCard/KPIHero.

import { redirect } from "next/navigation";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { perfilLogado } from "@/lib/perfis-server";
import { ehEquipe, perfilAtual } from "@/lib/perfis";
import { devEuFromParam } from "@/lib/dev-auth";
import {
  obterDadosDashboardPlataforma,
  listarOpcoesFiltros,
  type FiltrosPlataforma,
  type PeriodoChave,
  type StatusCaso,
} from "@/lib/dashboard-plataforma";

import FiltrosPlataformaUI from "./_components/FiltrosPlataforma";
import KPIPatrimonioTotal from "./_components/KPIPatrimonioTotal";
import KPIPenhorasEfetivadasMes from "./_components/KPIPenhorasEfetivadasMes";
import KPICasosAtivos from "./_components/KPICasosAtivos";
import KPIGastoAPIs from "./_components/KPIGastoAPIs";
import KPIAndamentosCapturados from "./_components/KPIAndamentosCapturados";
import EvolucaoPatrimonioMensal from "./_components/EvolucaoPatrimonioMensal";
import MixBensPorTipo from "./_components/MixBensPorTipo";
import AtividadeEquipe7Dias from "./_components/AtividadeEquipe7Dias";
import CustosPorAPIDonut from "./_components/CustosPorAPIDonut";
import Top5ClientesPorPatrimonio from "./_components/Top5ClientesPorPatrimonio";
import Top5DevedoresRastreio from "./_components/Top5DevedoresRastreio";
import CarteiraPorAdvogado from "./_components/CarteiraPorAdvogado";
import FeedMedidasRecentes from "./_components/FeedMedidasRecentes";
// Mapa do Brasil reaproveitado do dashboard analítico do devedor.
// O componente já vem com DashboardCard próprio (não envolver de novo).
import MapaDistribuicaoBens from "./devedores/[id]/dashboard/_components/MapaDistribuicaoBens";

// Force-dynamic: o painel agrega dados em tempo real (feed de medidas,
// custos do mes). Sem isso o Next.js cacheia a primeira render — basta
// que outro advogado registre uma medida pra ficar desatualizado ate o
// redeploy.
export const dynamic = "force-dynamic";

const PERIODOS_VALIDOS: PeriodoChave[] = ["tudo", "7d", "30d", "90d", "mes", "ano"];
const STATUS_VALIDOS: StatusCaso[] = ["ativo", "pausado", "encerrado", "satisfeito"];

function parseFiltros(sp: Record<string, string | string[] | undefined>): FiltrosPlataforma {
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const periodoRaw = get("periodo");
  const periodo = PERIODOS_VALIDOS.includes(periodoRaw as PeriodoChave)
    ? (periodoRaw as PeriodoChave)
    : "tudo";
  const advogados = (get("advogados") || "").split(",").filter(Boolean);
  const credores = (get("credores") || "")
    .split(",")
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => !Number.isNaN(n));
  const statusCasos = (get("status") || "")
    .split(",")
    .filter((s): s is StatusCaso => STATUS_VALIDOS.includes(s as StatusCaso));
  return { periodo, advogados, credores, statusCasos };
}

export default async function DashboardPlataformaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  // Dev shortcut: ?eu=<email> permite previsualizar como outro usuario em
  // dev/preview sem fazer login. Em producao, devEuFromParam retorna
  // undefined e a checagem real (perfilLogado) prevalece.
  const euDev = devEuFromParam(sp.eu);
  const perfilLog = await perfilLogado();
  const perfil = euDev ? await perfilAtual(euDev) : perfilLog;
  if (!ehEquipe(perfil)) redirect("/login");

  const filtros = parseFiltros(sp);

  const [dados, opcoes] = await Promise.all([
    obterDadosDashboardPlataforma(filtros),
    listarOpcoesFiltros(),
  ]);

  // Penhoras do mês anterior — penúltimo bucket da série de 12 meses
  // (o último é o mês corrente). Se a série for curta por algum motivo,
  // cai pra 0 sem quebrar o delta.
  const evol = dados.evolucaoMensal;
  const penhorasMesAnterior =
    evol.length >= 2 ? evol[evol.length - 2].penhorasEfetivadas : 0;

  return (
    <main className="relative min-h-svh py-12">
      {/* Fundo: preto puro (padrão da cara nova 25/08). */}
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      {/* Cabeçalho centralizado dentro do container 1400 */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-6 sm:px-10">
        <header className="mb-8 text-center">
          <h1
            className="font-serif text-[clamp(29px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[#C97B2A]"
            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.65)" }}
          >
            Estatísticas da Plataforma
          </h1>
          <p className="mt-3 font-mono text-[clamp(13px,1.6vw,20px)] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
            Visão Geral do Escritório.
          </p>
        </header>

        {/* Barra de filtros num card verde escuro (padrão do Banco). */}
        <SpotlightCard
          local
          degrade="linear-gradient(0deg, rgba(10,48,28,0.7), rgba(10,48,28,0.7))"
          className="mb-4 p-4 sm:p-5"
        >
          <FiltrosPlataformaUI
            advogados={opcoes.advogados}
            credores={opcoes.credores}
          />
        </SpotlightCard>
      </div>

      {/* Grid principal centralizado */}
      <div className="relative z-10 mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-6 sm:px-10 md:grid-cols-12">
        {/* L1 — KPIs (5 + 3 + 2 + 2) */}
        <div className="md:col-span-5">
          <KPIPatrimonioTotal
            valorBrl={dados.kpisGerais.patrimonioLocalizadoTotalBrl}
          />
        </div>
        <div className="md:col-span-3">
          <KPIPenhorasEfetivadasMes
            mesAtual={dados.kpisGerais.penhorasEfetivadasMes}
            mesAnterior={penhorasMesAnterior}
          />
        </div>
        <div className="md:col-span-2">
          <KPICasosAtivos
            ativos={dados.kpisGerais.casosBreakdown.ativos}
            pausados={dados.kpisGerais.casosBreakdown.pausados}
            encerrados={dados.kpisGerais.casosBreakdown.encerrados}
          />
        </div>
        <div className="md:col-span-2">
          <KPIGastoAPIs
            gastoMes={dados.kpisGerais.gastoApisMes}
            limite={dados.kpisGerais.gastoApisLimite}
          />
        </div>

        {/* L1.5 — Andamentos capturados nos tribunais (full width) */}
        <div className="md:col-span-12">
          <KPIAndamentosCapturados dados={dados.kpisAndamentos} />
        </div>

        {/* L2 — Evolução mensal (full width) */}
        <div className="md:col-span-12">
          <EvolucaoPatrimonioMensal dados={dados.evolucaoMensal} />
        </div>

        {/* L3 — Mix (6) + Custos (6) na mesma linha; Atividade (12) full-width
            embaixo. Donuts ganham o dobro de espaço horizontal pra legendas
            respirarem sem cortar, e o stacked bar usa a largura inteira. */}
        <div className="md:col-span-6">
          <MixBensPorTipo dados={dados.mixBensPorTipo} />
        </div>
        <div className="md:col-span-6">
          <CustosPorAPIDonut dados={dados.custosPorAPI} />
        </div>
        <div className="md:col-span-12">
          <AtividadeEquipe7Dias dados={dados.atividadeEquipe7Dias} />
        </div>

        {/* L4 — Rankings (6 + 6) */}
        <div className="md:col-span-6">
          <Top5ClientesPorPatrimonio itens={dados.top5ClientesPorPatrimonio} />
        </div>
        <div className="md:col-span-6">
          <Top5DevedoresRastreio dados={dados.top5DevedoresRastreio} />
        </div>

        {/* L4.5 — Mapa do Brasil (full width). Reaproveita o mesmo
            componente do dashboard analítico do devedor; aqui agrega
            todos os bens da plataforma em rastreio. */}
        <div className="md:col-span-12">
          <MapaDistribuicaoBens
            distribuicao={dados.bensPorLocalizacao}
            titulo="Distribuição Patrimonial pelo Brasil"
            descricao="Onde estão os bens rastreados pela plataforma"
          />
        </div>

        {/* L5 — Carteira (7) + Feed (5) */}
        <div className="md:col-span-7">
          <CarteiraPorAdvogado itens={dados.carteiraPorAdvogado} />
        </div>
        <div className="md:col-span-5">
          <FeedMedidasRecentes dados={dados.feedMedidasRecentes} />
        </div>
      </div>
    </main>
  );
}
