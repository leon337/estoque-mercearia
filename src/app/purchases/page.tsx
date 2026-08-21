import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireActiveProfile } from "@/lib/authz";

export const dynamic = "force-dynamic";
type QueryValue = string | string[] | undefined;
function first(value: QueryValue) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }
type SupplierRelation = { name: string } | { name: string }[] | null;
type OrderRow = { id: string; status: string; notes: string | null; created_at: string; suppliers: SupplierRelation };
function supplierName(value: SupplierRelation) { return Array.isArray(value) ? value[0]?.name ?? "Fornecedor" : value?.name ?? "Fornecedor"; }
function tone(status: string): "success" | "warning" | "neutral" | "critical" {
  if (status === "RECEIVED") return "success";
  if (status === "ORDERED" || status === "PARTIALLY_RECEIVED") return "warning";
  if (status === "CANCELLED") return "critical";
  return "neutral";
}
const labels: Record<string, string> = { DRAFT: "Rascunho", ORDERED: "Enviado", PARTIALLY_RECEIVED: "Recebido parcialmente", RECEIVED: "Recebido", CANCELLED: "Cancelado" };

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<Record<string, QueryValue>> }) {
  const { supabase, profile } = await requireActiveProfile();
  const params = await searchParams;
  const requestedStatus = first(params.status);
  const statuses = ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"];
  let query = supabase.from("purchase_orders").select("id, status, notes, created_at, suppliers(name)");
  if (statuses.includes(requestedStatus)) query = query.eq("status", requestedStatus);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível consultar pedidos de compra.");
  const orders = (data ?? []) as unknown as OrderRow[];
  const isAdmin = profile.role === "ADMIN";

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader title="Compras" subtitle="Acompanhe pedidos e recebimentos vinculados ao estoque." actions={isAdmin ? <Link className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-on-primary)]" href="/purchases/new">Novo pedido</Link> : null} />
        <DataCard className="mt-6">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
            <label className="grid flex-1 gap-2 text-sm font-medium">Status
              <select className="min-h-12 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3" defaultValue={requestedStatus} name="status">
                <option value="">Todos</option>
                {statuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}
              </select>
            </label>
            <button className="min-h-12 rounded-lg border border-[var(--color-border-subtle)] px-4 font-semibold text-[var(--color-primary)]" type="submit">Filtrar</button>
          </form>
        </DataCard>
        <section className="mt-8 grid gap-4 lg:grid-cols-2" aria-label="Pedidos de compra">
          {orders.length === 0 ? <DataCard className="border-dashed"><p className="text-sm text-[var(--color-on-surface-variant)]">Nenhum pedido encontrado.</p></DataCard> : orders.map((order) => (
            <DataCard key={order.id}>
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-lg font-semibold">Pedido {order.id.slice(0, 8)}</h2><p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">{supplierName(order.suppliers)}</p></div>
                <StatusBadge tone={tone(order.status)}>{labels[order.status] ?? order.status}</StatusBadge>
              </div>
              <p className="mt-4 text-sm text-[var(--color-on-surface-variant)]">Criado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(order.created_at))}</p>
              <Link className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href={`/purchases/${order.id}`}>Abrir pedido</Link>
            </DataCard>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
