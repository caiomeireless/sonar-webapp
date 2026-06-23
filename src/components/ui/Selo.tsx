"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export type SeloVariant =
  | "signal"
  | "gold"
  | "neutral"
  | "success"
  | "warn"
  | "danger";

export type SeloProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: SeloVariant;
  /** Ponto/icone opcional a esquerda do texto. */
  dot?: boolean;
  children: ReactNode;
};

const BASE =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-mono text-[9px] font-medium uppercase tracking-[0.08em] px-1.5 py-0.5";

const VARIANT: Record<SeloVariant, string> = {
  signal:
    "border-[rgba(60,255,138,0.30)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  gold: "border-[rgba(201,162,74,0.30)] bg-[var(--color-accent-2-soft)] text-[var(--color-accent-2)]",
  neutral:
    "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]",
  // success aponta para o mesmo accent verde (no Sonar success == signal).
  success:
    "border-[rgba(60,255,138,0.30)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  warn: "border-[rgba(244,197,66,0.30)] bg-[rgba(244,197,66,0.10)] text-[var(--color-warn)]",
  danger:
    "border-[rgba(255,91,91,0.30)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

const DOT: Record<SeloVariant, string> = {
  signal: "bg-[var(--color-accent)]",
  gold: "bg-[var(--color-accent-2)]",
  neutral: "bg-[var(--color-fg-faint)]",
  success: "bg-[var(--color-accent)]",
  warn: "bg-[var(--color-warn)]",
  danger: "bg-[var(--color-danger)]",
};

const Selo = forwardRef<HTMLSpanElement, SeloProps>(function Selo(
  { variant = "neutral", dot = false, className, children, ...rest },
  ref,
) {
  const classes = [BASE, VARIANT[variant], className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span ref={ref} className={classes} {...rest}>
      {dot ? (
        <span
          aria-hidden
          className={`inline-block h-1 w-1 rounded-full ${DOT[variant]}`}
        />
      ) : null}
      {children}
    </span>
  );
});

export { Selo };
export default Selo;
