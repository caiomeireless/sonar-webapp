// POST /api/autos/lote
// Passada 1: extrai os fatos de UM lote de páginas, ancorados na página.
//
// Um pedido por lote. É o que mantém cada requisição curta o bastante para
// caber no tempo de função da Vercel, e é o que dá progresso de verdade na
// tela: o navegador é quem orquestra a fila.
import { NextRequest, NextResponse } from "next/server";

import { extrairLote, type PaginaTexto } from "@/lib/autos/claude";
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

    const { extracao, custo } = await extrairLote({
      paginas,
      totalPaginas: corpo.totalPaginas ?? paginas.length,
      resumoAnterior: corpo.resumoAnterior,
    });

    return NextResponse.json({ extracao, custo });
  } catch (e) {
    return respostaDeErro(e);
  }
}
