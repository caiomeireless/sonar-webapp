// Detalhe de uma notificacao — canal CLIENTE. Server Component.
//
// Mesmo layout do detalhe da equipe, mas: referencias linkam pra /cliente/casos,
// acoes primarias contextualizadas (Ver meu caso, Falar com escritorio, etc).
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Hash,
  User,
  Wallet,
} from "lucide-react";

import { perfilLogado } from "@/lib/perfis-server";
import { previewEuFromParam } from "@/lib/dev-auth";
import { DEMO_CLIENTE_EMAIL } from "@/lib/mock-fixtures";
import {
  buscarNotificacaoPorId,
  configCategoria,
  marcarComoLida,
  type NotificacaoCategoriaCliente,
} from "@/lib/notificacoes";
import { formatBRL, formatData, formatTempoRelativo } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ eu?: string | string[] }>;
};

function acaoPrimaria(
  categoria: NotificacaoCategoriaCliente,
  casoId?: number,
  qsEu: string = "",
): { label: string; href: string } | null {
  switch (categoria) {
    case "patrimonio-encontrado":
      return casoId
        ? { label: "Ver Meu Caso", href: `/cliente/casos/${casoId}${qsEu}` }
        : { label: "Ver Meus Casos", href: `/cliente/casos${qsEu}` };
    case "recuperacao-efetivada":
      return casoId
        ? { label: "Ver Meu Caso", href: `/cliente/casos/${casoId}${qsEu}` }
        : { label: "Ver Meus Casos", href: `/cliente/casos${qsEu}` };
    case "audiencia-agendada":
      return casoId
        ? { label: "Abrir Caso da Audiência", href: `/cliente/casos/${casoId}${qsEu}` }
        : null;
    case "andamento-processo":
      return casoId
        ? { label: "Ver Caso Completo", href: `/cliente/casos/${casoId}${qsEu}` }
        : { label: "Ver Meus Casos", href: `/cliente/casos${qsEu}` };
    case "relatorio-mensal":
      return { label: "Abrir Meus Casos", href: `/cliente/casos${qsEu}` };
    case "mensagem-escritorio":
      return { label: "Falar com o Escritório", href: `/cliente/sugestoes${qsEu}` };
    case "limite-consultas":
      return { label: "Ajustar Limite", href: `/cliente/preferencias${qsEu}` };
    default:
      return null;
  }
}

