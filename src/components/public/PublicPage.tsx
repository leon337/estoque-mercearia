import Link from "next/link";
import type { ReactNode } from "react";

export function PublicPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-8 text-[var(--color-on-surface)] sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-5">
          <Link href="/sobre" className="font-semibold">Estoque Mercearia</Link>
          <Link href="/login" className="rounded-lg bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-on-primary)]">
            Entrar
          </Link>
        </header>
        <article className="py-8 leading-7">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-[var(--color-on-surface-variant)]">{subtitle}</p>
          <div className="mt-8 space-y-6 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
            {children}
          </div>
        </article>
        <footer className="flex flex-wrap gap-5 border-t border-[var(--color-border-subtle)] py-5 text-sm">
          <Link href="/sobre" className="underline underline-offset-4">Sobre</Link>
          <Link href="/privacidade" className="underline underline-offset-4">Privacidade</Link>
          <Link href="/termos" className="underline underline-offset-4">Termos de uso</Link>
          <Link href="/login" className="underline underline-offset-4">Entrar</Link>
        </footer>
      </div>
    </main>
  );
}
