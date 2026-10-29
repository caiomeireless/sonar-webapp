// POST /api/autos/consolidar
// Passada 2: recebe os JSON dos lotes (NÃO o PDF), deduplica, fecha a conta
// do débito, monta o caminho das medidas e diz o que falta fazer.
import { NextRequest, NextResponse } from "next/server";

import { consolidar, custoEmReais, somarCustos } from "@/lib/autos/claude";
import { atualizarAnalise } from "@/lib/autos/analises";
import type { CustoTokens, ResultadoExtracao } from "@/lib/autos/tipos";
import { exigirEquipeNaRota, respostaDeErro } from "../_auth";

export const dynamic = "force-dynamic";
// Vercel Pro permite ate 800s. A extracao de um lote grande passa de 300s
// com folga — foi medido.
export const maxDuration = 800;

export async function POST(req: NextRequest) {
  const auth = await exigirEquipeNaRota();
  if (!auth.ok) return auth.resposta;

  try {
    const corpo = (await req.json()) as {
      analiseId?: number;
      extracoes?: ResultadoExtracao[];
      totalPaginas?: number;
      paginasUteis?: number;
      custosAnteriores?: CustoTokens[];
      dadosAssertiva?: string;
    };

    const extracoes = corpo.extracoes ?? [];
    if (extracoes.length === 0) {
      return NextResponse.json(
        { erro: "Nenhuma extração recebida para consolidar." },
        { status: 400 },
      );
    }

    const hoje = new Date().toISOString().slice(0, 10);
    const { ficha, custos: custosConsolidacao } = await consolidar({
      extracoes,
      totalPaginas: corpo.totalPaginas ?? 0,
      dadosAssertiva: corpo.dadosAssertiva,
      hoje,
    });

    // Custo total da análise: triagem + lotes + as duas etapas daqui.
    const custos = somarCustos([
      ...(corpo.custosAnteriores ?? []),
      ...custosConsolidacao,
    ]);
    const custoBrl = custos.reduce((s, c) => s + custoEmReais(c), 0);

    if (corpo.analiseId) {
      await atualizarAnalise(corpo.analiseId, {
        status: "revisao",
        etapa_atual: "Pronta para conferência",
        progresso_pct: 100,
        numero_processo: ficha.identificacao.numeroCnj,
        paginas_uteis: corpo.paginasUteis,
        extracoes,
        ficha,
        custo_tokens: custos,
        custo_brl: Number(custoBrl.toFixed(4)),
      });
    }

    return NextResponse.json({ ficha, custoBrl, custos });
  } catch (e) {
    return respostaDeErro(e);
  }
}
