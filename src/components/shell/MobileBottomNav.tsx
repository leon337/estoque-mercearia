"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavigation, isNavActive, type AppRoute, type Role } from "./navigation";

const MOBILE_NAV_ROUTES: AppRoute[] = ["/", "/sales", "/purchases", "/inventory", "/products"];

export function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = getNavigation(role)
    .filter((item) => MOBILE_NAV_ROUTES.includes(item.href))
    .slice(0, 5);

  return (
    <nav aria-label="Navegação móvel" className="fixed inset-x-0 bottom-0 z-50 flex border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-1 py-1 shadow-lg md:hidden">
      {items.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 min-w-[44px] flex-1 items-center justify-center rounded-lg px-1 text-center text-[11px] font-semibold leading-tight ${active ? "bg-[var(--color-primary-container)] text-[var(--color-on-surface)]" : "text-[var(--color-on-surface-variant)]"}`}
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
