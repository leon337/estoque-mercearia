import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireActiveProfile } from "@/lib/authz";
import { addPurchaseOrderItem, cancelPurchaseOrder, markPurchaseOrderOrdered, receivePurchaseOrder, removePurchaseOrderItem } from "../actions";

export const dynamic = "force-dynamic";
type QueryValue = string | string[] | undefined;
function first(value: QueryValue) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }
type SupplierRelation = { name: string } | { name: string }[] | null;
type ProductRelation = { id: string; internal_code: string; name: string; unit: string; active: boolean } | { id: string; internal_code: string; name: string; unit: string; active: boolean }[] | null;
type OrderRow = { id: string; supplier_id: string; status: string; notes: string | null; created_at: string; suppliers: SupplierRelation };
type ItemRow = { id: string; product_id: string; ordered_quantity: number; received_quantity: number; active: boolean; products: ProductRelation };
type LinkRow = { product_id: string; products: ProductRelation };
function one<T>(value: T | T[] | null): T | null { return Array.isArray(value) ? value[0] ?? null : value; }
const labels: Record<string, string> = { DRAFT: "Rascunho", ORDERED: "Enviado", PARTIALLY_RECEIVED: "Recebido parcialmente", RECEIVED: "Recebido", CANCELLED: "Cancelado" };
function tone(status: string): "success" | "warning" | "neutral" | "critical" { if (status === "RECEIVED") return "success"; if (status === "ORDERED" || status === "PARTIALLY_RECEIVED") return "warning"; if (status === "CANCELLED") return "critical"; return "neutral"; }
function stepForUnit(unit: string) { return ["UN", "CX", "PCT"].includes(unit.trim().toUpperCase()) ? "1" : "0.001"; }
const controlClass = "min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2";

