# M1 — configuração Supabase

O código do M1 usa Supabase Auth SSR e a migration `supabase/migrations/0001_auth_profiles.sql`.

## Variáveis necessárias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use somente a chave publicável no navegador. Credenciais administrativas não devem ser versionadas nem expostas ao cliente.

## Bootstrap do primeiro ADMIN

Novos usuários são criados como `OPERATOR` por segurança. Depois de criar o usuário que será o proprietário, promova-o administrativamente no banco:

```sql
update public.profiles
set role = 'ADMIN'::public.app_role
where id = '<UUID_DO_PROPRIETARIO>';
```

Esse procedimento é de bootstrap. O gerenciamento de usuários pela interface pertence a milestone posterior.

## Validação pendente

A migration e o login precisam ser aplicados/testados em um projeto Supabase dedicado à mercearia antes de o M1 receber aceite completo de integração.
