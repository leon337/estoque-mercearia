# PHASE-14 — Decisões

## D1 — Reutilizar o domínio autoritativo de estoque
A conclusão de venda usa `private.register_stock_movement` com `EXIT`; não existe um segundo motor de saldo.

## D2 — Snapshot de preço no banco
`unit_sale_price` deriva de `products.sale_price` no boundary autoritativo. O cliente envia intenção e quantidade, não preço autoritativo.

## D3 — Totais derivados
Subtotal/total não são agregados monetários persistidos nesta fase.

## D4 — Lifecycle mínimo
Estados: `DRAFT`, `COMPLETED`, `CANCELLED`. Estrutura fica congelada fora de `DRAFT`.

## D5 — Recoveries forward-only
Como `0013` já estava aplicada no banco hospedado, correções foram versionadas em migrations incrementais `0014`, `0015` e `0016`, sem reescrever migration histórica aplicada.

## D6 — Falhas de smoke não são mascaradas
O Production Smoke `32806536045` foi tratado como FAIL. A causa PostgreSQL `42702` foi reproduzida, coberta por TDD e corrigida antes do novo gate.

## D7 — Evidência de produção
O estado terminal depende de CI GREEN, banco, Render LIVE no SHA funcional integrado e Production Smoke pós-deploy PASS. Todos foram comprovados.

## D8 — Gate final
Auditoria: `PASS`. Gate LÉO: `APROVAR`.
