# Estoque Mercearia — Estado Atual e Mapa de Verdade

**Classificação:** `CURRENT_IMPLEMENTED` + `STABLE_BASELINE`  
**Baseline funcional qualificada:** `main@8d43e46aac11120ac786e6e1e343b9175050a11a`  
**Fase mais recente:** PHASE-15 — Alertas operacionais de estoque  
**Data da reconciliação:** 2026-08-30

## 1. Precedência de verdade

1. instrução explícita atual de LEANDRO;
2. GitHub / Render / Supabase live;
3. código, testes e workflows do SHA aplicável;
4. este mapa de estado;
5. PRFs, Issues e documentos históricos.

Estados de deploy, branch, PR, Issue e workflow são voláteis e devem ser confirmados live quando relevantes.

## 2. Estado executivo

```text
PHASE-06  MVP funcional                 ✅
PHASE-07  Public Release                ✅
PHASE-08  Design System v1              ✅
PHASE-09  Production Smoke autônomo     ✅
PHASE-10  Estabilização e integridade   ✅
PHASE-11  Fornecedores                  ✅
PHASE-12  Compras e Reposição           ✅
PHASE-13  Custos e Preços               ✅
PHASE-14  Vendas / PDV mínimo           ✅
PHASE-15  Alertas operacionais          ✅ qualificada
PHASE-16  Lotes e validade              🟡 missão aberta / PR candidata
```

## 3. Capacidades atuais

### Fundação operacional
- autenticação e perfis `ADMIN` / `OPERATOR`;
- categorias/produtos;
- estoque materializado;
- movimentos `INITIAL`, `ENTRY`, `EXIT`, `ADJUSTMENT`;
- histórico auditável;
- idempotência;
- bloqueio de estoque negativo;
- precisão por unidade;
- estoque mínimo coerente;
- dashboard e administração.

### PHASE-11 — Fornecedores
- `suppliers`;
- `product_suppliers`;
- cadastro, edição, ativação/inativação;
- vínculo produto-fornecedor;
- fornecedor preferencial;
- RLS e operações administrativas.

### PHASE-12 — Compras
- pedidos e itens;
- lifecycle de compra/recebimento;
- recebimentos transacionais;
- entrada autoritativa de estoque;
- idempotência;
- RLS;
- UI `/purchases`.

### PHASE-13 — Custos e preços
- `cost_price`;
- `sale_price`;
- custo unitário de compra;
- atualização de último custo recebido;
- total monetário derivado, não agregado persistido;
- boundaries monetários no banco.

### PHASE-14 — Vendas / PDV mínimo
- `sales` e `sale_items`;
- `DRAFT`, `COMPLETED`, `CANCELLED`;
- snapshot de `products.sale_price`;
- quantidade com política de unidade;
- conclusão atômica;
- `EXIT` via domínio autoritativo de estoque;
- idempotência;
- histórico sem DELETE pela aplicação;
- UI `/sales`, `/sales/new`, `/sales/[id]`.

### PHASE-15 — Alertas operacionais
- rota `/alerts`;
- alertas derivados de produtos ativos + `inventory`;
- `CRITICAL` para `quantity <= 0`;
- `WARNING` para `quantity > 0 && quantity <= minimum_stock`;
- busca, filtro, contadores e ordenação;
- handoff do dashboard para o centro de alertas;
- navegação desktop sem exceder o limite qualificado do bottom-nav mobile;
- nenhum saldo ou severidade autoritativa duplicada.

## 4. PHASE-15 — evidência final

### Implementação e recovery
- PR #48 merge `2bdb666fc3ecceb5718fc76c2444187064676744`;
- PR #51 merge `1014dcd87f98a3f892b7b0e99be704b8d64d14fa`;
- smoke intermediário `32823449233` detectou overflow real em 320 px;
- PR #52 recovery por TDD;
- merge funcional final `8d43e46aac11120ac786e6e1e343b9175050a11a`.

