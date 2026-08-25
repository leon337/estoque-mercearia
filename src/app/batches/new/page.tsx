import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { createReceiptBatch } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewBatchPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role, active").eq("id", userId).single();
  if (profileError || !profile?.active || profile.role !== "ADMIN") redirect("/batches?error=permission");

  const { data: receiptItems, error: receiptError } = await supabase
    .from("purchase_receipt_items")
    .select("id, purchase_order_item_id, quantity, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (receiptError) throw new Error("Não foi possível carregar os recebimentos.");

  const orderItemIds = [...new Set((receiptItems ?? []).map((row) => row.purchase_order_item_id))];
  const { data: orderItems } = orderItemIds.length
    ? await supabase.from("purchase_order_items").select("id, product_id").in("id", orderItemIds)
    : { data: [] };
  const orderToProduct = new Map((orderItems ?? []).map((row) => [row.id, row.product_id]));
  const productIds = [...new Set((orderItems ?? []).map((row) => row.product_id))];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, internal_code, name, unit").in("id", productIds)
    : { data: [] };
  const productById = new Map((products ?? []).map((row) => [row.id, row]));

  return (
    <AppShell role="ADMIN">
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader title="Registrar lote" subtitle="Associe lote e validade a um item efetivamente recebido." />
        <DataCard className="mt-6">
          <form action={createReceiptBatch} className="grid gap-5">
            <label className="grid gap-1 text-sm font-semibold">Item recebido
              <select className="min-h-12 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-3" name="purchase_receipt_item_id" required>
                <option value="">Selecione</option>
                {(receiptItems ?? []).map((item) => {
                  const productId = orderToProduct.get(item.purchase_order_item_id);
                  const product = productId ? productById.get(productId) : undefined;
                  return <option key={item.id} value={item.id}>{product?.internal_code ?? "—"} · {product?.name ?? "Produto"} · recebido {Number(item.quantity)} {product?.unit ?? ""}</option>;
                })}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">Código do lote<input className="min-h-12 rounded-lg border border-[var(--color-border-subtle)] px-3" maxLength={100} name="lot_code" required /></label>
            <label className="grid gap-1 text-sm font-semibold">Validade<input className="min-h-12 rounded-lg border border-[var(--color-border-subtle)] px-3" name="expires_on" type="date" /></label>
            <label className="grid gap-1 text-sm font-semibold">Quantidade<input className="min-h-12 rounded-lg border border-[var(--color-border-subtle)] px-3" inputMode="decimal" min="0" name="quantity" required /></label>
            <div className="flex flex-wrap gap-3"><button className="min-h-12 rounded-lg bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]" type="submit">Salvar lote</button><Link className="inline-flex min-h-12 items-center px-4 font-semibold text-[var(--color-primary)]" href="/batches">Cancelar</Link></div>
          </form>
        </DataCard>
      </main>
    </AppShell>
  );
}
