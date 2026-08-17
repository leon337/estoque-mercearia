"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerStockMovement } from "@/modules/inventory/register-stock-movement";

export async function registerAdjustmentAction(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "").trim();
  const operationId = String(formData.get("operation_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const countedQuantity = Number(String(formData.get("quantity") ?? ""));

  if (!productId || !operationId || !reason || !Number.isFinite(countedQuantity) || countedQuantity < 0) {
    redirect("/admin/adjustment?error=validation");
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role, active").eq("id", userId).single();
  if (profileError || !profile?.active || profile.role !== "ADMIN") redirect("/?error=permission");

  try {
    await registerStockMovement(supabase, {
      productId,
      type: "ADJUSTMENT",
      quantity: countedQuantity,
      operationId,
      reason,
    });
  } catch (error) {
    const message = typeof error === "object" && error && "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
    const code = message.includes("REASON_REQUIRED") || message.includes("INVALID_QUANTITY")
      ? "validation"
      : message.includes("ADMIN_REQUIRED")
        ? "permission"
        : message.includes("INACTIVE_PRODUCT") || message.includes("PRODUCT_NOT_FOUND")
          ? "product"
          : "database";
    redirect(`/admin/adjustment?error=${code}&product=${encodeURIComponent(productId)}`);
  }

  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/history");
  redirect("/admin/adjustment?success=registered");
}