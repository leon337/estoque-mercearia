# PHASE-16 — Plano executado

Fonte versionada: `docs/superpowers/plans/2026-08-25-phase16-receipt-batches.md`.

## Sequência
1. RED exigindo migration `0017_receipt_batches.sql`, ações, páginas `/batches` e `/batches/new`, navegação e smoke.
2. Banco GREEN com tabela, RLS, grants e triggers de ator, precisão e limite por receipt item.
3. Aplicação GREEN com helpers de validade, Server Actions ADMIN e SSR.
4. Integração à navegação desktop e ao centro `/alerts`, sem expandir bottom-nav.
5. Runner de Production Smoke para `/batches` e `/batches/new`.
6. `verify` completo.
7. Migration aplicada e validada no Supabase live.
8. Integração somente após closeout formal da PHASE-15.
9. Render LIVE + Production Smoke pós-deploy.
10. Recovery TDD do finding responsivo detectado no primeiro smoke canônico.
11. Requalificação integral e PRF Classe B.
