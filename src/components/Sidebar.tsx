"use client";

// Navegacao lateral do Sonar.
// - Desktop (md+): <aside> sticky, 240px, sempre visivel.
// - Mobile (<md): drawer off-canvas controlado por estado + botao hamburger
//   flutuante no topo-esquerda.
// Estilo glass: superficie ivory-on-onyx com blur generoso, casa com os tokens
// do projeto (--color-surface-1 / --color-line) e responde a [data-theme].

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Chave persistente do estado de colapso do nav (desktop).
const COLLAPSED_KEY = "sonar.sidebar.collapsed";

import { LogoSvg } from "./LogoSvg";
import { ThemeToggle } from "./ThemeToggle";

// --------------------------------------------------------------------------
// Tipos publicos
// --------------------------------------------------------------------------

export type SidebarItem = {
  href: string;
  label: string;
  /**
   * Icone ja renderizado (JSX). RSC nao permite passar funcoes como prop
   * de Server -> Client, entao a navegacao serve o React element direto.
   */
  icon: ReactNode;
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
  // Estado de colapso (desktop). Default = expandido. Hidrata do localStorage.
  const [recolhido, setRecolhido] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(COLLAPSED_KEY);
      if (salvo === "1") setRecolhido(true);
    } catch {
      // ignora SecurityError / quota
    }
  }, []);

  function alternarRecolhido() {
    setRecolhido((prev) => {
      const novo = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, novo ? "1" : "0");
      } catch {
        // ignora
      }
      return novo;
    });
  }

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
                     bg-[var(--color-surface-1)] text-[var(--color-fg)]
                     backdrop-blur-xl transition hover:bg-[var(--color-surface-2)]
                     md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {/* Desktop: aside fixa OU bolinha pra reexpandir quando recolhida */}
      {recolhido ? (
        <button
          type="button"
          onClick={alternarRecolhido}
          aria-label="Abrir menu lateral"
          title="Abrir menu lateral"
          className="fixed left-3 top-1/2 z-40 hidden h-12 w-12 -translate-y-1/2
                     items-center justify-center rounded-full
                     border-2 border-[var(--color-signal)]/85
                     bg-[var(--color-onyx)]/85 text-[var(--color-signal)]
                     shadow-[0_0_24px_rgba(60,255,138,0.55),0_0_8px_rgba(60,255,138,0.40),inset_0_0_18px_rgba(60,255,138,0.20)]
                     backdrop-blur-md transition-all duration-200
                     hover:scale-110 hover:border-[#3CFF8A] hover:bg-[var(--color-signal)]/22
                     hover:shadow-[0_0_36px_rgba(60,255,138,0.85),0_0_60px_rgba(60,255,138,0.40)]
                     md:inline-flex"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : (
        <SidebarPanel
          items={items}
          usuario={usuario}
          portal={portal}
          homeHref={homeHref}
          variant="desktop"
          onRecolher={alternarRecolhido}
        />
      )}

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
  /** Desktop: handler pra recolher o nav lateral. */
  onRecolher?: () => void;
};

