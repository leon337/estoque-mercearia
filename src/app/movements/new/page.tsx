import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { MovementForm } from "./movement-form";

export const dynamic = "force-dynamic";

type MovementType = "ENTRY" | "EXIT" | "INITIAL";

type SearchParams = Promise<{
  type?: string;
  product?: string;
  error?: string;
}>;

const errorMessages: Record<string, string> = {
  validation: "Revise o produto, o tipo e a quantidade informados.",
  insufficient_stock: "Estoque insuficiente. O saldo não foi alterado.",
  product_unavailable: "Produto indisponível para movimentação.",
  permission: "Seu perfil não possui permissão para esta operação.",
  initial_already_registered: "O inventário inicial deste produto já foi registrado.",
  operation_conflict: "Esta operação já foi usada com dados diferentes. Recarregue a página e tente novamente.",
  database: "Não foi possível registrar a movimentação. Tente novamente.",
};

function movementType(value: string | undefined, isAdmin: boolean): MovementType {
  if (value === "EXIT") return "EXIT";
  if (value === "INITIAL" && isAdmin) return "INITIAL";
  return "ENTRY";
}

function inventoryQuantity(inventory: { quantity: unknown }[] | null) {
  return Number(inventory?.[0]?.quantity ?? 0);
}

const secondaryLinkClass =
  "inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 font-semibold text-[var(--color-primary)]";

export default async function NewMovementPage({
  searchParams,
}: {
  searchParams: SearchParams;
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

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, internal_code, name, unit, inventory(quantity)")
    .eq("active", true)
    .order("name");

  if (productsError) {
    throw new Error("Não foi possível carregar produtos para movimentação.");
  }

  const isAdmin = profile.role === "ADMIN";
  const options = (products ?? []).map((product) => ({
    id: product.id,
    internalCode: product.internal_code,
    name: product.name,
    unit: product.unit,
    currentQuantity: inventoryQuantity(product.inventory),
  }));

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Nova movimentação"
          subtitle={(
            <span>
              Usuário: <strong>{profile.name || "Sem nome"}</strong> · {profile.role}
            </span>
          )}
          actions={<Link className={secondaryLinkClass} href="/inventory">Voltar ao estoque</Link>}
        />

        {!options.length ? (
          <DataCard className="mt-8 border-dashed">
            <h2 className="text-lg font-semibold">Nenhum produto ativo</h2>
            <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
              Cadastre ou ative um produto antes de registrar movimentações.
            </p>
            {isAdmin ? (
              <Link className={`${secondaryLinkClass} mt-4`} href="/products">Abrir produtos</Link>
            ) : null}
          </DataCard>
        ) : (
          <MovementForm
            errorMessage={params.error ? errorMessages[params.error] ?? errorMessages.database : null}
            initialOperationId={randomUUID()}
            initialProductId={params.product}
            initialType={movementType(params.type, isAdmin)}
            isAdmin={isAdmin}
            products={options}
          />
        )}
      </main>
    </AppShell>
  );
}
