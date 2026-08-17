# PHASE-06 / M1 — PLAN

## Objetivo
Implementar e validar a base de autenticação e autorização do MVP: Supabase Auth SSR, `profiles`, roles `ADMIN/OPERATOR`, RLS inicial e login/logout.

## Escopo
- clientes Supabase browser/server com SSR;
- proxy de renovação/proteção de sessão;
- login/logout por e-mail e senha;
- tabela `public.profiles` ligada 1:1 a `auth.users`;
- role padrão `OPERATOR`;
- leitura do próprio perfil e leitura administrativa;
- funções privilegiadas fora do schema exposto;
- instalação reprodutível com lockfile;
- testes RED→GREEN, CI e smoke real.

## Fora de escopo
Produtos, estoque, movimentações, gestão completa de usuários, deploy público e dados reais da loja.

## Aceite
- CI com `npm ci`, lint, testes, typecheck e build verdes;
- usuário não pode escolher `ADMIN` no cadastro;
- novos usuários nascem `OPERATOR`;
- leitura de perfil do app é escopada ao usuário autenticado;
- RLS habilitado e validado em banco real;
- funções `SECURITY DEFINER` do M1 fora de `public`;
- login por senha real funcionando;
- sessão SSR/cookie aceita pela página protegida;
- logout limpa a sessão;
- fixtures de teste removidos;
- PRF completo.

## Riscos
Escalada de privilégio, leitura indevida de perfis, função privilegiada exposta, concorrência entre estado de Auth e perfil, falsa validação somente estática, instalação não reprodutível e resíduos de teste.

## Agentes
MESTRE, Rafael, Renato, Ricardo, Vinícius, Augusto, Carmem, Gabriel e Emily.

## Autorizações
`SCOPED_WRITE` em `feature/m1-auth-base`; integração em `main` somente após CI verde, auditoria e gate.
