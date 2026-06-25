"use client";

// Sino de notificacoes da TopBar. Substitui o placeholder `BotaoSino` antigo.
//
// Recebe as notificacoes ja resolvidas pelo layout server-side (sem fetch
// no cliente), monta dropdown signal/gold com os 5 mais recentes, badge
// circular com contagem de nao lidas, e expoe um link "Ver todas" pra
// pagina /<portal>/notificacoes.
//
// Padrao visual herdado do AvatarMenu (mesmo botao 14x14 rounded-xl, mesma
// logica de close-on-outside-click usando useRef + mousedown).

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import {
  type Notificacao,
  type PortalNotificacao,
  configCategoria,
} from "@/lib/notificacoes";
import {
  marcarComoLidaAction as marcarLidaEquipe,
  marcarTodasComoLidasAction as marcarTodasEquipe,
} from "@/app/equipe/notificacoes/actions";
import {
  marcarComoLidaAction as marcarLidaCliente,
  marcarTodasComoLidasAction as marcarTodasCliente,
} from "@/app/cliente/notificacoes/actions";

type Props = {
  portal: PortalNotificacao;
  notificacoes: Notificacao[];
  naoLidas: number;
  // Necessario pra que admin/socio em modo "Visualizar como cliente" mantenha
  // o filtro de destinatario ao marcar todas como lidas. No portal equipe,
  // este campo eh ignorado.
  emailCliente?: string | null;
};

export function SinoNotificacoes({
  portal,
  notificacoes,
  naoLidas,
  emailCliente,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  // Fecha ao clicar fora — mesmo padrao do AvatarMenu.
  useEffect(() => {
    if (!aberto) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [aberto]);

  const recentes = notificacoes.slice(0, 5);
  const baseUrl = portal === "equipe" ? "/equipe/notificacoes" : "/cliente/notificacoes";

  function marcarItemComoLido(id: string) {
    startTransition(async () => {
      if (portal === "equipe") {
        await marcarLidaEquipe(id);
      } else {
        await marcarLidaCliente(id);
      }
    });
  }

  function marcarTodas() {
    startTransition(async () => {
      if (portal === "equipe") {
        await marcarTodasEquipe();
      } else {
        await marcarTodasCliente(emailCliente ?? null);
      }
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={`Notificações ${naoLidas > 0 ? `(${naoLidas} não lidas)` : ""}`.trim()}
        className="
          relative inline-flex h-14 w-14 items-center justify-center rounded-xl
          border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]
          transition hover:border-[var(--color-signal-soft-2)] hover:text-[var(--color-fg)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-soft-2)]
        "
      >
        <Bell className="h-6 w-6" aria-hidden="true" />
        {naoLidas > 0 ? (
          <span
            className="
              absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center
              rounded-full bg-[var(--color-signal)] px-1.5 font-mono text-[10px]
              font-bold text-onyx
              ring-2 ring-[var(--color-surface-2)]
            "
          >
            {naoLidas > 99 ? "99+" : naoLidas}
          </span>
        ) : null}
      </button>

      {aberto ? (
        <div
          className="
            absolute right-0 z-50 mt-2 w-[420px] overflow-hidden rounded-xl
            border border-[var(--color-line)] bg-[var(--color-surface-solid)] shadow-2xl
          "
          role="menu"
        >
          {/* Header do dropdown */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-4 py-3">
            <div>
              <p className="font-serif text-sm uppercase tracking-[0.18em] text-[var(--color-fg)]">
                Notificações
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-muted)]">
                {naoLidas > 0
                  ? `${naoLidas} não ${naoLidas === 1 ? "lida" : "lidas"}`
                  : "Tudo em dia"}
              </p>
            </div>
            {naoLidas > 0 ? (
              <button
                type="button"
                onClick={marcarTodas}
                className="
                  inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)]
                  px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]
                  text-[var(--color-fg-muted)] transition hover:border-[var(--color-signal-soft-2)]
                  hover:text-[var(--color-signal)]
                "
                aria-label="Marcar todas como lidas"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Marcar todas
              </button>
            ) : null}
          </div>

          {/* Lista */}
          {recentes.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Bell className="mx-auto mb-2 h-5 w-5 text-[var(--color-fg-muted)]" aria-hidden="true" />
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-fg-muted)]">
                Sem notificações por enquanto
              </p>
            </div>
          ) : (
            <ul className="max-h-[480px] divide-y divide-[var(--color-line)] overflow-y-auto">
              {recentes.map((n) => {
                const cfg = configCategoria(portal, n.categoria);
                const cor = cfg?.cor ?? "var(--color-ivory-66)";
                const Icone = cfg?.icone ?? Bell;
                return (
                  <li key={n.id}>
                    <Link
                      href={`${baseUrl}/${n.id}`}
                      onClick={() => {
                        setAberto(false);
                        if (!n.lida) marcarItemComoLido(n.id);
                      }}
                      className={`
                        relative flex gap-3 px-4 py-3 transition
                        hover:bg-[var(--color-surface-2)]
                        ${n.lida ? "" : "bg-[var(--color-surface-2)]/60"}
                      `}
                    >
                      {/* Dot signal de "nao lida" */}
                      {!n.lida ? (
                        <span
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 inline-block h-2 w-2 rounded-full"
                          style={{ background: "var(--color-signal)" }}
                          aria-hidden="true"
                        />
                      ) : null}

                      {/* Icone categoria */}
                      <span
                        className="
                          mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center
                          rounded-lg border
                        "
                        style={{
                          borderColor: `color-mix(in srgb, ${cor} 45%, transparent)`,
                          background: `color-mix(in srgb, ${cor} 12%, transparent)`,
                          color: cor,
                        }}
                      >
                        <Icone className="h-4 w-4" aria-hidden="true" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className="font-mono text-[10px] uppercase tracking-[0.18em]"
                            style={{ color: cor }}
                          >
                            {cfg?.rotulo ?? n.categoria}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--color-fg-muted)]">
                            {n.relativaEm}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium leading-snug text-[var(--color-fg)]">
                          {n.titulo}
                        </p>
                        <p className="mt-1 line-clamp-2 font-mono text-[12px] leading-relaxed text-[var(--color-fg-muted)]">
                          {n.resumo}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer: Ver todas */}
          <div className="border-t border-[var(--color-line)] px-4 py-2.5">
            <Link
              href={baseUrl}
              onClick={() => setAberto(false)}
              className="
                flex w-full items-center justify-center font-mono text-[12px]
                uppercase tracking-[0.22em] text-[var(--color-signal)] transition
                hover:text-[var(--color-fg)]
              "
            >
              Ver Todas →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
