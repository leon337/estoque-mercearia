import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
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
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
      <header>
        <Link className="text-sm font-semibold underline" href="/inventory">← Voltar ao estoque</Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide">M4 · Operação</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Nova movimentação</h1>
        <p className="mt-2 text-sm text-neutral-600">Usuário: {profile.name || "Sem nome"} · {profile.role}</p>
      </header>

      {!options.length ? (
        <section className="mt-8 rounded-lg border border-dashed p-6">
          <h2 className="font-semibold">Nenhum produto ativo</h2>
          <p className="mt-1 text-sm text-neutral-600">Cadastre ou ative um produto antes de registrar movimentações.</p>
          {isAdmin ? <Link className="mt-4 inline-block underline" href="/products">Abrir produtos</Link> : null}
        </section>
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
  );
}