// Detalhe de uma notificacao — canal EQUIPE. Server Component.
//
// Mostra titulo, corpo, metadata e referencias. Marca como lida automaticamente
// ao abrir (efeito colateral da chamada `marcarComoLida` direto no fetch).
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

import { ehEquipe } from "@/lib/perfis";
import { perfilLogado } from "@/lib/perfis-server";
import {
  buscarNotificacaoPorId,
  configCategoria,
  marcarComoLida,
  type NotificacaoCategoriaEquipe,
} from "@/lib/notificacoes";
import { formatBRL, formatData, formatTempoRelativo } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

// Mapa categoria -> rota e label da acao primaria. Quando o caso/destino
// nao existir, cai pro fallback "Voltar".
function acaoPrimaria(
  categoria: NotificacaoCategoriaEquipe,
  casoId?: number,
): { label: string; href: string } | null {
  switch (categoria) {
    case "themis-novo-processo":
      return { label: "Ver na Fila Themis", href: "/equipe/themis" };
    case "patrimonio-bem-encontrado":
      return casoId
        ? { label: "Abrir Ficha do Devedor", href: `/equipe/devedores/${casoId}` }
        : { label: "Ver Banco de Devedores", href: "/equipe/devedores" };
    case "processo-medida":
      return casoId
        ? { label: "Ver Caso Completo", href: `/equipe/devedores/${casoId}` }
        : null;
    case "processo-audiencia":
      return casoId
        ? { label: "Abrir Caso da Audiência", href: `/equipe/devedores/${casoId}` }
        : null;
    case "processo-parado":
      return casoId
        ? { label: "Revisar Caso Parado", href: `/equipe/devedores/${casoId}` }
        : null;
    case "cliente-novo":
      return { label: "Ver Banco de Devedores", href: "/equipe/devedores" };
    case "consulta-limite":
      return { label: "Abrir Monitor de Custos", href: "/equipe/custos" };
    case "sistema":
      return { label: "Ir para Configurações", href: "/equipe/configuracoes" };
    default:
      return null;
  }
}

export default async function NotificacaoEquipeDetalhe({ params }: Props) {
  const perfil = await perfilLogado();
  if (!ehEquipe(perfil) && process.env.NODE_ENV === "production") {
    redirect("/login");
  }

  const { id } = await params;
  const notificacao = await buscarNotificacaoPorId(id);
  if (!notificacao || notificacao.portal !== "equipe") notFound();

  // Marca como lida ao abrir (efeito colateral leve sobre o mock in-memory).
  if (!notificacao.lida) {
    await marcarComoLida(notificacao.id);
    notificacao.lida = true;
  }

  const cfg = configCategoria(
    "equipe",
    notificacao.categoria as NotificacaoCategoriaEquipe,
  );
  const cor = cfg?.cor ?? "var(--color-ivory-66)";
  const Icone = cfg?.icone ?? Bell;
  const acao = acaoPrimaria(
    notificacao.categoria as NotificacaoCategoriaEquipe,
    notificacao.referencias?.caso_id,
  );

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10 sm:px-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
        <Link
          href="/equipe/notificacoes"
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

          {/* Corpo em prose */}
          <div className="mt-8 space-y-4 whitespace-pre-line text-base leading-relaxed text-[var(--color-ivory-88)]">
            {notificacao.corpo}
          </div>

          {acao ? (
            <div className="mt-10 flex items-center justify-between gap-4 border-t border-[var(--color-line)] pt-6">
              <Link
                href="/equipe/notificacoes"
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
                href="/equipe/notificacoes"
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
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
                Referências
              </p>
              <h2 className="mt-2 font-serif text-lg text-[var(--color-fg)]">
                Contexto da Notificação
              </h2>

              <ul className="mt-5 space-y-4">
                {notificacao.referencias.caso_id ? (
                  <li>
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-ivory-40)]">
                      <Hash className="-mt-0.5 mr-1 inline h-3 w-3" aria-hidden="true" />
                      Caso
                    </div>
                    <Link
                      href={`/equipe/devedores/${notificacao.referencias.caso_id}`}
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
                    <p className="mt-1 font-mono text-lg text-[var(--color-signal)]">
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
