// Radar de Movimentações — feed dos andamentos de ALTO SINAL capturados
// pelos robôs (e-SAJ/eproc, Ter+Sex). Filtra 162 mil+ andamentos pelas
// palavras que importam pra execução (penhora, SISBAJUD, RENAJUD, leilão,
// defesas, citação, pagamento) e liga cada item ao dossiê do devedor.
//
// "NOVO" = capturado depois da última visita (localStorage, por navegador).
import Link from "next/link";
import { redirect } from "next/navigation";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

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
    <main className="relative min-h-svh">
      {/* Fundo: preto puro (padrão da cara nova). */}
      <div aria-hidden="true" className="absolute inset-0 bg-black" />
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-12 sm:px-10">
      {/* ============ HEADER (padrão Banco de Dossiês) ============ */}
      <header className="mb-8 text-center">
        <h1
          className="font-serif text-[clamp(29px,4.2vw,52px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[#C97B2A]"
          style={{ WebkitTextStroke: "1px rgba(255,255,255,0.65)" }}
        >
          Radar de Movimentações
        </h1>
        <p className="mt-3 font-mono text-[clamp(13px,1.6vw,20px)] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]">
          Andamentos de Alto Sinal Capturados dos Tribunais.
        </p>
      </header>

      {/* ============ CHIPS DE CATEGORIA (card de filtro verde) ===== */}
      <SpotlightCard
        local
        degrade="linear-gradient(0deg, rgba(10,48,28,0.7), rgba(10,48,28,0.7))"
        className="p-4 sm:p-5"
      >
      <nav
        aria-label="Filtrar por categoria"
        className="flex flex-wrap justify-center gap-2"
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
      </SpotlightCard>

      {/* Contador vermelho (padrão do Banco). */}
      <p className="mb-4 mt-4 font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-devedor)]">
        {listagem.erro
          ? "Radar temporariamente indisponível"
          : listagem.itens.length === 0
            ? "Nenhum andamento de alto sinal encontrado"
            : `${listagem.itens.length} andamentos nesta página · página ${listagem.pagina}${listagem.temMais ? " · há mais" : ""}`}
      </p>

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
        <div className="flex flex-col gap-2">
          {listagem.itens.map((item) => {
            const cor = COR_CATEGORIA[item.categoria];
            return (
              <SpotlightCard
                key={item.id}
                blur={false}
                local
                claro
                className="transition hover:shadow-[0_0_24px_-10px_rgba(60,255,138,0.3)]"
              >
                <article className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
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

                    {/* Devedor CAIXA ALTA vermelho + processo + cliente
                        laranja (padrão do Banco, reforma 25/08). */}
                    <p className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span
                        className="max-w-full truncate text-[15px] font-semibold uppercase leading-snug text-[var(--color-devedor)]"
                        style={{
                          textShadow:
                            "0 0 1px rgba(220,38,38,0.55), 0 0 10px rgba(220,38,38,0.14)",
                        }}
                      >
                        {item.devedor?.nome ?? "Devedor não vinculado"}
                      </span>
                      <span className="font-mono text-[12px] text-[var(--color-ivory-66)]">
                        {item.numero_processo || "processo não identificado"}
                        {item.pasta_themis ? ` · Pasta ${item.pasta_themis}` : ""}
                      </span>
                      {item.credor_nome ? (
                        <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-[#FF9C41]">
                          {item.credor_nome}
                        </span>
                      ) : null}
                    </p>

                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--color-ivory-88)]">
                      {item.descricao}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 self-start">
                    {item.caso_id ? (
                      <Link
                        href={`/equipe/themis/processo/${item.caso_id}${euDev ? `?eu=${encodeURIComponent(euDev)}` : ""}`}
                        className="btn-neon-signal"
                      >
                        Ficha do Processo
                      </Link>
                    ) : null}
                    {item.devedor && (
                      <Link
                        href={`/equipe/devedores/${item.devedor.id}${euDev ? `?eu=${encodeURIComponent(euDev)}` : ""}`}
                        className="btn-neon-gold"
                      >
                        Abrir Dossiê
                      </Link>
                    )}
                  </div>
                </article>
              </SpotlightCard>
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
      </div>
    </main>
  );
}
