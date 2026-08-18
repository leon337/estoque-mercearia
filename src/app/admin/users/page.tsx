import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { DataCard } from "@/components/ui/DataCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

const controlClass =
  "mt-1 min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2 font-normal text-[var(--color-on-surface)] focus:border-[var(--color-primary)]";
const secondaryLinkClass =
  "inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-lowest)] px-4 py-2 font-semibold text-[var(--color-primary)]";

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
    <AppShell role={currentProfile.role}>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Usuários e permissões"
          subtitle="Cadastros novos aparecem como OPERATOR inativo até aprovação."
          actions={(
            <div className="flex flex-wrap gap-2">
              <Link className={secondaryLinkClass} href="/">Painel</Link>
              <Link className={secondaryLinkClass} href="/register">Abrir cadastro</Link>
            </div>
          )}
        />

        {params.error ? (
          <p
            className="mt-5 rounded-lg border border-[var(--color-error)] bg-[var(--color-surface-lowest)] px-4 py-3 text-sm text-[var(--color-error)]"
            role="alert"
          >
            {errorMessages[params.error] ?? errorMessages.database}
          </p>
        ) : null}
        {params.success === "updated" ? (
          <p
            className="mt-5 rounded-lg border border-[var(--color-status-success)] bg-[var(--color-surface-lowest)] px-4 py-3 text-sm"
            role="status"
          >
            Perfil atualizado.
          </p>
        ) : null}

        <section className="mt-6 space-y-3" aria-label="Perfis cadastrados">
          {(profiles ?? []).map((profile) => (
            <DataCard key={profile.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-semibold">{profile.name || "Sem nome"}</h2>
                  <p className="font-data mt-1 break-all text-xs text-[var(--color-on-surface-variant)]">{profile.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone={profile.active ? "success" : "neutral"}>{profile.active ? "Ativo" : "Inativo"}</StatusBadge>
                  <StatusBadge>{profile.role}</StatusBadge>
                </div>
              </div>

              <form action={updateProfileAction} className="mt-4 grid gap-3 border-t border-[var(--color-border-subtle)] pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <input type="hidden" name="user_id" value={profile.id} />
                <label className="text-sm font-semibold">
                  Papel
                  <select className={controlClass} name="role" defaultValue={profile.role}>
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  Status
                  <select className={controlClass} name="active" defaultValue={String(profile.active)}>
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </label>
                <Button type="submit">Salvar</Button>
              </form>
            </DataCard>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
