"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (!userId || (role !== "ADMIN" && role !== "OPERATOR")) {
    redirect("/admin/users?error=validation");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_profile", {
    p_user_id: userId,
    p_role: role,
    p_active: active,
  });

  if (error) {
    const message = error.message ?? "";
    const code = message.includes("LAST_ACTIVE_ADMIN")
      ? "last_admin"
      : message.includes("ADMIN_REQUIRED")
        ? "permission"
        : message.includes("PROFILE_NOT_FOUND")
          ? "not_found"
          : "database";
    redirect(`/admin/users?error=${code}`);
  }

  revalidatePath("/admin/users");
  revalidatePath("/");
  redirect("/admin/users?success=updated");
}