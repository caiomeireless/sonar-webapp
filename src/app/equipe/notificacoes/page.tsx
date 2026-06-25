// Central de Notificacoes — equipe. Server Component.
//
// Lista todas as notificacoes do canal EQUIPE em ordem cronologica decrescente,
// com filtros por categoria e por status (todas | nao lidas) via searchParams.
// Cards em grid responsivo, cada um linkando pro detalhe /<id>.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";

import { ehEquipe } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";
import {
  CATEGORIAS_EQUIPE,
  configCategoria,
  listarNotificacoesEquipe,
  type NotificacaoCategoriaEquipe,
} from "@/lib/notificacoes";
import { formatBRL, formatTempoRelativo } from "@/lib/format";

import { marcarTodasComoLidasForm } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    categoria?: string;
    status?: string;
  }>;
};

export default async function NotificacoesEquipePage({ searchParams }: Props) {
  const perfil = await perfilLogado();
  if (!ehEquipe(perfil) && process.env.NODE_ENV === "production") {
    redirect("/login");
  }

  const params = (await searchParams) ?? {};
  const filtroCategoria = (params.categoria ?? "").trim();
  const filtroStatus = (params.status ?? "").trim();

  const todas = await listarNotificacoesEquipe();
  const filtradas = todas.filter((n) => {
    if (filtroCategoria && n.categoria !== filtroCategoria) return false;
    if (filtroStatus === "nao-lidas" && n.lida) return false;
    return true;
  });

  const naoLidasNoTotal = todas.filter((n) => !n.lida).length;

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-10 sm:px-10">
      {/* ============ HEADER ============ */}
      <header className="title-shield mb-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-2)]">
          <Bell className="h-5 w-5 text-[var(--color-signal)]" />
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
          Tudo Que Mexeu na Carteira
        </p>
        <h1 className="mt-3 font-serif text-[clamp(19px,2.75vw,34px)] font-medium uppercase leading-[1.05] tracking-[0.08em] text-[var(--color-gold)]">
          Central de Notificações
        </h1>
        <p className="mx-auto mt-3 max-w-[640px] font-mono text-[13px] text-[var(--color-ivory-88)]">
          Novos processos do Themis, bens encontrados, audiências, casos
          parados e tudo mais que merece sua atenção.
        </p>
      </header>

      {/* ============ FILTROS + AÇÃO ============ */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <ChipFiltro
            ativo={!filtroCategoria && filtroStatus !== "nao-lidas"}
            href="/equipe/notificacoes"
            label="Todas"
            contador={todas.length}
            cor="var(--color-fg)"
          />
          <ChipFiltro
            ativo={filtroStatus === "nao-lidas"}
            href="/equipe/notificacoes?status=nao-lidas"
            label="Não Lidas"
            contador={naoLidasNoTotal}
            cor="var(--color-signal)"
          />
          <span className="mx-1 h-5 w-px bg-[var(--color-line)]" aria-hidden="true" />
          {CATEGORIAS_EQUIPE.map((c) => {
            const total = todas.filter((n) => n.categoria === c.chave).length;
            if (total === 0) return null;
            return (
              <ChipFiltro
                key={c.chave}
                ativo={filtroCategoria === c.chave}
                href={`/equipe/notificacoes?categoria=${c.chave}`}
                label={c.rotulo}
                contador={total}
                cor={c.cor}
              />
            );
          })}
        </div>

        {naoLidasNoTotal > 0 ? (
          <form action={marcarTodasComoLidasForm}>
            <button
              type="submit"
              className="
                inline-flex items-center gap-2 rounded-xl border border-[var(--color-signal-soft-2)]
                bg-[var(--color-signal-soft)] px-4 py-2.5 font-mono text-[12px]
                uppercase tracking-[0.18em] text-[var(--color-signal)] transition
                hover:bg-[var(--color-signal-soft-2)]
              "
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Marcar Todas Como Lidas
            </button>
          </form>
        ) : null}
      </div>

      {/* ============ LISTA ============ */}
      {filtradas.length === 0 ? (
        <div className="glass p-10 text-center">
          <Bell className="mx-auto mb-3 h-6 w-6 text-[var(--color-ivory-40)]" aria-hidden="true" />
          <p className="font-mono text-[12px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
            Nenhuma notificação por aqui
          </p>
          <p className="mt-2 text-sm text-[var(--color-ivory-66)]">
            {filtroStatus === "nao-lidas"
              ? "Você já leu tudo. Bom trabalho."
              : "Nenhum evento se encaixa no filtro escolhido."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtradas.map((n) => {
            const cfg = configCategoria("equipe", n.categoria as NotificacaoCategoriaEquipe);
            const cor = cfg?.cor ?? "var(--color-ivory-66)";
            const Icone = cfg?.icone ?? Bell;
            return (
              <Link
                key={n.id}
                href={`/equipe/notificacoes/${n.id}`}
                className={`
                  glass relative flex flex-col gap-4 p-6 transition
                  hover:border-[var(--color-signal-soft-2)]
                  ${!n.lida ? "ring-1 ring-[var(--color-signal-soft-2)]" : ""}
                `}
              >
                {!n.lida ? (
                  <span
                    className="absolute right-4 top-4 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: "var(--color-signal)" }}
                    aria-label="Não lida"
                  />
                ) : null}

                <header className="flex items-center gap-3">
                  <span
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: `color-mix(in srgb, ${cor} 45%, transparent)`,
                      background: `color-mix(in srgb, ${cor} 12%, transparent)`,
                      color: cor,
                    }}
                  >
                    <Icone className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span
                    className="font-mono text-[12px] uppercase tracking-[0.22em]"
                    style={{ color: cor }}
                  >
                    {cfg?.rotulo ?? n.categoria}
                  </span>
                </header>

                <div>
                  <h3 className="font-serif text-xl font-medium leading-snug text-[var(--color-fg)]">
                    {n.titulo}
                  </h3>
                  <p className="mt-2 line-clamp-3 font-mono text-[12px] leading-relaxed text-[var(--color-ivory-88)]">
                    {n.resumo}
                  </p>
                </div>

                <footer className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.20em] text-[var(--color-ivory-40)]">
                  <span>{n.relativaEm}</span>
                  <span>· {formatTempoRelativo(n.criadoEm)}</span>
                  {n.referencias?.caso_id ? (
                    <span>· Caso {n.referencias.caso_id}</span>
                  ) : null}
                  {n.referencias?.valor_brl ? (
                    <span className="text-[var(--color-signal)]">
                      · {formatBRL(n.referencias.valor_brl)}
                    </span>
                  ) : null}
                </footer>
                {n.referencias?.devedor_nome ? (
                  <p className="-mt-2 font-mono text-[11px] text-[var(--color-ivory-66)]">
                    <span className="nome-devedor">{n.referencias.devedor_nome}</span>
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

function ChipFiltro({
  ativo,
  href,
  label,
  contador,
  cor,
}: {
  ativo: boolean;
  href: string;
  label: string;
  contador: number;
  cor: string;
}) {
  return (
    <Link
      href={href}
      className="
        inline-flex items-center gap-2 rounded-full border px-3 py-1.5
        font-mono text-[11px] uppercase tracking-[0.20em] transition
      "
      style={
        ativo
          ? {
              borderColor: `color-mix(in srgb, ${cor} 60%, transparent)`,
              background: `color-mix(in srgb, ${cor} 14%, transparent)`,
              color: cor,
            }
          : {
              borderColor: "var(--color-line)",
              color: "var(--color-ivory-66)",
            }
      }
    >
      {label}
      <span className="font-mono text-[10px] opacity-70">{contador}</span>
    </Link>
  );
}
