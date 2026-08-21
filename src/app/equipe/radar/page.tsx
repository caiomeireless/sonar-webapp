// Radar de Movimentações — feed dos andamentos de ALTO SINAL capturados
// pelos robôs (e-SAJ/eproc, Ter+Sex). Filtra 162 mil+ andamentos pelas
// palavras que importam pra execução (penhora, SISBAJUD, RENAJUD, leilão,
// defesas, citação, pagamento) e liga cada item ao dossiê do devedor.
//
// "NOVO" = capturado depois da última visita (localStorage, por navegador).
import Link from "next/link";
import { redirect } from "next/navigation";
import { Radar as RadarIcon } from "lucide-react";

import { ehCliente } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";
import { devEuFromParam } from "@/lib/dev-auth";
import {
  CATEGORIAS_RADAR,
  listarRadar,
  type CategoriaRadarChave,
} from "@/lib/radar";
import { formatData } from "@/lib/format";

import { BadgeNovo } from "./_components/BadgeNovo";

export const dynamic = "force-dynamic";

// Cor de cada categoria (chips e pills) — paleta já usada nos status.
const COR_CATEGORIA: Record<CategoriaRadarChave, string> = {
  bloqueio: "#3CFF8A",
  veiculos: "#FF9C41",
  expropriacao: "#C9A24A",
  penhora: "#3CFF8A",
  defesa: "#DC2626",
  citacao: "#C084FC",
  pagamento: "#3CFF8A",
};

type Props = {
  searchParams?: Promise<{
    eu?: string | string[];
    cat?: string | string[];
    p?: string | string[];
  }>;
};

function primeiro(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function RadarPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const perfil = await perfilLogado();
  if (ehCliente(perfil)) redirect("/cliente/casos");
  const euDev = devEuFromParam(params.eu);
  const eu = euDev ?? perfil?.email ?? null;
  if (!eu) redirect("/login");
  const euQuery = euDev ? `&eu=${encodeURIComponent(euDev)}` : "";

  const catRaw = primeiro(params.cat);
  const categoria: CategoriaRadarChave | "todas" = CATEGORIAS_RADAR.some(
    (c) => c.chave === catRaw,
  )
    ? (catRaw as CategoriaRadarChave)
    : "todas";
  const pagina = Math.max(1, Number.parseInt(primeiro(params.p) ?? "1", 10) || 1);

  const listagem = await listarRadar({ categoria, pagina });

  const rotuloCategoria = new Map(
    CATEGORIAS_RADAR.map((c) => [c.chave, c.rotulo]),
  );

  const linkFiltro = (cat: string, p = 1) =>
    `/equipe/radar?cat=${cat}&p=${p}${euQuery}`;

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10">
      {/* ============ HEADER ============ */}
      <header className="title-shield mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <RadarIcon className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <h1 className="font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Radar de Movimentações
        </h1>
        <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Andamentos de Alto Sinal Capturados dos Tribunais
        </p>
        <p className="mx-auto mt-3 max-w-[680px] font-mono text-[13px] text-[var(--color-signal)]">
          {listagem.erro
            ? "Radar temporariamente indisponível."
            : listagem.itens.length === 0
              ? "Nenhum andamento de alto sinal encontrado."
              : `${listagem.itens.length} andamentos nesta página · página ${listagem.pagina}${listagem.temMais ? " · há mais" : ""}`}
        </p>
      </header>

      {/* ============ CHIPS DE CATEGORIA ============ */}
      <nav
        aria-label="Filtrar por categoria"
        className="mb-8 flex flex-wrap justify-center gap-2"
      >
        <Link
          href={linkFiltro("todas")}
          className={
            "rounded-full border px-3.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.18em] transition " +
            (categoria === "todas"
              ? "border-[var(--color-signal)]/60 bg-[var(--color-signal-soft)] text-[var(--color-signal)]"
              : "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] hover:border-[var(--color-signal-soft-2)] hover:text-[var(--color-fg)]")
          }
        >
          Tudo
        </Link>
        {CATEGORIAS_RADAR.map((c) => (
          <Link
            key={c.chave}
            href={linkFiltro(c.chave)}
            title={c.descricao}
            className={
              "rounded-full border px-3.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.18em] transition " +
              (categoria === c.chave
                ? "border-[var(--color-signal)]/60 bg-[var(--color-signal-soft)] text-[var(--color-signal)]"
                : "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] hover:border-[var(--color-signal-soft-2)] hover:text-[var(--color-fg)]")
            }
          >
            {c.rotulo}
          </Link>
        ))}
      </nav>

      {/* ============ LISTA ============ */}
      {listagem.erro ? (
        <div className="glass mx-auto max-w-[560px] p-10 text-center">
          <h3 className="font-serif text-2xl text-ivory">
            Radar Fora do Ar Momentaneamente
          </h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            Não foi possível consultar os andamentos agora. Recarregue a
            página em instantes — os dados continuam guardados.
          </p>
        </div>
      ) : listagem.itens.length === 0 ? (
        <div className="glass mx-auto max-w-[560px] p-10 text-center">
          <h3 className="font-serif text-2xl text-ivory">Radar limpo</h3>
          <p className="mt-3 text-sm text-[var(--color-ivory-88)]">
            Nenhum andamento com este sinal por enquanto. Os robôs varrem os
            tribunais às terças e sextas — o que chegar aparece aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {listagem.itens.map((item) => {
            const cor = COR_CATEGORIA[item.categoria];
            return (
              <article
                key={item.id}
                className="glass-flat flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[12px] uppercase tracking-[0.16em]"
                      style={{
                        color: cor,
                        backgroundColor: `color-mix(in srgb, ${cor} 14%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${cor} 45%, transparent)`,
                      }}
                    >
                      {rotuloCategoria.get(item.categoria)}
                    </span>
                    <BadgeNovo capturadoEm={item.capturado_em} />
                    <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--color-ivory-66)]">
                      {item.data_andamento
                        ? formatData(item.data_andamento)
                        : "sem data"}
                      {item.tribunal ? ` · ${item.tribunal}` : ""}
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-ivory">
                    {item.descricao}
                  </p>

                  <p className="mt-2 truncate font-mono text-[12px] tracking-wide text-[var(--color-ivory-66)]">
                    {item.devedor ? `${item.devedor.nome} · ` : ""}
                    {item.numero_processo || "processo não identificado"}
                    {item.pasta_themis ? ` · Pasta ${item.pasta_themis}` : ""}
                    {item.credor_nome ? ` · Cliente ${item.credor_nome}` : ""}
                  </p>
                </div>

                {item.devedor && (
                  <Link
                    href={`/equipe/devedores/${item.devedor.id}${euDev ? `?eu=${encodeURIComponent(euDev)}` : ""}`}
                    className="btn-neon-gold shrink-0 self-start"
                  >
                    Abrir Dossiê
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ============ PAGINAÇÃO ============ */}
      {(listagem.pagina > 1 || listagem.temMais) && (
        <nav
          aria-label="Paginação"
          className="mt-8 flex items-center justify-center gap-4"
        >
          {listagem.pagina > 1 ? (
            <Link
              href={linkFiltro(categoria, listagem.pagina - 1)}
              className="btn-neon-gold"
            >
              Página Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-[var(--color-ivory-66)]">
            Página {listagem.pagina}
          </span>
          {listagem.temMais && (
            <Link
              href={linkFiltro(categoria, listagem.pagina + 1)}
              className="btn-neon-gold"
            >
              Próxima Página
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
