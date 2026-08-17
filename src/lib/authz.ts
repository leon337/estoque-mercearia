import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireActiveProfile() {
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

  return { supabase, userId, profile };
}

export async function requireAdminUser() {
  const context = await requireActiveProfile();

  if (context.profile.role !== "ADMIN") {
    redirect("/products?error=permission");
  }

  return context;
}
