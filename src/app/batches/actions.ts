"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/authz";
import { isQuantityTextValidForUnit } from "@/modules/inventory/quantity-policy.mjs";

function text(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function errorCode(error: { code?: string; message?: string } | null) {
  const message = String(error?.message ?? "");
  if (error?.code === "23505") return "duplicate";
  if (error?.code === "42501" || message.includes("ADMIN_REQUIRED")) return "permission";
  if (message.includes("BATCH_QUANTITY_EXCEEDS_RECEIPT")) return "exceeds_receipt";
  if (message.includes("INVALID_QUANTITY_PRECISION")) return "precision";
  if (message.includes("BATCH_RECEIPT_ITEM_NOT_FOUND")) return "receipt_item";
  return "database";
}

export async function createReceiptBatch(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const receiptItemId = text(formData.get("purchase_receipt_item_id"));
  const lotCode = text(formData.get("lot_code"));
  const expiresOn = text(formData.get("expires_on")) || null;
  const quantityText = text(formData.get("quantity"));
  const quantity = Number(quantityText.replace(",", "."));

  if (!receiptItemId || !lotCode || lotCode.length > 100 || !Number.isFinite(quantity) || quantity <= 0) {
    redirect("/batches/new?error=validation");
  }

  const { data: receiptItem, error: receiptError } = await supabase
    .from("purchase_receipt_items")
    .select("purchase_order_item_id")
    .eq("id", receiptItemId)
    .single();
  if (receiptError || !receiptItem) redirect("/batches/new?error=receipt_item");

  const { data: orderItem, error: orderItemError } = await supabase
    .from("purchase_order_items")
    .select("product_id")
    .eq("id", receiptItem.purchase_order_item_id)
    .single();
  if (orderItemError || !orderItem) redirect("/batches/new?error=receipt_item");

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("unit")
    .eq("id", orderItem.product_id)
    .single();
  if (productError || !product || !isQuantityTextValidForUnit(quantityText, product.unit)) {
    redirect("/batches/new?error=precision");
  }

  const { error } = await supabase.from("receipt_batches").insert({
    purchase_receipt_item_id: receiptItemId,
    lot_code: lotCode,
    expires_on: expiresOn,
    quantity,
    active: true,
  });
  if (error) redirect(`/batches/new?error=${errorCode(error)}`);

  revalidatePath("/batches");
  revalidatePath("/alerts");
  redirect("/batches?success=created");
}

export async function setReceiptBatchActive(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const batchId = text(formData.get("batch_id"));
  const active = text(formData.get("active")) === "true";
  if (!batchId) redirect("/batches?error=validation");

  const { error } = await supabase.from("receipt_batches").update({ active }).eq("id", batchId);
  if (error) redirect(`/batches?error=${errorCode(error)}`);

  revalidatePath("/batches");
  revalidatePath("/alerts");
  redirect(`/batches?success=${active ? "activated" : "inactivated"}`);
}
