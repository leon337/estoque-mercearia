import type { ReactNode } from "react";

type Padding = "default" | "none";

const paddings: Record<Padding, string> = {
  default: "p-4",
  none: "p-0",
};

export function DataCard({ children, className = "", padding = "default" }: { children: ReactNode; className?: string; padding?: Padding }) {
  return <section className={`rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] shadow-sm ${paddings[padding]} ${className}`}>{children}</section>;
}
