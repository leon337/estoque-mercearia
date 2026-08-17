"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProductInput = {
  internal_code: string;
  barcode: string | null;
  name: string;
  category_id: string | null;
  unit: string;
  minimum_stock: number;
};

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function requireAdmin() {
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

  if (profileError || !profile?.active || profile.role !== "ADMIN") {
    redirect("/products?error=permission");
  }

  return supabase;
}

function parseProductInput(formData: FormData): ProductInput | null {
  const internalCode = readText(formData, "internal_code");
  const barcodeRaw = readText(formData, "barcode");
  const name = readText(formData, "name");
  const categoryRaw = readText(formData, "category_id");
  const unit = readText(formData, "unit").toUpperCase();
  const minimumStock = Number(readText(formData, "minimum_stock") || "0");

  if (
    !internalCode ||
    !name ||
    !unit ||
    !Number.isFinite(minimumStock) ||
    minimumStock < 0
  ) {
    return null;
  }

  const barcode = barcodeRaw ? barcodeRaw : null;

  return {
    internal_code: internalCode,
    barcode,
    name,
    category_id: categoryRaw || null,
    unit,
    minimum_stock: minimumStock,
  };
}

function databaseErrorCode(code: string | undefined) {
  return code === "23505" ? "duplicate" : "database";
}

export async function createCategory(formData: FormData) {
  const supabase = await requireAdmin();
  const name = readText(formData, "category_name");

  if (!name) {
    redirect("/products?error=category_validation");
  }

  const { error } = await supabase.from("categories").insert({ name, active: true });

  if (error) {
    redirect(`/products?error=category_${databaseErrorCode(error.code)}`);
  }

  revalidatePath("/products");
  revalidatePath("/products/new");
  redirect("/products?success=category_created");
}

export async function toggleCategoryActive(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readText(formData, "id");
  const nextActive = readText(formData, "next_active") === "true";

  if (!id) {
    redirect("/products?error=category_validation");
  }

  const { error } = await supabase
    .from("categories")
    .update({ active: nextActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect("/products?error=category_database");
  }

  revalidatePath("/products");
  revalidatePath("/products/new");
  redirect("/products?success=category_updated");
}

export async function createProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const input = parseProductInput(formData);

  if (!input) {
    redirect("/products/new?error=validation");
  }

  const { error } = await supabase.from("products").insert({ ...input, active: true });

  if (error) {
    redirect(`/products/new?error=${databaseErrorCode(error.code)}`);
  }

  revalidatePath("/products");
  redirect("/products?success=created");
}

export async function updateProduct(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readText(formData, "id");
  const input = parseProductInput(formData);

  if (!id || !input) {
    redirect(id ? `/products/${id}/edit?error=validation` : "/products?error=validation");
  }

  const { error } = await supabase
    .from("products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`/products/${id}/edit?error=${databaseErrorCode(error.code)}`);
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}/edit`);
  redirect("/products?success=updated");
}

export async function toggleProductActive(formData: FormData) {
  const supabase = await requireAdmin();
  const id = readText(formData, "id");
  const nextActive = readText(formData, "next_active") === "true";

  if (!id) {
    redirect("/products?error=validation");
  }

  const { error } = await supabase
    .from("products")
    .update({ active: nextActive, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect("/products?error=database");
  }

  revalidatePath("/products");
  redirect(`/products?success=${nextActive ? "activated" : "deactivated"}`);
}
