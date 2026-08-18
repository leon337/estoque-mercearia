# Estoque Mercearia

MVP web de controle de estoque para uma pequena mercearia, desenvolvido com Next.js, TypeScript, PostgreSQL/Supabase e governança MCF.

> **Estado atual:** MVP funcional publicado e em estabilização pós-PHASE-09. O mapa canônico do estado do projeto está em [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md). Para branch, SHA, PR, Issue, workflow e produção, o estado live do GitHub/Render prevalece sobre snapshots documentais.

## Estado do produto

- **M0–M7 / PHASE-06:** MVP funcional qualificado — concluído.
- **PHASE-07 — Public Release:** produção pública no Render — concluída.
- **PHASE-08 — Design System v1:** redesign visual baseado no Google Stitch, preservando regras e arquitetura — concluído.
- **PHASE-09 — Autonomous Production Smoke:** Playwright/Chromium, desktop/mobile, rotas públicas/protegidas/admin, fluxo QA e revisão crítica — concluído e integrado pela PR #20.
- **PHASE-10 — Stabilization & Domain Integrity:** reconciliação documental, hardening do repositório e correção de invariantes de quantidade/unidade — em andamento no Issue #21.

## Escopo funcional atual

- autenticação por e-mail/senha e cadastro pendente;
- perfis `ADMIN` / `OPERATOR` com RLS;
- categorias e produtos;
- estoque materializado por produto;
- `INITIAL`, `ENTRY`, `EXIT` e `ADJUSTMENT`;
- idempotência e bloqueio de estoque negativo;
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

O navegador envia intenção, nunca o saldo autoritativo nem o ator da movimentação. Alterações de estoque passam pelos RPCs controlados; APIs públicas privilegiadas são wrappers `SECURITY INVOKER` e as implementações privilegiadas ficam em schema privado. Usuários inativos não possuem acesso operacional.

Nunca versionar credenciais reais, dumps de produção ou chaves privilegiadas.

## Testes de produção

O workflow `Production Smoke E2E` executa Chromium real contra a aplicação publicada e preserva evidências. As credenciais de QA/E2E ficam exclusivamente nos GitHub Actions repository secrets `E2E_ADMIN_EMAIL` e `E2E_ADMIN_PASSWORD`.

A PHASE-09 foi qualificada antes do merge com 87/87 testes no CI, 11/11 rotas no smoke final e revisão crítica independente sem achado bloqueante. Esses números são evidência histórica do HEAD qualificado; novas mudanças exigem nova validação.

## Backup e recuperação

O `MVP-RUNBOOK.md` define backup lógico periódico com Supabase CLI (`supabase db dump`) e armazenamento fora do ambiente principal, além do procedimento de restauração e validação pós-restore.

## Produção

Produção pública: https://estoque-mercearia.onrender.com

A documentação de cada fase preserva o estado verdadeiro do momento em que foi produzida. Para saber **onde o projeto está agora**, comece por `docs/CURRENT-STATE.md` e confirme os itens voláteis no GitHub/Render live.
