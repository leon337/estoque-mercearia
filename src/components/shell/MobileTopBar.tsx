"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "./navigation";

export function MobileTopBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const adminActive = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 flex min-h-12 items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 md:hidden">
      <Link className="font-bold text-[var(--color-primary)]" href="/">Estoque Mercearia</Link>
      {role === "ADMIN" ? (
        <Link aria-current={adminActive ? "page" : undefined} className="flex min-h-12 items-center px-2 text-sm font-semibold text-[var(--color-primary)]" href="/admin/users">Administração</Link>
      ) : null}
    </header>
  );
}
