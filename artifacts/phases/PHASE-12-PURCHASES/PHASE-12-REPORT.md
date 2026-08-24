# PHASE-12 — Relatório de execução

## Objetivo
Adicionar pedidos de compra e recebimento sobre a baseline PHASE-11, preservando estoque autoritativo, RLS, idempotência e precisão por unidade, sem antecipar dimensão monetária.

## Entrega funcional
A fase materializou `purchase_orders`, `purchase_order_items`, `purchase_receipts` e `purchase_receipt_items`, lifecycle `DRAFT → ORDERED → PARTIALLY_RECEIVED/RECEIVED`, cancelamento antes de recebimento, vínculos obrigatórios com fornecedor/produto ativo e recebimento transacional por `ENTRY` no domínio de estoque.

A UI publicada inclui `/purchases`, `/purchases/new` e `/purchases/[id]`, com mutações ADMIN-only e leitura para usuário ativo.

## Integração e recoveries
- PR #32: implementação funcional da PHASE-12;
- PR #34: recovery de persistência de item e compactação do bottom nav;
- PR #35: smoke passou a aguardar rota real de detalhe de compra;
- PR #36: desabilitou cache de framework nas leituras Supabase server-side;
- PR #39: leitura da tela de estoque passou a consultar `public.inventory` diretamente por `product_id`.

O último recovery teve RED CI `32787555598` e GREEN CI `32787782198`, com lint, testes, typecheck e build PASS.

## Banco hospedado
Migration `0011_purchases.sql` aplicada no projeto Supabase `exwtngpwqgkrkoszpgib`.

Validações live durante os recoveries confirmaram que pedidos QA chegavam a `RECEIVED`, `received_quantity` refletia a quantidade recebida e `public.inventory` persistia o saldo autoritativo esperado.

## Produção final
Render publicou `main@826ea2b798e19761acf55cedbe54032f0bf927ce` como deploy live.

Production Smoke final:
- run `32788784924`;
- job `97626059502`;
- head SHA `826ea2b798e19761acf55cedbe54032f0bf927ce`;
- smoke normal PASS;
- critical review PASS;
- enforcement PASS;
- artifact `9542459270`;
- digest `sha256:2e59a630a0555a865952cec3a3c0e467e2f39ecca6bbf80c49d76ba082dc6e59`.

## Resultado
Critérios técnicos e operacionais atendidos. PHASE-12 qualificada para `ENTREGUE`.
