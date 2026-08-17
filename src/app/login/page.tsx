import Link from "next/link";
import { login } from "./actions";

const messages: Record<string, string> = {
  required: "Informe e-mail e senha.",
  invalid: "E-mail ou senha inválidos.",
  inactive: "Seu acesso ainda não foi liberado ou está inativo.",
  config: "A autenticação ainda não foi configurada neste ambiente.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; registered?: string }> }) {
  const { error, registered } = await searchParams;
  const message = error ? messages[error] : null;

  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
    <div><p className="text-sm font-semibold uppercase tracking-wide">Estoque Mercearia</p><h1 className="mt-2 text-3xl font-bold">Entrar</h1></div>
    {registered === "pending" ? <p className="rounded-md border p-3 text-sm" role="status">Pedido recebido. Confirme seu e-mail se solicitado e aguarde a aprovação de um administrador.</p> : null}
    {message ? <p role="alert" className="rounded-md border p-3 text-sm">{message}</p> : null}
    <form action={login} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2"><span>E-mail</span><input className="rounded-md border px-3 py-3" type="email" name="email" autoComplete="email" required /></label>
      <label className="flex flex-col gap-2"><span>Senha</span><input className="rounded-md border px-3 py-3" type="password" name="password" autoComplete="current-password" required /></label>
      <button className="rounded-md bg-black px-4 py-3 font-semibold text-white" type="submit">Entrar</button>
    </form>
    <p className="text-sm text-neutral-600">Ainda não tem acesso? <Link className="font-semibold underline" href="/register">Solicitar acesso</Link></p>
  </main>;
}