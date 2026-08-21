import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAdminUser } from "@/lib/authz";
import { createPurchaseOrder } from "../actions";

export const dynamic = "force-dynamic";
type QueryValue = string | string[] | undefined;
function first(value: QueryValue) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }
const controlClass = "min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2";

type SupplierRow = { id: string; name: string; active: boolean };

export default async function NewPurchasePage({ searchParams }: { searchParams: Promise<Record<string, QueryValue>> }) {
  const { supabase, profile } = await requireAdminUser();
  const params = await searchParams;
  const { data, error } = await supabase.from("suppliers").select("id, name, active").eq("active", true).order("name");
  if (error) throw new Error("Não foi possível consultar fornecedores para compras.");
  const suppliers = (data ?? []) as SupplierRow[];
  const errorCode = first(params.error);
  const errors: Record<string, string> = {
    validation: "Revise os dados do pedido.",
    supplier_inactive: "Selecione um fornecedor ativo.",
    database: "Não foi possível criar o pedido.",
  };

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader title="Novo pedido de compra" subtitle="Crie o pedido e adicione os produtos na próxima etapa." actions={<Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/purchases">Voltar para compras</Link>} />
        {errorCode ? <p className="mt-6 rounded-lg border border-[var(--color-error)] px-4 py-3 text-sm text-[var(--color-error)]" role="alert">{errors[errorCode] ?? "Não foi possível concluir a operação."}</p> : null}
        <DataCard className="mt-6">
          <form action={createPurchaseOrder} className="grid gap-5">
            <label className="grid gap-2 text-sm font-medium">
              Fornecedor
              <select className={controlClass} name="supplier_id" required>
                <option value="">Selecione</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Observações
              <textarea className={`${controlClass} min-h-28`} maxLength={2000} name="notes" />
            </label>
            <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:justify-end">
              <Link className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 font-semibold text-[var(--color-primary)]" href="/purchases">Cancelar</Link>
              <Button disabled={suppliers.length === 0} type="submit">Criar pedido</Button>
            </div>
          </form>
        </DataCard>
      </main>
    </AppShell>
  );
}
