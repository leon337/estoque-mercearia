# PHASE-06 / M1 — PLAN

## Objetivo
Implementar a base de autenticação e autorização do MVP: Supabase Auth SSR, `profiles`, roles `ADMIN/OPERATOR`, RLS inicial e login/logout.

## Escopo
- clientes Supabase browser/server;
- proxy de renovação/proteção de sessão;
- login/logout;
- tabela `public.profiles`;
- role padrão `OPERATOR`;
- leitura do próprio perfil e leitura administrativa;
- funções privilegiadas fora do schema exposto;
- testes RED→GREEN e CI.

## Fora de escopo
Produtos, estoque, movimentações, gestão completa de usuários, deploy público e dados reais da loja.

## Aceite
- lint, testes, typecheck e build verdes;
- usuário não pode escolher `ADMIN` no cadastro;
- leitura de perfil sempre escopada ao usuário atual;
- RLS habilitado;
- função de autorização `SECURITY DEFINER` fora de `public`;
- validação real da migration e Auth em projeto Supabase dedicado.

## Riscos
Escalada de privilégio, consulta ambígua de perfil de ADMIN, exposição de funções privilegiadas e validação apenas estática sem banco real.

## Agentes
MESTRE, Rafael, Renato, Ricardo, Augusto, Carmem, Gabriel e Emily.

## Autorizações
SCOPED_WRITE em `feature/m1-auth-base`. Sem merge/publicação sem gate.
