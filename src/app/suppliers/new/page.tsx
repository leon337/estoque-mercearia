import Link from "next/link";
import { SupplierFormFields } from "@/components/suppliers/SupplierFormFields";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdminUser } from "@/lib/authz";
import { createSupplier } from "../actions";

export const dynamic = "force-dynamic";
type QueryValue = string | string[] | undefined;
function first(value: QueryValue) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

export default async function NewSupplierPage({ searchParams }: { searchParams: Promise<Record<string, QueryValue>> }) {
  const { profile } = await requireAdminUser();
  const query = await searchParams;
  const error = first(query.error);
  const errorText = error === "duplicate"
    ? "Já existe fornecedor com esse documento."
    : error === "database"
      ? "Não foi possível salvar o fornecedor."
      : "Revise os campos informados.";

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Novo fornecedor"
          subtitle="Cadastre os dados essenciais. Documento e contatos são opcionais."
          actions={<Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/suppliers">Voltar para fornecedores</Link>}
        />
        {error ? <p className="mt-6 rounded-lg border border-[var(--color-error)] px-4 py-3 text-sm text-[var(--color-error)]" role="alert">{errorText}</p> : null}
        <DataCard className="mt-6">
          <form action={createSupplier} className="grid gap-6">
            <SupplierFormFields />
            <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:justify-end">
              <Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/suppliers">Cancelar</Link>
              <Button type="submit">Cadastrar fornecedor</Button>
            </div>
          </form>
        </DataCard>
      </main>
    </AppShell>
  );
}