function SidebarPanel({
  items,
  usuario,
  portal,
  homeHref,
  variant,
  onClose,
  onRecolher,
}: PanelProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Focus inicial no botao fechar (focus trap simples).
  useEffect(() => {
    if (variant !== "drawer") return;
    closeBtnRef.current?.focus();
  }, [variant]);

  const isDrawer = variant === "drawer";

  // Sidebar SEMPRE estica até o final (aside self-stretch) MAS o conteúdo
  // da nav (logo + items + footer) vive num inner sticky top-0 h-dvh —
  // assim o usuário sempre vê o nav inteiro ao rolar, e o background da
  // sidebar continua até o rodapé da página.
  const shellClass = isDrawer
    ? "glass-side absolute left-0 top-0 z-10 flex h-dvh w-[288px] shrink-0 flex-col px-4 py-6 animate-[slideIn_180ms_ease-out]"
    : "glass-side hidden w-[288px] shrink-0 self-stretch md:block";

  const Wrapper = isDrawer
    ? ({ children }: { children: React.ReactNode }) => <>{children}</>
    : ({ children }: { children: React.ReactNode }) => (
        <div className="sticky top-0 flex h-dvh flex-col px-4 py-6">
          {children}
        </div>
      );

  return (
    <aside className={shellClass} aria-label="Navegação principal">
      <Wrapper>
      {/* Header: faixa de grid quadriculado verde com logo sobreposto.
          A faixa "sangra" pras laterais (negative margin) pra cobrir o
          padding interno do shell. */}
      <div className="relative -mx-4 -mt-6 mb-2 overflow-hidden">
        <div
          className="bg-grid-strong animate-grid-pulse absolute inset-0"
          aria-hidden="true"
        />
        {/* Vinheta dourada nos cantos pra suavizar a borda do grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(60,255,138,0.10), transparent 70%)",
          }}
        />
        <div className="relative flex items-center justify-between gap-2 px-4 py-5">
          <Link
            href={homeHref}
            className="inline-flex items-center rounded-lg outline-none transition
                       focus-visible:ring-2 focus-visible:ring-[var(--color-signal)]"
            aria-label="Sonar — página inicial"
          >
            <LogoSvg height={82} />
          </Link>

          {isDrawer && (
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              aria-label="Fechar menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg
                         border border-[var(--color-line)] bg-[var(--color-surface-2)]
                         text-[var(--color-fg)] transition
                         hover:bg-[var(--color-line)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {!isDrawer && onRecolher && (
            <button
              type="button"
              onClick={onRecolher}
              aria-label="Recolher menu lateral"
              title="Recolher menu lateral"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg
                         border border-[var(--color-signal)]/40 bg-[var(--color-onyx)]/60
                         text-[var(--color-signal)] backdrop-blur-md transition
                         hover:scale-105 hover:border-[var(--color-signal)]
                         hover:bg-[var(--color-signal)]/15
                         hover:shadow-[0_0_16px_rgba(60,255,138,0.45)]"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Nav — fundo cinza herdado do glass-side (NAO leva o quadriculado) */}
      <nav className="flex flex-col gap-1 overflow-y-auto">
        {items.map((item) => (
          <NavLinkItem key={item.href} item={item} />
        ))}
      </nav>

      {/* === BLOCO INFERIOR — comeca LOGO abaixo do nav (quase grudado) e
          vai ate o fim. Recebe o MESMO quadriculado verde da faixa do
          logo. flex-1 faz o bloco capturar TODO o espaco apos o nav; o
          spacer interno empurra o footer pra base. O cinza dos
          cards/botoes individuais e' mantido porque cada um tem seu
          proprio bg-surface-2 sobre o quadriculado. */}
      <div className="relative -mx-4 -mb-6 mt-3 flex flex-1 flex-col overflow-hidden">
        {/* Camada do grid quadriculado animado — fade suave do topo:
            o quadriculado "nasce" transparente nos primeiros 90px e so
            depois aparece pleno, criando transicao com o cinza do nav. */}
        <div
          className="bg-grid-strong animate-grid-pulse absolute inset-0
            [mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.25)_45px,black_120px)]
            [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.25)_45px,black_120px)]"
          aria-hidden="true"
        />
        {/* Vinheta verde do topo (espelha a do header do logo) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at bottom, rgba(60,255,138,0.10), transparent 75%)",
          }}
        />
        {/* Conteudo do footer + spacer */}
        <div className="relative z-10 flex flex-1 flex-col px-4 pt-5 pb-6">
          <div className="flex-1" />
          <SidebarFooter usuario={usuario} portal={portal} />
        </div>
      </div>
      </Wrapper>
    </aside>
  );
}

// --------------------------------------------------------------------------
// Item de navegacao
// --------------------------------------------------------------------------

function NavLinkItem({ item }: { item: SidebarItem }) {
  const pathname = usePathname();

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
    "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] " +
    "hover:text-[var(--color-fg)]";

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

      {/* Caixinha de vidro envolvendo o ícone — sutil quando inativo,
          forte quando ativo (signal-soft sobre signal-soft-2). */}
      <span
        className={
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " +
          "border backdrop-blur-md transition " +
          (ativo
            ? "border-[var(--color-signal-soft-2)] bg-[var(--color-signal-soft)] text-[var(--color-signal)] shadow-[0_0_12px_rgba(60,255,138,0.25)]"
            : "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)] group-hover:border-[var(--color-signal-soft-2)] group-hover:text-[var(--color-fg)]")
        }
      >
        {item.icon}
      </span>

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
          className="truncate text-[13px] text-[var(--color-fg)]"
          title={usuario.email}
        >
          {usuario.email}
        </span>
        <div className="flex items-center gap-2">
          <PortalBadge portal={portal} papel={usuario.papel} />
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
                       px-3 py-2 text-[13px] text-[var(--color-fg-muted)]
                       transition hover:bg-[var(--color-line)]
                       hover:text-[var(--color-fg)]
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--color-signal)]"
          >
            <span>Sair</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
          </button>
        </form>
      </div>

      {/* Assinatura — projeto BETA + autoria */}
      <div className="flex flex-col gap-0.5 px-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full border border-[var(--color-signal-soft-2)] bg-[var(--color-signal-soft)] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
            Beta
          </span>
          <span className="font-mono text-[10px] text-[var(--color-ivory-66)]">
            Sonar &middot; Battaglia &amp; Pedrosa
          </span>
        </div>
        <p className="text-[10px] text-[var(--color-gold)]">
          Projeto conduzido por Caio Vicentino
        </p>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Badge do PAPEL do usuário (ADMIN/SÓCIO/FUNCIONÁRIO em signal verde;
// CLIENTE em dourado).
// --------------------------------------------------------------------------

function PortalBadge({
  portal,
  papel,
}: {
  portal: SidebarPortal;
  papel: string;
}) {
  const label = papel || (portal === "equipe" ? "EQUIPE" : "CLIENTE");

  if (portal === "equipe") {
    return (
      <span
        className="inline-flex items-center rounded-full border
                   border-[var(--color-signal-soft-2)] bg-[var(--color-signal-soft)]
                   px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]
                   text-[var(--color-signal)]"
      >
        {label}
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
      {label}
    </span>
  );
}
