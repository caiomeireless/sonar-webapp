"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Marca o input como invalido (borda + foco vermelhos). */
  invalid?: boolean;
};

/**
 * Input padrao do design system Sonar.
 *
 * Usa as classes globais .input / .input--invalid declaradas em globals.css.
 * Caso o consumidor passe `className`, ela e concatenada (e pode sobrescrever).
 */
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid = false, type = "text", ...rest },
  ref,
) {
  const classes = ["input", invalid ? "input--invalid" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={classes}
      {...rest}
    />
  );
});

export { Input };
export default Input;
