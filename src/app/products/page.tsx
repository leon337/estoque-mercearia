import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
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
      category_in_use: "Não é possível inativar uma categoria usada por produto ativo.",
      category_inactive: "Selecione uma categoria ativa antes de ativar o produto.",
    };
    return { kind: "error", text: messages[error] ?? "Não foi possível concluir a operação." };
  }

  return null;
}

const controlClass =
  "min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2";

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
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Produtos"
          subtitle="Consulte produtos por nome ou código. Alterações cadastrais exigem ADMIN."
          actions={isAdmin ? (
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-on-primary)]"
              href="/products/new"
            >
              Novo produto
            </Link>
          ) : null}
        />

        {flash ? (
          <p
            className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
              flash.kind === "error"
                ? "border-[var(--color-error)] text-[var(--color-error)]"
                : "border-[var(--color-status-success)] text-[var(--color-on-surface)]"
            }`}
            role={flash.kind === "error" ? "alert" : "status"}
          >
            {flash.text}
          </p>
        ) : null}

        <DataCard className="mt-6">
          <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end" method="get">
            <label className="grid gap-2 text-sm font-medium">
              Buscar
              <input
                className={controlClass}
                defaultValue={q}
                name="q"
                placeholder="Nome ou código interno"
              />
            </label>
            {isAdmin ? (
              <label className="grid gap-2 text-sm font-medium">
                Status
                <select className={controlClass} defaultValue={status} name="status">
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </label>
            ) : null}
            <Button className="w-full sm:w-auto" type="submit" variant="secondary">
              Pesquisar
            </Button>
          </form>
        </DataCard>

        <section className="mt-8" aria-labelledby="product-list-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-on-surface-variant)]">Cadastro</p>
              <h2 className="mt-1 text-2xl font-bold" id="product-list-title">Produtos cadastrados</h2>
            </div>
            <span className="text-sm text-[var(--color-on-surface-variant)]">{products.length} resultado(s)</span>
          </div>

          {products.length === 0 ? (
            <DataCard className="mt-4 border-dashed">
              <p className="text-sm text-[var(--color-on-surface-variant)]">Nenhum produto encontrado.</p>
            </DataCard>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {products.map((product) => (
                <DataCard className="h-full" key={product.id}>
                  <div className="flex h-full flex-col gap-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <p className="mt-1 font-data text-sm text-[var(--color-on-surface-variant)]">{product.internal_code}</p>
                      </div>
                      <StatusBadge tone={product.active ? "success" : "neutral"}>
                        {product.active ? "Ativo" : "Inativo"}
                      </StatusBadge>
                    </div>

                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-[var(--color-on-surface-variant)]">Código de barras</dt>
                        <dd className="mt-1 font-data font-medium">{product.barcode || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-on-surface-variant)]">Categoria</dt>
                        <dd className="mt-1 font-medium">{product.category_id ? categoryNames.get(product.category_id) ?? "Categoria indisponível" : "Sem categoria"}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-on-surface-variant)]">Unidade</dt>
                        <dd className="mt-1 font-medium">{product.unit}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-on-surface-variant)]">Estoque mínimo</dt>
                        <dd className="mt-1 font-data font-medium">{String(product.minimum_stock)}</dd>
                      </div>
                    </dl>

                    {isAdmin ? (
                      <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--color-border-subtle)] pt-4">
                        <Link
                          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]"
                          href={`/products/${product.id}/edit`}
                        >
                          Editar
                        </Link>
                        <form action={toggleProductActive}>
                          <input name="id" type="hidden" value={product.id} />
                          <input name="next_active" type="hidden" value={String(!product.active)} />
                          <Button type="submit" variant={product.active ? "danger" : "secondary"}>
                            {product.active ? "Inativar" : "Ativar"}
                          </Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </DataCard>
              ))}
            </div>
          )}
        </section>

        {isAdmin ? (
          <section className="mt-10" aria-labelledby="categories-title">
            <DataCard>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-on-surface-variant)]">Administração</p>
                <h2 className="text-2xl font-bold" id="categories-title">Categorias</h2>
                <p className="text-sm text-[var(--color-on-surface-variant)]">Categorias em uso por produtos ativos não podem ser inativadas.</p>
              </div>

              <form action={createCategory} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="grid flex-1 gap-2 text-sm font-medium">
                  Nome da categoria
                  <input className={controlClass} name="category_name" required />
                </label>
                <Button className="sm:shrink-0" type="submit" variant="secondary">Adicionar categoria</Button>
              </form>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-[var(--color-on-surface-variant)]">Nenhuma categoria cadastrada.</p>
                ) : (
                  categories.map((category) => (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border-subtle)] p-3" key={category.id}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{category.name}</p>
                        <div className="mt-2">
                          <StatusBadge tone={category.active ? "success" : "neutral"}>{category.active ? "Ativa" : "Inativa"}</StatusBadge>
                        </div>
                      </div>
                      <form action={toggleCategoryActive}>
                        <input name="id" type="hidden" value={category.id} />
                        <input name="next_active" type="hidden" value={String(!category.active)} />
                        <Button type="submit" variant={category.active ? "danger" : "secondary"}>
                          {category.active ? "Inativar" : "Ativar"}
                        </Button>
                      </form>
                    </div>
                  ))
                )}
              </div>
            </DataCard>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
