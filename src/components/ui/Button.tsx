"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "signal" | "gold" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renderiza estado de carregamento (desabilita + reduz opacidade). */
  loading?: boolean;
  /** Icone opcional a esquerda do label. */
  leftIcon?: ReactNode;
  /** Icone opcional a direita do label. */
  rightIcon?: ReactNode;
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-sans font-medium transition-colors duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50";

const SIZE: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
};

const VARIANT: Record<ButtonVariant, string> = {
  // Primario verde signal sobre fundo onyx.
  signal:
    "border border-[rgba(60,255,138,0.30)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] hover:bg-[rgba(60,255,138,0.16)] hover:border-[rgba(60,255,138,0.45)] focus-visible:ring-[rgba(60,255,138,0.45)]",
  // Secundario ouro para acoes de firm (Themis, pecas).
  gold: "border border-[rgba(201,162,74,0.30)] bg-[var(--color-accent-2-soft)] text-[var(--color-accent-2)] hover:bg-[rgba(201,162,74,0.18)] hover:border-[rgba(201,162,74,0.45)] focus-visible:ring-[rgba(201,162,74,0.45)]",
  // Transparente: acoes terciarias / cancelar.
  ghost:
    "border border-transparent bg-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] focus-visible:ring-[var(--color-line-strong)]",
  // Destrutivo / perigo.
  danger:
    "border border-[rgba(255,91,91,0.30)] bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:bg-[rgba(255,91,91,0.18)] hover:border-[rgba(255,91,91,0.45)] focus-visible:ring-[rgba(255,91,91,0.45)]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "signal",
    size = "md",
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    className,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const classes = [BASE, SIZE[size], VARIANT[variant], className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {leftIcon ? (
        <span className="inline-flex shrink-0 items-center" aria-hidden>
          {leftIcon}
        </span>
      ) : null}
      <span className={loading ? "opacity-70" : undefined}>{children}</span>
      {rightIcon ? (
        <span className="inline-flex shrink-0 items-center" aria-hidden>
          {rightIcon}
        </span>
      ) : null}
    </button>
  );
});

export { Button };
export default Button;
