import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";

export const dynamic = "force-dynamic";

function inventoryQuantity(inventory: { quantity: unknown }[] | null) {
  return Number(inventory?.[0]?.quantity ?? 0);
}

export default async function Home() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("name, role, active").eq("id", claimsData.claims.sub).single();
  if (profileError || !profile?.active) { await supabase.auth.signOut(); redirect("/login?error=inactive"); }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, internal_code, name, unit, minimum_stock, inventory(quantity)")
    .eq("active", true)
    .order("name");
  if (productsError) throw new Error("Não foi possível carregar o dashboard.");

  const rows = (products ?? []).map((product) => ({ ...product, quantity: inventoryQuantity(product.inventory), minimumStock: Number(product.minimum_stock ?? 0) }));
  const zeroStock = rows.filter((product) => product.quantity <= 0);
  const lowStock = rows.filter((product) => product.quantity > 0 && product.quantity <= product.minimumStock);
  const urgent = [...zeroStock, ...lowStock].slice(0, 8);

  return <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wide">M5 · Dashboard</p><h1 className="mt-1 text-4xl font-bold tracking-tight">Estoque Mercearia</h1><p className="mt-2 text-sm text-neutral-600">Usuário: {profile.name || "Sem nome"} · {profile.role}</p></div><form action={logout}><button className="rounded-md border px-4 py-3 font-semibold" type="submit">Sair</button></form></header>

    <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Resumo do estoque">
      <article className="rounded-lg border p-5"><p className="text-sm text-neutral-600">Produtos ativos</p><p className="mt-1 text-3xl font-bold">{rows.length}</p></article>
      <article className="rounded-lg border p-5"><p className="text-sm text-neutral-600">Estoque zerado</p><p className="mt-1 text-3xl font-bold">{zeroStock.length}</p></article>
      <article className="rounded-lg border p-5"><p className="text-sm text-neutral-600">Estoque baixo</p><p className="mt-1 text-3xl font-bold">{lowStock.length}</p></article>
    </section>

    <nav className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Módulos">
      <Link className="rounded-lg border p-5 font-semibold" href="/inventory">Estoque<span className="mt-1 block text-sm font-normal text-neutral-600">Consultar todos os saldos.</span></Link>
      <Link className="rounded-lg bg-black p-5 font-semibold text-white" href="/movements/new">Nova movimentação<span className="mt-1 block text-sm font-normal text-neutral-300">Registrar entrada ou saída.</span></Link>
      <Link className="rounded-lg border p-5 font-semibold" href="/history">Histórico<span className="mt-1 block text-sm font-normal text-neutral-600">Rastrear movimentos e atores.</span></Link>
      <Link className="rounded-lg border p-5 font-semibold" href="/products">Produtos<span className="mt-1 block text-sm font-normal text-neutral-600">Pesquisar e manter o cadastro.</span></Link>
    </nav>

    <section className="mt-8 rounded-lg border p-5">
      <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Atenção no estoque</h2><p className="text-sm text-neutral-600">Produtos zerados ou no mínimo.</p></div><Link className="text-sm font-semibold underline" href="/inventory">Ver estoque completo</Link></div>
      {!urgent.length ? <p className="mt-5 text-sm">Nenhum produto exige reposição neste momento.</p> : <ul className="mt-5 divide-y">{urgent.map((product) => <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between" key={product.id}><div><p className="font-semibold">{product.internal_code} · {product.name}</p><p className="text-sm text-neutral-600">Mínimo: {product.minimumStock} {product.unit}</p></div><div className="flex items-center gap-3"><span className="rounded-full border px-3 py-1 text-xs font-bold">{product.quantity <= 0 ? "ZERADO" : "BAIXO"}</span><strong>{product.quantity} {product.unit}</strong></div></li>)}</ul>}
    </section>
  </main>;
}