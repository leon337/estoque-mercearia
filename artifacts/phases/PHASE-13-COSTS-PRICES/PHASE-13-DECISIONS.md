# PHASE-13 — Decisões

## D1 — Monetário não governa estoque
Quantidades e saldos continuam exclusivos do domínio de estoque. Custo/preço não entram no RPC de movimentação.

## D2 — Totais derivados
Não persistir subtotal/total financeiro; calcular `quantidade × valor unitário` na leitura/UI.

## D3 — Último custo recebido
Recebimento confirmado atualiza `products.cost_price` para o `unit_cost` daquele item dentro da transação.

## D4 — Recovery do smoke
A falha `Locator.toHaveValue` foi classificada como harness E2E, corrigida por `inputValue()` com comparação explícita. Nenhuma regra de domínio foi alterada.

## D5 — Ressalva móvel
`small_touch_target` em 320 px é não bloqueante para a PHASE-13 e passa para a PHASE-14, cujo contrato reduz o bottom nav a cinco destinos.

## Gate LÉO
Decisão: `APROVAR_COM_RESSALVAS`.

Fundamento: CI e funcionalidade passam; banco e segurança foram validados; Production Smoke não contém FAIL/BLOCKED, e a única ressalva é visual, identificada e já contratada na fase seguinte.
