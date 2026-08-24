import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductFormFields } from "@/components/products/ProductFormFields";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdminUser } from "@/lib/authz";
import { toggleProductActive, updateProduct } from "../../actions";

export const dynamic = "force-dynamic";
type QueryValue = string | string[] | undefined;
function first(value: QueryValue) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, QueryValue>> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, profile } = await requireAdminUser();
  const [{ data: product, error: productError }, { data: categories, error: categoryError }] = await Promise.all([
    supabase.from("products").select("id, internal_code, barcode, name, category_id, unit, minimum_stock, cost_price, sale_price, active").eq("id", id).single(),
    supabase.from("categories").select("id, name, active").order("name"),
  ]);
  if (productError || !product) notFound();
  if (categoryError) throw new Error("Não foi possível consultar categorias.");
  const error = first(query.error);
  const errorText = error === "duplicate" ? "Código interno ou código de barras já cadastrado." : error === "category_inactive" ? "Selecione uma categoria ativa." : "Revise os campos obrigatórios e os valores informados.";

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader title="Editar produto" subtitle="Atualize cadastro, custo e preço sem alterar o histórico de estoque." actions={<Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/products">Voltar para produtos</Link>} />
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)]"><span>Status atual:</span><StatusBadge tone={product.active ? "success" : "neutral"}>{product.active ? "Ativo" : "Inativo"}</StatusBadge></div>
        {error ? <p className="mt-6 rounded-lg border border-[var(--color-error)] px-4 py-3 text-sm text-[var(--color-error)]" role="alert">{errorText}</p> : null}
        <DataCard className="mt-6">
          <form action={updateProduct} className="grid gap-6">
            <input name="id" type="hidden" value={product.id} />
            <ProductFormFields categories={categories ?? []} values={{ internal_code: product.internal_code, barcode: product.barcode, name: product.name, category_id: product.category_id, unit: product.unit, minimum_stock: product.minimum_stock, cost_price: product.cost_price, sale_price: product.sale_price }} />
            <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:justify-end"><Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/products">Cancelar</Link><Button type="submit">Salvar alterações</Button></div>
          </form>
        </DataCard>
        <DataCard className="mt-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Disponibilidade do produto</h2><p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Inativar preserva o cadastro e impede sua exibição normal para operadores.</p></div><form action={toggleProductActive}><input name="id" type="hidden" value={product.id} /><input name="next_active" type="hidden" value={String(!product.active)} /><Button type="submit" variant={product.active ? "danger" : "secondary"}>{product.active ? "Inativar produto" : "Ativar produto"}</Button></form></div></DataCard>
      </main>
    </AppShell>
  );
}
