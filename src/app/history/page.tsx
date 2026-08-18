import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ product?: string; type?: string; actor?: string; from?: string; to?: string }>;
const movementTypes = ["INITIAL", "ENTRY", "EXIT", "ADJUSTMENT"] as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function typeLabel(type: string) {
  if (type === "INITIAL") return "Inventário inicial";
  if (type === "ENTRY") return "Entrada";
  if (type === "EXIT") return "Saída";
  if (type === "ADJUSTMENT") return "Ajuste";
  return type;
}

function typeTone(type: string) {
  if (type === "ENTRY") return "success" as const;
  if (type === "EXIT") return "warning" as const;
  if (type === "ADJUSTMENT") return "critical" as const;
  return "neutral" as const;
}

function formatNumber(value: unknown) {
  return Number(value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Recife",
  }).format(new Date(value));
}

function shortActor(id: string) {
  return `Usuário ${id.slice(0, 8)}`;
}

const controlClass =
  "mt-1 min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2 font-normal text-[var(--color-on-surface)] focus:border-[var(--color-primary)]";
const secondaryLinkClass =
  "inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 font-semibold text-[var(--color-primary)]";

export default async function HistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase.from("profiles").select("name, role, active").eq("id", userId).single();
  if (profileError || !profile?.active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  const { data: filterProducts, error: productFilterError } = await supabase.from("products").select("id, internal_code, name").order("name");
  if (productFilterError) throw new Error("Não foi possível carregar os filtros do histórico.");

  let movementQuery = supabase.from("stock_movements")
    .select("id, product_id, type, quantity_delta, previous_quantity, resulting_quantity, reason, performed_by, created_at")
    .order("created_at", { ascending: false }).limit(200);
  if (params.product && uuidPattern.test(params.product)) movementQuery = movementQuery.eq("product_id", params.product);
  if (params.actor && uuidPattern.test(params.actor)) movementQuery = movementQuery.eq("performed_by", params.actor);
  if (params.type && movementTypes.includes(params.type as (typeof movementTypes)[number])) movementQuery = movementQuery.eq("type", params.type);
  if (params.from && datePattern.test(params.from)) movementQuery = movementQuery.gte("created_at", `${params.from}T00:00:00-03:00`);
  if (params.to && datePattern.test(params.to)) movementQuery = movementQuery.lte("created_at", `${params.to}T23:59:59.999-03:00`);

  const { data: movements, error: movementError } = await movementQuery;
  if (movementError) throw new Error("Não foi possível carregar o histórico.");

  const productIds = [...new Set((movements ?? []).map((movement) => movement.product_id))];
  const actorIds = [...new Set((movements ?? []).map((movement) => movement.performed_by))];
  const movementProducts = productIds.length
    ? await supabase.from("products").select("id, internal_code, name, unit").in("id", productIds)
    : { data: [], error: null };
  const visibleActors = actorIds.length
    ? await supabase.from("profiles").select("id, name").in("id", actorIds)
    : { data: [], error: null };
  if (movementProducts.error || visibleActors.error) throw new Error("Não foi possível resolver os dados do histórico.");

  const productById = new Map((movementProducts.data ?? []).map((product) => [product.id, product]));
  const actorById = new Map((visibleActors.data ?? []).map((actor) => [actor.id, actor.name || shortActor(actor.id)]));

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Movimentações de estoque"
          subtitle="Até 200 registros mais recentes dentro dos filtros selecionados."
          actions={<Link className={secondaryLinkClass} href="/">Voltar ao painel</Link>}
        />

        <DataCard className="mt-6">
          <form className="grid gap-4 md:grid-cols-3 lg:grid-cols-5" method="get">
            <label className="text-sm font-semibold">
              Produto
              <select className={controlClass} name="product" defaultValue={params.product ?? ""}>
                <option value="">Todos</option>
                {(filterProducts ?? []).map((product) => (
                  <option key={product.id} value={product.id}>{product.internal_code} · {product.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Tipo
              <select className={controlClass} name="type" defaultValue={params.type ?? ""}>
                <option value="">Todos</option>
                {movementTypes.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Ator (ID)
              <input className={`${controlClass} font-data`} name="actor" defaultValue={params.actor ?? ""} placeholder="UUID do usuário" />
            </label>
            <label className="text-sm font-semibold">
              De
              <input className={controlClass} name="from" type="date" defaultValue={params.from ?? ""} />
            </label>
            <label className="text-sm font-semibold">
              Até
              <input className={controlClass} name="to" type="date" defaultValue={params.to ?? ""} />
            </label>
            <div className="flex flex-wrap gap-2 md:col-span-3 lg:col-span-5">
              <Button type="submit">Aplicar filtros</Button>
              <Link className={secondaryLinkClass} href="/history">Limpar</Link>
            </div>
          </form>
        </DataCard>

        {!movements?.length ? (
          <DataCard className="mt-6 border-dashed">
            <h2 className="text-lg font-semibold">Nenhuma movimentação encontrada</h2>
            <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
              Ajuste os filtros ou registre uma movimentação.
            </p>
          </DataCard>
        ) : (
          <section className="mt-6 space-y-3" aria-label="Histórico de movimentações">
            {movements.map((movement) => {
              const product = productById.get(movement.product_id);
              const actor = actorById.get(movement.performed_by) ?? shortActor(movement.performed_by);
              const unit = product?.unit ?? "";

              return (
                <DataCard key={movement.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-data text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)]">
                        {product?.internal_code ?? movement.product_id.slice(0, 8)}
                      </p>
                      <h2 className="mt-1 font-semibold">{product?.name ?? "Produto não disponível"}</h2>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                      <StatusBadge tone={typeTone(movement.type)}>{typeLabel(movement.type)}</StatusBadge>
                      <time className="text-sm text-[var(--color-on-surface-variant)]" dateTime={movement.created_at}>
                        {formatDate(movement.created_at)}
                      </time>
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-xs text-[var(--color-on-surface-variant)]">Saldo anterior</dt>
                      <dd className="font-data mt-1 font-semibold">{formatNumber(movement.previous_quantity)} {unit}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--color-on-surface-variant)]">Delta</dt>
                      <dd className="font-data mt-1 font-semibold">
                        {Number(movement.quantity_delta) > 0 ? "+" : ""}{formatNumber(movement.quantity_delta)} {unit}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--color-on-surface-variant)]">Saldo resultante</dt>
                      <dd className="font-data mt-1 font-semibold">{formatNumber(movement.resulting_quantity)} {unit}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[var(--color-on-surface-variant)]">Ator</dt>
                      <dd className="mt-1 font-semibold">{actor}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-sm">
                    <span className="font-semibold">Motivo:</span> {movement.reason || "Não informado"}
                  </p>
                </DataCard>
              );
            })}
          </section>
        )}
      </main>
    </AppShell>
  );
}
