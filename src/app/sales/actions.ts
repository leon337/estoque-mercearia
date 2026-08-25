"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActiveProfile } from "@/lib/authz";
import { isQuantityTextValidForUnit } from "@/modules/inventory/quantity-policy.mjs";

function text(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function optional(value: FormDataEntryValue | null) {
  const valueText = text(value);
  return valueText || null;
}

function errorCode(error: { code?: string; message?: string } | null) {
  const message = String(error?.message ?? "");
  if (error?.code === "42501") return "permission";
  if (message.includes("SALE_NOT_DRAFT")) return "not_draft";
  if (message.includes("SALE_EMPTY")) return "empty";
  if (message.includes("STOCK_INSUFFICIENT")) return "insufficient_stock";
  if (message.includes("PRODUCT_INACTIVE_OR_MISSING") || message.includes("INACTIVE_PRODUCT")) return "product_inactive";
  if (message.includes("INVALID_QUANTITY") || message.includes("INVALID_QUANTITY_PRECISION") || message.includes("INVALID_SALE_INPUT")) return "validation";
  if (message.includes("IDEMPOTENCY_CONFLICT")) return "operation_conflict";
  return "database";
}

export async function createSale(formData: FormData) {
  const { supabase } = await requireActiveProfile();
  const notes = optional(formData.get("notes"));
  if (notes && notes.length > 1000) redirect("/sales/new?error=validation");

  const { data, error } = await supabase.from("sales").insert({ notes }).select("id").single();
  if (error || !data?.id) redirect(`/sales/new?error=${errorCode(error)}`);

  revalidatePath("/sales");
  redirect(`/sales/${data.id}?success=created`);
}

export async function addSaleItem(formData: FormData) {
  const { supabase } = await requireActiveProfile();
  const saleId = text(formData.get("sale_id"));
  const productId = text(formData.get("product_id"));
  const quantityText = text(formData.get("quantity"));
  const quantity = Number(quantityText.replace(",", "."));
  if (!saleId || !productId || !Number.isFinite(quantity) || quantity <= 0) {
    redirect(`/sales/${saleId || "unknown"}?error=validation`);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("unit, active")
    .eq("id", productId)
    .single();
  if (productError || !product?.active) redirect(`/sales/${saleId}?error=product_inactive`);
  if (!isQuantityTextValidForUnit(quantityText, product.unit)) redirect(`/sales/${saleId}?error=validation`);

  const { error: insertError } = await supabase.from("sale_items").insert({
    sale_id: saleId,
    product_id: productId,
    quantity,
    active: true,
  });

  let error = insertError;
  if (insertError?.code === "23505") {
    const { error: updateError } = await supabase
      .from("sale_items")
      .update({ quantity, active: true })
      .eq("sale_id", saleId)
      .eq("product_id", productId);
    error = updateError;
  }

  if (error) redirect(`/sales/${saleId}?error=${errorCode(error)}`);
  revalidatePath(`/sales/${saleId}`);
  redirect(`/sales/${saleId}?success=item_saved`);
}

export async function removeSaleItem(formData: FormData) {
  const { supabase } = await requireActiveProfile();
  const saleId = text(formData.get("sale_id"));
  const itemId = text(formData.get("item_id"));
  if (!saleId || !itemId) redirect("/sales?error=validation");

  const { error } = await supabase
    .from("sale_items")
    .update({ active: false })
    .eq("id", itemId)
    .eq("sale_id", saleId);
  if (error) redirect(`/sales/${saleId}?error=${errorCode(error)}`);

  revalidatePath(`/sales/${saleId}`);
  redirect(`/sales/${saleId}?success=item_removed`);
}

export async function completeSale(formData: FormData) {
  const { supabase } = await requireActiveProfile();
  const saleId = text(formData.get("sale_id"));
  const operationId = text(formData.get("operation_id"));
  if (!saleId || !operationId) redirect(`/sales/${saleId || "unknown"}?error=validation`);

  const { error } = await supabase.rpc("complete_sale", {
    p_sale_id: saleId,
    p_operation_id: operationId,
  });
  if (error) redirect(`/sales/${saleId}?error=${errorCode(error)}`);

  revalidatePath("/");
  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  revalidatePath("/inventory");
  revalidatePath("/history");
  redirect(`/sales/${saleId}?success=completed`);
}

export async function cancelSale(formData: FormData) {
  const { supabase } = await requireActiveProfile();
  const saleId = text(formData.get("sale_id"));
  if (!saleId) redirect("/sales?error=validation");

  const { error } = await supabase.rpc("cancel_sale", { p_sale_id: saleId });
  if (error) redirect(`/sales/${saleId}?error=${errorCode(error)}`);

  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  redirect(`/sales/${saleId}?success=cancelled`);
}
