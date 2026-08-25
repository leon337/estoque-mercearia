# PHASE-14 — Relatório de execução

## Resultado
A PHASE-14 implementou Vendas / PDV mínimo sobre a baseline PHASE-13:

- `sales` e `sale_items`;
- estados `DRAFT`, `COMPLETED`, `CANCELLED`;
- snapshot autoritativo de `products.sale_price`;
- quantidade com precisão por unidade;
- conclusão transacional e idempotente;
- baixa via `private.register_stock_movement(..., 'EXIT', ...)`;
- rejeição atômica de estoque insuficiente;
- UI `/sales`, `/sales/new`, `/sales/[id]`;
- navegação mobile priorizada para 320 px;
- Production Smoke cobrindo criação, estoque inicial, venda, baixa e saldo final.

## Implementação
PR #42 — `feat: PHASE-14 vendas / PDV mínimo`.

Merge funcional inicial:
`ee2d16eeac4b787096313443ce0fbfa2388116a6`.

CI pré-merge:
- run `32806378496`;
- job `97677178335`;
- lint, 134/134 testes, typecheck e build PASS.

## Achados corrigidos
### `0014`
Reativação de item reutilizado agora recaptura `products.sale_price`.

### `0015`
Item de produto posteriormente inativado pode ser removido de venda ainda `DRAFT` sem enfraquecer o freeze fora de `DRAFT`.

### `0016`
O smoke pós-merge revelou PostgreSQL `42702` em `private.complete_sale()` por ambiguidade de `id`. A migration `0016_complete_sale_qualified_item_id.sql` qualificou `public.sale_items.id`.

Recovery PR #45:
- RED: run `32807016706`, job `97678998323`, 134/135;
- GREEN: run `32807140246`, job `97679344873`, lint + 135/135 + typecheck + build PASS;
- merge: `1011194369b16b33d108c100e8c49e12d15a4f17`.

## Supabase
Migrations aplicadas:
- `0013_sales.sql`;
- `0014_sales_item_price_reactivation.sql`;
- `0015_sales_item_inactive_product_removal.sql`;
- `0016_complete_sale_qualified_item_id.sql`.

A reprodução controlada após `0016` retornou `COMPLETED` e foi revertida deliberadamente para não persistir dados de teste.

## Render
Serviço `estoque-mercearia`:
- service id `srv-da1et8pt0dsc73bn9pgg`;
- branch `main`;
- auto-deploy ativo;
- deploy `dep-da6heh49v7es739qa22g`;
- commit `1011194369b16b33d108c100e8c49e12d15a4f17`;
- status `live`;
- finished at `2026-08-25T04:18:28.803817Z`.

## Production Smoke final
- run `32808403066`;
- job `97682929264`;
- head SHA `1011194369b16b33d108c100e8c49e12d15a4f17`;
- workflow conclusion `success`;
- `PRODUCTION_SMOKE overall=PASS`;
- artifact `9548993617`;
- digest `sha256:2b4741d6da0f93a8606f7658d5d5e1acd3506c7aef355058e87bacfab0d535df`;
- 90 arquivos de evidência.

## Aceite no banco
O cenário QA final comprovou:
- venda `COMPLETED`;
- quantidade vendida `3`;
- snapshot `4.99`;
- movimento `EXIT`;
- delta `-3`;
- saldo `5 → 2`;
- produto QA inativado no cleanup.

## Auditoria e gate
Emily: `PASS`.
LÉO: `APROVAR`.

## Estado
Objetivo técnico e operacional atingido. Pendente apenas o merge deste PRF para materializar o estado terminal `ENTREGUE`.
