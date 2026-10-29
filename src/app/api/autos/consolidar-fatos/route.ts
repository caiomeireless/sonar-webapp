// POST /api/autos/consolidar-fatos
// Passada 2a numa requisição PRÓPRIA: o que os autos dizem.
//
// As duas etapas numa requisição só deram 504 em produção ("Task timed out
// after 800 seconds"). Agora cada etapa tem o tempo de função inteiro, lê
// as extrações do BANCO em vez de recebê-las no corpo (nada grande
// trafega), e grava o resultado antes de responder (nada se perde).
import { NextRequest, NextResponse } from "next/server";

import {
  consolidarFatos,
  custoEmReais,
  somarCustos,
  traduzirErroApi,
} from "@/lib/autos/claude";
import { atualizarAnalise, obterParaConsolidar } from "@/lib/autos/analises";
import { exigirEquipeNaRota, respostaDeErro } from "../_auth";

export const dynamic = "force-dynamic";
export const maxDuration = 800;

export async function POST(req: NextRequest) {
  const auth = await exigirEquipeNaRota();
  if (!auth.ok) return auth.resposta;

  const corpo = (await req.json().catch(() => ({}))) as { analiseId?: number };
  const analiseId = Number(corpo.analiseId);
  if (!Number.isFinite(analiseId)) {
    return NextResponse.json({ erro: "Análise não informada." }, { status: 400 });
  }

  const a = await obterParaConsolidar(analiseId);
  if (!a) {
    return NextResponse.json({ erro: "Análise não encontrada." }, { status: 404 });
  }

  const esperados = a.triagem?.totalLotes ?? a.extracoes.length;
  if (a.extracoes.length === 0 || a.extracoes.length < esperados) {
    return NextResponse.json(
      {
        erro: `Faltam lotes para consolidar: ${a.extracoes.length} de ${esperados} lidos. Arraste o mesmo PDF de novo para continuar de onde parou.`,
      },
      { status: 409 },
    );
  }

  await atualizarAnalise(a.id, {
    status: "consolidando",
    etapa_atual: "Apurando os fatos",
    progresso_pct: 88,
    erro: null,
  });

  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const { fatos, custo } = await consolidarFatos({
      extracoes: a.extracoes.map((l) => l.extracao),
      totalPaginas: a.total_paginas,
      hoje,
    });

    const custos = somarCustos([...a.custo_tokens, custo]);
    const custoBrl = custos.reduce((s, c) => s + custoEmReais(c), 0);

    await atualizarAnalise(a.id, {
      ficha: fatos,
      etapa_atual: "Fatos apurados; julgando",
      progresso_pct: 93,
      numero_processo: fatos.identificacao?.numeroCnj ?? null,
      custo_tokens: custos,
      custo_brl: Number(custoBrl.toFixed(4)),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    await atualizarAnalise(a.id, {
      status: "erro",
      etapa_atual: "Falhou ao apurar os fatos",
      erro: traduzirErroApi(e).slice(0, 1000),
    }).catch(() => undefined);
    return respostaDeErro(e);
  }
}
