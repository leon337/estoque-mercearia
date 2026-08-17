# Bootstrap do primeiro ADMIN

O fluxo normal de `/register` cria um pedido de acesso como `OPERATOR` **inativo**. Isso é deliberado: nenhum novo cadastro recebe acesso operacional antes de aprovação.

## Quando usar

Este procedimento é necessário **uma única vez**, quando o ambiente ainda não possui nenhum ADMIN ativo. Depois disso, toda ativação e mudança de papel deve ocorrer pela interface `/admin/users`.

## Responsável

Somente o proprietário/owner do projeto Supabase deve executar o bootstrap diretamente no SQL Editor ou por uma conexão administrativa já controlada pelo ambiente. O aplicativo não precisa receber credenciais privilegiadas para isso.

## Procedimento

1. A pessoa que será o primeiro administrador abre `/register` e conclui o cadastro.
2. No Supabase, o proprietário identifica o UUID desse usuário em Authentication > Users ou em `public.profiles`.
3. O proprietário executa **uma vez** a atualização abaixo, substituindo `<USER_UUID>` pelo UUID real:

```sql
update public.profiles
set role = 'ADMIN',
    active = true,
    updated_at = timezone('utc', now())
where id = '<USER_UUID>';
```

4. Confirme que existe exatamente um perfil ADMIN ativo:

```sql
select id, name, role, active
from public.profiles
where role = 'ADMIN' and active = true;
```

5. O administrador já pode entrar no sistema. A partir daqui, pedidos pendentes são aprovados, ativados ou promovidos exclusivamente por `/admin/users`.

## Regras de segurança

- Não coloque chaves administrativas, senhas do banco ou outros segredos no navegador, `.env.example`, Git ou documentação versionada.
- Não use este procedimento para administrar usuários no dia a dia; ele existe apenas para romper o ciclo inicial em um ambiente sem ADMIN.
- O RPC administrativo protege contra desativar ou rebaixar o último ADMIN ativo depois do bootstrap.
- Se o usuário escolhido não estiver mais autorizado a administrar o sistema, primeiro promova outro ADMIN ativo pela aplicação e só então altere o anterior.