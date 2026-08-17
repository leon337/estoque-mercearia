import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type InventorySearchParams = Promise<{
  success?: string;
}>;

function stockStatus(quantity: number, minimumStock: number) {
  if (quantity <= 0) {
    return { label: "ZERADO", description: "Sem estoque disponível" };
  }

  if (quantity <= minimumStock) {
    return { label: "BAIXO", description: "Estoque baixo" };
  }

  return { label: "OK", description: "Estoque dentro do mínimo" };
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: InventorySearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, role, active")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("id, internal_code, name, unit, minimum_stock, inventory(quantity)")
    .eq("active", true)
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar o estoque.");
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide">M4 · Operação</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Estoque atual</h1>
          <p className="mt-2 text-sm text-neutral-600">Consulte o saldo antes de registrar entradas ou saídas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-md border px-4 py-3 font-semibold" href="/">Início</Link>
          <Link className="rounded-md bg-black px-4 py-3 font-semibold text-white" href="/movements/new">Nova movimentação</Link>
        </div>
      </header>

      {params.success === "movement_registered" ? (
        <p className="mt-6 rounded-md border p-3" role="status">Movimentação registrada com sucesso.</p>
      ) : null}

      {!products?.length ? (
        <section className="mt-8 rounded-lg border border-dashed p-6">
          <h2 className="font-semibold">Nenhum produto ativo</h2>
          <p className="mt-1 text-sm text-neutral-600">Cadastre ou ative produtos antes de movimentar o estoque.</p>
          {profile.role === "ADMIN" ? (
            <Link className="mt-4 inline-block rounded-md border px-4 py-2 font-semibold" href="/products">Ir para produtos</Link>
          ) : null}
        </section>
      ) : (
        <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Saldos por produto">
          {products.map((product) => {
            const quantity = Number(product.inventory?.quantity ?? 0);
            const minimumStock = Number(product.minimum_stock ?? 0);
            const status = stockStatus(quantity, minimumStock);

            return (
              <article className="rounded-lg border p-5" key={product.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{product.internal_code}</p>
                    <h2 className="mt-1 text-xl font-semibold">{product.name}</h2>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs font-bold" aria-label={`Status ${status.label}`}>
                    {status.label}
                  </span>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-sm text-neutral-600">Saldo atual</dt>
                    <dd className="text-2xl font-bold">{quantity} {product.unit}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-neutral-600">Estoque mínimo</dt>
                    <dd className="text-lg font-semibold">{minimumStock} {product.unit}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-sm text-neutral-600">{status.description}</p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link className="rounded-md border px-3 py-3 text-center font-semibold" href={`/movements/new?type=ENTRY&product=${product.id}`}>Entrada</Link>
                  <Link className="rounded-md border px-3 py-3 text-center font-semibold" href={`/movements/new?type=EXIT&product=${product.id}`}>Saída</Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}