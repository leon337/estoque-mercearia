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
    // Never log e-mails, passwords or provider response bodies.
    console.warn("auth.signup.failed", { code: error.code, status: error.status });
    const errorCode = (error.code ?? "").toLowerCase();
    const errorMessage = error.message.toLowerCase();

    if (error.status === 429 || errorCode.includes("rate_limit") || errorMessage.includes("rate limit")) {
      redirect("/register?error=rate_limit");
    }

    if (errorCode.includes("email_address_not_authorized") ||
        errorCode.includes("email_provider_disabled") ||
        errorMessage.includes("email address not authorized")) {
      redirect("/register?error=email_unavailable");
    }

    if (errorCode.includes("signup_disabled") || errorMessage.includes("signups not allowed")) {
      redirect("/register?error=signup_disabled");
    }

    redirect("/register?error=signup");
  }

  // The database trigger creates an inactive OPERATOR. Signup is not authorization.
  await supabase.auth.signOut();
  redirect("/login?registered=pending");
}
