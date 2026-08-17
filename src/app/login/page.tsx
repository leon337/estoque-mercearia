import { login } from "./actions";

const messages: Record<string, string> = {
  required: "Informe e-mail e senha.",
  invalid: "E-mail ou senha inválidos.",
  inactive: "Este usuário está inativo.",
  config: "A autenticação ainda não foi configurada neste ambiente.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? messages[error] : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide">Estoque Mercearia</p>
        <h1 className="mt-2 text-3xl font-bold">Entrar</h1>
      </div>

      {message ? (
        <p role="alert" className="rounded-md border p-3 text-sm">
          {message}
        </p>
      ) : null}

      <form action={login} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span>E-mail</span>
          <input
            className="rounded-md border px-3 py-3"
            type="email"
            name="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span>Senha</span>
          <input
            className="rounded-md border px-3 py-3"
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>

        <button className="rounded-md border px-4 py-3 font-semibold" type="submit">
          Entrar
        </button>
      </form>
    </main>
  );
}
