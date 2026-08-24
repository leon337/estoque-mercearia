import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type InventorySearchParams = Promise<{ success?: string }>;
type InventoryRow = { product_id: string; quantity: number | string };

function stockStatus(quantity: number, minimumStock: number) {
  if (quantity <= 0) return { label: "ZERADO", description: "Sem estoque disponível", tone: "critical" as const };
  if (quantity <= minimumStock) return { label: "BAIXO", description: "Estoque baixo", tone: "warning" as const };
  return { label: "OK", description: "Estoque dentro do mínimo", tone: "success" as const };
}

const secondaryLinkClass = "inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 font-semibold text-[var(--color-primary)]";
const primaryLinkClass = "inline-flex min-h-12 items-center justify-center rounded-lg border border-transparent bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-on-primary)]";

export default async function InventoryPage({ searchParams }: { searchParams: InventorySearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, role, active")
    .eq("id", userId)
    .single();
  if (profileError || !profile?.active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, internal_code, name, unit, minimum_stock")
    .eq("active", true)
    .order("name");
  if (productError) throw new Error("Não foi possível carregar o estoque.");

  const productIds = (products ?? []).map((product) => product.id);
  let inventoryRows: InventoryRow[] = [];
  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from("inventory")
      .select("product_id, quantity")
      .in("product_id", productIds);
    if (error) throw new Error("Não foi possível carregar os saldos de estoque.");
    inventoryRows = (data ?? []) as InventoryRow[];
  }
  const inventoryByProduct = new Map(inventoryRows.map((row) => [row.product_id, Number(row.quantity ?? 0)]));

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Estoque atual"
          subtitle="Consulte o saldo antes de registrar entradas ou saídas."
          actions={<div className="flex flex-wrap gap-2"><Link className={secondaryLinkClass} href="/">Painel</Link><Link className={primaryLinkClass} href="/movements/new">Nova movimentação</Link></div>}
        />

        {params.success === "movement_registered" ? <p className="mt-6 rounded-lg border border-[var(--color-status-success)] bg-[var(--color-surface-lowest)] px-4 py-3 text-sm text-[var(--color-on-surface)]" role="status">Movimentação registrada com sucesso.</p> : null}

        {!products?.length ? (
          <DataCard className="mt-8 border-dashed">
            <h2 className="text-lg font-semibold">Nenhum produto ativo</h2>
            <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Cadastre ou ative produtos antes de movimentar o estoque.</p>
            {profile.role === "ADMIN" ? <Link className={`${secondaryLinkClass} mt-4`} href="/products">Ir para produtos</Link> : null}
          </DataCard>
        ) : (
          <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Saldos por produto">
            {products.map((product) => {
              const quantity = inventoryByProduct.get(product.id) ?? 0;
              const minimumStock = Number(product.minimum_stock ?? 0);
              const status = stockStatus(quantity, minimumStock);
              return (
                <DataCard className="flex h-full flex-col" key={product.id}>
                  <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-data text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">{product.internal_code}</p><h2 className="mt-1 text-xl font-semibold">{product.name}</h2></div><StatusBadge tone={status.tone}>{status.label}</StatusBadge></div>
                  <dl className="mt-5 grid grid-cols-2 gap-3"><div><dt className="text-sm text-[var(--color-on-surface-variant)]">Saldo atual</dt><dd className="font-data mt-1 text-2xl font-bold">{quantity} {product.unit}</dd></div><div><dt className="text-sm text-[var(--color-on-surface-variant)]">Estoque mínimo</dt><dd className="font-data mt-1 text-lg font-semibold">{minimumStock} {product.unit}</dd></div></dl>
                  <p className="mt-3 text-sm text-[var(--color-on-surface-variant)]">{status.description}</p>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5"><Link className={secondaryLinkClass} href={`/movements/new?type=ENTRY&product=${product.id}`}>Entrada</Link><Link className={secondaryLinkClass} href={`/movements/new?type=EXIT&product=${product.id}`}>Saída</Link></div>
                </DataCard>
              );
            })}
          </section>
        )}
      </main>
    </AppShell>
  );
}
