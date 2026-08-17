import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, role, active")
    .eq("id", claimsData.claims.sub)
    .single();

  if (profileError || !profile?.active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide">M1 · Auth + Banco Base</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Estoque Mercearia</h1>
      </div>
      <p className="text-lg">Usuário: {profile.name || "Sem nome"}</p>
      <p className="text-lg">Perfil: {profile.role}</p>
      <p className="text-sm">A próxima etapa adicionará o cadastro de produtos.</p>
      <form action={logout}>
        <button className="rounded-md border px-4 py-3 font-semibold" type="submit">
          Sair
        </button>
      </form>
    </main>
  );
}
