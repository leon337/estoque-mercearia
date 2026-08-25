# Estoque Mercearia

Sistema web de controle operacional para pequena mercearia, desenvolvido com Next.js, TypeScript, PostgreSQL/Supabase e governança MCF.

> **Estado atual:** PHASE-06 a PHASE-14 concluídas tecnicamente. O mapa canônico está em [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md). Estados voláteis de branch, deploy, CI e produção devem ser confirmados live.

## Capacidades atuais

- autenticação por e-mail/senha e cadastro pendente;
- perfis `ADMIN` / `OPERATOR` com RLS;
- categorias e produtos;
- estoque materializado por produto;
- movimentos `INITIAL`, `ENTRY`, `EXIT` e `ADJUSTMENT`;
- idempotência, histórico auditável e bloqueio de estoque negativo;
- precisão por unidade e estoque mínimo coerente;
- fornecedores e vínculos produto-fornecedor;
- compras e recebimentos com entrada autoritativa de estoque;
- custos e preços, incluindo último custo recebido;
- vendas / PDV mínimo com `DRAFT`, `COMPLETED`, `CANCELLED`;
- snapshot autoritativo de preço por item de venda;
- conclusão transacional de venda com `EXIT` no estoque;
- dashboard, administração de usuários e ajustes;
- Design System responsivo;
- Production Smoke E2E autônomo com Playwright/Chromium.

## Fases

- **M0–M7 / PHASE-06** — MVP funcional — concluída.
- **PHASE-07** — Public Release — concluída.
- **PHASE-08** — Design System v1 — concluída.
- **PHASE-09** — Autonomous Production Smoke — concluída.
- **PHASE-10** — Stabilization & Domain Integrity — concluída.
- **PHASE-11** — Fornecedores — concluída.
- **PHASE-12** — Compras e Reposição — concluída.
- **PHASE-13** — Custos e Preços — concluída.
- **PHASE-14** — Vendas / PDV mínimo — qualificada; closeout em PRF.

## Stack

- Next.js 16.3.1 + React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL / Supabase
- Supabase Auth + RLS
- GitHub Actions
- Render
- Playwright

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
- `/suppliers`
- `/suppliers/new`
- `/suppliers/[id]/edit`
- `/purchases`
- `/purchases/new`
- `/purchases/[id]`
- `/sales`
- `/sales/new`
- `/sales/[id]`
- `/admin/users`
- `/admin/adjustment`

## Segurança e domínio

O navegador envia intenção; ator, saldo, snapshot monetário e movimentos resultantes são derivados ou validados no boundary autoritativo do servidor/banco. Operações de estoque reutilizam RPCs controlados. Histórico concluído não possui DELETE pela aplicação.

## Produção

Produção pública: `https://estoque-mercearia.onrender.com`

Baseline funcional PHASE-14 qualificada:
`main@1011194369b16b33d108c100e8c49e12d15a4f17`

Render:
- serviço `estoque-mercearia`;
- deploy `dep-da6heh49v7es739qa22g`;
- status `live`;
- commit `1011194369b16b33d108c100e8c49e12d15a4f17`.

Production Smoke final PHASE-14:
- run `32808403066`;
- job `97682929264`;
- `PRODUCTION_SMOKE overall=PASS`;
- artifact `9548993617`;
- digest `sha256:2b4741d6da0f93a8606f7658d5d5e1acd3506c7aef355058e87bacfab0d535df`.

## Operação e evidências

- mapa de verdade: `docs/CURRENT-STATE.md`;
- runbook: `docs/operations/MVP-RUNBOOK.md`;
- bootstrap histórico do primeiro ADMIN: `docs/operations/FIRST-ADMIN-BOOTSTRAP.md`;
- PRFs: `artifacts/phases/`;
- CI canônico: job `verify`;
- branch padrão: `main`;
- ruleset `Protect main` ativo.

## Próximas expansões

Capacidades como alertas inteligentes, lotes/validade, multi-loja, integrações fiscais/financeiras e automação avançada permanecem fora do escopo atual e devem ser abertas como novas missões.
