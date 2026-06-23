// Dashboard da Plataforma — entry point do portal da equipe.
//
// Server Component:
//   - Checa sessao (perfilLogado): nao equipe → /login
//   - Agrega tudo no servidor (obterDadosDashboardPlataforma)
//   - Layout grid 12-col Tailwind, mobile cai pra 1 coluna
//
// Decisao do Caio: funcionario ve TUDO (valores, equipe inteira). A
// pagina apenas roteia + monta o grid; cada card e responsavel pelo
// proprio chrome via DashboardCard/KPIHero.

import { redirect } from "next/navigation";
import { perfilLogado } from "@/lib/perfis-server";
import { ehEquipe } from "@/lib/perfis";
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
  const perfil = await perfilLogado();
  if (!ehEquipe(perfil)) redirect("/login");

  const sp = await searchParams;
  const filtros = parseFiltros(sp);

  const [dados, opcoes] = await Promise.all([
    obterDadosDashboardPlataforma(filtros),
    listarOpcoesFiltros(),
  ]);

  // Penhoras do mes anterior — penultimo bucket da serie de 12 meses
  // (o ultimo e o mes corrente). Se a serie for curta por algum motivo,
  // cai pra 0 sem quebrar o delta.
  const evol = dados.evolucaoMensal;
  const penhorasMesAnterior =
    evol.length >= 2 ? evol[evol.length - 2].penhorasEfetivadas : 0;

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 sm:px-10">
      {/* Cabecalho */}
      <header className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-66)]">
          Painel da Plataforma
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight text-ivory sm:text-4xl">
          Visao geral do escritorio
        </h1>
      </header>

      {/* Barra de filtros (sticky no topo) */}
      <FiltrosPlataformaUI
        advogados={opcoes.advogados}
        credores={opcoes.credores}
      />

      {/* Grid principal: 12 colunas no desktop, 1 no mobile */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
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

        {/* L2 — Evolucao mensal (full width) */}
        <div className="md:col-span-12">
          <EvolucaoPatrimonioMensal dados={dados.evolucaoMensal} />
        </div>

        {/* L3 — Mix (4) + Atividade (5) + Custos (3) */}
        <div className="md:col-span-4">
          <MixBensPorTipo dados={dados.mixBensPorTipo} />
        </div>
        <div className="md:col-span-5">
          <AtividadeEquipe7Dias dados={dados.atividadeEquipe7Dias} />
        </div>
        <div className="md:col-span-3">
          <CustosPorAPIDonut dados={dados.custosPorAPI} />
        </div>

        {/* L4 — Rankings (6 + 6) */}
        <div className="md:col-span-6">
          <Top5ClientesPorPatrimonio itens={dados.top5ClientesPorPatrimonio} />
        </div>
        <div className="md:col-span-6">
          <Top5DevedoresRastreio dados={dados.top5DevedoresRastreio} />
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
