import Link from "next/link";
import { requireAdminUser } from "@/lib/authz";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

type QueryValue = string | string[] | undefined;

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NewProductPage({ searchParams }: { searchParams: Promise<Record<string, QueryValue>> }) {
  const { supabase } = await requireAdminUser();
  const params = await searchParams;
  const error = first(params.error);
  const { data: categories, error: categoryError } = await supabase.from("categories").select("id, name").eq("active", true).order("name");

  if (categoryError) throw new Error("Não foi possível consultar categorias.");

  const errorText = error === "duplicate"
    ? "Código interno ou código de barras já cadastrado."
    : error === "category_inactive"
      ? "Selecione uma categoria ativa."
      : "Revise os campos obrigatórios e os valores informados.";

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
      <Link className="text-sm underline" href="/products">← Produtos</Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide">M2 · Produtos</p>
      <h1 className="mt-1 text-3xl font-bold">Novo produto</h1>
      {error ? <p className="mt-6 rounded-md border border-red-300 px-4 py-3 text-sm" role="alert">{errorText}</p> : null}
      <form action={createProduct} className="mt-6 grid gap-4 rounded-lg border p-5">
        <label className="grid gap-1 text-sm font-medium">Código interno *<input className="rounded-md border px-3 py-2" name="internal_code" required /></label>
        <label className="grid gap-1 text-sm font-medium">Código de barras<input className="rounded-md border px-3 py-2" inputMode="numeric" name="barcode" /></label>
        <label className="grid gap-1 text-sm font-medium">Nome *<input className="rounded-md border px-3 py-2" name="name" required /></label>
        <label className="grid gap-1 text-sm font-medium">Categoria<select className="rounded-md border px-3 py-2" defaultValue="" name="category_id"><option value="">Sem categoria</option>{(categories ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium">Unidade *<input className="rounded-md border px-3 py-2" name="unit" placeholder="UN, KG, L, CX..." required /></label>
        <label className="grid gap-1 text-sm font-medium">Estoque mínimo *<input className="rounded-md border px-3 py-2" defaultValue="0" min="0" name="minimum_stock" required step="0.001" type="number" /></label>
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Link className="rounded-md border px-4 py-3 text-center font-semibold" href="/products">Cancelar</Link><button className="rounded-md bg-black px-4 py-3 font-semibold text-white" type="submit">Cadastrar produto</button></div>
      </form>
    </main>
  );
}
