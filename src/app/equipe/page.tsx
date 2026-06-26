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
import { Eye } from "lucide-react";
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
    <main className="py-10">
      {/* Cabeçalho centralizado dentro do container 1400 */}
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <header className="title-shield mb-6 flex flex-col items-center text-center">
          {/* Icone Eye dourado em cima do titulo — simboliza visao geral. */}
          <div
            className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-gold)]/45 bg-[var(--color-gold)]/10"
            style={{
              boxShadow:
                "0 0 20px rgba(201,162,74,0.30), inset 0 0 12px rgba(201,162,74,0.10)",
            }}
          >
            <Eye
              className="h-7 w-7 text-[var(--color-gold)]"
              style={{
                filter: "drop-shadow(0 0 8px rgba(201,162,74,0.7))",
              }}
              aria-hidden="true"
            />
          </div>
          <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
            Visão Geral do Escritório
          </h1>
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
            Painel da Plataforma
          </p>
        </header>

        {/* Barra de filtros DENTRO do container 1400 — alinhada com os cards.
            Estilo .glass igual o do Monitor de Custos. */}
        <FiltrosPlataformaUI
          advogados={opcoes.advogados}
          credores={opcoes.credores}
        />
      </div>

      {/* Grid principal centralizado */}
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-6 sm:px-10 md:grid-cols-12">
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
