"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/authz";
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
  if (error?.code === "23505") return "duplicate";
  if (error?.code === "42501" || message.includes("ADMIN_REQUIRED")) return "permission";
  if (message.includes("PURCHASE_ORDER_NOT_DRAFT")) return "not_draft";
  if (message.includes("PURCHASE_ORDER_EMPTY")) return "empty";
  if (message.includes("PURCHASE_ORDER_NOT_RECEIVABLE")) return "not_receivable";
  if (message.includes("PURCHASE_ORDER_CANNOT_CANCEL") || message.includes("PURCHASE_ORDER_HAS_RECEIPTS")) return "cannot_cancel";
  if (message.includes("SUPPLIER_INACTIVE")) return "supplier_inactive";
  if (message.includes("PRODUCT_INACTIVE_OR_MISSING")) return "product_inactive";
  if (message.includes("PRODUCT_NOT_LINKED_TO_SUPPLIER")) return "not_linked";
  if (message.includes("RECEIPT_QUANTITY_EXCEEDS_ORDERED")) return "exceeds_ordered";
  if (message.includes("INVALID_QUANTITY") || message.includes("INVALID_QUANTITY_PRECISION") || message.includes("INVALID_RECEIPT_INPUT")) return "validation";
  if (message.includes("IDEMPOTENCY_CONFLICT")) return "operation_conflict";
  return "database";
}

export async function createPurchaseOrder(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const supplier_id = text(formData.get("supplier_id"));
  const notes = optional(formData.get("notes"));
  if (!supplier_id || (notes && notes.length > 2000)) redirect("/purchases/new?error=validation");

  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .select("id, active")
    .eq("id", supplier_id)
    .single();
  if (supplierError || !supplier?.active) redirect("/purchases/new?error=supplier_inactive");

  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({ supplier_id, notes })
    .select("id")
    .single();
  if (error || !data?.id) redirect(`/purchases/new?error=${errorCode(error)}`);

  revalidatePath("/purchases");
  redirect(`/purchases/${data.id}?success=created`);
}

export async function addPurchaseOrderItem(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const orderId = text(formData.get("purchase_order_id"));
  const productId = text(formData.get("product_id"));
  const quantityText = text(formData.get("quantity"));
  const quantity = Number(quantityText.replace(",", "."));
  if (!orderId || !productId || !Number.isFinite(quantity) || quantity <= 0) {
    redirect(`/purchases/${orderId || "unknown"}?error=validation`);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("unit, active")
    .eq("id", productId)
    .single();
  if (productError || !product?.active) redirect(`/purchases/${orderId}?error=product_inactive`);
  if (!isQuantityTextValidForUnit(quantityText, product.unit)) redirect(`/purchases/${orderId}?error=validation`);

  const { error: insertError } = await supabase.from("purchase_order_items").insert({
    purchase_order_id: orderId,
    product_id: productId,
    ordered_quantity: quantity,
    active: true,
  });

  let error = insertError;
  if (insertError?.code === "23505") {
    const { error: updateError } = await supabase
      .from("purchase_order_items")
      .update({ ordered_quantity: quantity, active: true })
      .eq("purchase_order_id", orderId)
      .eq("product_id", productId);
    error = updateError;
  }

  if (error) redirect(`/purchases/${orderId}?error=${errorCode(error)}`);

  revalidatePath(`/purchases/${orderId}`);
  redirect(`/purchases/${orderId}?success=item_saved`);
}

export async function removePurchaseOrderItem(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const orderId = text(formData.get("purchase_order_id"));
  const itemId = text(formData.get("item_id"));
  if (!orderId || !itemId) redirect("/purchases?error=validation");

  const { error } = await supabase
    .from("purchase_order_items")
    .update({ active: false })
    .eq("id", itemId)
    .eq("purchase_order_id", orderId);
  if (error) redirect(`/purchases/${orderId}?error=${errorCode(error)}`);

  revalidatePath(`/purchases/${orderId}`);
  redirect(`/purchases/${orderId}?success=item_removed`);
}

export async function markPurchaseOrderOrdered(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const orderId = text(formData.get("purchase_order_id"));
  if (!orderId) redirect("/purchases?error=validation");

  const { error } = await supabase.rpc("mark_purchase_order_ordered", { p_order_id: orderId });
  if (error) redirect(`/purchases/${orderId}?error=${errorCode(error)}`);

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${orderId}`);
  redirect(`/purchases/${orderId}?success=ordered`);
}

export async function cancelPurchaseOrder(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const orderId = text(formData.get("purchase_order_id"));
  if (!orderId) redirect("/purchases?error=validation");

  const { error } = await supabase.rpc("cancel_purchase_order", { p_order_id: orderId });
  if (error) redirect(`/purchases/${orderId}?error=${errorCode(error)}`);

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${orderId}`);
  redirect(`/purchases/${orderId}?success=cancelled`);
}

export async function receivePurchaseOrder(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const orderId = text(formData.get("purchase_order_id"));
  const itemId = text(formData.get("purchase_order_item_id"));
  const operationId = text(formData.get("operation_id"));
  const stockOperationId = text(formData.get("stock_operation_id"));
  const quantityText = text(formData.get("quantity"));
  const quantity = Number(quantityText.replace(",", "."));
  if (!orderId || !itemId || !operationId || !stockOperationId || !Number.isFinite(quantity) || quantity <= 0) {
    redirect(`/purchases/${orderId || "unknown"}?error=validation`);
  }

  const { data: item, error: itemError } = await supabase
    .from("purchase_order_items")
    .select("product_id")
    .eq("id", itemId)
    .eq("purchase_order_id", orderId)
    .single();
  if (itemError || !item) redirect(`/purchases/${orderId}?error=validation`);

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("unit, active")
    .eq("id", item.product_id)
    .single();
  if (productError || !product?.active) redirect(`/purchases/${orderId}?error=product_inactive`);
  if (!isQuantityTextValidForUnit(quantityText, product.unit)) redirect(`/purchases/${orderId}?error=validation`);

  const { error } = await supabase.rpc("receive_purchase_order", {
    p_order_id: orderId,
    p_operation_id: operationId,
    p_items: [{ purchase_order_item_id: itemId, quantity, stock_operation_id: stockOperationId }],
  });
  if (error) redirect(`/purchases/${orderId}?error=${errorCode(error)}`);

  revalidatePath("/");
  revalidatePath("/inventory");
  revalidatePath("/history");
  revalidatePath("/purchases");
  revalidatePath(`/purchases/${orderId}`);
  redirect(`/purchases/${orderId}?success=received`);
}
