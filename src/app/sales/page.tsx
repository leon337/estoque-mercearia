import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireActiveProfile } from "@/lib/authz";

export const dynamic = "force-dynamic";

type QueryValue = string | string[] | undefined;
type ItemRow = { quantity: number | string; unit_sale_price: number | string; active: boolean };
type SaleRow = {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  sale_items: ItemRow[] | null;
};

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function tone(status: string): "success" | "warning" | "neutral" | "critical" {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "critical";
  return "warning";
}

const labels: Record<string, string> = {
  DRAFT: "Rascunho",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, QueryValue>> }) {
  const { supabase, profile } = await requireActiveProfile();
  const params = await searchParams;
  const requestedStatus = first(params.status);
  const statuses = ["DRAFT", "COMPLETED", "CANCELLED"];
  let query = supabase
    .from("sales")
    .select("id, status, notes, created_at, completed_at, cancelled_at, sale_items(quantity, unit_sale_price, active)");
  if (statuses.includes(requestedStatus)) query = query.eq("status", requestedStatus);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível consultar vendas.");
  const sales = (data ?? []) as unknown as SaleRow[];

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Vendas"
          subtitle="Registre saídas de estoque por venda com preço congelado por item."
          actions={(
            <Link className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-on-primary)]" href="/sales/new">
              Nova venda
            </Link>
          )}
        />

        <DataCard className="mt-6">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
            <label className="grid flex-1 gap-2 text-sm font-medium">
              Status
              <select className="min-h-12 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3" defaultValue={requestedStatus} name="status">
                <option value="">Todos</option>
                {statuses.map((status) => <option key={status} value={status}>{labels[status]}</option>)}
              </select>
            </label>
            <button className="min-h-12 rounded-lg border border-[var(--color-border-subtle)] px-4 font-semibold text-[var(--color-primary)]" type="submit">Filtrar</button>
          </form>
        </DataCard>

        <section className="mt-8 grid gap-4 lg:grid-cols-2" aria-label="Vendas registradas">
          {sales.length === 0 ? (
            <DataCard className="border-dashed"><p className="text-sm text-[var(--color-on-surface-variant)]">Nenhuma venda encontrada.</p></DataCard>
          ) : sales.map((sale) => {
            const items = (sale.sale_items ?? []).filter((item) => item.active);
            const total = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_sale_price), 0);
            return (
              <DataCard key={sale.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Venda {sale.id.slice(0, 8)}</h2>
                    <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">{items.length} item(ns) · {formatBRL(total)}</p>
                  </div>
                  <StatusBadge tone={tone(sale.status)}>{labels[sale.status] ?? sale.status}</StatusBadge>
                </div>
                <p className="mt-4 text-sm text-[var(--color-on-surface-variant)]">
                  Criada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(sale.created_at))}
                </p>
                <Link className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href={`/sales/${sale.id}`}>
                  Abrir venda
                </Link>
              </DataCard>
            );
          })}
        </section>
      </main>
    </AppShell>
  );
}
