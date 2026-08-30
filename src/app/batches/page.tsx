import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { batchExpiryStatus, batchStatusLabel } from "@/lib/batches";
import { createClient } from "@/lib/supabase/server";
import { setReceiptBatchActive } from "./actions";

export const dynamic = "force-dynamic";

type BatchRow = {
  id: string;
  purchase_receipt_item_id: string;
  lot_code: string;
  expires_on: string | null;
  quantity: number | string;
  active: boolean;
  created_at: string;
};

const linkClass = "inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 font-semibold text-[var(--color-primary)]";

export default async function BatchesPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role, active").eq("id", userId).single();
  if (profileError || !profile?.active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  const { data: batches, error: batchError } = await supabase
    .from("receipt_batches")
    .select("id, purchase_receipt_item_id, lot_code, expires_on, quantity, active, created_at")
    .order("created_at", { ascending: false });
  if (batchError) throw new Error("Não foi possível carregar os lotes.");

  const rows = (batches ?? []) as BatchRow[];
  const receiptItemIds = [...new Set(rows.map((row) => row.purchase_receipt_item_id))];
  const { data: receiptItems } = receiptItemIds.length
    ? await supabase.from("purchase_receipt_items").select("id, purchase_order_item_id").in("id", receiptItemIds)
    : { data: [] };
  const receiptToOrder = new Map((receiptItems ?? []).map((row) => [row.id, row.purchase_order_item_id]));
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
    <AppShell role={profile.role === "ADMIN" ? "ADMIN" : "OPERATOR"}>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          title="Lotes e validade"
          subtitle="Rastreabilidade dos lotes associados a recebimentos de compras."
          actions={profile.role === "ADMIN" ? <Link className={linkClass} href="/batches/new">Registrar lote</Link> : undefined}
        />

        {!rows.length ? (
          <DataCard className="mt-6"><h2 className="text-lg font-semibold">Nenhum lote registrado</h2><p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Registre lotes a partir de itens já recebidos.</p></DataCard>
        ) : (
          <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Lotes registrados">
            {rows.map((batch) => {
              const orderItemId = receiptToOrder.get(batch.purchase_receipt_item_id);
              const productId = orderItemId ? orderToProduct.get(orderItemId) : undefined;
              const product = productId ? productById.get(productId) : undefined;
              const status = batch.active ? batchExpiryStatus(batch.expires_on) : "NO_EXPIRY";
              const tone = !batch.active ? "neutral" : status === "EXPIRED" ? "critical" : status === "EXPIRING" ? "warning" : status === "OK" ? "success" : "neutral";
              return (
                <DataCard className="flex h-full flex-col" key={batch.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="font-data text-xs font-semibold text-[var(--color-on-surface-variant)]">{product?.internal_code ?? "—"}</p><h2 className="text-lg font-semibold">{product?.name ?? "Produto"}</h2><p className="mt-1 text-sm">Lote <strong>{batch.lot_code}</strong></p></div>
                    <StatusBadge tone={tone}>{batch.active ? batchStatusLabel(status) : "INATIVO"}</StatusBadge>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-[var(--color-on-surface-variant)]">Quantidade</dt><dd className="font-data font-semibold">{Number(batch.quantity)} {product?.unit ?? ""}</dd></div><div><dt className="text-[var(--color-on-surface-variant)]">Validade</dt><dd className="font-data font-semibold">{batch.expires_on ?? "Não informada"}</dd></div></dl>
                  {profile.role === "ADMIN" ? <form action={setReceiptBatchActive} className="mt-auto pt-5"><input name="batch_id" type="hidden" value={batch.id} /><input name="active" type="hidden" value={String(!batch.active)} /><button className={linkClass} type="submit">{batch.active ? "Inativar" : "Reativar"}</button></form> : null}
                </DataCard>
              );
            })}
          </section>
        )}
      </main>
    </AppShell>
  );
}
