# Estoque Mercearia

Sistema web de controle operacional para pequena mercearia, desenvolvido com Next.js, TypeScript, PostgreSQL/Supabase e governança MCF.

> **Estado atual:** PHASE-06 a PHASE-15 concluídas e qualificadas. O mapa canônico está em [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md). Estados voláteis de branch, deploy, CI e produção devem ser confirmados live.

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
- centro `/alerts` derivado de estoque zerado/baixo, sem estado duplicado;
- dashboard, administração de usuários e ajustes;
- Design System responsivo;
- Production Smoke E2E autônomo com Playwright/Chromium e revisão crítica.

## Fases

- **M0–M7 / PHASE-06** — MVP funcional — concluída.
- **PHASE-07** — Public Release — concluída.
- **PHASE-08** — Design System v1 — concluída.
- **PHASE-09** — Autonomous Production Smoke — concluída.
- **PHASE-10** — Stabilization & Domain Integrity — concluída.
- **PHASE-11** — Fornecedores — concluída.
- **PHASE-12** — Compras e Reposição — concluída.
- **PHASE-13** — Custos e Preços — concluída.
- **PHASE-14** — Vendas / PDV mínimo — concluída.
- **PHASE-15** — Alertas operacionais de estoque — concluída e qualificada.
- **PHASE-16** — Lotes e validade de recebimentos — missão aberta em #49 / PR #50.

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
- `/alerts`
- `/admin/users`
- `/admin/adjustment`

## Segurança e domínio

O navegador envia intenção; ator, saldo, snapshot monetário e movimentos resultantes são derivados ou validados no boundary autoritativo do servidor/banco. Alertas são derivados em leitura e não substituem `inventory.quantity`. Operações de estoque reutilizam RPCs controlados. Histórico concluído não possui DELETE pela aplicação.

## Produção

Produção pública: `https://estoque-mercearia.onrender.com`

Baseline funcional PHASE-15 qualificada:
`main@8d43e46aac11120ac786e6e1e343b9175050a11a`

Render:
- serviço `estoque-mercearia`;
- deploy `dep-da6kob5bedkc73fr83ig`;
- status `live`;
- commit `8d43e46aac11120ac786e6e1e343b9175050a11a`.

Production Smoke final PHASE-15:
- run `32824720287`;
- job `97730119241`;
- `success`;
- artifact `9554526907`;
- digest `sha256:d4a978161419a8b5bdc0c303022517cac76d8930e56f0d335e418fbbd35fdd70`.

Requalificação fresca em 2026-08-30:
- CI run `32824603560`, attempt 2;
- job `99336733237`;
- lint, testes, typecheck e build `PASS`.

## Operação e evidências

- mapa de verdade: `docs/CURRENT-STATE.md`;
- runbook: `docs/operations/MVP-RUNBOOK.md`;
- bootstrap histórico do primeiro ADMIN: `docs/operations/FIRST-ADMIN-BOOTSTRAP.md`;
- PRFs: `artifacts/phases/`;
- CI canônico: job `verify`;
- branch padrão: `main`;
- ruleset `Protect main` ativo.

## Próxima expansão ativa

A PHASE-16 adiciona rastreabilidade de lotes e validade sem substituir o saldo quantitativo autoritativo. O contrato está na Issue #49 e a implementação candidata na PR #50. Capacidades posteriores como FEFO automático, multi-loja, integrações fiscais/financeiras e automação avançada permanecem fora do escopo atual.
