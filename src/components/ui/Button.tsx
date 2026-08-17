import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

const variants: Record<Variant, string> = {
  primary: "border-transparent bg-[var(--color-primary)] text-[var(--color-on-primary)]",
  secondary: "border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] text-[var(--color-primary)]",
  danger: "border-transparent bg-[var(--color-error)] text-[var(--color-on-primary)]",
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return <button className={`min-h-12 rounded-lg border px-4 py-2 font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props} />;
}
