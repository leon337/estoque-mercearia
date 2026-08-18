import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { AdjustmentForm } from "./adjustment-form";

export const dynamic = "force-dynamic";

function quantity(rows: { quantity: unknown }[] | null) {
  return Number(rows?.[0]?.quantity ?? 0);
}

const errors: Record<string, string> = {
  validation: "Informe produto, contagem e motivo.",
  permission: "Somente ADMIN pode ajustar estoque.",
  product: "Produto indisponível.",
  database: "Não foi possível registrar o ajuste.",
};

const secondaryLinkClass =
  "inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 font-semibold text-[var(--color-primary)]";

export default async function AdjustmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", userId)
    .single();
  if (profileError || !profile?.active || profile.role !== "ADMIN") redirect("/");

  const { data: products, error } = await supabase
    .from("products")
    .select("id, internal_code, name, unit, inventory(quantity)")
    .eq("active", true)
    .order("name");
  if (error) throw new Error("Não foi possível carregar produtos para ajuste.");

  const options = (products ?? []).map((product) => ({
    id: product.id,
    internalCode: product.internal_code,
    name: product.name,
    unit: product.unit,
    currentQuantity: quantity(product.inventory),
  }));

  return (
    <AppShell role={profile.role}>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Ajuste de estoque"
          subtitle="Informe a contagem física real. O sistema deriva a diferença e preserva o histórico."
          actions={<Link className={secondaryLinkClass} href="/">Voltar ao painel</Link>}
        />

        {params.error ? (
          <p
            className="mt-5 rounded-lg border border-[var(--color-error)] bg-[var(--color-surface-lowest)] px-4 py-3 text-sm text-[var(--color-error)]"
            role="alert"
          >
            {errors[params.error] ?? errors.database}
          </p>
        ) : null}
        {params.success === "registered" ? (
          <p
            className="mt-5 rounded-lg border border-[var(--color-status-success)] bg-[var(--color-surface-lowest)] px-4 py-3 text-sm"
            role="status"
          >
            Ajuste registrado.
          </p>
        ) : null}

        {!options.length ? (
          <DataCard className="mt-6 border-dashed">
            <h2 className="text-lg font-semibold">Nenhum produto ativo disponível</h2>
            <p className="mt-1 text-sm text-[var(--color-on-surface-variant)]">
              Ative ou cadastre um produto antes de registrar um ajuste.
            </p>
          </DataCard>
        ) : (
          <AdjustmentForm products={options} initialOperationId={randomUUID()} />
        )}
      </main>
    </AppShell>
  );
}
