import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,560px)] lg:gap-6 lg:p-6">
      <section className="hidden min-h-[calc(100vh-3rem)] flex-col justify-between rounded-xl bg-[var(--color-primary)] p-10 text-[var(--color-on-primary)] lg:flex" aria-label="Estoque Mercearia">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 text-sm font-bold" aria-hidden="true">EM</span>
          <span className="font-semibold">Estoque Mercearia</span>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/75">Controle de estoque</p>
          <p className="mt-4 text-4xl font-bold leading-tight">Operação simples, rastreável e pronta para a rotina da mercearia.</p>
          <p className="mt-4 max-w-lg text-base leading-7 text-white/80">Produtos, saldos e movimentações em um único fluxo operacional.</p>
        </div>
        <p className="text-sm text-white/65">Acesso protegido para usuários autorizados.</p>
      </section>

      <section className="flex min-h-[calc(100vh-3rem)] items-center justify-center py-6 lg:py-0">
        <div className="w-full max-w-md rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] p-6 shadow-sm sm:p-8">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-xs font-bold text-[var(--color-on-primary)]" aria-hidden="true">EM</span>
              <span className="font-semibold text-[var(--color-on-surface)]">Estoque Mercearia</span>
            </div>
          </div>

          <header className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-on-surface)]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-variant)]">{description}</p>
          </header>

          {children}

          <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5 text-sm text-[var(--color-on-surface-variant)]">
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}
