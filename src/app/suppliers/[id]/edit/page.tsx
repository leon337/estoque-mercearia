import Link from "next/link";
import { notFound } from "next/navigation";
import { SupplierFormFields } from "@/components/suppliers/SupplierFormFields";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdminUser } from "@/lib/authz";
import {
  toggleProductSupplierActive,
  toggleSupplierActive,
  updateSupplier,
  upsertProductSupplier,
} from "../../actions";

export const dynamic = "force-dynamic";
type QueryValue = string | string[] | undefined;
function first(value: QueryValue) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

const controlClass =
  "min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2";

type ProductRow = { id: string; internal_code: string; name: string; active: boolean };
type LinkRow = {
  id: string;
  product_id: string;
  supplier_id: string;
  supplier_code: string | null;
  preferred: boolean;
  active: boolean;
};

export default async function EditSupplierPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, QueryValue>> }) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, profile } = await requireAdminUser();
  const [supplierResult, productsResult, linksResult] = await Promise.all([
    supabase.from("suppliers").select("id, name, tax_id, email, phone, notes, active").eq("id", id).single(),
    supabase.from("products").select("id, internal_code, name, active").eq("active", true).order("name"),
    supabase.from("product_suppliers").select("id, product_id, supplier_id, supplier_code, preferred, active").eq("supplier_id", id).order("created_at"),
  ]);

  if (supplierResult.error || !supplierResult.data) notFound();
  if (productsResult.error || linksResult.error) throw new Error("Não foi possível consultar vínculos do fornecedor.");

  const supplier = supplierResult.data;
  const products = (productsResult.data ?? []) as ProductRow[];
  const links = (linksResult.data ?? []) as LinkRow[];
  const productNames = new Map(products.map((product) => [product.id, `${product.internal_code} · ${product.name}`]));
  const linkedIds = new Set(links.filter((link) => link.active).map((link) => link.product_id));
  const availableProducts = products.filter((product) => !linkedIds.has(product.id));
  const error = first(query.error);
  const success = first(query.success);
  const errorMessages: Record<string, string> = {
    validation: "Revise os campos informados.",
    duplicate: "O documento ou vínculo informado já existe.",
    database: "Não foi possível salvar a alteração.",
    supplier_inactive: "Ative o fornecedor antes de criar ou reativar vínculos.",
    product_inactive: "O produto selecionado está inativo.",
  };
  const successMessages: Record<string, string> = {
    link_saved: "Vínculo salvo.",
    link_activated: "Vínculo ativado.",
    link_deactivated: "Vínculo inativado.",
  };

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Editar fornecedor"
          subtitle="Atualize contatos e defina quais produtos este fornecedor atende."
          actions={<Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/suppliers">Voltar para fornecedores</Link>}
        />

        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)]">
          <span>Status atual:</span>
          <StatusBadge tone={supplier.active ? "success" : "neutral"}>{supplier.active ? "Ativo" : "Inativo"}</StatusBadge>
        </div>

        {error ? <p className="mt-6 rounded-lg border border-[var(--color-error)] px-4 py-3 text-sm text-[var(--color-error)]" role="alert">{errorMessages[error] ?? "Não foi possível concluir a operação."}</p> : null}
        {success ? <p className="mt-6 rounded-lg border border-[var(--color-status-success)] px-4 py-3 text-sm" role="status">{successMessages[success] ?? "Operação concluída."}</p> : null}

        <DataCard className="mt-6">
          <form action={updateSupplier} className="grid gap-6">
            <input name="id" type="hidden" value={supplier.id} />
            <SupplierFormFields values={supplier} />
            <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:justify-end">
              <Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/suppliers">Cancelar</Link>
              <Button type="submit">Salvar alterações</Button>
            </div>
          </form>
        </DataCard>

        <DataCard className="mt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Disponibilidade do fornecedor</h2>
              <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Inativar também inativa seus vínculos ativos. Reativação não restaura vínculos automaticamente.</p>
            </div>
            <form action={toggleSupplierActive}>
              <input name="id" type="hidden" value={supplier.id} />
              <input name="next_active" type="hidden" value={String(!supplier.active)} />
              <Button type="submit" variant={supplier.active ? "danger" : "secondary"}>{supplier.active ? "Inativar fornecedor" : "Ativar fornecedor"}</Button>
            </form>
          </div>
        </DataCard>

        <section className="mt-8" aria-labelledby="supplier-products-title">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-on-surface-variant)]">Catálogo comercial</p>
            <h2 className="mt-1 text-2xl font-bold" id="supplier-products-title">Produtos atendidos</h2>
          </div>

          {supplier.active && availableProducts.length > 0 ? (
            <DataCard className="mt-4">
              <form action={upsertProductSupplier} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto_auto] lg:items-end">
                <input name="supplier_id" type="hidden" value={supplier.id} />
                <label className="grid gap-2 text-sm font-medium">
                  Produto
                  <select className={controlClass} name="product_id" required>
                    <option value="">Selecione</option>
                    {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.internal_code} · {product.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Código no fornecedor
                  <input className={controlClass} maxLength={80} name="supplier_code" />
                </label>
                <label className="flex min-h-12 items-center gap-2 text-sm font-medium">
                  <input className="size-12" name="preferred" type="checkbox" /> Preferencial
                </label>
                <Button type="submit">Vincular produto</Button>
              </form>
            </DataCard>
          ) : null}

          <div className="mt-4 grid gap-4">
            {links.length === 0 ? (
              <DataCard className="border-dashed"><p className="text-sm text-[var(--color-on-surface-variant)]">Nenhum produto vinculado.</p></DataCard>
            ) : links.map((link) => (
              <DataCard key={link.id}>
                <form action={upsertProductSupplier} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto_auto] lg:items-end">
                  <input name="supplier_id" type="hidden" value={supplier.id} />
                  <input name="product_id" type="hidden" value={link.product_id} />
                  <div>
                    <p className="font-semibold">{productNames.get(link.product_id) ?? "Produto indisponível"}</p>
                    <div className="mt-2 flex gap-2">
                      <StatusBadge tone={link.active ? "success" : "neutral"}>{link.active ? "Ativo" : "Inativo"}</StatusBadge>
                      {link.preferred ? <StatusBadge tone="warning">Preferencial</StatusBadge> : null}
                    </div>
                  </div>
                  <label className="grid gap-2 text-sm font-medium">
                    Código no fornecedor
                    <input className={controlClass} defaultValue={link.supplier_code ?? ""} disabled={!link.active || !supplier.active} maxLength={80} name="supplier_code" />
                  </label>
                  <label className="flex min-h-12 items-center gap-2 text-sm font-medium">
                    <input className="size-12" defaultChecked={link.preferred} disabled={!link.active || !supplier.active} name="preferred" type="checkbox" /> Preferencial
                  </label>
                  {link.active && supplier.active ? <Button type="submit" variant="secondary">Salvar vínculo</Button> : <span />}
                </form>
                <form action={toggleProductSupplierActive} className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
                  <input name="id" type="hidden" value={link.id} />
                  <input name="supplier_id" type="hidden" value={supplier.id} />
                  <input name="next_active" type="hidden" value={String(!link.active)} />
                  <Button disabled={!supplier.active && !link.active} type="submit" variant={link.active ? "danger" : "secondary"}>{link.active ? "Inativar vínculo" : "Reativar vínculo"}</Button>
                </form>
              </DataCard>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
