import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/authz";
import { toggleProductActive, updateProduct } from "../../actions";

export const dynamic = "force-dynamic";

type QueryValue = string | string[] | undefined;

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, QueryValue>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireAdminUser();

  const [{ data: product, error: productError }, { data: categories, error: categoryError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, internal_code, barcode, name, category_id, unit, minimum_stock, active")
        .eq("id", id)
        .single(),
      supabase.from("categories").select("id, name, active").order("name"),
    ]);

  if (productError || !product) {
    notFound();
  }
  if (categoryError) {
    throw new Error("Não foi possível consultar categorias.");
  }

  const error = first(query.error);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
      <Link className="text-sm underline" href="/products">← Produtos</Link>
      <p className="mt-6 text-sm font-semibold uppercase tracking-wide">M2 · Produtos</p>
      <h1 className="mt-1 text-3xl font-bold">Editar produto</h1>
      <p className="mt-2 text-sm text-neutral-600">Status atual: {product.active ? "Ativo" : "Inativo"}</p>

      {error ? (
        <p className="mt-6 rounded-md border border-red-300 px-4 py-3 text-sm" role="alert">
          {error === "duplicate"
            ? "Código interno ou código de barras já cadastrado."
            : "Revise os campos obrigatórios e os valores informados."}
        </p>
      ) : null}

      <form action={updateProduct} className="mt-6 grid gap-4 rounded-lg border p-5">
        <input name="id" type="hidden" value={product.id} />
        <label className="grid gap-1 text-sm font-medium">
          Código interno *
          <input className="rounded-md border px-3 py-2" defaultValue={product.internal_code} name="internal_code" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Código de barras
          <input className="rounded-md border px-3 py-2" defaultValue={product.barcode ?? ""} inputMode="numeric" name="barcode" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Nome *
          <input className="rounded-md border px-3 py-2" defaultValue={product.name} name="name" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Categoria
          <select className="rounded-md border px-3 py-2" defaultValue={product.category_id ?? ""} name="category_id">
            <option value="">Sem categoria</option>
            {(categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}{category.active ? "" : " (inativa)"}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Unidade *
          <input className="rounded-md border px-3 py-2" defaultValue={product.unit} name="unit" required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Estoque mínimo *
          <input className="rounded-md border px-3 py-2" defaultValue={String(product.minimum_stock)} min="0" name="minimum_stock" required step="0.001" type="number" />
        </label>
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link className="rounded-md border px-4 py-3 text-center font-semibold" href="/products">Cancelar</Link>
          <button className="rounded-md bg-black px-4 py-3 font-semibold text-white" type="submit">Salvar alterações</button>
        </div>
      </form>

      <form action={toggleProductActive} className="mt-4 rounded-lg border p-5">
        <input name="id" type="hidden" value={product.id} />
        <input name="next_active" type="hidden" value={String(!product.active)} />
        <p className="text-sm text-neutral-600">Inativar preserva o cadastro e impede sua exibição normal para operadores.</p>
        <button className="mt-3 rounded-md border px-4 py-3 font-semibold" type="submit">
          {product.active ? "Inativar produto" : "Ativar produto"}
        </button>
      </form>
    </main>
  );
}
