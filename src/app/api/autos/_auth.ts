// Porta de entrada das rotas da Análise de Autos.
//
// O Sonar não tem middleware.ts, então NÃO existe gate global de auth: cada
// rota barra por conta própria. Estas rotas leem peças de processo e gastam
// dinheiro de API — nenhuma brecha de ambiente é aceitável aqui.
import { NextResponse } from "next/server";

import { traduzirErroApi } from "@/lib/autos/claude";
import { ehEquipe } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";

export async function exigirEquipeNaRota(): Promise<
  { ok: true; email: string } | { ok: false; resposta: NextResponse }
> {
  const perfil = await perfilLogado();
  if (!perfil) {
    return {
      ok: false,
      resposta: NextResponse.json({ erro: "Não autenticado" }, { status: 401 }),
    };
  }
  if (!ehEquipe(perfil)) {
    return {
      ok: false,
      resposta: NextResponse.json(
        { erro: "Somente a equipe do escritório pode analisar autos" },
        { status: 403 },
      ),
    };
  }
  return { ok: true, email: perfil.email };
}

/**
 * Converte exceção em resposta JSON sem vazar stack para o navegador, e
 * traduz a falha da API para linguagem de advogado — inclusive dizendo
 * quando o problema é do Sonar e não do arquivo.
 */
export function respostaDeErro(e: unknown): NextResponse {
  console.error("[autos]", e);
  return NextResponse.json({ erro: traduzirErroApi(e) }, { status: 500 });
}
