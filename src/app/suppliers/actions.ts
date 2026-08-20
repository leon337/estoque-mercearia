"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/authz";

function text(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function optional(value: FormDataEntryValue | null) {
  const normalized = text(value);
  return normalized || null;
}

function checked(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function supplierPayload(formData: FormData) {
  const name = text(formData.get("name"));
  const tax_id = optional(formData.get("tax_id"));
  const email = optional(formData.get("email"));
  const phone = optional(formData.get("phone"));
  const notes = optional(formData.get("notes"));

  if (name.length < 2 || name.length > 160) return null;
  if (tax_id && (tax_id.length < 3 || tax_id.length > 40)) return null;
  if (email && email.length > 254) return null;
  if (phone && phone.length > 40) return null;
  if (notes && notes.length > 2000) return null;

  return { name, tax_id, email, phone, notes };
}

function supplierError(error: { code?: string } | null) {
  if (error?.code === "23505") return "duplicate";
  if (error?.code === "42501") return "permission";
  return "database";
}

export async function createSupplier(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const payload = supplierPayload(formData);
  if (!payload) redirect("/suppliers/new?error=validation");

  const { error } = await supabase.from("suppliers").insert(payload);
  if (error) redirect(`/suppliers/new?error=${supplierError(error)}`);

  revalidatePath("/suppliers");
  redirect("/suppliers?success=created");
}

export async function updateSupplier(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const id = text(formData.get("id"));
  const payload = supplierPayload(formData);
  if (!id || !payload) redirect(`/suppliers/${id || "unknown"}/edit?error=validation`);

  const { error } = await supabase.from("suppliers").update(payload).eq("id", id);
  if (error) redirect(`/suppliers/${id}/edit?error=${supplierError(error)}`);

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}/edit`);
  redirect("/suppliers?success=updated");
}

export async function toggleSupplierActive(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const id = text(formData.get("id"));
  const nextActive = text(formData.get("next_active")) === "true";
  if (!id) redirect("/suppliers?error=validation");

  const { error } = await supabase.from("suppliers").update({ active: nextActive }).eq("id", id);
  if (error) redirect(`/suppliers?error=${supplierError(error)}`);

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}/edit`);
  redirect(`/suppliers?success=${nextActive ? "activated" : "deactivated"}`);
}

export async function upsertProductSupplier(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const supplier_id = text(formData.get("supplier_id"));
  const product_id = text(formData.get("product_id"));
  const supplier_code = optional(formData.get("supplier_code"));
  const preferred = checked(formData.get("preferred"));
  if (!supplier_id || !product_id || (supplier_code && supplier_code.length > 80)) {
    redirect(`/suppliers/${supplier_id || "unknown"}/edit?error=validation`);
  }

  const [{ data: supplier, error: supplierQueryError }, { data: product, error: productQueryError }] = await Promise.all([
    supabase.from("suppliers").select("id, active").eq("id", supplier_id).single(),
    supabase.from("products").select("id, active").eq("id", product_id).single(),
  ]);

  if (supplierQueryError || !supplier || !supplier.active) {
    redirect(`/suppliers/${supplier_id}/edit?error=supplier_inactive`);
  }
  if (productQueryError || !product || !product.active) {
    redirect(`/suppliers/${supplier_id}/edit?error=product_inactive`);
  }

  const { error } = await supabase.from("product_suppliers").upsert(
    { supplier_id, product_id, supplier_code, preferred, active: true },
    { onConflict: "product_id,supplier_id" },
  );
  if (error) redirect(`/suppliers/${supplier_id}/edit?error=${supplierError(error)}`);

  revalidatePath(`/suppliers/${supplier_id}/edit`);
  redirect(`/suppliers/${supplier_id}/edit?success=link_saved`);
}

export async function toggleProductSupplierActive(formData: FormData) {
  const { supabase } = await requireAdminUser();
  const id = text(formData.get("id"));
  const supplierId = text(formData.get("supplier_id"));
  const nextActive = text(formData.get("next_active")) === "true";
  if (!id || !supplierId) redirect("/suppliers?error=validation");

  if (nextActive) {
    const { data: link, error: linkError } = await supabase
      .from("product_suppliers")
      .select("product_id, supplier_id")
      .eq("id", id)
      .single();
    if (linkError || !link) redirect(`/suppliers/${supplierId}/edit?error=database`);

    const [{ data: supplier }, { data: product }] = await Promise.all([
      supabase.from("suppliers").select("active").eq("id", link.supplier_id).single(),
      supabase.from("products").select("active").eq("id", link.product_id).single(),
    ]);
    if (!supplier?.active) redirect(`/suppliers/${supplierId}/edit?error=supplier_inactive`);
    if (!product?.active) redirect(`/suppliers/${supplierId}/edit?error=product_inactive`);
  }

  const patch = nextActive ? { active: true } : { active: false, preferred: false };
  const { error } = await supabase.from("product_suppliers").update(patch).eq("id", id);
  if (error) redirect(`/suppliers/${supplierId}/edit?error=${supplierError(error)}`);

  revalidatePath(`/suppliers/${supplierId}/edit`);
  redirect(`/suppliers/${supplierId}/edit?success=${nextActive ? "link_activated" : "link_deactivated"}`);
}
