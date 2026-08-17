"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=required");
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !signInData.user) {
    redirect("/login?error=invalid");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active")
    .eq("id", signInData.user.id)
    .single();

  if (profileError || !profile?.active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
