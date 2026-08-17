import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>{subtitle ? <div className="mt-2 text-sm text-[var(--color-on-surface-variant)]">{subtitle}</div> : null}</div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
