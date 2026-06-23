"use client";

// Tabs de navegação horizontal no header dos portais.
// Reage à rota atual destacando a aba ativa.

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  href: string;
  label: string;
  // Marca como ativo quando pathname começa com qualquer um dos prefixos.
  matchPrefixes?: string[];
};

export function NavTabs({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const prefixes = item.matchPrefixes ?? [item.href];
        const ativo = prefixes.some((p) =>
          p === "/equipe" || p === "/cliente"
            ? pathname === p
            : pathname.startsWith(p),
        );
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "rounded-lg px-3 py-1.5 text-sm font-medium transition " +
              (ativo
                ? "bg-[rgba(60,255,138,0.10)] text-[var(--color-signal)]"
                : "text-[var(--color-ivory-88)] hover:bg-white/5 hover:text-ivory")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
