import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";

export const dynamic = "force-dynamic";

function inventoryQuantity(inventory: { quantity: unknown }[] | null) {
  return Number(inventory?.[0]?.quantity ?? 0);
}

const quickLinkClass =
  "flex min-h-12 items-center justify-between gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-3 font-semibold text-[var(--color-on-surface)] transition hover:border-[var(--color-outline)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]";

export default async function Home() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, role, active")
    .eq("id", claimsData.claims.sub)
    .single();

  if (profileError || !profile?.active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, internal_code, name, unit, minimum_stock, inventory(quantity)")
    .eq("active",true)
    .order("name");

  if (productsError) throw new Error("Não foi possível carregar o dashboard.");

  const rows = (products ?? []).map((p) => ({
    ...p,
    quantity: inventoryQuantity(p.inventory),
    minimumStock: Number(p.minimum_stock ?? 0),
  }));
  const zeroStock=rows.filter((p) => p.quantity <= 0);
  const lowStock=rows.filter((p) => p.quantity > 0 && p.quantity <= p.minimumStock);
  const urgent = [...zeroStock, ...lowStock].slice(0,8);

  return (
    <AppShell role={profile.role === "ADMIN" ? "ADMIN" : "OPERATOR"}>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          title="Painel"
          subtitle={
            <span>
              {profile.name || "Sem nome"} · {profile.role === "ADMIN" ? "Administrador" : "Operador"}
            </span>
          }
          actions={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-transparent bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-on-primary)] transition active:translate-y-px"
                href="/movements/new"
              >
                Nova movimentação
              </Link>
              <form action={logout}>
                <Button className="w-full sm:w-auto" type="submit" variant="secondary">
                  Sair
                </Button>
              </form>
            </div>
          }
        />

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Resumo do estoque">
          <MetricCard hint="Itens disponíveis para operação" label="Produtos ativos" value={<span className="font-data">{rows.length}</span>} />
          <MetricCard hint="Reposição prioritária" label="Estoque zerado" tone="critical" value={<span className="font-data">{zeroStock.length}</span>} />
          <MetricCard hint="No mínimo ou abaixo dele" label="Estoque baixo" tone="warning" value={<span className="font-data">{lowStock.length}</span>} />
        </section>

        <div className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <DataCard className="min-w-0" padding="none">
            <div className="flex flex-col gap-3 border-b border-[var(--color-border-subtle)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Atenção no estoque</h2>
                <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Produtos zerados ou que já atingiram o estoque mínimo.</p>
              </div>
              <Link className="text-sm font-semibold text-[var(--color-primary)] underline underline-offset-4" href="/alerts">
                Ver todos os alertas
              </Link>
            </div>

            {!urgent.length ? (
              <div className="p-5">
                <p className="font-semibold">Nenhum produto exige reposição neste momento.</p>
                <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Os produtos ativos estão acima do limite de atenção.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-border-subtle)]">
                {urgent.map((p) => (
                  <li className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between" key={p.id}>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--color-on-surface)]">
                        <span className="font-data text-sm text-[var(--color-on-surface-variant)]">{p.internal_code}</span>
                        <span aria-hidden="true"> · </span>
                        {p.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Mínimo: <span className="font-data">{p.minimumStock}</span> {p.unit}</p>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                      {p.quantity <= 0 ? <StatusBadge tone="critical">ZERADO</StatusBadge> : <StatusBadge tone="warning">BAIXO</StatusBadge>}
                      <strong className="font-data text-sm">{p.quantity} {p.unit}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DataCard>

          <aside className="grid min-w-0 content-start gap-6">
            <DataCard>
              <h2 className="text-lg font-semibold">Ações rápidas</h2>
              <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Acesse os fluxos mais usados da operação.</p>
              <nav className="mt-4 grid gap-2" aria-label="Ações rápidas">
                <Link className={quickLinkClass} href="/inventory"><span>Estoque</span><span aria-hidden="true">→</span></Link>
                <Link className={quickLinkClass} href="/products"><span>Produtos</span><span aria-hidden="true">→</span></Link>
                <Link className={quickLinkClass} href="/history"><span>Histórico</span><span aria-hidden="true">→</span></Link>
                <Link className={quickLinkClass} href="/movements/new"><span>Nova movimentação</span><span aria-hidden="true">→</span></Link>
              </nav>
            </DataCard>

            {profile.role === "ADMIN" ? (
              <DataCard>
                <h2 className="text-lg font-semibold">Administração</h2>
                <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">Controles disponíveis somente para administradores.</p>
                <div className="mt-4 grid gap-2">
                  <Link className={quickLinkClass} href="/admin/users"><span>Usuários e permissões</span><span aria-hidden="true">→</span></Link>
                  <Link className={quickLinkClass} href="/admin/adjustment"><span>Ajuste de estoque</span><span aria-hidden="true">→</span></Link>
                </div>
              </DataCard>
            ) : null}
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
