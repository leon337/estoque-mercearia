import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function redirectToLogin(errorCode: "oauth_failed" | "inactive") {
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://estoque-mercearia.onrender.com";
  return NextResponse.redirect(new URL("/login?error=" + errorCode, appUrl));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) return redirectToLogin("oauth_failed");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    await supabase.auth.signOut();
    return redirectToLogin("oauth_failed");
  }

  // A Google account never grants itself inventory access or ADMIN rights.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile?.active) {
    await supabase.auth.signOut();
    return redirectToLogin("inactive");
  }

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://estoque-mercearia.onrender.com";
  return NextResponse.redirect(new URL("/", appUrl));
}