export default async function PurchaseDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, QueryValue>> }) {
  const { id } = await params;
  const queryParams = await searchParams;
  const { supabase, profile } = await requireActiveProfile();
  const { data: orderData, error: orderError } = await supabase.from("purchase_orders").select("id, supplier_id, status, notes, created_at, suppliers(name)").eq("id", id).single();
  if (orderError || !orderData) notFound();
  const order = orderData as unknown as OrderRow;
  const { data: itemData, error: itemError } = await supabase.from("purchase_order_items").select("id, product_id, ordered_quantity, received_quantity, active, products(id, internal_code, name, unit, active)").eq("purchase_order_id", id).eq("active", true).order("created_at");
  if (itemError) throw new Error("Não foi possível consultar os itens do pedido.");
  const items = (itemData ?? []) as unknown as ItemRow[];
  const isAdmin = profile.role === "ADMIN";

  let availableProducts: LinkRow[] = [];
  if (isAdmin && order.status === "DRAFT") {
    const { data, error } = await supabase.from("product_suppliers").select("product_id, products(id, internal_code, name, unit, active)").eq("supplier_id", order.supplier_id).eq("active", true);
    if (error) throw new Error("Não foi possível consultar produtos do fornecedor.");
    const existing = new Set(items.map((item) => item.product_id));
    availableProducts = ((data ?? []) as unknown as LinkRow[]).filter((link) => { const product = one(link.products); return product?.active && !existing.has(link.product_id); });
  }

  const errorCode = first(queryParams.error);
  const success = first(queryParams.success);
  const errors: Record<string, string> = { validation: "Revise os dados informados.", not_draft: "O pedido não está mais em rascunho.", empty: "Adicione ao menos um item antes de enviar.", not_receivable: "O pedido não está disponível para recebimento.", cannot_cancel: "Este pedido não pode mais ser cancelado.", supplier_inactive: "O fornecedor está inativo.", product_inactive: "O produto está inativo.", not_linked: "O produto não possui vínculo ativo com o fornecedor.", exceeds_ordered: "A quantidade recebida excede o restante do item.", operation_conflict: "A operação de recebimento conflita com uma tentativa anterior.", database: "Não foi possível concluir a operação." };
  const successMessages: Record<string, string> = { created: "Pedido criado.", item_saved: "Item adicionado ao pedido.", item_removed: "Item removido do pedido.", ordered: "Pedido marcado como enviado.", cancelled: "Pedido cancelado.", received: "Recebimento registrado no estoque." };
  const supplier = one(order.suppliers);

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader title={`Pedido ${order.id.slice(0, 8)}`} subtitle={supplier?.name ?? "Fornecedor"} actions={<Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/purchases">Voltar para compras</Link>} />
        <div className="mt-4"><StatusBadge tone={tone(order.status)}>{labels[order.status] ?? order.status}</StatusBadge></div>
        {errorCode ? <p className="mt-6 rounded-lg border border-[var(--color-error)] px-4 py-3 text-sm text-[var(--color-error)]" role="alert">{errors[errorCode] ?? "Não foi possível concluir a operação."}</p> : null}
        {success ? <p className="mt-6 rounded-lg border border-[var(--color-status-success)] px-4 py-3 text-sm" role="status">{successMessages[success] ?? "Operação concluída."}</p> : null}

        {isAdmin && order.status === "DRAFT" ? (
          <DataCard className="mt-6">
            <h2 className="text-lg font-semibold">Adicionar produto</h2>
            <form action={addPurchaseOrderItem} className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end">
              <input name="purchase_order_id" type="hidden" value={order.id} />
              <label className="grid gap-2 text-sm font-medium">Produto
                <select className={controlClass} name="product_id" required><option value="">Selecione</option>{availableProducts.map((link) => { const product = one(link.products); return product ? <option key={product.id} value={product.id}>{product.internal_code} · {product.name} ({product.unit})</option> : null; })}</select>
              </label>
              <label className="grid gap-2 text-sm font-medium">Quantidade<input className={controlClass} min="0.001" name="quantity" required step="0.001" type="number" /></label>
              <Button disabled={availableProducts.length === 0} type="submit">Adicionar item</Button>
            </form>
          </DataCard>
        ) : null}

        <section className="mt-8" aria-labelledby="purchase-items-title">
          <h2 className="text-2xl font-bold" id="purchase-items-title">Itens do pedido</h2>
          <div className="mt-4 grid gap-4">
            {items.length === 0 ? <DataCard className="border-dashed"><p className="text-sm text-[var(--color-on-surface-variant)]">Nenhum item adicionado.</p></DataCard> : items.map((item) => {
              const product = one(item.products);
              const remaining = Number(item.ordered_quantity) - Number(item.received_quantity);
              return (
                <DataCard key={item.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><h3 className="font-semibold">{product ? `${product.internal_code} · ${product.name}` : "Produto"}</h3><p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Pedido: {item.ordered_quantity} {product?.unit ?? ""} · Recebido: {item.received_quantity} · Restante: {remaining}</p></div>
                    {isAdmin && order.status === "DRAFT" ? <form action={removePurchaseOrderItem}><input name="purchase_order_id" type="hidden" value={order.id} /><input name="item_id" type="hidden" value={item.id} /><Button type="submit" variant="danger">Remover</Button></form> : null}
                  </div>
                  {isAdmin && ["ORDERED", "PARTIALLY_RECEIVED"].includes(order.status) && remaining > 0 && product ? (
                    <form action={receivePurchaseOrder} className="mt-4 grid gap-3 border-t border-[var(--color-border-subtle)] pt-4 sm:grid-cols-[12rem_auto] sm:items-end">
                      <input name="purchase_order_id" type="hidden" value={order.id} />
                      <input name="purchase_order_item_id" type="hidden" value={item.id} />
                      <input name="operation_id" type="hidden" value={randomUUID()} />
                      <input name="stock_operation_id" type="hidden" value={randomUUID()} />
                      <label className="grid gap-2 text-sm font-medium">Quantidade a receber<input className={controlClass} max={remaining} min={stepForUnit(product.unit)} name="quantity" required step={stepForUnit(product.unit)} type="number" /></label>
                      <Button type="submit">Registrar recebimento</Button>
                    </form>
                  ) : null}
                </DataCard>
              );
            })}
          </div>
        </section>

        {isAdmin && order.status === "DRAFT" ? <DataCard className="mt-6"><div className="flex flex-wrap gap-3"><form action={markPurchaseOrderOrdered}><input name="purchase_order_id" type="hidden" value={order.id} /><Button disabled={items.length === 0} type="submit">Marcar como enviado</Button></form><form action={cancelPurchaseOrder}><input name="purchase_order_id" type="hidden" value={order.id} /><Button type="submit" variant="danger">Cancelar pedido</Button></form></div></DataCard> : null}
        {isAdmin && order.status === "ORDERED" ? <DataCard className="mt-6"><form action={cancelPurchaseOrder}><input name="purchase_order_id" type="hidden" value={order.id} /><Button type="submit" variant="danger">Cancelar pedido</Button></form></DataCard> : null}
      </main>
    </AppShell>
  );
}
