"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavigation, isNavActive, type Role } from "./navigation";

export function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = getNavigation(role).filter((item) => !item.adminOnly);

  return (
    <nav aria-label="Navegação móvel" className="fixed inset-x-0 bottom-0 z-50 flex overflow-x-auto border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-1 py-1 shadow-lg md:hidden">
      {items.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 min-w-[52px] flex-1 items-center justify-center rounded-lg px-2 text-center text-[11px] font-semibold leading-tight ${active ? "bg-[var(--color-primary-container)] text-[var(--color-on-surface)]" : "text-[var(--color-on-surface-variant)]"}`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
