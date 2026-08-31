# Estoque Mercearia

Sistema web de controle operacional para pequena mercearia, desenvolvido com Next.js, TypeScript, PostgreSQL/Supabase e governança MCF.

> **Estado atual:** PHASE-06 a PHASE-16 concluídas e qualificadas. O mapa canônico está em [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md). Estados voláteis de branch, deploy, CI e produção devem ser confirmados live.

## Capacidades atuais
- autenticação por e-mail/senha e perfis `ADMIN` / `OPERATOR` com RLS;
- categorias, produtos e estoque materializado;
- movimentos `INITIAL`, `ENTRY`, `EXIT`, `ADJUSTMENT`, idempotência e histórico auditável;
- fornecedores e vínculos produto-fornecedor;
- compras/recebimentos com entrada autoritativa de estoque;
- custos e preços;
- vendas / PDV mínimo com conclusão transacional;
- centro `/alerts` para estoque baixo/zerado e validade de lotes;
- lotes de recebimento em `receipt_batches`, com validade e integridade por quantidade recebida;
- dashboard e administração;
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
- **PHASE-15** — Alertas operacionais — concluída.
- **PHASE-16** — Lotes e validade de recebimentos — concluída e qualificada.
- **PHASE-17** — ainda não instanciada; o próximo loop MCF deve recuperar o objetivo verificável antes de criar escopo.

## Stack
Next.js 16.3.1, React 19, TypeScript, Tailwind CSS 4, PostgreSQL/Supabase, Supabase Auth + RLS, GitHub Actions, Render e Playwright.

## Rotas principais
`/login`, `/register`, `/`, `/products`, `/inventory`, `/movements/new`, `/history`, `/suppliers`, `/purchases`, `/sales`, `/alerts`, `/batches`, `/batches/new`, `/admin/users`, `/admin/adjustment`.

## Segurança e domínio
O navegador envia intenção. Ator, saldo, precisão, limites e movimentos são derivados ou validados no boundary autoritativo do servidor/banco. `inventory.quantity` continua sendo o saldo quantitativo autoritativo; lotes são rastreabilidade de recebimentos, não um segundo estoque. Histórico concluído não possui DELETE pela aplicação.

## Produção
Produção pública: `https://estoque-mercearia.onrender.com`

Baseline funcional PHASE-16:
`main@8e508e3421528a6da60c8a9b571097a11f651c69`

Render:
- deploy `dep-daackkc9v7es73e9ifdg`;
- status `live`;
- commit `8e508e3421528a6da60c8a9b571097a11f651c69`.

CI final:
- run `33344608583`;
- job `99346251908`;
- lint, testes, typecheck e build `PASS`.

Production Smoke final PHASE-16:
- run `33344692905`;
- job `99346483166`;
- conclusion `success`;
- normal smoke `PASS`;
- independent critical review `PASS`;
- enforcement `PASS`;
- artifact `9741654703`;
- digest `sha256:b1df8994cae45a5bd6c252535627d113d72b8aead8b3d448833fe0cb084abba3`.

## Operação e evidências
- mapa de verdade: `docs/CURRENT-STATE.md`;
- runbook: `docs/operations/MVP-RUNBOOK.md`;
- bootstrap do primeiro ADMIN: `docs/operations/FIRST-ADMIN-BOOTSTRAP.md`;
- PRFs: `artifacts/phases/`;
- CI canônico: job `verify`;
- default branch: `main`;
- ruleset `Protect main`.

## Próxima expansão
Não há PHASE-17 materializada no snapshot deste closeout. MESTRE deve recuperar o próximo objetivo das fontes de verdade e instanciar a próxima missão pelo MCF vigente, sem inventar escopo. Capacidades ainda fora do baseline incluem FEFO automático, saldo autoritativo por lote, multi-loja, integrações fiscais/financeiras e automação avançada.
