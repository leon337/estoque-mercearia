# PHASE-14 — Decisões

## D1 — Reutilizar o domínio autoritativo de estoque
A conclusão de venda usa `private.register_stock_movement` com `EXIT`; não foi criado segundo motor de saldo.

## D2 — Snapshot de preço no banco
`unit_sale_price` é derivado de `products.sale_price` no boundary autoritativo. O cliente envia intenção e quantidade, não preço autoritativo.

## D3 — Totais derivados
Subtotal/total não são agregados monetários persistidos nesta fase.

## D4 — Lifecycle mínimo
Estados: `DRAFT`, `COMPLETED`, `CANCELLED`. Estrutura fica congelada fora de `DRAFT`.

## D5 — Recovery forward-only
Como `0013` já havia sido aplicada no banco hospedado, correções foram materializadas em migrations incrementais `0014`, `0015` e `0016`, sem reescrever migration histórica aplicada.

## D6 — Falha pós-merge não foi mascarada
O Production Smoke `32806536045` foi tratado como FAIL. A causa PostgreSQL `42702` foi reproduzida, coberta por TDD RED e corrigida antes de novo gate.

## D7 — Evidência antes de ENTREGUE
O smoke final e o banco comprovam comportamento. O estado `ENTREGUE` ficará bloqueado até existir evidência direta da identidade LIVE no Render exigida pela Issue #41.
