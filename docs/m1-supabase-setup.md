# M1 — configuração Supabase

O código do M1 usa Supabase Auth SSR e a migration `supabase/migrations/0001_auth_profiles.sql`.

## Variáveis necessárias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use somente a chave publicável no navegador. Credenciais administrativas não devem ser versionadas nem expostas ao cliente.

## Projeto de integração

O projeto Supabase dedicado do M1 foi criado na região `sa-east-1` e recebeu a migration base. O repositório não versiona chaves de ambiente.

## Bootstrap do primeiro ADMIN

Novos usuários são criados como `OPERATOR` por segurança. Depois de criar o usuário que será o proprietário, promova-o administrativamente no banco:

```sql
update public.profiles
set role = 'ADMIN'::public.app_role
where id = '<UUID_DO_PROPRIETARIO>';
```

Esse procedimento é de bootstrap. O gerenciamento de usuários pela interface pertence a milestone posterior.

## Validação

Já validado no projeto dedicado:
- aplicação da migration;
- RLS em `public.profiles`;
- usuário novo iniciando como `OPERATOR`;
- `OPERATOR` lendo apenas o próprio perfil;
- `ADMIN` lendo todos os perfis;
- funções privilegiadas em schema `private`;
- Security Advisor sem lints;
- remoção dos fixtures de teste.

Ainda pendente antes do aceite completo do M1:
- smoke HTTP/SDK de sessão por e-mail/senha;
- fluxo completo de login Next.js contra o projeto vivo.
