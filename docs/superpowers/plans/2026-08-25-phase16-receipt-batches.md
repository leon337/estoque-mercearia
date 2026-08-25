# PHASE-16 — Lotes e validade de recebimentos — Plano

1. RED: exigir migration `0017_receipt_batches.sql`, ações, páginas `/batches` e `/batches/new`, navegação e smoke.
2. GREEN banco: criar tabela/RLS/grants e triggers de ator, precisão e limite por receipt item.
3. GREEN aplicação: helpers de validade, actions ADMIN e páginas SSR com joins feitos por mapas/consultas separadas.
4. Integrar lotes à navegação desktop e alertas de validade ao centro `/alerts`, sem expandir bottom nav.
5. Adicionar runner de smoke para `/batches` e `/batches/new` autenticado/ADMIN.
6. `verify` completo.
7. Aplicar `0017` no Supabase e validar schema/policies/grants/trigger.
8. Merge somente após PHASE-15 estar formalmente fechada; confirmar Render LIVE; Production Smoke pós-deploy.
9. PRF Classe B, auditoria e closeout.
