import Link from "next/link";
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
        <p className="text-sm font-semibold uppercase tracking-wide">M2 · Produtos</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Estoque Mercearia</h1>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-lg">Usuário: {profile.name || "Sem nome"}</p>
        <p className="mt-1 text-sm">Perfil: {profile.role}</p>
      </div>
      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Módulos">
        <Link className="rounded-lg border p-5 font-semibold" href="/products">
          Produtos
          <span className="mt-1 block text-sm font-normal text-neutral-600">Cadastrar, pesquisar e manter produtos.</span>
        </Link>
        <div className="rounded-lg border border-dashed p-5 text-neutral-500">
          Estoque
          <span className="mt-1 block text-sm">Será habilitado no próximo milestone.</span>
        </div>
      </nav>
      <form action={logout}>
        <button className="rounded-md border px-4 py-3 font-semibold" type="submit">Sair</button>
      </form>
    </main>
  );
}
