"use client";

// Navegacao lateral do Sonar.
// - Desktop (md+): <aside> sticky, 240px, sempre visivel.
// - Mobile (<md): drawer off-canvas controlado por estado + botao hamburger
//   flutuante no topo-esquerda.
// Estilo glass: superficie ivory-on-onyx com blur generoso, casa com os tokens
// do projeto (--color-surface-1 / --color-line) e responde a [data-theme].

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  type LucideIcon,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

// --------------------------------------------------------------------------
// Tipos publicos
// --------------------------------------------------------------------------

export type SidebarItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Numero exibido em badge circular signal a direita; oculto se ausente ou 0. */
  badge?: number;
  /** Prefixos extras que marcam o item como ativo (alem do proprio href). */
  matchPrefixes?: string[];
};

export type SidebarUsuario = {
  email: string;
  /** ex: "socio", "funcionario", "cliente". */
  papel: string;
};

export type SidebarPortal = "equipe" | "cliente";

type SidebarProps = {
  items: SidebarItem[];
  usuario: SidebarUsuario;
  portal: SidebarPortal;
};

// --------------------------------------------------------------------------
// Componente principal
// --------------------------------------------------------------------------

export function Sidebar({ items, usuario, portal }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha drawer ao trocar de rota.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // ESC fecha drawer mobile.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Trava scroll do body enquanto drawer aberto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const homeHref = `/${portal}`;

  return (
    <>
      {/* Botao hamburger flutuante — so mobile, so quando drawer fechado */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center
                     justify-center rounded-xl border border-[var(--color-line)]
                     bg-[var(--color-surface-1)] text-[var(--color-ivory)]
                     backdrop-blur-xl transition hover:bg-[var(--color-surface-2)]
                     md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {/* Desktop: aside fixa */}
      <SidebarPanel
        items={items}
        usuario={usuario}
        portal={portal}
        homeHref={homeHref}
        variant="desktop"
      />

      {/* Mobile: drawer off-canvas */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-[var(--color-onyx)]/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <SidebarPanel
            items={items}
            usuario={usuario}
            portal={portal}
            homeHref={homeHref}
            variant="drawer"
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// Painel (compartilhado entre desktop e drawer)
// --------------------------------------------------------------------------

type PanelProps = {
  items: SidebarItem[];
  usuario: SidebarUsuario;
  portal: SidebarPortal;
  homeHref: string;
  variant: "desktop" | "drawer";
  onClose?: () => void;
};

function SidebarPanel({
  items,
  usuario,
  portal,
  homeHref,
  variant,
  onClose,
}: PanelProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Focus inicial no botao fechar (focus trap simples).
  useEffect(() => {
    if (variant !== "drawer") return;
    closeBtnRef.current?.focus();
  }, [variant]);

  const isDrawer = variant === "drawer";

  // Classes de container — sticky no desktop, fixed na esquerda no drawer.
  const baseShell =
    "flex h-svh w-[240px] shrink-0 flex-col gap-6 border-r " +
    "border-[var(--color-line)] bg-[var(--color-surface-1)] px-4 py-6 " +
    "backdrop-blur-2xl";

  const shellClass = isDrawer
    ? `absolute left-0 top-0 z-10 ${baseShell} animate-[slideIn_180ms_ease-out]`
    : `sticky top-0 hidden ${baseShell} md:flex`;

  return (
    <aside className={shellClass} aria-label="Navegacao principal">
      {/* Header: logo + (drawer) botao fechar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <Link
          href={homeHref}
          className="inline-flex items-center rounded-lg outline-none transition
                     focus-visible:ring-2 focus-visible:ring-[var(--color-signal)]"
          aria-label="Sonar — pagina inicial"
        >
          <Logo size="sm" />
        </Link>

        {isDrawer && (
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg
                       border border-[var(--color-line)] bg-[var(--color-surface-2)]
                       text-[var(--color-ivory)] transition
                       hover:bg-[var(--color-line)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map((item) => (
          <NavLinkItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Footer: usuario + acoes */}
      <SidebarFooter usuario={usuario} portal={portal} />
    </aside>
  );
}

// --------------------------------------------------------------------------
// Item de navegacao
// --------------------------------------------------------------------------

function NavLinkItem({ item }: { item: SidebarItem }) {
  const pathname = usePathname();
  const Icon = item.icon;

  const prefixes = item.matchPrefixes ?? [item.href];
  const ativo = prefixes.some((p) => {
    if (p === "/equipe" || p === "/cliente") return pathname === p;
    return pathname === p || pathname.startsWith(p + "/");
  });

  const base =
    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm " +
    "transition outline-none focus-visible:ring-2 " +
    "focus-visible:ring-[var(--color-signal)]";

  const inativo =
    "text-[var(--color-ivory-88)] hover:bg-[var(--color-surface-2)] " +
    "hover:text-[var(--color-ivory)]";

  const ativoCls =
    "font-medium text-[var(--color-signal)] " +
    "bg-[var(--color-signal-soft)]";

  return (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      className={`${base} ${ativo ? ativoCls : inativo}`}
    >
      {/* Bullet 4px sinal — so quando ativo */}
      <span
        aria-hidden="true"
        className={
          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full " +
          "bg-[var(--color-signal)] transition-opacity " +
          (ativo ? "opacity-100" : "opacity-0")
        }
      />

      <Icon
        className="h-[18px] w-[18px] shrink-0"
        strokeWidth={ativo ? 2.25 : 2}
        aria-hidden="true"
      />

      <span className="truncate">{item.label}</span>

      {/* Badge numerico (so se > 0) */}
      {typeof item.badge === "number" && item.badge > 0 && (
        <span
          className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center
                     rounded-full bg-[var(--color-signal)] px-1.5 text-[10px]
                     font-semibold text-[var(--color-onyx)] tabular-nums"
          aria-label={`${item.badge} novos`}
        >
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}

// --------------------------------------------------------------------------
// Footer: card do usuario + ThemeToggle + Sair
// --------------------------------------------------------------------------

function SidebarFooter({
  usuario,
  portal,
}: {
  usuario: SidebarUsuario;
  portal: SidebarPortal;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Card do usuario */}
      <div
        className="flex flex-col gap-1.5 rounded-xl border border-[var(--color-line)]
                   bg-[var(--color-surface-2)] px-3 py-2.5"
      >
        <span
          className="truncate text-[13px] text-[var(--color-ivory)]"
          title={usuario.email}
        >
          {usuario.email}
        </span>
        <div className="flex items-center gap-2">
          <PortalBadge portal={portal} />
          <span className="truncate text-[10px] uppercase tracking-[0.12em]
                           text-[var(--color-ivory-40)]">
            {usuario.papel}
          </span>
        </div>
      </div>

      {/* Acoes em linha: tema + sair */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <form action="/auth/signout" method="post" className="flex-1">
          <button
            type="submit"
            className="flex w-full items-center justify-between gap-2 rounded-xl
                       border border-[var(--color-line)] bg-[var(--color-surface-2)]
                       px-3 py-2 text-[13px] text-[var(--color-ivory-88)]
                       transition hover:bg-[var(--color-line)]
                       hover:text-[var(--color-ivory)]
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--color-signal)]"
          >
            <span>Sair</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          </button>
        </form>
      </div>

      {/* Assinatura */}
      <p className="px-1 text-[10px] text-[var(--color-ivory-40)]">
        Sonar &middot; Battaglia &amp; Pedrosa
      </p>
    </div>
  );
}

// --------------------------------------------------------------------------
// Portal badge (verde signal pra Equipe, dourado pra Cliente)
// --------------------------------------------------------------------------

function PortalBadge({ portal }: { portal: SidebarPortal }) {
  if (portal === "equipe") {
    return (
      <span
        className="inline-flex items-center rounded-full border
                   border-[var(--color-signal-soft-2)] bg-[var(--color-signal-soft)]
                   px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]
                   text-[var(--color-signal)]"
      >
        Equipe
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-full border
                 border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10
                 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]
                 text-[var(--color-gold)]"
    >
      Cliente
    </span>
  );
}
