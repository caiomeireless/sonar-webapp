"use client";

// Topbar global das áreas autenticadas (Equipe + Cliente).
//
// Estrutura:
//   - Esquerda/centro: título + subtítulo da página corrente (mapa pathname→título).
//   - Direita: botão Sincronizar (placeholder visual, ação real virá com
//     integração Themis), sino de notificações (placeholder) e avatar
//     do usuário com dropdown (e-mail + Sair).
//
// Inspirada no BP CRM. Cores Sonar.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, Eye, LogOut, RefreshCw } from "lucide-react";

import { AssistantBot } from "./AssistantBot";

type Usuario = { email: string; papel: string };

type TitulosMap = Record<string, { titulo: string; subtitulo?: string }>;

const TITULOS_EQUIPE: TitulosMap = {
  "/equipe": {
    titulo: "Dashboard",
    subtitulo: "Visão geral da carteira do escritório",
  },
  "/equipe/devedores": {
    titulo: "Banco de Devedores",
    subtitulo: "Carteira hierárquica de clientes e casos",
  },
  "/equipe/themis": {
    titulo: "Fila Themis",
    subtitulo: "Execuções aguardando rastreamento patrimonial",
  },
  "/equipe/custos": {
    titulo: "Monitor de Custos",
    subtitulo: "Gastos com APIs por advogado, cliente e devedor",
  },
  "/equipe/configuracoes": {
    titulo: "Configurações",
    subtitulo: "Administração da plataforma",
  },
};

const TITULOS_CLIENTE: TitulosMap = {
  "/cliente/casos": {
    titulo: "Meus Casos",
    subtitulo: "Acompanhamento patrimonial dos seus processos",
  },
  "/cliente/preferencias": {
    titulo: "Preferências",
    subtitulo: "Limites de gasto e regras de consulta",
  },
};

function resolverTitulo(
  pathname: string,
  mapa: TitulosMap,
): { titulo: string; subtitulo?: string } {
  // Match exato primeiro, depois maior prefixo.
  if (mapa[pathname]) return mapa[pathname];
  const chaves = Object.keys(mapa).sort((a, b) => b.length - a.length);
  const k = chaves.find((c) => pathname.startsWith(c + "/"));
  if (k) return mapa[k];
  // Fallback inteligente por contexto.
  if (pathname.startsWith("/equipe/devedores")) {
    return mapa["/equipe/devedores"] ?? { titulo: "Devedores" };
  }
  if (pathname.startsWith("/equipe")) {
    return { titulo: "Sonar", subtitulo: "Plataforma" };
  }
  return { titulo: "Sonar" };
}

export function TopBar({
  usuario,
  portal,
}: {
  usuario: Usuario;
  portal: "equipe" | "cliente";
}) {
  const pathname = usePathname();
  const mapa = portal === "equipe" ? TITULOS_EQUIPE : TITULOS_CLIENTE;
  const { titulo, subtitulo } = resolverTitulo(pathname, mapa);

  const inicial = (usuario.email[0] || "?").toUpperCase();

  return (
    <header className="relative sticky top-0 z-20 border-b border-[var(--color-line)] bg-[var(--color-bg-2)]/70 backdrop-blur-xl">
      {/* Faixa de quadriculado verde — mesma altura/estilo da faixa do logo
          na sidebar, ficam alinhadas na horizontal. */}
      <div
        className="bg-grid-strong animate-grid-pulse absolute inset-0 overflow-hidden opacity-80"
        aria-hidden="true"
      />
      {/* Vinheta radial signal sutil pra dar peso ao centro */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(60,255,138,0.10), transparent 70%)",
        }}
      />

      <div className="relative flex min-h-[122px] items-center px-6 sm:px-10">
        {/* Esquerda: Sincronizar + Sino */}
        <div className="flex items-center gap-2">
          <BotaoSincronizar />
          <BotaoSino />
        </div>

        {/* Centro absoluto: título da página + subtítulo, centralizados
            horizontal e vertical, independentes do conteúdo lateral. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <h1 className="font-serif text-2xl font-medium uppercase tracking-[0.06em] text-[var(--color-fg)] sm:text-[28px]">
            {titulo}
          </h1>
          {subtitulo ? (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-muted)]">
              {subtitulo}
            </p>
          ) : null}
        </div>

        {/* Direita: AssistantBot (3D) + Avatar */}
        <div className="ml-auto flex items-center gap-3">
          <AssistantBot />
          <AvatarMenu usuario={usuario} inicial={inicial} />
        </div>
      </div>
    </header>
  );
}

// --------------------------------------------------------------------------

function BotaoSincronizar() {
  const [girando, setGirando] = useState(false);

  function sincronizar() {
    if (girando) return;
    setGirando(true);
    // Placeholder: ação real vem com integração Themis (Sem 2-8).
    // Aqui só simula o feedback visual.
    setTimeout(() => setGirando(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={sincronizar}
      className="
        inline-flex items-center gap-2 rounded-lg border border-[var(--color-signal-soft-2)]
        bg-[var(--color-signal-soft)] px-3 py-1.5 text-xs font-medium text-[var(--color-signal)]
        transition hover:bg-[var(--color-signal-soft-2)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal)]
      "
    >
      <RefreshCw
        className={`h-3.5 w-3.5 ${girando ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      Sincronizar
    </button>
  );
}

// --------------------------------------------------------------------------

function BotaoSino() {
  return (
    <button
      type="button"
      aria-label="Notificações"
      className="
        relative inline-flex h-9 w-9 items-center justify-center rounded-lg
        border border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]
        transition hover:border-[var(--color-signal-soft-2)] hover:text-[var(--color-fg)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-soft-2)]
      "
    >
      <Bell className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

// --------------------------------------------------------------------------

function AvatarMenu({
  usuario,
  inicial,
}: {
  usuario: Usuario;
  inicial: string;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [aberto]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={aberto ? "true" : "false"}
        className="
          inline-flex items-center gap-2 rounded-full border border-[var(--color-line)]
          bg-[var(--color-surface-2)] py-1 pl-1 pr-2 transition
          hover:border-[var(--color-signal-soft-2)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal-soft-2)]
        "
      >
        <span
          className="
            flex h-7 w-7 items-center justify-center rounded-full
            bg-[var(--color-signal-soft)] text-[12px] font-semibold text-[var(--color-signal)]
          "
        >
          {inicial}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--color-fg-muted)] transition ${aberto ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {aberto && (
        <div
          className="
            absolute right-0 mt-2 w-[260px] overflow-hidden rounded-xl border
            border-[var(--color-line)] bg-[var(--color-surface-solid)] shadow-2xl
          "
        >
          <div className="border-b border-[var(--color-line)] px-4 py-3">
            <p className="truncate text-[13px] text-[var(--color-fg)]" title={usuario.email}>
              {usuario.email}
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
              {usuario.papel}
            </p>
          </div>

          {/* Admin/Sócio: pode entrar na visão do cliente demo (banner mostra
              que está em modo visualização). */}
          {(usuario.papel === "ADMIN" || usuario.papel === "SOCIO") && (
            <Link
              href="/cliente/casos?eu=cliente.demo@battaglia.com.br"
              className="
                flex items-center gap-2 border-b border-[var(--color-line)]
                px-4 py-2.5 text-sm text-[var(--color-fg-muted)] transition
                hover:bg-[var(--color-surface-2)] hover:text-[var(--color-signal)]
              "
              onClick={() => setAberto(false)}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Visualizar como cliente
            </Link>
          )}

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="
                flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm
                text-[var(--color-fg-muted)] transition
                hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]
              "
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