export default async function NotificacaoClienteDetalhe({
  params,
  searchParams,
}: Props) {
  const sp = (await searchParams) ?? {};
  const perfilSessao = await perfilLogado();
  if (!perfilSessao && process.env.NODE_ENV === "production") {
    redirect("/login");
  }

  const ehVisualizacao =
    perfilSessao?.papel === "admin" || perfilSessao?.papel === "socio";
  const euParam = previewEuFromParam(sp.eu, perfilSessao);
  const emailEfetivo =
    euParam ?? (ehVisualizacao ? DEMO_CLIENTE_EMAIL : perfilSessao?.email ?? null);

  const { id } = await params;
  const notificacao = await buscarNotificacaoPorId(id);
  if (!notificacao || notificacao.portal !== "cliente") notFound();

  // Marca como lida ao abrir.
  if (!notificacao.lida) {
    await marcarComoLida(notificacao.id);
    notificacao.lida = true;
  }

  const cfg = configCategoria(
    "cliente",
    notificacao.categoria as NotificacaoCategoriaCliente,
  );
  const cor = cfg?.cor ?? "var(--color-ivory-66)";
  const Icone = cfg?.icone ?? Bell;
  const qsEu = ehVisualizacao && emailEfetivo
    ? `?eu=${encodeURIComponent(emailEfetivo)}`
    : "";
  const acao = acaoPrimaria(
    notificacao.categoria as NotificacaoCategoriaCliente,
    notificacao.referencias?.caso_id,
    qsEu,
  );

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
        <Link
          href={`/cliente/notificacoes${qsEu}`}
          className="transition hover:text-[var(--color-signal)]"
        >
          Notificações
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span style={{ color: cor }}>{cfg?.rotulo ?? notificacao.categoria}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Conteudo principal */}
        <article className="glass p-8">
          {/* Categoria pill grande */}
          <div className="mb-5 inline-flex items-center gap-3">
            <span
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border"
              style={{
                borderColor: `color-mix(in srgb, ${cor} 45%, transparent)`,
                background: `color-mix(in srgb, ${cor} 12%, transparent)`,
                color: cor,
              }}
            >
              <Icone className="h-5 w-5" aria-hidden="true" />
            </span>
            <span
              className="font-mono text-[12px] uppercase tracking-[0.28em]"
              style={{ color: cor }}
            >
              {cfg?.rotulo ?? notificacao.categoria}
            </span>
          </div>

          <h1 className="font-serif text-3xl font-medium leading-tight text-[var(--color-fg)]">
            {notificacao.titulo}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.20em] text-[var(--color-ivory-40)]">
            <span>{notificacao.relativaEm}</span>
            <span>· {formatTempoRelativo(notificacao.criadoEm)}</span>
            <span>· {formatData(notificacao.criadoEm)}</span>
            <span className="inline-flex items-center gap-1.5 text-[var(--color-signal)]">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Lida
            </span>
          </div>

          {/* Corpo em prose narrativa */}
          <div className="mt-8 space-y-4 whitespace-pre-line text-base leading-relaxed text-[var(--color-ivory-88)]">
            {notificacao.corpo}
          </div>

          {acao ? (
            <div className="mt-10 flex items-center justify-between gap-4 border-t border-[var(--color-line)] pt-6">
              <Link
                href={`/cliente/notificacoes${qsEu}`}
                className="
                  inline-flex items-center gap-2 font-mono text-[12px] uppercase
                  tracking-[0.22em] text-[var(--color-ivory-66)] transition
                  hover:text-[var(--color-fg)]
                "
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar para Notificações
              </Link>
              <Link href={acao.href} className="btn-neon-signal">
                {acao.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="mt-10 border-t border-[var(--color-line)] pt-6">
              <Link
                href={`/cliente/notificacoes${qsEu}`}
                className="
                  inline-flex items-center gap-2 font-mono text-[12px] uppercase
                  tracking-[0.22em] text-[var(--color-ivory-66)] transition
                  hover:text-[var(--color-fg)]
                "
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar para Notificações
              </Link>
            </div>
          )}
        </article>

        {/* Sidebar referencias */}
        <aside className="space-y-4">
          {notificacao.referencias ? (
            <div className="glass p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-gold)]">
                Referências
              </p>
              <h2 className="mt-2 font-serif text-lg text-[var(--color-fg)]">
                Contexto desta Notícia
              </h2>

              <ul className="mt-5 space-y-4">
                {notificacao.referencias.caso_id ? (
                  <li>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
                      <Hash className="-mt-0.5 mr-1 inline h-3 w-3" aria-hidden="true" />
                      Caso
                    </div>
                    <Link
                      href={`/cliente/casos/${notificacao.referencias.caso_id}${qsEu}`}
                      className="mt-1 inline-block font-serif text-base text-[var(--color-signal)] underline-offset-4 hover:underline"
                    >
                      Caso #{notificacao.referencias.caso_id}
                    </Link>
                  </li>
                ) : null}

                {notificacao.referencias.devedor_nome ? (
                  <li>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
                      <User className="-mt-0.5 mr-1 inline h-3 w-3" aria-hidden="true" />
                      Devedor
                    </div>
                    <p className="mt-1 nome-devedor font-medium text-[var(--color-fg)]">
                      {notificacao.referencias.devedor_nome}
                    </p>
                  </li>
                ) : null}

                {notificacao.referencias.valor_brl !== undefined ? (
                  <li>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
                      <Wallet className="-mt-0.5 mr-1 inline h-3 w-3" aria-hidden="true" />
                      Valor de Referência
                    </div>
                    <p
                      className="mt-1 font-mono text-lg"
                      style={{ color: cor }}
                    >
                      {formatBRL(notificacao.referencias.valor_brl)}
                    </p>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <div className="glass p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-gold)]">
              Quando
            </p>
            <h2 className="mt-2 font-serif text-lg text-[var(--color-fg)]">
              Linha do Tempo
            </h2>
            <div className="mt-5 space-y-3 font-mono text-[12px] uppercase tracking-[0.18em] text-[var(--color-ivory-66)]">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-[var(--color-gold)]" aria-hidden="true" />
                <span>{formatData(notificacao.criadoEm)}</span>
              </div>
              <div className="font-mono text-[11px] tracking-normal text-[var(--color-ivory-40)]">
                {notificacao.relativaEm} ({formatTempoRelativo(notificacao.criadoEm)})
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
