"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function register(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");

  if (!name || !email || !password) redirect("/register?error=required");
  if (password.length < 8) redirect("/register?error=password_length");
  if (password !== passwordConfirm) redirect("/register?error=password_match");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    const code = error.message.toLowerCase().includes("rate") ? "rate_limit" : "signup";
    redirect(`/register?error=${code}`);
  }

  await supabase.auth.signOut();
  redirect("/login?registered=pending");
}