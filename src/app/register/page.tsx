import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/Button";
import { register } from "./actions";

const messages: Record<string, string> = {
  required: "Preencha nome, e-mail e senha.",
  password_length: "A senha deve ter pelo menos 8 caracteres.",
  password_match: "As senhas não conferem.",
  rate_limit: "Muitas tentativas de cadastro. Tente novamente mais tarde.",
  signup: "Não foi possível enviar o pedido de acesso.",
};

const inputClass = "min-h-12 w-full rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-lowest)] px-3 py-2 text-[var(--color-on-surface)] outline-none transition placeholder:text-[var(--color-outline)] focus:border-[var(--color-primary)]";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error ? messages[error] ?? messages.signup : null;

  return (
    <AuthCard
      title="Solicitar acesso"
      description="Envie seus dados para análise. O cadastro permanece pendente até a aprovação de um administrador."
      footer={<Link className="font-semibold text-[var(--color-primary)] underline underline-offset-4" href="/login">Já tenho acesso</Link>}
    >
      <div className="mb-5 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-low)] p-3 text-sm leading-6 text-[var(--color-on-surface-variant)]">
        Após o envio, você poderá precisar confirmar seu e-mail. O acesso ao estoque só será liberado depois da aprovação administrativa.
      </div>

      {message ? (
        <p className="mb-4 rounded-lg border border-[var(--color-error)]/35 bg-[var(--color-error)]/10 p-3 text-sm leading-6 text-[var(--color-error)]" role="alert">
          {message}
        </p>
      ) : null}

      <form action={register} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--color-on-surface)]">
          <span>Nome</span>
          <input className={inputClass} name="name" autoComplete="name" required />
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--color-on-surface)]">
          <span>E-mail</span>
          <input className={inputClass} type="email" name="email" autoComplete="email" inputMode="email" required />
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--color-on-surface)]">
          <span>Senha</span>
          <input className={inputClass} type="password" name="password" autoComplete="new-password" minLength={8} required />
          <span className="text-xs font-normal text-[var(--color-on-surface-variant)]">Use pelo menos 8 caracteres.</span>
        </label>

        <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--color-on-surface)]">
          <span>Confirmar senha</span>
          <input className={inputClass} type="password" name="password_confirm" autoComplete="new-password" minLength={8} required />
        </label>

        <Button className="mt-1 w-full" type="submit">Enviar pedido de acesso</Button>
      </form>
    </AuthCard>
  );
}
