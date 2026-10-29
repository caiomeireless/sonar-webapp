// POST /api/autos/triagem
// Separa página de peça de página de anexo, com o modelo barato.
//
// Num capa a capa integral — que é o único que o advogado consegue baixar —
// a maior parte do arquivo é documento anexado. Mandar isso para o Opus no
// esforço máximo seria queimar dinheiro sem ganhar análise.
import { NextRequest, NextResponse } from "next/server";

import { triarPaginas, type PaginaTexto } from "@/lib/autos/claude";
import { exigirEquipeNaRota, respostaDeErro } from "../_auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = await exigirEquipeNaRota();
  if (!auth.ok) return auth.resposta;

  try {
    const corpo = (await req.json()) as { paginas?: PaginaTexto[] };
    const paginas = corpo.paginas ?? [];
    if (paginas.length === 0) {
      return NextResponse.json(
        { erro: "Nenhuma página recebida para triagem." },
        { status: 400 },
      );
    }

    const { triagem, custo } = await triarPaginas(paginas);
    return NextResponse.json({ triagem, custo });
  } catch (e) {
    return respostaDeErro(e);
  }
}
