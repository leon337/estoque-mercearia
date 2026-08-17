import Link from "next/link";
import { requireActiveProfile } from "@/lib/authz";
import {
  createCategory,
  toggleCategoryActive,
  toggleProductActive,
} from "./actions";

export const dynamic = "force-dynamic";

type QueryValue = string | string[] | undefined;
type SearchParams = Promise<Record<string, QueryValue>>;

type ProductRow = {
  id: string;
  internal_code: string;
  barcode: string | null;
  name: string;
  category_id: string | null;
  unit: string;
  minimum_stock: number | string;
  active: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  active: boolean;
};

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function message(error: string, success: string) {
  if (success) {
    const messages: Record<string, string> = {
      created: "Produto cadastrado.",
      updated: "Produto atualizado.",
      activated: "Produto ativado.",
      deactivated: "Produto inativado.",
      category_created: "Categoria cadastrada.",
      category_updated: "Categoria atualizada.",
    };
    return { kind: "success", text: messages[success] ?? "Operação concluída." };
  }

  if (error) {
    const messages: Record<string, string> = {
      permission: "Esta operação exige perfil ADMIN.",
      duplicate: "Código interno ou código de barras já cadastrado.",
      database: "Não foi possível salvar a alteração.",
      validation: "Revise os dados informados.",
      category_validation: "Informe um nome de categoria válido.",
      category_duplicate: "Já existe uma categoria com esse nome.",
      category_database: "Não foi possível salvar a categoria.",
    };
    return { kind: "error", text: messages[error] ?? "Não foi possível concluir a operação." };
  }

  return null;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase, profile } = await requireActiveProfile();
  const params = await searchParams;
  const q = first(params.q).trim();
  const requestedStatus = first(params.status);
  const isAdmin = profile.role === "ADMIN";
  const status = isAdmin && ["all", "active", "inactive"].includes(requestedStatus)
    ? requestedStatus
    : "active";

  const productColumns =
    "id, internal_code, barcode, name, category_id, unit, minimum_stock, active";

  let products: ProductRow[] = [];

  if (q) {
    let byName = supabase.from("products").select(productColumns).ilike("name", `%${q}%`);
    let byCode = supabase
      .from("products")
      .select(productColumns)
      .ilike("internal_code", `%${q}%`);

    if (status === "active") {
      byName = byName.eq("active", true);
      byCode = byCode.eq("active", true);
    } else if (status === "inactive") {
      byName = byName.eq("active", false);
      byCode = byCode.eq("active", false);
    }

    const [nameResult, codeResult] = await Promise.all([
      byName.order("name"),
      byCode.order("name"),
    ]);

    if (nameResult.error || codeResult.error) {
      throw new Error("Não foi possível consultar produtos.");
    }

    const merged = new Map<string, ProductRow>();
    for (const product of [
      ...((nameResult.data ?? []) as ProductRow[]),
      ...((codeResult.data ?? []) as ProductRow[]),
    ]) {
      merged.set(product.id, product);
    }
    products = [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  } else {
    let query = supabase.from("products").select(productColumns);

    if (status === "active") {
      query = query.eq("active", true);
    } else if (status === "inactive") {
      query = query.eq("active", false);
    }

    const { data, error } = await query.order("name");
    if (error) {
      throw new Error("Não foi possível consultar produtos.");
    }
    products = (data ?? []) as ProductRow[];
  }

  const { data: categoryData, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, active")
    .order("name");

  if (categoryError) {
    throw new Error("Não foi possível consultar categorias.");
  }

  const categories = (categoryData ?? []) as CategoryRow[];
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const flash = message(first(params.error), first(params.success));

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link className="text-sm underline" href="/">
            ← Início
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide">M2 · Produtos</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Consulte produtos por nome ou código. Alterações cadastrais exigem ADMIN.
          </p>
        </div>
        {isAdmin ? (
          <Link className="rounded-md bg-black px-4 py-3 text-center font-semibold text-white" href="/products/new">
            Novo produto
          </Link>
        ) : null}
      </header>

      {flash ? (
        <p
          className={`mt-6 rounded-md border px-4 py-3 text-sm ${
            flash.kind === "error" ? "border-red-300" : "border-green-300"
          }`}
          role="status"
        >
          {flash.text}
        </p>
      ) : null}

      <form className="mt-6 grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto_auto]" method="get">
        <label className="grid gap-1 text-sm font-medium">
          Buscar
          <input
            className="rounded-md border px-3 py-2"
            defaultValue={q}
            name="q"
            placeholder="Nome ou código interno"
          />
        </label>
        {isAdmin ? (
          <label className="grid gap-1 text-sm font-medium">
            Status
            <select className="rounded-md border px-3 py-2" defaultValue={status} name="status">
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </label>
        ) : null}
        <button className="self-end rounded-md border px-4 py-2 font-semibold" type="submit">
          Pesquisar
        </button>
      </form>

      <section className="mt-6" aria-labelledby="product-list-title">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold" id="product-list-title">
            Cadastro
          </h2>
          <span className="text-sm text-neutral-600">{products.length} resultado(s)</span>
        </div>

        {products.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed p-6 text-sm text-neutral-600">
            Nenhum produto encontrado.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {products.map((product) => (
              <article className="rounded-lg border p-4" key={product.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <span className="rounded border px-2 py-0.5 text-xs">
                        {product.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <dl className="mt-3 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                      <div><dt className="inline font-medium">Código: </dt><dd className="inline">{product.internal_code}</dd></div>
                      <div><dt className="inline font-medium">Barcode: </dt><dd className="inline">{product.barcode || "—"}</dd></div>
                      <div><dt className="inline font-medium">Categoria: </dt><dd className="inline">{product.category_id ? categoryNames.get(product.category_id) ?? "Categoria indisponível" : "Sem categoria"}</dd></div>
                      <div><dt className="inline font-medium">Unidade: </dt><dd className="inline">{product.unit}</dd></div>
                      <div><dt className="inline font-medium">Estoque mínimo: </dt><dd className="inline">{String(product.minimum_stock)}</dd></div>
                    </dl>
                  </div>
                  {isAdmin ? (
                    <div className="flex flex-wrap gap-2">
                      <Link className="rounded-md border px-3 py-2 text-sm font-semibold" href={`/products/${product.id}/edit`}>
                        Editar
                      </Link>
                      <form action={toggleProductActive}>
                        <input name="id" type="hidden" value={product.id} />
                        <input name="next_active" type="hidden" value={String(!product.active)} />
                        <button className="rounded-md border px-3 py-2 text-sm font-semibold" type="submit">
                          {product.active ? "Inativar" : "Ativar"}
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isAdmin ? (
        <section className="mt-10 border-t pt-8" aria-labelledby="categories-title">
          <h2 className="text-xl font-semibold" id="categories-title">Categorias</h2>
          <form action={createCategory} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="flex-1 text-sm font-medium">
              Nome da categoria
              <input className="mt-1 w-full rounded-md border px-3 py-2" name="category_name" required />
            </label>
            <button className="self-end rounded-md border px-4 py-2 font-semibold" type="submit">
              Adicionar categoria
            </button>
          </form>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {categories.length === 0 ? (
              <p className="text-sm text-neutral-600">Nenhuma categoria cadastrada.</p>
            ) : (
              categories.map((category) => (
                <div className="flex items-center justify-between rounded-md border px-3 py-2" key={category.id}>
                  <span className="text-sm">{category.name} · {category.active ? "Ativa" : "Inativa"}</span>
                  <form action={toggleCategoryActive}>
                    <input name="id" type="hidden" value={category.id} />
                    <input name="next_active" type="hidden" value={String(!category.active)} />
                    <button className="text-sm font-semibold underline" type="submit">
                      {category.active ? "Inativar" : "Ativar"}
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
