import type { ReactNode } from "react";

export function DataCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] p-4 shadow-sm ${className}`}>{children}</section>;
}
