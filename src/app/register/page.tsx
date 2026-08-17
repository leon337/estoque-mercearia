import Link from "next/link";
import { register } from "./actions";

const messages: Record<string, string> = {
  required: "Preencha nome, e-mail e senha.",
  password_length: "A senha deve ter pelo menos 8 caracteres.",
  password_match: "As senhas não conferem.",
  rate_limit: "Muitas tentativas de cadastro. Tente novamente mais tarde.",
  signup: "Não foi possível enviar o pedido de acesso.",
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error ? messages[error] ?? messages.signup : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide">Estoque Mercearia</p>
        <h1 className="mt-2 text-3xl font-bold">Solicitar acesso</h1>
        <p className="mt-2 text-sm text-neutral-600">O cadastro fica pendente. Aguarde liberação e aprovação de um administrador antes de usar o estoque.</p>
      </div>

      {message ? <p className="rounded-md border p-3 text-sm" role="alert">{message}</p> : null}

      <form action={register} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2"><span>Nome</span><input className="rounded-md border px-3 py-3" name="name" autoComplete="name" required /></label>
        <label className="flex flex-col gap-2"><span>E-mail</span><input className="rounded-md border px-3 py-3" type="email" name="email" autoComplete="email" required /></label>
        <label className="flex flex-col gap-2"><span>Senha</span><input className="rounded-md border px-3 py-3" type="password" name="password" autoComplete="new-password" minLength={8} required /></label>
        <label className="flex flex-col gap-2"><span>Confirmar senha</span><input className="rounded-md border px-3 py-3" type="password" name="password_confirm" autoComplete="new-password" minLength={8} required /></label>
        <button className="rounded-md bg-black px-4 py-3 font-semibold text-white" type="submit">Enviar pedido de acesso</button>
      </form>

      <Link className="text-sm font-semibold underline" href="/login">Já tenho acesso</Link>
    </main>
  );
}