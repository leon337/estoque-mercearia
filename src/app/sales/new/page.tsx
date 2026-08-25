import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireActiveProfile } from "@/lib/authz";
import { createSale } from "../actions";

export const dynamic = "force-dynamic";
type QueryValue = string | string[] | undefined;
function first(value: QueryValue) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

export default async function NewSalePage({ searchParams }: { searchParams: Promise<Record<string, QueryValue>> }) {
  const { profile } = await requireActiveProfile();
  const params = await searchParams;
  const error = first(params.error);

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Nova venda"
          subtitle="Crie um rascunho; produtos e quantidades são adicionados antes da conclusão."
          actions={<Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/sales">Voltar para vendas</Link>}
        />
        {error ? <p className="mt-6 rounded-lg border border-[var(--color-error)] px-4 py-3 text-sm text-[var(--color-error)]" role="alert">Revise os dados da venda.</p> : null}
        <DataCard className="mt-6">
          <form action={createSale} className="grid gap-5">
            <label className="grid gap-2 text-sm font-medium">
              Observações
              <textarea className="min-h-28 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2" maxLength={1000} name="notes" placeholder="Opcional" />
            </label>
            <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:justify-end">
              <Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/sales">Cancelar</Link>
              <Button type="submit">Criar venda</Button>
            </div>
          </form>
        </DataCard>
      </main>
    </AppShell>
  );
}
