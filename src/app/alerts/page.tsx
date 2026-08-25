import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { DataCard } from "@/components/ui/DataCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { buildInventoryAlerts } from "@/lib/alerts";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AlertSearchParams = Promise<{ severity?: string; query?: string }>;
type InventoryRow = { product_id: string; quantity: number | string };

const linkClass = "inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 font-semibold text-[var(--color-primary)]";

export default async function AlertsPage({ searchParams }: { searchParams: AlertSearchParams }) {
  const params = await searchParams;
  const severity = params.severity === "CRITICAL" || params.severity === "WARNING" ? params.severity : "ALL";
  const query = (params.query ?? "").trim().toLocaleLowerCase("pt-BR");

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
  if (productError) throw new Error("Não foi possível carregar os produtos para alertas.");

  const productIds = (products ?? []).map((product) => product.id);
  let inventoryRows: InventoryRow[] = [];
  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from("inventory")
      .select("product_id, quantity")
      .in("product_id", productIds);
    if (error) throw new Error("Não foi possível carregar os saldos para alertas.");
    inventoryRows = (data ?? []) as InventoryRow[];
  }
  const quantityByProduct = new Map(inventoryRows.map((row) => [row.product_id, Number(row.quantity ?? 0)]));

  const alerts = buildInventoryAlerts(
    (products ?? []).map((product) => ({
      id: product.id,
      internalCode: product.internal_code,
      name: product.name,
      unit: product.unit,
      quantity: quantityByProduct.get(product.id) ?? 0,
      minimumStock: Number(product.minimum_stock ?? 0),
    })),
  );
  const criticalCount = alerts.filter((alert) => alert.severity === "CRITICAL").length;
  const warningCount = alerts.filter((alert) => alert.severity === "WARNING").length;
  const visibleAlerts = alerts.filter((alert) => {
    const matchesSeverity = severity === "ALL" || alert.severity === severity;
    const matchesQuery = !query || alert.name.toLocaleLowerCase("pt-BR").includes(query) || alert.internalCode.toLocaleLowerCase("pt-BR").includes(query);
    return matchesSeverity && matchesQuery;
  });

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          title="Alertas operacionais"
          subtitle="Priorize itens zerados ou que atingiram o estoque mínimo."
          actions={<div className="flex flex-wrap gap-2"><Link className={linkClass} href="/inventory">Ver estoque</Link><Link className={linkClass} href="/purchases">Ver compras</Link></div>}
        />

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Resumo dos alertas">
          <MetricCard label="Alertas ativos" value={<span className="font-data">{alerts.length}</span>} hint="Produtos que exigem atenção" />
          <MetricCard label="Críticos" value={<span className="font-data">{criticalCount}</span>} hint="Produtos zerados" tone="critical" />
          <MetricCard label="Baixos" value={<span className="font-data">{warningCount}</span>} hint="No mínimo ou abaixo" tone="warning" />
        </section>

        <DataCard className="mt-6">
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end" method="get">
            <label className="grid gap-1 text-sm font-semibold">Buscar
              <input className="min-h-12 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-3" defaultValue={params.query ?? ""} name="query" placeholder="Código ou produto" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">Severidade
              <select className="min-h-12 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-3" defaultValue={severity} name="severity">
                <option value="ALL">Todos</option>
                <option value="CRITICAL">Críticos</option>
                <option value="WARNING">Baixos</option>
              </select>
            </label>
            <button className="min-h-12 rounded-lg bg-[var(--color-primary)] px-4 font-semibold text-[var(--color-on-primary)]" type="submit">Filtrar</button>
          </form>
        </DataCard>

        {!visibleAlerts.length ? (
          <DataCard className="mt-6 border-dashed">
            <h2 className="text-lg font-semibold">Nenhum alerta encontrado</h2>
            <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Os filtros atuais não retornam produtos que exijam atenção.</p>
          </DataCard>
        ) : (
          <section className="mt-6 grid gap-4 md:grid-cols-2" aria-label="Alertas por produto">
            {visibleAlerts.map((alert) => (
              <DataCard className="flex h-full flex-col" key={alert.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-data text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">{alert.internalCode}</p>
                    <h2 className="mt-1 text-xl font-semibold">{alert.name}</h2>
                  </div>
                  <StatusBadge tone={alert.severity === "CRITICAL" ? "critical" : "warning"}>{alert.severity === "CRITICAL" ? "ZERADO" : "BAIXO"}</StatusBadge>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3">
                  <div><dt className="text-sm text-[var(--color-on-surface-variant)]">Saldo</dt><dd className="font-data mt-1 text-xl font-bold">{alert.quantity} {alert.unit}</dd></div>
                  <div><dt className="text-sm text-[var(--color-on-surface-variant)]">Mínimo</dt><dd className="font-data mt-1 text-xl font-semibold">{alert.minimumStock} {alert.unit}</dd></div>
                </dl>
                <div className="mt-auto flex flex-wrap gap-2 pt-5"><Link className={linkClass} href="/inventory">Estoque</Link>{profile.role === "ADMIN" ? <Link className={linkClass} href="/purchases/new">Nova compra</Link> : <Link className={linkClass} href="/purchases">Compras</Link>}</div>
              </DataCard>
            ))}
          </section>
        )}
      </main>
    </AppShell>
  );
}
