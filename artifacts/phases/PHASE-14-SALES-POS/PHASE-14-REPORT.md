# PHASE-14 — Relatório de execução

## Resultado funcional
Foi implementado o fluxo mínimo de vendas/PDV:
- tabelas `sales` e `sale_items`;
- estados `DRAFT`, `COMPLETED`, `CANCELLED`;
- snapshot autoritativo de `products.sale_price`;
- conclusão transacional e idempotente;
- baixa de estoque via `private.register_stock_movement(..., 'EXIT', ...)`;
- UI `/sales`, `/sales/new`, `/sales/[id]`;
- navegação mobile limitada aos destinos prioritários;
- Production Smoke cobrindo criação, estoque inicial, venda e saldo final.

## Integração principal
PR #42 — `feat: PHASE-14 vendas / PDV mínimo`  
HEAD final antes do merge: `1c94714169af6000d3c00cbbdccfb75f57f57c87`  
Merge em `main`: `ee2d16eeac4b787096313443ce0fbfa2388116a6`

CI final pré-merge:
- run `32806378496`;
- job `97677178335`;
- lint PASS;
- 134/134 testes PASS;
- typecheck PASS;
- build PASS.

## Achados pré-merge corrigidos
1. Reativação de item reutilizado mantinha snapshot antigo.
   - recovery `0014_sales_item_price_reactivation.sql`;
   - recaptura `products.sale_price` em `active=false → true`.
2. Produto inativado impedia remover item do `DRAFT`.
   - recovery `0015_sales_item_inactive_product_removal.sql`;
   - remoção pura permanece possível sem enfraquecer o boundary de `DRAFT`.

## Falha pós-merge e recovery
Production Smoke `32806536045` / job `97677639816` falhou na conclusão de venda. A transação preservou atomicidade: venda `DRAFT`, estoque `5 UN`, sem movimento parcial.

Causa raiz reproduzida no PostgreSQL:
`42702` por ambiguidade de `id` em `private.complete_sale()` (`RETURNS TABLE (id ...)` versus `sale_items.id`).

Recovery PR #45:
- RED commit `9f85b2015ecfaac4c116cb7f0240d7cd0a163b8f`;
- RED run `32807016706` / job `97678998323`: 134/135, falha esperada;
- GREEN commit `230ec4f9a632be6dd0861f2f584edb66e0cc1515`;
- GREEN run `32807140246` / job `97679344873`: 135/135 + lint/typecheck/build PASS;
- migration `0016_complete_sale_qualified_item_id.sql`;
- merge PR #45 em `main@1011194369b16b33d108c100e8c49e12d15a4f17`.

## Banco hospedado
Migrations PHASE-14 aplicadas:
- `0013_sales.sql`;
- `0014_sales_item_price_reactivation.sql`;
- `0015_sales_item_inactive_product_removal.sql`;
- `0016_complete_sale_qualified_item_id.sql`.

A reprodução pós-`0016`, dentro de transação deliberadamente revertida, retornou:
`QA_COMPLETE_OK status=COMPLETED replayed=f`.

## Production Smoke final
Run `32808403066` / job `97682929264` em `main@1011194369b16b33d108c100e8c49e12d15a4f17`:
- workflow: success;
- normal smoke: success;
- critical review: success;
- enforcement: success;
- `PRODUCTION_SMOKE overall=PASS`.

Artifact:
- id `9548993617`;
- digest `sha256:2b4741d6da0f93a8606f7658d5d5e1acd3506c7aef355058e87bacfab0d535df`;
- 90 arquivos;
- tamanho 9,478,090 bytes.

Verificação autoritativa no banco para `QA-SALE-32808403066-1`:
- venda `COMPLETED`;
- quantidade `3`;
- `unit_sale_price=4.99`;
- movimento `EXIT`;
- `quantity_delta=-3`;
- `previous_quantity=5`;
- `resulting_quantity=2`;
- produto QA inativado no cleanup.

## Pendência de closeout
O comportamento em produção está comprovado. Ainda falta provar diretamente no provedor o critério contratual `Render LIVE no SHA integrado`. O Production Smoke contra `https://estoque-mercearia.onrender.com` não substitui a identidade de deploy reportada pelo Render.

Estado documental deste candidato: `AGUARDANDO_RENDER_IDENTITY_CHECK`.
