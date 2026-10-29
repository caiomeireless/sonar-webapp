// POST /api/autos/consolidar-juizo
// Passada 2b numa requisição PRÓPRIA: o que os fatos significam e o que
// fazer. Lê do banco os fatos apurados pela etapa anterior e os marcos
// prescricionais das extrações; grava a ficha completa e libera a
// conferência.
import { NextRequest, NextResponse } from "next/server";

import {
  consolidarJuizo,
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

  const corpo = (await req.json().catch(() => ({}))) as {
    analiseId?: number;
    dadosAssertiva?: string;
  };
  const analiseId = Number(corpo.analiseId);
  if (!Number.isFinite(analiseId)) {
    return NextResponse.json({ erro: "Análise não informada." }, { status: 400 });
  }

  const a = await obterParaConsolidar(analiseId);
  if (!a) {
    return NextResponse.json({ erro: "Análise não encontrada." }, { status: 404 });
  }
  if (!a.ficha || !Array.isArray(a.ficha.medidasRealizadas)) {
    return NextResponse.json(
      { erro: "Os fatos ainda não foram apurados para esta análise." },
      { status: 409 },
    );
  }

  await atualizarAnalise(a.id, {
    status: "consolidando",
    etapa_atual: "Julgando: prescrição, vulnerabilidades e o que falta",
    progresso_pct: 94,
    erro: null,
  });

  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const marcos = a.extracoes.flatMap((l) => l.extracao.marcos ?? []);

    const { ficha, custo } = await consolidarJuizo({
      fatos: a.ficha,
      marcos,
      totalPaginas: a.total_paginas,
      totalLotes: a.extracoes.length,
      hoje,
      dadosAssertiva: corpo.dadosAssertiva,
    });

    const custos = somarCustos([...a.custo_tokens, custo]);
    const custoBrl = custos.reduce((s, c) => s + custoEmReais(c), 0);

    await atualizarAnalise(a.id, {
      status: "revisao",
      etapa_atual: "Pronta para conferência",
      progresso_pct: 100,
      ficha,
      numero_processo: ficha.identificacao?.numeroCnj ?? null,
      custo_tokens: custos,
      custo_brl: Number(custoBrl.toFixed(4)),
    });

    return NextResponse.json({ ficha, custoBrl });
  } catch (e) {
    await atualizarAnalise(a.id, {
      status: "erro",
      etapa_atual: "Falhou ao julgar",
      erro: traduzirErroApi(e).slice(0, 1000),
    }).catch(() => undefined);
    return respostaDeErro(e);
  }
}
