# PHASE-06 / M1 — REPORT

## Execução
- M0 integrado em `main`: `9c45d652704b7df2f8af2000ba11250ebac41634`.
- branch `feature/m1-auth-base` criada e PR draft #3 aberto.
- PR acidental #2 (`noop`) foi fechado sem merge e sem efeito funcional.
- TDD inicial: RED `828db0b...`; GREEN inicial `2c46e76...`.
- critério inseguro de role via metadata foi removido antes da implementação final.
- revisão encontrou leitura de `profiles` não escopada para ADMIN; RED `671dd47...` e correção validada em `6d0327f...`.
- revisão de segurança encontrou `SECURITY DEFINER` no schema exposto; RED `47a820e...`, correção `29cd988...` e refactor final `abc421c...`.
- projeto Supabase dedicado `estoque-mercearia` criado em `sa-east-1`, custo confirmado em 0/mês.
- migration `auth_profiles` aplicada no projeto `exwtngpwqgkrkoszpgib`, versão `20260817063444`.
- Security Advisor retornou zero lints.
- RLS real validado: OPERATOR lê somente o próprio perfil; ADMIN lê ambos. Fixtures removidos.
- smoke HTTP real de Auth: primeira execução confirmou bloqueio por e-mail não confirmado; após confirmação controlada, rerun `32003793856` passou signup existente, login por senha, RLS e logout. Usuário removido após o teste.
- dívida do M0 resolvida: `package-lock.json` v3 versionado; CI permanente mudou para `npm ci` e `contents: read`.
- tentativa de preview no Vercel não pôde ser materializada porque o conector não possuía projeto associado e a ação de deploy expôs contrato incompatível. Não houve alegação de deploy.
- substituição verificável: smoke do Next.js real em GitHub Actions, iniciando `next start` e exercitando Server Actions/cookies contra Supabase vivo.
- primeira tentativa do smoke Next.js encontrou rate limit de e-mail; foi criado fixture Auth temporário controlado. Primeira tentativa do fixture falhou por `instance_id` ausente; após corrigir o fixture, rerun do job `95310379955` no run `32004143103` passou login Server Action, página protegida, sessão e logout.
- fixture final removido: zero usuários, perfis e identidades remanescentes.
- workflow temporário de smoke removido.
- HEAD limpo de implementação/testes temporários: `0661b9d8f6465501cfe9c1d58e77c1b4fc678db0`.
- CI final desse HEAD: run `32004303874`, todos os passos verdes.

## Desvios e recuperação
- falhas de ambiente/email foram capturadas e não convertidas em falso PASS;
- fixture Auth manual foi limitado a teste, usou bcrypt e foi totalmente removido;
- nenhum segredo administrativo foi versionado;
- a chave usada nos workflows temporários era publishable/client-side;
- nenhum merge ocorreu antes do gate.

## Estado
Objetivo técnico do M1 atendido; pronto para auditoria, gate e integração.
