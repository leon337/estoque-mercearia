import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfileAction } from "./actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  validation: "Dados de usuário inválidos.",
  last_admin: "Não é permitido remover ou desativar o último ADMIN ativo.",
  permission: "Somente ADMIN ativo pode gerenciar usuários.",
  not_found: "Perfil não encontrado.",
  database: "Não foi possível atualizar o perfil.",
};

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) redirect("/login");

  const { data: currentProfile, error: currentProfileError } = await supabase.from("profiles").select("role, active").eq("id", userId).single();
  if (currentProfileError || !currentProfile?.active || currentProfile.role !== "ADMIN") redirect("/");

  const { data: profiles, error } = await supabase.from("profiles").select("id, name, role, active, created_at").order("created_at");
  if (error) throw new Error("Não foi possível carregar usuários.");

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-wide">M6 · Administração</p><h1 className="mt-1 text-3xl font-bold">Usuários e permissões</h1><p className="mt-2 text-sm text-neutral-600">Cadastros novos aparecem como OPERATOR inativo até aprovação.</p></div>
        <div className="flex gap-2"><Link className="rounded-md border px-4 py-3 font-semibold" href="/">Dashboard</Link><Link className="rounded-md border px-4 py-3 font-semibold" href="/register">Abrir cadastro</Link></div>
      </header>

      {params.error ? <p className="mt-5 rounded-md border p-3" role="alert">{errorMessages[params.error] ?? errorMessages.database}</p> : null}
      {params.success === "updated" ? <p className="mt-5 rounded-md border p-3" role="status">Perfil atualizado.</p> : null}

      <section className="mt-6 space-y-3" aria-label="Perfis cadastrados">
        {(profiles ?? []).map((profile) => (
          <article className="rounded-lg border p-4" key={profile.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="font-semibold">{profile.name || "Sem nome"}</h2><p className="text-sm text-neutral-600">{profile.id}</p></div>
              <span className="rounded-full border px-3 py-1 text-xs font-bold">{profile.active ? "Ativo" : "Inativo"}</span>
            </div>
            <form action={updateProfileAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <input type="hidden" name="user_id" value={profile.id} />
              <label className="text-sm font-semibold">Papel
                <select className="mt-1 w-full rounded-md border px-3 py-2 font-normal" name="role" defaultValue={profile.role}>
                  <option value="OPERATOR">OPERATOR</option><option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <label className="text-sm font-semibold">Status
                <select className="mt-1 w-full rounded-md border px-3 py-2 font-normal" name="active" defaultValue={String(profile.active)}>
                  <option value="true">Ativo</option><option value="false">Inativo</option>
                </select>
              </label>
              <button className="rounded-md bg-black px-4 py-2 font-semibold text-white" type="submit">Salvar</button>
            </form>
          </article>
        ))}
      </section>
    </main>
  );
}