### CI fresco
Requalificação em 2026-08-30:
- run `32824603560`;
- attempt `2`;
- job `99336733237`;
- lint PASS;
- testes PASS;
- typecheck PASS;
- build PASS.

### Render
- workspace `tea-d2u2msje5dus73eb6ehg`;
- service `srv-da1et8pt0dsc73bn9pgg`;
- deploy `dep-da6kob5bedkc73fr83ig`;
- commit `8d43e46aac11120ac786e6e1e343b9175050a11a`;
- status `live`.

### Production Smoke
- run `32824720287`;
- job `97730119241`;
- head SHA `8d43e46aac11120ac786e6e1e343b9175050a11a`;
- workflow `success`;
- normal smoke PASS;
- independent critical review PASS;
- artifact `9554526907`;
- digest `sha256:d4a978161419a8b5bdc0c303022517cac76d8930e56f0d335e418fbbd35fdd70`.

## 5. Arquitetura operacional

```text
Browser / Next.js UI
        ↓
Server Actions / SSR
        ↓
Supabase Auth + RLS
        ↓
public SECURITY INVOKER RPCs + leituras sujeitas a RLS
        ↓
private controlled implementations
        ↓
PostgreSQL domains
  ├─ products / suppliers
  ├─ purchases / receipts
  ├─ inventory / stock_movements
  └─ sales / sale_items

/alerts
  └─ derivação em leitura de products + inventory
```

Princípios:
- cliente envia intenção;
- ator deriva da sessão;
- saldo e movimentos são autoritativos no banco;
- alerta é estado derivado, não novo saldo;
- preço de venda do item é snapshot controlado no boundary;
- operações transacionais são idempotentes;
- histórico não é reescrito para “corrigir” operações concluídas.

## 6. Governança

```yaml
default_branch: main
ruleset: Protect main
require_pull_request: true
required_status_check: verify
required_approvals: 0
bypass_list: empty
block_force_push: true
restrict_deletions: true
```

A API de branch protection tradicional pode continuar mostrando proteção legada desativada; o ruleset é a proteção efetiva.

## 7. Produção

URL: `https://estoque-mercearia.onrender.com`

Baseline funcional PHASE-15:
`8d43e46aac11120ac786e6e1e343b9175050a11a`

Render LIVE:
`dep-da6kob5bedkc73fr83ig` → `8d43e46aac11120ac786e6e1e343b9175050a11a`.

## 8. Continuidade ativa

### PHASE-16 — Lotes e validade
- Issue #49: aberta;
- PR #50: draft aberta e mergeable no snapshot de retomada;
- migration candidata `0017_receipt_batches.sql` já reportada como aplicada/validada no Supabase;
- próximo gate: sincronizar a PR #50 com o `main` pós-closeout da PHASE-15, requalificar CI, integrar, confirmar Render LIVE no novo SHA, executar Production Smoke pós-deploy e gerar PRF Classe B.

Nenhum HUMAN_GATE novo é necessário enquanto a execução permanecer dentro da autorização contínua registrada para PHASE-15 → PHASE-18 e não ocorrer gatilho reservado do MCF.

## 9. Fora do escopo atual

- pagamento Pix/cartão integrado;
- caixa financeiro;
- clientes/fiado;
- fiscal/NF-e/NFC-e;
- devoluções/trocas;
- promoções/comissões;
- FEFO automático e saldo autoritativo por lote;
- serialização/recall/cadeia fria;
- multi-loja;
- automação/IA de demanda.

## 10. Regra de continuidade

Ao retomar:
1. verificar GitHub/Render/Supabase live;
2. usar este arquivo como mapa canônico depois da leitura live;
3. consultar o PRF da PHASE-15 para evidência de closeout;
4. retomar PHASE-16 pela Issue #49 / PR #50;
5. escalar a LEANDRO somente nos gates reservados pelo MCF.
