// Disparo sob demanda da raspagem dos tribunais — server-only.
// GRATUITO: os robôs e-SAJ/eproc usam Playwright (automação de navegador,
// zero tokens de IA) e rodam no GitHub Actions (free tier). O botão do
// dossiê dispara o workflow_dispatch e os andamentos chegam ao banco em
// ~15-30 min (aparecem na seção Andamentos Processuais).
//
// Env necessária:
//   GITHUB_TOKEN  — PAT fine-grained com Actions: write no repo
//   GITHUB_REPO   — "caiomeireless/sonar-importadores" (default)

export type TribunalCrawl = "esaj" | "eproc";

export const TRIBUNAIS_CRAWL: {
  id: TribunalCrawl;
  rotulo: string;
  descricao: string;
  workflow: string;
}[] = [
  {
    id: "esaj",
    rotulo: "e-SAJ TJSP",
    descricao: "Processos físicos antigos e digitais legados do TJSP",
    workflow: "sync-esaj.yml",
  },
  {
    id: "eproc",
    rotulo: "eproc TJSP",
    descricao: "Processos novos do TJSP (sistema atual)",
    workflow: "sync-eproc.yml",
  },
];

const GITHUB_REPO =
  process.env.GITHUB_REPO || "caiomeireless/sonar-importadores";

export function crawlConfigurado(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

export type ResultadoDisparo =
  | { ok: true; disparados: string[] }
  | { ok: false; erro: string };

// Dispara o workflow_dispatch de cada tribunal selecionado.
export async function dispararCrawlTribunais(
  tribunais: TribunalCrawl[],
): Promise<ResultadoDisparo> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      ok: false,
      erro: "GITHUB_TOKEN não configurado no ambiente — peça ao admin.",
    };
  }
  const selecionados = TRIBUNAIS_CRAWL.filter((t) => tribunais.includes(t.id));
  if (selecionados.length === 0) {
    return { ok: false, erro: "Nenhum tribunal selecionado." };
  }

  const disparados: string[] = [];
  for (const t of selecionados) {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${t.workflow}/dispatches`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref: "main" }),
        cache: "no-store",
      });
    } catch (e) {
      return {
        ok: false,
        erro: `Falha de rede ao falar com o GitHub: ${(e as Error).message}`,
      };
    }
    // 204 = disparado. 404 = workflow/permissão errada. 401 = token inválido.
    if (res.status !== 204) {
      const corpo = await res.text();
      return {
        ok: false,
        erro: `GitHub devolveu ${res.status} pro ${t.rotulo}: ${corpo.slice(0, 200)}`,
      };
    }
    disparados.push(t.rotulo);
  }

  return { ok: true, disparados };
}
