import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { login } from "./actions";

const messages: Record<string, string> = {
  required: "Informe e-mail e senha.",
  invalid: "E-mail ou senha inválidos.",
  inactive: "Seu acesso ainda não foi liberado ou está inativo.",
  config: "A autenticação ainda não foi configurada neste ambiente.",
};

const inputClass = "min-h-12 w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-lowest)] px-3 py-2 text-[var(--color-on-surface)] outline-none transition placeholder:text-[var(--color-outline)] focus:border-[var(--color-primary)]";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; registered?: string }> }) {
  const { error, registered } = await searchParams;
  const message = error ? messages[error] : null;

  return (
    <AuthCard
      title="Entrar"
      description="Use sua conta autorizada para acessar o controle de estoque."
      footer={<>Ainda não tem acesso? <Link className="font-semibold text-[var(--color-primary)] underline underline-offset-4" href="/register">Solicitar acesso</Link></>}
    >
      {registered === "pending" ? (
        <p className="mb-4 rounded-lg border border-[var(--color-status-success)]/35 bg-[var(--color-status-success)]/10 p-3 text-sm leading-6 text-[var(--color-on-surface)]" role="status" aria-live="polite">
          Pedido recebido. Confirme seu e-mail se solicitado e aguarde a aprovação de um administrador.
        </p>
      ) : null}

      {message ? (
        <p role="alert" className="mb-4 rounded-lg border border-[var(--color-error)]/35 bg-[var(--color-error)]/10 p-3 text-sm leading-6 text-[var(--color-error)]">
          {message}
        </p>
      ) : null}

      <form action={login} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--color-on-surface)]">
          <span>E-mail</span>
          <input className={inputClass} type="email" name="email" autoComplete="email" inputMode="email" required />
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--color-on-surface)]">
          <span>Senha</span>
          <input className={inputClass} type="password" name="password" autoComplete="current-password" required />
        </label>

        <Button className="mt-1 w-full" type="submit">Entrar</Button>
      </form>
    </AuthCard>
  );
}
