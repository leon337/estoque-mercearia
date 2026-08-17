# PHASE-08 / P8.1 — Plano de gate MCF

## Contrato
- mission_id: `ESTOQUE-PHASE-08`
- phase_id: `P8.1`
- título: Fundação visual do Design System v1
- risco: `B`
- repositório: `leon337/estoque-mercearia`
- branch: `phase08/p8-1-visual-foundation`
- base: `main@4bac3a964d2cc4aba6e2f8ae55d715db52309647`
- issue: `#13`
- PR: `#14`
- referência MCF consultada: `leon337/multiagent-collaboration-framework@main` (HEAD observado `5d79f488407c77f7b9f21ecfefb41ddfb3a52aef`)

## Objetivo
Estabelecer tokens semânticos, tipografia, primitives de UI e AppShell responsivo, envolvendo o dashboard existente sem alterar banco, RLS, autenticação, Server Actions ou regras de estoque.

## Critérios de aceite
1. tokens e fontes aprovados presentes;
2. primitives e shell não acessam Supabase;
3. navegação canônica e filtragem ADMIN;
4. acessibilidade-base: `lang=pt-BR`, foco visível, `aria-current`, touch target >=48px;
5. dashboard preserva contratos M5;
6. regressão completa, lint, typecheck e build verdes;
7. nenhum arquivo de DB/RLS/auth/actions/regra de negócio alterado;
8. revisão visual mobile/desktop registrada ou lacuna explicitamente transferida ao próximo gate.

## Autorizações
- SPEC P8.1 aprovada por LEANDRO.
- implementação em branch isolada autorizada.
- em 2026-08-17, LEANDRO selecionou a opção 2: avançar PR #14 para revisão/gate MCF.
- merge e deploy continuam não autorizados por essa escolha.

## Proibições
- merge automático;
- deploy público;
- alteração de schema/RLS/auth;
- mudança de regras de estoque;
- transformar referência Stitch em HTML bruto de produção.

## Fontes
- `docs/superpowers/specs/2026-08-17-phase08-design-system-v1-design.md`
- `docs/superpowers/plans/2026-08-17-p8-1-visual-foundation.md`
- Issue #13
- PR #14
- GitHub Actions CI run `32069976350`
