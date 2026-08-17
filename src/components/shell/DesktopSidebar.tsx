"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavigation, isNavActive, type Role } from "./navigation";

export function DesktopSidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-72 shrink-0 self-start overflow-y-auto border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-container)] p-4 md:sticky md:top-0 md:flex md:flex-col">
      <div className="mb-6 px-3 py-2">
        <p className="text-xl font-bold text-[var(--color-primary)]">Estoque Mercearia</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
          {role === "ADMIN" ? "Administrador" : "Operador"}
        </p>
      </div>
      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-2">
        {getNavigation(role).map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 items-center rounded-lg px-3 py-2 font-semibold transition ${active ? "bg-[var(--color-primary-container)] text-[var(--color-on-surface)]" : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-high)]"}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
