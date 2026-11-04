import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { login, loginWithGoogle } from "./actions";

const messages: Record<string, string> = {
  required: "Informe e-mail e senha.",
  invalid: "E-mail ou senha inválidos.",
  unconfirmed: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada e spam.",
  google_unavailable: "O acesso com Google ainda não está habilitado neste ambiente.",
  google_failed: "Não foi possível iniciar o login com Google. Tente novamente.",
  oauth_failed: "Não foi possível concluir o login com Google. Tente novamente.",
  inactive: "Seu acesso ainda não foi liberado ou está inativo.",
  config: "A autenticação ainda não foi configurada neste ambiente.",
};

const inputClass = "min-h-12 w-full rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-lowest)] px-3 py-2 text-[var(--color-on-surface)] outline-none transition placeholder:text-[var(--color-outline)] focus:border-[var(--color-primary)]";

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
          Pedido de acesso recebido. Verifique seu e-mail (inclusive spam) para confirmar a conta e aguarde a aprovação administrativa. Não é necessário enviar outra solicitação.
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
      {process.env.GOOGLE_OAUTH_ENABLED === "true" ? (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-[var(--color-on-surface-variant)]" aria-hidden="true">
            <span className="h-px flex-1 bg-[var(--color-outline-variant)]" />
            <span>ou</span>
            <span className="h-px flex-1 bg-[var(--color-outline-variant)]" />
          </div>
          <form action={loginWithGoogle}>
            <Button type="submit" variant="secondary" className="flex w-full items-center justify-center gap-3" aria-label="Continuar com Google">
              <span aria-hidden="true" className="font-bold text-lg">G</span>
              Continuar com Google
            </Button>
          </form>
        </>
      ) : null}
    </AuthCard>
  );
}
