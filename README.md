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

Render (evidência histórica de 2026-08-31):
- deploy `dep-daackkc9v7es73e9ifdg`;
- status então `live`, posteriormente substituído;
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

Encerramento formal da PHASE-16:
- PR [#57](https://github.com/leon337/estoque-mercearia/pull/57) mergeado e Issue [#49](https://github.com/leon337/estoque-mercearia/issues/49) concluída em 2026-08-31;
- `main@520e2b811baf1d50c42dab1694befbc415f1b2f4` após o closeout (snapshot), CI [33345474881](https://github.com/leon337/estoque-mercearia/actions/runs/33345474881) `success`;
- em 2026-11-04, o Render reportou deploy `dep-daacstu7bikc73bkia4g` como `live`, mas o Supabase estava `INACTIVE` e a restauração foi bloqueada por limite de projetos gratuitos ativos. A qualificação histórica não garante disponibilidade atual.

## Operação e evidências
- mapa de verdade: `docs/CURRENT-STATE.md`;
- runbook: `docs/operations/MVP-RUNBOOK.md`;
- bootstrap do primeiro ADMIN: `docs/operations/FIRST-ADMIN-BOOTSTRAP.md`;
- PRFs: `artifacts/phases/`;
- CI canônico: job `verify`;
- default branch: `main`;
- ruleset `Protect main`.

## Próxima expansão
Não há PHASE-17 materializada na reconciliação de 2026-11-04. MESTRE deve recuperar o próximo objetivo verificável antes de instanciar a missão e resolver o gate de infraestrutura registrado no mapa canônico antes de qualificar nova fase dependente do banco. Capacidades ainda fora do baseline incluem FEFO automático, saldo autoritativo por lote, multi-loja, integrações fiscais/financeiras e automação avançada.
