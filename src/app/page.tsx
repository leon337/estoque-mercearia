import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
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

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 px-4 py-12 sm:px-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide">M4 · Operação da loja</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Estoque Mercearia</h1>
        <p className="mt-2 text-sm text-neutral-600">Consulte o saldo e registre a movimentação no momento em que ela acontecer.</p>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-lg">Usuário: {profile.name || "Sem nome"}</p>
        <p className="mt-1 text-sm">Perfil: {profile.role}</p>
      </div>

      <nav className="grid gap-3 sm:grid-cols-3" aria-label="Módulos operacionais">
        <Link className="rounded-lg border p-5 font-semibold" href="/inventory">
          Estoque
          <span className="mt-1 block text-sm font-normal text-neutral-600">Ver saldos e situação de cada produto.</span>
        </Link>
        <Link className="rounded-lg bg-black p-5 font-semibold text-white" href="/movements/new">
          Nova movimentação
          <span className="mt-1 block text-sm font-normal text-neutral-300">Registrar entrada ou saída rapidamente.</span>
        </Link>
        <Link className="rounded-lg border p-5 font-semibold" href="/products">
          Produtos
          <span className="mt-1 block text-sm font-normal text-neutral-600">Pesquisar e manter o cadastro mestre.</span>
        </Link>
      </nav>

      <form action={logout}>
        <button className="rounded-md border px-4 py-3 font-semibold" type="submit">Sair</button>
      </form>
    </main>
  );
}