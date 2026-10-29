// POST /api/autos/lote
// Passada 1: extrai os fatos de UM lote de páginas, ancorados na página, e
// GRAVA o resultado no banco antes de responder.
//
// Um pedido por lote. É o que mantém cada requisição curta o bastante para
// caber no tempo de função da Vercel, e é o que dá progresso de verdade na
// tela: o navegador é quem orquestra a fila. Gravar aqui, lote a lote, é o
// que garante que uma falha mais adiante não apaga o que já foi lido.
import { NextRequest, NextResponse } from "next/server";

import { extrairLote, type PaginaTexto } from "@/lib/autos/claude";
import { anexarExtracao } from "@/lib/autos/analises";
import { exigirEquipeNaRota, respostaDeErro } from "../_auth";

export const dynamic = "force-dynamic";
// Teto do Vercel Pro. Um lote de 40 páginas leva ~100s em esforço "high";
// 300s não dava folga para lote denso.
export const maxDuration = 800;

export async function POST(req: NextRequest) {
  const auth = await exigirEquipeNaRota();
  if (!auth.ok) return auth.resposta;

  try {
    const corpo = (await req.json()) as {
      analiseId?: number;
      indice?: number;
      totalLotes?: number;
      paginas?: PaginaTexto[];
      totalPaginas?: number;
      resumoAnterior?: string;
    };

    const paginas = corpo.paginas ?? [];
    if (paginas.length === 0) {
      return NextResponse.json(
        { erro: "Nenhuma página recebida no lote." },
        { status: 400 },
      );
    }
    const analiseId = Number(corpo.analiseId);
    const indice = Number(corpo.indice);
    if (!Number.isFinite(analiseId) || !Number.isFinite(indice)) {
      return NextResponse.json(
        { erro: "Lote sem análise ou sem posição na fila." },
        { status: 400 },
      );
    }

    const { extracao, custo } = await extrairLote({
      paginas,
      totalPaginas: corpo.totalPaginas ?? paginas.length,
      resumoAnterior: corpo.resumoAnterior,
    });

    const { lotesLidos } = await anexarExtracao({
      id: analiseId,
      indice,
      totalLotes: corpo.totalLotes ?? indice + 1,
      extracao,
      custo,
    });

    return NextResponse.json({ extracao, custo, lotesLidos });
  } catch (e) {
    return respostaDeErro(e);
  }
}
