# Estoque Mercearia

MVP web de controle de estoque para uma pequena mercearia, desenvolvido com Next.js, TypeScript, PostgreSQL/Supabase e governança MCF.

> **Estado atual:** MVP funcional publicado. PHASE-10 — Stabilization & Domain Integrity — qualificada e encerrada tecnicamente; o estado live de branch, SHA, Issue, workflow e produção deve ser confirmado no GitHub/Render. O mapa canônico está em [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md).

## Estado do produto

- **M0–M7 / PHASE-06:** MVP funcional qualificado — concluído.
- **PHASE-07 — Public Release:** produção pública no Render — concluída.
- **PHASE-08 — Design System v1:** redesign visual responsivo — concluído.
- **PHASE-09 — Autonomous Production Smoke:** Playwright/Chromium com evidência desktop/mobile e fluxo QA — concluído.
- **PHASE-10 — Stabilization & Domain Integrity:** reconciliação, precisão por unidade, hardening de CI/repositório e estoque mínimo — concluída tecnicamente; closeout em PR #27.

## Escopo funcional atual

- autenticação por e-mail/senha e cadastro pendente;
- perfis `ADMIN` / `OPERATOR` com RLS;
- categorias e produtos;
- estoque materializado por produto;
- `INITIAL`, `ENTRY`, `EXIT` e `ADJUSTMENT`;
- idempotência e bloqueio de estoque negativo;
- precisão de quantidade vinculada à unidade (`UN/CX/PCT` inteiros; unidades fracionáveis com precisão controlada);
- estoque mínimo com a mesma integridade de unidade;
- histórico auditável;
- dashboard operacional;
- administração de usuários e ajustes;
- Design System v1 responsivo;
- smoke E2E autônomo em Chromium com evidências.

## Stack

- Next.js 16.3.1 + React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL / Supabase
- Supabase Auth + RLS
- GitHub Actions
- Render
- Playwright instalado efemeramente no workflow de smoke de produção

## Requisitos locais

- Node.js >= 20.9
- npm

## Configuração

Copie `.env.example` para `.env.local` e preencha apenas:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Não versione `.env.local`, senha do banco, chaves administrativas, credenciais E2E ou outros segredos.

## Comandos reproduzíveis

```bash
npm ci
npm run lint
npm test
npm run typecheck
npm run build
npm run dev
```

A CI executa a sequência essencial com `npm ci`.

## Rotas principais

- `/login`
- `/register`
- `/`
- `/products`
- `/products/new`
- `/products/[id]/edit`
- `/inventory`
- `/movements/new`
- `/history`
- `/admin/users`
- `/admin/adjustment`

## Operação

- Estado consolidado: `docs/CURRENT-STATE.md`
- Runbook: `docs/operations/MVP-RUNBOOK.md`
- Bootstrap do primeiro administrador: `docs/operations/FIRST-ADMIN-BOOTSTRAP.md`
- Critérios históricos de qualificação do MVP: `docs/operations/MVP-ACCEPTANCE.md`
- Evidências MCF: `artifacts/phases/`

Fluxo inicial: criar o primeiro usuário em `/register`, executar o bootstrap owner-only do primeiro ADMIN, cadastrar produtos, registrar `INITIAL` e conferir estoque/histórico. Aprovações posteriores de usuários ocorrem em `/admin/users`.

## Segurança

O navegador envia intenção, nunca o saldo autoritativo nem o ator da movimentação. Alterações de estoque passam pelos RPCs controlados; APIs públicas privilegiadas são wrappers `SECURITY INVOKER` e implementações privilegiadas ficam em schema privado. Usuários inativos não possuem acesso operacional.

Precisão de quantidade e de estoque mínimo também é validada no boundary autoritativo do banco, impedindo bypass da UI.

Nunca versione credenciais reais, dumps de produção ou chaves privilegiadas.

## Testes de produção

O workflow `Production Smoke E2E` executa Chromium real contra a aplicação publicada e preserva evidências. As credenciais QA/E2E ficam somente nos GitHub Actions repository secrets `E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD`.

A qualificação final da PHASE-10 após o HUMAN_GATE executou o run `32344160656` em `main@326d1b2059e77253bac446ff111b297a3e428a71` com `PRODUCTION_SMOKE overall=PASS`, 51 evidências no artifact `9397459502` e cleanup QA confirmado.

## Governança do repositório

- default branch: `main`;
- ruleset: `Protect main` ativo;
- pull request obrigatório;
- required status check: `verify`;
- force push/deleção protegidos;
- bypass list vazia no HUMAN_GATE materializado.

## Produção

Produção pública: https://estoque-mercearia.onrender.com

A identidade funcional qualificada antes do closeout documental é `main@326d1b2059e77253bac446ff111b297a3e428a71`. Um merge somente documental pode avançar `main` e o commit reportado pelo provider sem alterar a árvore de aplicação. Para qualquer estado volátil, consulte GitHub/Render live.

## Próxima expansão

Novos módulos — fornecedores, compras, custos/preços, vendas/PDV, alertas ou multi-loja — não fazem parte das capacidades atuais e devem ser priorizados em nova missão, sobre a baseline estabilizada da PHASE-10.
