# PHASE-12 — Plano de implementação

## Baseline
`main@f08c7600a808a3a22701ff4a2b6e6ee1c722a190`

## Gate de entrada
A implementação pode avançar em branch. Merge em `main` permanece bloqueado até a PHASE-11 obter Production Smoke E2E PASS e closeout rastreável.

## Sequência
1. Criar contratos RED de migration, ações, UI, navegação e smoke.
2. Implementar `0011_purchases.sql` com RLS, constraints, bloqueio de itens fora de DRAFT e RPC transacional/idempotente de recebimento.
3. Implementar Server Actions ADMIN-only e superfícies `/purchases`.
4. Integrar navegação e lifecycle no Production Smoke.
5. Executar CI completa até GREEN.
6. Aplicar/validar migration no Supabase hospedado.
7. Revisar segurança e boundary transacional.
8. Abrir PR e qualificar HEAD exato.
9. Somente após gate PHASE-11: integrar, observar deploy e executar Production Smoke pós-merge.
10. Gerar PRF Classe B e fechar Issue #31.

## Critérios de aceite
- RED observado antes do código.
- CI: lint, testes, typecheck e build PASS.
- RLS e privilégios validados no banco hospedado.
- recebimento parcial/totais e idempotência validados.
- nenhuma dimensão monetária introduzida.
- Production Smoke PASS pós-merge.
- PRF completo.

## Equipe por competência
MESTRE (orquestração), Leonardo (produto), Sofia (arquitetura), Ricardo (segurança), Helena (UI), Beatriz/Renato (testes), Gabriel (Git/deploy), Augusto (trace), Carmem (PRF), Emily (auditoria), LÉO (gate operacional).
