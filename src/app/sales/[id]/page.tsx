import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireActiveProfile } from "@/lib/authz";
import { addSaleItem, cancelSale, completeSale, removeSaleItem } from "../actions";

export const dynamic = "force-dynamic";
type QueryValue = string | string[] | undefined;
function first(value: QueryValue) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

type ProductRelation = {
  id: string;
  internal_code: string;
  name: string;
  unit: string;
  active: boolean;
  sale_price: number | string;
} | {
  id: string;
  internal_code: string;
  name: string;
  unit: string;
  active: boolean;
  sale_price: number | string;
}[] | null;

type SaleRow = { id: string; status: string; notes: string | null; created_at: string };
type ItemRow = {
  id: string;
  product_id: string;
  quantity: number | string;
  unit_sale_price: number | string;
  active: boolean;
  stock_movement_id: string | null;
  products: ProductRelation;
};
type ProductRow = { id: string; internal_code: string; name: string; unit: string; active: boolean; sale_price: number | string };

function one<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }
function formatBRL(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value); }
function stepForUnit(unit: string) { return ["UN", "CX", "PCT"].includes(unit.trim().toUpperCase()) ? "1" : "0.001"; }
function tone(status: string): "success" | "warning" | "neutral" | "critical" { if (status === "COMPLETED") return "success"; if (status === "CANCELLED") return "critical"; return "warning"; }
const labels: Record<string, string> = { DRAFT: "Rascunho", COMPLETED: "Concluída", CANCELLED: "Cancelada" };
const controlClass = "min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2";

export default async function SaleDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, QueryValue>> }) {
  const { id } = await params;
  const queryParams = await searchParams;
  const { supabase, profile } = await requireActiveProfile();

  const { data: saleData, error: saleError } = await supabase
    .from("sales")
    .select("id, status, notes, created_at")
    .eq("id", id)
    .single();
  if (saleError || !saleData) notFound();
  const sale = saleData as SaleRow;

  const { data: itemData, error: itemError } = await supabase
    .from("sale_items")
    .select("id, product_id, quantity, unit_sale_price, active, stock_movement_id, products(id, internal_code, name, unit, active, sale_price)")
    .eq("sale_id", id)
    .eq("active", true)
    .order("created_at");
  if (itemError) throw new Error("Não foi possível consultar os itens da venda.");
  const items = (itemData ?? []) as unknown as ItemRow[];

  let availableProducts: ProductRow[] = [];
  if (sale.status === "DRAFT") {
    const { data, error } = await supabase
      .from("products")
      .select("id, internal_code, name, unit, active, sale_price")
      .eq("active", true)
      .order("name");
    if (error) throw new Error("Não foi possível consultar produtos para venda.");
    const existingActive = new Set(items.map((item) => item.product_id));
    availableProducts = ((data ?? []) as ProductRow[]).filter((product) => !existingActive.has(product.id));
  }

  const errorCode = first(queryParams.error);
  const success = first(queryParams.success);
  const errors: Record<string, string> = {
    validation: "Revise os dados informados.",
    not_draft: "A venda não está mais em rascunho.",
    empty: "Adicione ao menos um item antes de concluir.",
    insufficient_stock: "Estoque insuficiente. Nenhuma baixa desta conclusão foi confirmada.",
    product_inactive: "O produto está inativo ou indisponível.",
    operation_conflict: "A operação de conclusão conflita com uma tentativa anterior.",
    permission: "Seu perfil não possui permissão para esta operação.",
    database: "Não foi possível concluir a operação.",
  };
  const successMessages: Record<string, string> = {
    created: "Venda criada.",
    item_saved: "Item adicionado à venda.",
    item_removed: "Item removido da venda.",
    completed: "Venda concluída e estoque baixado.",
    cancelled: "Venda cancelada.",
  };
  const total = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_sale_price), 0);

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title={`Venda ${sale.id.slice(0, 8)}`}
          subtitle={`Criada em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(sale.created_at))}`}
          actions={<Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/sales">Voltar para vendas</Link>}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge tone={tone(sale.status)}>{labels[sale.status] ?? sale.status}</StatusBadge>
          <span className="font-data text-lg font-bold">Total: {formatBRL(total)}</span>
        </div>

        {errorCode ? <p className="mt-6 rounded-lg border border-[var(--color-error)] px-4 py-3 text-sm text-[var(--color-error)]" role="alert">{errors[errorCode] ?? "Não foi possível concluir a operação."}</p> : null}
        {success ? <p className="mt-6 rounded-lg border border-[var(--color-status-success)] px-4 py-3 text-sm" role="status">{successMessages[success] ?? "Operação concluída."}</p> : null}

        {sale.status === "DRAFT" ? (
          <DataCard className="mt-6">
            <h2 className="text-lg font-semibold">Adicionar produto</h2>
            <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">O preço é capturado pelo banco a partir do cadastro atual do produto.</p>
            <form action={addSaleItem} className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end">
              <input name="sale_id" type="hidden" value={sale.id} />
              <label className="grid gap-2 text-sm font-medium">
                Produto
                <select className={controlClass} name="product_id" required>
                  <option value="">Selecione</option>
                  {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.internal_code} · {product.name} ({product.unit}) · {formatBRL(Number(product.sale_price))}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">Quantidade<input className={controlClass} min="0.001" name="quantity" required step="0.001" type="number" /></label>
              <Button disabled={availableProducts.length === 0} type="submit">Adicionar item</Button>
            </form>
          </DataCard>
        ) : null}

        <section className="mt-8" aria-labelledby="sale-items-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-bold" id="sale-items-title">Itens da venda</h2>
            <strong className="font-data">{formatBRL(total)}</strong>
          </div>
          <div className="mt-4 grid gap-4">
            {items.length === 0 ? <DataCard className="border-dashed"><p className="text-sm text-[var(--color-on-surface-variant)]">Nenhum item adicionado.</p></DataCard> : items.map((item) => {
              const product = one(item.products);
              const lineTotal = Number(item.quantity) * Number(item.unit_sale_price);
              return (
                <DataCard key={item.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{product ? `${product.internal_code} · ${product.name}` : "Produto"}</h3>
                      <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
                        {String(item.quantity)} {product?.unit ?? ""} × {formatBRL(Number(item.unit_sale_price))} = <strong>{formatBRL(lineTotal)}</strong>
                      </p>
                      {item.stock_movement_id ? <p className="mt-1 font-data text-xs text-[var(--color-on-surface-variant)]">Movimento: {item.stock_movement_id.slice(0, 8)}</p> : null}
                    </div>
                    {sale.status === "DRAFT" ? <form action={removeSaleItem}><input name="sale_id" type="hidden" value={sale.id} /><input name="item_id" type="hidden" value={item.id} /><Button type="submit" variant="danger">Remover</Button></form> : null}
                  </div>
                </DataCard>
              );
            })}
          </div>
        </section>

        {sale.status === "DRAFT" ? (
          <DataCard className="mt-6">
            <div className="flex flex-wrap gap-3">
              <form action={completeSale}>
                <input name="sale_id" type="hidden" value={sale.id} />
                <input name="operation_id" type="hidden" value={randomUUID()} />
                <Button disabled={items.length === 0} type="submit">Concluir venda</Button>
              </form>
              <form action={cancelSale}>
                <input name="sale_id" type="hidden" value={sale.id} />
                <Button type="submit" variant="danger">Cancelar venda</Button>
              </form>
            </div>
          </DataCard>
        ) : null}
      </main>
    </AppShell>
  );
}
