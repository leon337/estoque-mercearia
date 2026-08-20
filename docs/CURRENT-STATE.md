# Estoque Mercearia — Estado Atual e Mapa de Verdade

**Classificação:** `CURRENT_IMPLEMENTED` + `STABLE_BASELINE`  
**Baseline funcional qualificada:** `main@326d1b2059e77253bac446ff111b297a3e428a71`  
**Closeout documental:** PR #27  
**Data da reconciliação:** 2026-08-20

## 1. Como ler este repositório

Este arquivo é o ponto de entrada para responder **“qual é o estado atual do Estoque Mercearia?”**.

Ordem de precedência:

1. instrução explícita atual de LEANDRO;
2. GitHub/Render/Supabase live;
3. código, testes e workflows do SHA aplicável;
4. este mapa de estado;
5. PRFs, Issues e documentos históricos.

Branch heads, estados de PR/Issue, runs de CI, deploys e saúde de produção são voláteis e devem ser confirmados live.

## 2. Estado executivo

```text
FUNDAÇÃO       ✅ concluída
AUTH / RLS     ✅ concluído
PRODUTOS       ✅ concluído
ESTOQUE        ✅ concluído
MOVIMENTAÇÕES  ✅ concluídas
HISTÓRICO      ✅ concluído
ADMINISTRAÇÃO  ✅ concluída
PUBLICAÇÃO     ✅ concluída
DESIGN SYSTEM  ✅ concluído
E2E AUTÔNOMO   ✅ concluído
ESTABILIZAÇÃO  ✅ PHASE-10 qualificada
```

O produto é um MVP publicado e operacional. A PHASE-10 consolidou invariantes de domínio, documentação e governança do repositório antes de qualquer nova expansão funcional.

## 3. Marcos concluídos

### PHASE-06 — MVP funcional
M0–M7 materializaram fundação, autenticação/RLS, produtos, estoque, movimentações, histórico, dashboard e administração.

### PHASE-07 — Public Release
Aplicação publicada no Render, com runbook e qualificação de produção.

### PHASE-08 — Design System v1
Redesign responsivo integrado sem alterar regras de domínio, auth ou RLS.

### PHASE-09 — Autonomous Production Smoke
Playwright/Chromium passou a validar produção pública com evidências desktop/mobile, rotas públicas/protegidas/admin, lifecycle QA e critical review.

### PHASE-10 — Stabilization & Domain Integrity

#### P10.1 — Reconciliação documental
PR #22 integrou README reconciliado e este mapa canônico, preservando PRFs históricos como snapshots.

#### P10.2 — Integridade de quantidades/unidades
PRs #23 e #24:
- `UN`, `CX`, `PCT`: somente inteiros;
- `KG`, `L`, `M`: até 3 casas decimais;
- unidades desconhecidas: até 3 casas por compatibilidade;
- validação em UI, Server Action e banco;
- formatação de quantidade em pt-BR;
- migration `0008_quantity_precision.sql`;
- harness E2E robusto a reruns por `GITHUB_RUN_ATTEMPT`.

Production Smoke qualificado: run `32193323462` — PASS.

#### P10.3 — Hardening de repositório/CI
PR #25:
- CI também em push para `main`;
- `/smoke-production` reutilizável;
- trigger de `issue_comment` restrito a OWNER/MEMBER/COLLABORATOR;
- enforcement `PRODUCTION_SMOKE`.

Production Smoke: run `32193964995` — PASS.

#### P10.4 — Integridade de estoque mínimo
PR #26:
- correção humana aprovada de `minimum_stock=0.046 UN` para `1 UN`;
- validação por unidade em Server Action e formulário;
- migration `0009_product_minimum_stock_precision.sql`;
- trigger autoritativo `products_minimum_stock_precision`;
- rejeição live comprovada de `1.5 UN`;
- CI `32197520954`: 97/97 + lint/typecheck/build PASS;
- merge funcional `326d1b2059e77253bac446ff111b297a3e428a71`.

