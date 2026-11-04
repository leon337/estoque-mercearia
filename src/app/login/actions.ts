"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
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

  if (error?.code === "email_not_confirmed") {
    redirect("/login?error=unconfirmed");
  }

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

export async function loginWithGoogle() {
  // Fail closed until the Google Cloud OAuth client is configured on Supabase.
  if (process.env.GOOGLE_OAUTH_ENABLED !== "true") {
    redirect("/login?error=google_unavailable");
  }

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://estoque-mercearia.onrender.com";
  const redirectTo = new URL("/auth/callback", appUrl).toString();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google_failed");
  }

  redirect(data.url as Route);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
