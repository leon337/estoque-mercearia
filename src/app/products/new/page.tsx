import Link from "next/link";
import { ProductFormFields } from "@/components/products/ProductFormFields";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdminUser } from "@/lib/authz";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

type QueryValue = string | string[] | undefined;

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NewProductPage({ searchParams }: { searchParams: Promise<Record<string, QueryValue>> }) {
  const { supabase, profile } = await requireAdminUser();
  const params = await searchParams;
  const error = first(params.error);
  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select("id, name")
    .eq("active", true)
    .order("name");

  if (categoryError) throw new Error("Não foi possível consultar categorias.");

  const errorText = error === "duplicate"
    ? "Código interno ou código de barras já cadastrado."
    : error === "category_inactive"
      ? "Selecione uma categoria ativa."
      : "Revise os campos obrigatórios e os valores informados.";

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Novo produto"
          subtitle="Cadastre os dados básicos usados na operação e no controle de estoque."
          actions={(
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 font-semibold text-[var(--color-primary)]"
              href="/products"
            >
              Voltar para produtos
            </Link>
          )}
        />

        {error ? (
          <p className="mt-6 rounded-lg border border-[var(--color-error)] px-4 py-3 text-sm text-[var(--color-error)]" role="alert">
            {errorText}
          </p>
        ) : null}

        <DataCard className="mt-6">
          <form action={createProduct} className="grid gap-6">
            <ProductFormFields categories={categories ?? []} />
            <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:justify-end">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 font-semibold text-[var(--color-primary)]"
                href="/products"
              >
                Cancelar
              </Link>
              <Button type="submit">Cadastrar produto</Button>
            </div>
          </form>
        </DataCard>
      </main>
    </AppShell>
  );
}