## 4. HUMAN_GATE de governança concluído

LEANDRO materializou no GitHub:

```yaml
default_branch: main
ruleset: Protect main
enforcement: Active
target: default/main
require_pull_request: true
required_approvals: 0
required_status_check: verify
bypass_list: empty
block_force_push: true
restrict_deletions: true
```

Leitura live posterior confirmou `main protected=true`.

A API de branch protection tradicional pode continuar mostrando seu bloco legado como desabilitado; a proteção efetiva é fornecida pelo Ruleset.

## 5. Qualificação final pós-HUMAN_GATE

Production Smoke E2E final:

```yaml
run_id: 32344160656
job_id: 96349225201
event: issue_comment
branch: main
head_sha: 326d1b2059e77253bac446ff111b297a3e428a71
workflow_conclusion: success
normal_smoke: PASS
critical_review: PASS
overall: PASS
artifact_id: 9397459502
artifact_digest: sha256:0e2d48949e5ac6725f15658bb11a8c27ed1b7664aa8b139b42128419126294bf
evidence_files: 51
qa_cleanup: inactive
```

O log registrou explicitamente `PRODUCTION_SMOKE overall=PASS`.

O PRF de closeout está em:
`artifacts/phases/PHASE-10-STABILIZATION-DOMAIN-INTEGRITY/`.

A PR #27 validou o próprio gate novo:
- CI run `32344608801`;
- job `verify` `96350580180`;
- install, lint, testes, typecheck e build PASS;
- PR reportada mergeable.

## 6. Superfícies atuais

Rotas principais:
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

## 7. Arquitetura operacional resumida

```text
Navegador / Next.js UI
        ↓
Server Actions / SSR
        ↓
Supabase Auth + RLS
        ↓
RPCs públicos SECURITY INVOKER
        ↓
implementações privadas controladas
        ↓
PostgreSQL / inventory + stock_movements
```

Princípios preservados:
- cliente envia intenção, não saldo autoritativo;
- ator deriva da sessão autenticada;
- histórico é append-only para a aplicação;
- operação de estoque usa idempotência;
- estoque negativo é bloqueado;
- precisão de quantidade depende da unidade;
- estoque mínimo respeita a mesma política;
- usuários inativos não possuem acesso operacional;
- operações administrativas exigem `ADMIN`.

## 8. Automação e evidência

### CI
O workflow `CI` executa instalação reprodutível, lint, testes, typecheck e build. O job canônico requerido no ruleset é `verify`.

### Production Smoke E2E
O workflow usa Chromium/Playwright contra produção pública. Credenciais QA ficam apenas em repository secrets. O runner gera screenshots, inventário de rotas, relatórios e artifact de evidência.

## 9. Limitações e observações

- O Playwright é instalado efemeramente no smoke e pode exibir resumo de dependências temporárias; isso não equivale automaticamente a vulnerabilidade nas dependências versionadas da aplicação.
- Branch heads, Issue state, workflow runs e commit reportado pelo Render continuam voláteis.
- Um closeout somente documental pode avançar `main`/deploy sem mudar a árvore de aplicação.
- PRFs antigos podem conter estados `BLOCKED`, `AWAITING_GATE` ou checklists incompletos que eram verdadeiros naquele boundary e são históricos hoje.

## 10. Próxima expansão de produto

A PHASE-10 encerra a estabilização. Novos módulos podem ser planejados em missão separada, por exemplo:
- fornecedores;
- compras;
- custos e preços;
- vendas/PDV;
- alertas;
- multi-loja.

Nenhum desses módulos é capacidade atual até existir implementação e evidência verificável.

## 11. Regra de continuidade

Ao retomar o projeto:

1. consulte `main`, PRs, Issues e workflows live;
2. leia este arquivo;
3. use o PRF da PHASE-10 como evidência da baseline estabilizada;
4. confirme produção e banco quando a pergunta depender de estado live;
5. trate novas expansões como nova missão, sem reabrir implicitamente a PHASE-10.
