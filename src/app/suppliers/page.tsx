import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireActiveProfile } from "@/lib/authz";
import { toggleSupplierActive } from "./actions";

export const dynamic = "force-dynamic";

type QueryValue = string | string[] | undefined;
type SearchParams = Promise<Record<string, QueryValue>>;
type SupplierRow = {
  id: string;
  name: string;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
};

function first(value: QueryValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function flashMessage(error: string, success: string) {
  if (success) {
    const messages: Record<string, string> = {
      created: "Fornecedor cadastrado.",
      updated: "Fornecedor atualizado.",
      activated: "Fornecedor ativado.",
      deactivated: "Fornecedor inativado.",
    };
    return { kind: "success", text: messages[success] ?? "Operação concluída." };
  }
  if (error) {
    const messages: Record<string, string> = {
      permission: "Esta operação exige perfil ADMIN.",
      duplicate: "Já existe fornecedor com esse documento.",
      validation: "Revise os dados informados.",
      database: "Não foi possível concluir a operação.",
    };
    return { kind: "error", text: messages[error] ?? "Não foi possível concluir a operação." };
  }
  return null;
}

const controlClass =
  "min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2";

export default async function SuppliersPage({ searchParams }: { searchParams: SearchParams }) {
  const { supabase, profile } = await requireActiveProfile();
  const params = await searchParams;
  const q = first(params.q).trim();
  const requestedStatus = first(params.status);
  const isAdmin = profile.role === "ADMIN";
  const status = isAdmin && ["all", "active", "inactive"].includes(requestedStatus)
    ? requestedStatus
    : "active";

  let query = supabase
    .from("suppliers")
    .select("id, name, tax_id, email, phone, active");
  if (q) query = query.ilike("name", `%${q}%`);
  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);

  const { data, error } = await query.order("name");
  if (error) throw new Error("Não foi possível consultar fornecedores.");
  const suppliers = (data ?? []) as SupplierRow[];
  const flash = flashMessage(first(params.error), first(params.success));

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Fornecedores"
          subtitle="Centralize contatos e vínculos comerciais usados nas próximas etapas de compras."
          actions={isAdmin ? (
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-2 font-semibold text-[var(--color-on-primary)]"
              href="/suppliers/new"
            >
              Novo fornecedor
            </Link>
          ) : null}
        />

        {flash ? (
          <p
            className={`mt-6 rounded-lg border px-4 py-3 text-sm ${flash.kind === "error" ? "border-[var(--color-error)] text-[var(--color-error)]" : "border-[var(--color-status-success)]"}`}
            role={flash.kind === "error" ? "alert" : "status"}
          >
            {flash.text}
          </p>
        ) : null}

        <DataCard className="mt-6">
          <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end" method="get">
            <label className="grid gap-2 text-sm font-medium">
              Buscar
              <input className={controlClass} defaultValue={q} name="q" placeholder="Nome do fornecedor" />
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
            <Button type="submit" variant="secondary">Pesquisar</Button>
          </form>
        </DataCard>

        <section className="mt-8" aria-labelledby="supplier-list-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-on-surface-variant)]">Cadastro</p>
              <h2 className="mt-1 text-2xl font-bold" id="supplier-list-title">Fornecedores cadastrados</h2>
            </div>
            <span className="text-sm text-[var(--color-on-surface-variant)]">{suppliers.length} resultado(s)</span>
          </div>

          {suppliers.length === 0 ? (
            <DataCard className="mt-4 border-dashed">
              <p className="text-sm text-[var(--color-on-surface-variant)]">Nenhum fornecedor encontrado.</p>
            </DataCard>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {suppliers.map((supplier) => (
                <DataCard className="h-full" key={supplier.id}>
                  <div className="flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold">{supplier.name}</h3>
                      <StatusBadge tone={supplier.active ? "success" : "neutral"}>{supplier.active ? "Ativo" : "Inativo"}</StatusBadge>
                    </div>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div><dt className="text-[var(--color-on-surface-variant)]">Documento</dt><dd className="mt-1 font-data">{supplier.tax_id || "—"}</dd></div>
                      <div><dt className="text-[var(--color-on-surface-variant)]">Telefone</dt><dd className="mt-1">{supplier.phone || "—"}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-[var(--color-on-surface-variant)]">E-mail</dt><dd className="mt-1 break-all">{supplier.email || "—"}</dd></div>
                    </dl>
                    {isAdmin ? (
                      <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--color-border-subtle)] pt-4">
                        <Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)]" href={`/suppliers/${supplier.id}/edit`}>
                          Editar
                        </Link>
                        <form action={toggleSupplierActive}>
                          <input name="id" type="hidden" value={supplier.id} />
                          <input name="next_active" type="hidden" value={String(!supplier.active)} />
                          <Button type="submit" variant={supplier.active ? "danger" : "secondary"}>{supplier.active ? "Inativar" : "Ativar"}</Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </DataCard>
              ))}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
