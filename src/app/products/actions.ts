"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isQuantityTextValidForUnit } from "@/modules/inventory/quantity-policy.mjs";

type ProductInput = {
  internal_code: string;
  barcode: string | null;
  name: string;
  category_id: string | null;
  unit: string;
  minimum_stock: number;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type DatabaseError = {
  code?: string;
  message?: string;
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
  const minimumStockText = readText(formData, "minimum_stock") || "0";
  const minimumStock = Number(minimumStockText.replace(",", "."));

  if (
    !internalCode ||
    !name ||
    !unit ||
    !Number.isFinite(minimumStock) ||
    minimumStock < 0 ||
    !isQuantityTextValidForUnit(minimumStockText, unit)
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

async function ensureActiveCategory(
  supabase: SupabaseServerClient,
  categoryId: string | null,
) {
  if (!categoryId) {
    return true;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("active", true)
    .maybeSingle();

  return !error && Boolean(data);
}

function databaseErrorCode(code: string | undefined) {
  return code === "23505" ? "duplicate" : "database";
}

function productDatabaseErrorCode(error: DatabaseError) {
  if (error.message?.includes("INVALID_MINIMUM_STOCK_PRECISION")) {
    return "validation";
  }
  return databaseErrorCode(error.code);
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

  if (!nextActive) {
    const { data: activeProduct, error: usageError } = await supabase
      .from("products")
      .select("id")
      .eq("category_id", id)
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    if (usageError) {
      redirect("/products?error=category_database");
    }

    if (activeProduct) {
      redirect("/products?error=category_in_use");
    }
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

  if (!(await ensureActiveCategory(supabase, input.category_id))) {
    redirect("/products/new?error=category_inactive");
  }

  const { error } = await supabase.from("products").insert({ ...input, active: true });

  if (error) {
    redirect(`/products/new?error=${productDatabaseErrorCode(error)}`);
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

  if (!(await ensureActiveCategory(supabase, input.category_id))) {
    redirect(`/products/${id}/edit?error=category_inactive`);
  }

  const { error } = await supabase
    .from("products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    redirect(`/products/${id}/edit?error=${productDatabaseErrorCode(error)}`);
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

  if (nextActive) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("category_id")
      .eq("id", id)
      .maybeSingle();

    if (productError) {
      redirect("/products?error=database");
    }

    if (!product) {
      redirect("/products?error=validation");
    }

    if (!(await ensureActiveCategory(supabase, product.category_id))) {
      redirect("/products?error=category_inactive");
    }
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
