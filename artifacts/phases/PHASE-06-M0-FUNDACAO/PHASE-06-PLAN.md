# PHASE-06 — PLAN

## Objetivo
Entregar o M0 — Fundação do Estoque Mercearia em branch isolada, com scaffold web, lint, testes, typecheck, build e CI verificáveis.

## Classe de risco
B — há escrita real em repositório, branch, commits e PR; não há produção, dados sensíveis ou ação irreversível de alto impacto.

## Escopo
- inicializar o repositório sem implementar regras de negócio;
- criar `feature/bootstrap`;
- preparar Next.js + TypeScript + React + Tailwind;
- configurar ESLint, teste de bootstrap e GitHub Actions;
- documentar segurança básica e variáveis de ambiente;
- validar lint, testes, typecheck e build;
- abrir PR draft para revisão.

## Fora de escopo
- autenticação;
- Supabase/PostgreSQL;
- produtos;
- movimentações de estoque;
- deploy/release;
- merge automático.

## Critérios de aceite
1. branch `feature/bootstrap` existente;
2. scaffold mínimo presente;
3. teste de bootstrap RED→GREEN registrado;
4. CI com install, lint, test, typecheck e build verde;
5. PR aberto contra `main`;
6. nenhum segredo versionado;
7. PRF da fase disponível.

## Agentes selecionados
- MESTRE: coordenação e contrato;
- Rafael: implementação técnica;
- Vinícius: revisão estrutural;
- Renato: validação/testes;
- Augusto: mission trace e observabilidade Classe B;
- Carmem: consistência documental do PRF;
- Gabriel: branch/commit/PR/CI;
- Emily: auditoria de suficiência com limitação de independência registrada;
- Léo: gate interno.

## Autorizações
- `SCOPED_WRITE` somente no repositório `leon337/estoque-mercearia`;
- escrita de implementação apenas em `feature/bootstrap`;
- criação da `main` permitida somente apontando para o commit inicial de README, sem scaffold;
- PR permitido;
- merge e release não autorizados neste ciclo.

## Validação planejada
- teste local de bootstrap com `node --test`;
- CI GitHub Actions: install, lint, test, typecheck, build;
- revisão do diff completo;
- smoke mínimo via build.
