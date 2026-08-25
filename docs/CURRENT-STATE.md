# Estoque Mercearia — Estado Atual e Mapa de Verdade

**Classificação:** `CURRENT_IMPLEMENTED` + `STABLE_BASELINE`  
**Baseline funcional qualificada:** `main@1011194369b16b33d108c100e8c49e12d15a4f17`  
**Fase mais recente:** PHASE-14 — Vendas / PDV mínimo  
**Data da reconciliação:** 2026-08-25

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
PHASE-14  Vendas / PDV mínimo           ✅ qualificada
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
- UI `/sales`, `/sales/new`, `/sales/[id]`;
- navegação móvel priorizada.

## 4. PHASE-14 — evidência final

### CI / TDD
Recovery final:
- run `32807140246`;
- job `97679344873`;
- lint PASS;
- 135/135 testes PASS;
- typecheck PASS;
- build PASS.

### Supabase
Migrations:
- `0013_sales.sql`;
- `0014_sales_item_price_reactivation.sql`;
- `0015_sales_item_inactive_product_removal.sql`;
- `0016_complete_sale_qualified_item_id.sql`.

Achados de lifecycle e conclusão descobertos durante a fase foram corrigidos por migrations forward-only.

### Render
- workspace `tea-d2u2msje5dus73eb6ehg`;
- service `srv-da1et8pt0dsc73bn9pgg`;
- deploy `dep-da6heh49v7es739qa22g`;
- commit `1011194369b16b33d108c100e8c49e12d15a4f17`;
- status `live`.

### Production Smoke
- run `32808403066`;
- job `97682929264`;
- head SHA `1011194369b16b33d108c100e8c49e12d15a4f17`;
- workflow `success`;
- `PRODUCTION_SMOKE overall=PASS`;
- artifact `9548993617`;
- digest `sha256:2b4741d6da0f93a8606f7658d5d5e1acd3506c7aef355058e87bacfab0d535df`;
- 90 evidências.

### Banco — cenário final
- venda `COMPLETED`;
- 3 unidades vendidas;
- snapshot `4.99`;
- movimento `EXIT -3`;
- saldo `5 → 2`;
- produto QA inativado.

## 5. Arquitetura operacional

```text
Browser / Next.js UI
        ↓
Server Actions / SSR
        ↓
Supabase Auth + RLS
        ↓
public SECURITY INVOKER RPCs
        ↓
private controlled implementations
        ↓
PostgreSQL domains
  ├─ products / suppliers
  ├─ purchases / receipts
  ├─ inventory / stock_movements
  └─ sales / sale_items
```

Princípios:
- cliente envia intenção;
- ator deriva da sessão;
- saldo e movimentos são autoritativos no banco;
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

Baseline funcional PHASE-14:
`1011194369b16b33d108c100e8c49e12d15a4f17`

Merges somente documentais após essa baseline podem avançar `main` e o SHA reportado pelo Render sem alterar a árvore funcional.

## 8. Fora do escopo atual

- pagamento Pix/cartão integrado;
- caixa financeiro;
- clientes/fiado;
- fiscal/NF-e/NFC-e;
- devoluções/trocas;
- promoções/comissões;
- lotes/validade;
- multi-loja;
- automação/IA de demanda.

Essas capacidades exigem novas missões.

## 9. Regra de continuidade

Ao retomar:
1. verificar GitHub/Render/Supabase live;
2. usar este arquivo como mapa canônico;
3. consultar o PRF da PHASE-14 para evidência de closeout;
4. abrir novas expansões como fases separadas.
