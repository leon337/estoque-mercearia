# Estoque Mercearia — Estado Atual e Mapa de Verdade

**Classificação:** `CURRENT_IMPLEMENTED` + `STABILIZATION_IN_PROGRESS`  
**Baseline live antes da PHASE-10:** `main@1082b8947c9ef5cc0ded3a21b01c01428ebb61ad`  
**Data da reconciliação:** 2026-08-18  
**Missão ativa:** Issue #21 — PHASE-10

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
ESTABILIZAÇÃO  🔄 PHASE-10 em andamento
```

O produto é um MVP publicado e operacional. A prioridade atual não é ampliar escopo funcional, e sim consolidar invariantes, documentação e governança do repositório antes de novos módulos.

## 3. Marcos concluídos

### PHASE-06 — MVP funcional

M0–M7 concluíram:

- fundação Next.js/TypeScript/CI;
- autenticação, perfis `ADMIN`/`OPERATOR` e RLS;
- categorias e produtos;
- núcleo transacional de estoque;
- `INITIAL`, `ENTRY`, `EXIT` e `ADJUSTMENT`;
- idempotência, serialização por produto e bloqueio de estoque negativo;
- histórico e dashboard;
- administração de usuários e last-admin guard;
- hardening de RPCs;
- qualificação técnica do MVP.

### PHASE-07 — Public Release

- aplicação publicada no Render;
- correções de segurança/dependências e roteamento encontradas no smoke real;
- endpoint público qualificado;
- rollback/runbook/evidência preservados.

### PHASE-08 — Design System v1

Issue #13 encerrado como concluído. PRs #14, #15, #16, #17 e #18 integraram:

- fundação visual/AppShell;
- login/cadastro;
- dashboard;
- produtos;
- estoque;
- movimentações/histórico;
- administração;
- qualificação visual cross-route.

A referência Google Stitch foi usada como insumo visual, sem substituir regras de domínio, auth, RLS ou arquitetura validada.

### PHASE-09 — Autonomous Production Smoke

Issue #19 encerrado como concluído. PR #20 integrada em `main`.

Baseline de integração:

- merge commit: `1082b8947c9ef5cc0ded3a21b01c01428ebb61ad`;
- HEAD pré-merge qualificado: `0e252c5a2e6ed237b7d9906ca1e6aad90e50fa86`;
- CI final pré-merge: PASS;
- Production Smoke E2E final: PASS;
- 87/87 testes no HEAD de código qualificado;
- 11/11 rotas mínimas PASS;
- desktop/mobile PASS;
- revisão crítica independente PASS;
- fluxo ADMIN real e lifecycle de produto QA PASS;
- credenciais mantidas fora de código/artefatos.

Esses números são evidência histórica do boundary PHASE-09. Qualquer mudança posterior precisa ser requalificada.

## 4. Superfícies atuais

Rotas principais materializadas:

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

## 5. Arquitetura operacional resumida

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
- operação de estoque usa chave de idempotência;
- estoque negativo é bloqueado;
- usuários inativos não possuem acesso operacional;
- operações administrativas exigem `ADMIN`.

## 6. Automação e evidência

### CI

O workflow `CI` executa instalação reprodutível, lint, testes, typecheck e build nos gatilhos configurados.

### Production Smoke E2E

O workflow `Production Smoke E2E` usa Chromium/Playwright contra produção pública. As credenciais de QA ficam apenas em repository secrets:

- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`

O runner produz screenshots, inventário de rotas, relatórios e artifact de evidência.

## 7. Divergências e achados atuais

### 7.1 Quantidade/unidade — achado funcional aberto

Foi reproduzido manualmente que a tela de nova movimentação aceita quantidade como `11,000001` para produto com unidade `UN`, e o saldo projetado pode ser exibido como `11.000001 UN`.

Causa já localizada no código atual:

- UI usa `step="any"` na quantidade;
- Server Action aceita qualquer `number` finito positivo;
- RPC/banco usa `numeric` sem regra de precisão vinculada à unidade;
- exibição não normaliza a quantidade para `pt-BR`.

Estado: **OPEN / PHASE-10 P10.2**.

Política inicial aprovada para implementação:

- unidades inteiras: `UN`, `CX`, `PCT` → somente inteiros;
- unidades fracionáveis: `KG`, `L`, `M` → precisão controlada;
- validação precisa existir no boundary autoritativo, não só no HTML;
- interface deve exibir quantidades em pt-BR.

### 7.2 Default branch do GitHub — divergência de governança

No início da PHASE-10, o GitHub reporta `default_branch = feature/bootstrap`, embora o desenvolvimento integrado esteja em `main`.

Consequência: quem abre o repositório pela branch padrão pode receber documentação histórica de bootstrap como se fosse atual.

Estado: **OPEN / PHASE-10 P10.3**.

A correção pretendida é tornar `main` a branch padrão. Se o conector disponível não oferecer mutação dessa configuração, a ação será tratada como dependência externa explícita e não será simulada.

### 7.3 Proteção de `main`

No início da PHASE-10, `main` aparece sem proteção e sem required status checks configurados na branch protection tradicional.

Estado: **OPEN / PHASE-10 P10.3**.

## 8. Como interpretar documentos históricos

PRFs e checkpoints registram a verdade do momento em que foram gerados.

Exemplo: o checkpoint da PHASE-09 contém `QUALIFIED_AWAITING_HUMAN_MERGE_GATE`. Isso não significa que o projeto atual ainda aguarda merge; significa que aquele arquivo foi criado **antes** da autorização/integração final. O estado live posterior é a fonte de verdade.

A mesma regra vale para checklists antigos com `[ ]`, estados `BLOCKED`, `NOT_PUBLISHED`, ressalvas pré-deploy e SHAs de branches antigas.

## 9. PHASE-10 — ordem de execução

### P10.1 — Reconciliação documental

- README atualizado;
- este `docs/CURRENT-STATE.md` criado;
- documentos históricos preservados como snapshots;
- divergências atuais registradas explicitamente.

### P10.2 — Integridade de quantidades/unidades

- RED reproduzindo quantidade fracionária indevida para `UN`;
- GREEN com regra compartilhada e enforcement autoritativo;
- formatação pt-BR;
- regressões e smoke E2E.

### P10.3 — Hardening de repositório/CI

- default branch `main`;
- proteção/checks de integração conforme capacidade do repositório;
- revisão dos gatilhos de CI para o fluxo real;
- qualificação final da PHASE-10.

## 10. Próxima expansão de produto

Somente depois da PHASE-10 devem ser priorizados novos módulos como fornecedores, compras, custos/preços, vendas/PDV, alertas ou multi-loja. Eles ainda **não** são capacidades atuais do MVP.

## 11. Regra de continuidade

Ao retomar o projeto:

1. consulte `main`, PRs, Issues e workflows live;
2. leia este arquivo;
3. leia o Issue #21 enquanto PHASE-10 estiver aberta;
4. use PRFs somente como evidência do boundary correspondente;
5. não declare regressão resolvida sem validação fresca.
