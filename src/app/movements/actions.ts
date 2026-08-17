"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  registerStockMovement,
  type StockMovementType,
} from "@/modules/inventory/register-stock-movement";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function movementErrorCode(error: unknown) {
  let message = "";

  if (typeof error === "object" && error !== null && "message" in error) {
    message = String((error as { message?: unknown }).message ?? "");
  } else {
    message = String(error ?? "");
  }

  if (message.includes("STOCK_INSUFFICIENT")) return "insufficient_stock";
  if (message.includes("INACTIVE_PRODUCT") || message.includes("PRODUCT_NOT_FOUND")) return "product_unavailable";
  if (message.includes("ADMIN_REQUIRED")) return "permission";
  if (message.includes("INITIAL_ALREADY_REGISTERED")) return "initial_already_registered";
  if (message.includes("IDEMPOTENCY_CONFLICT")) return "operation_conflict";
  if (message.includes("INVALID_QUANTITY") || message.includes("INVALID_MOVEMENT_INPUT")) return "validation";
  if (message.includes("AUTH_REQUIRED") || message.includes("USER_INACTIVE_OR_MISSING")) return "session";
  return "database";
}

export async function registerMovementAction(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  const productId = readText(formData, "product_id");
  const rawType = readText(formData, "type");
  const operationId = readText(formData, "operation_id");
  const quantity = Number(readText(formData, "quantity"));
  const allowedTypes: StockMovementType[] = ["ENTRY", "EXIT", "INITIAL"];

  if (
    !productId ||
    !operationId ||
    !allowedTypes.includes(rawType as StockMovementType) ||
    !Number.isFinite(quantity) ||
    quantity < 0 ||
    ((rawType === "ENTRY" || rawType === "EXIT") && quantity <= 0)
  ) {
    redirect("/movements/new?error=validation");
  }

  const type = rawType as StockMovementType;

  if (type === "INITIAL" && profile.role !== "ADMIN") {
    redirect("/movements/new?error=permission");
  }

  try {
    await registerStockMovement(supabase, {
      productId,
      type,
      quantity,
      operationId,
    });
  } catch (error) {
    const code = movementErrorCode(error);
    if (code === "session") {
      await supabase.auth.signOut();
      redirect("/login?error=inactive");
    }
    redirect(`/movements/new?error=${code}&product=${encodeURIComponent(productId)}&type=${type}`);
  }

  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/movements/new");
  redirect("/inventory?success=movement_registered");
}