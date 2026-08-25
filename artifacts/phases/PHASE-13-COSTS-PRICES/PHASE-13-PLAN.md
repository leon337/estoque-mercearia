# PHASE-13 — Plano de fechamento

Issue: #37  
Classe de risco: B

## Objetivo
Adicionar custos e preços operacionais mínimos sem transformar o Estoque Mercearia em sistema financeiro.

## Escopo entregue
- `products.cost_price numeric(14,4)`;
- `products.sale_price numeric(14,2)`;
- `purchase_order_items.unit_cost numeric(14,4)`;
- totais derivados em runtime;
- atualização do custo atual no recebimento confirmado;
- escrita monetária ADMIN-only;
- separação entre dimensão monetária e estoque quantitativo;
- Production Smoke com prova de persistência monetária.

## Gates
1. TDD RED→GREEN.
2. Migration hospedada e validada.
3. CI `verify` verde.
4. Deploy da feature em produção.
5. Production Smoke pós-deploy.
6. Auditoria independente e decisão LÉO.
7. PRF + fechamento da Issue.
