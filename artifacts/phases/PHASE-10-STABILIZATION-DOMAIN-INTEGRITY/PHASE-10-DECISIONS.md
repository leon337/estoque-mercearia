# PHASE-10 — Decisões

1. **MESTRE** — Priorizar estabilização antes de novos módulos.
2. **P10.1** — Preservar PRFs históricos como snapshots e criar mapa de estado atual.
3. **P10.2** — `UN/CX/PCT` exigem inteiro; `KG/L/M` aceitam até 3 casas; enforcement não pode ficar somente no HTML.
4. **P10.2 recovery** — Corrigir identidade de fixture por `GITHUB_RUN_ATTEMPT` antes de repetir smoke.
5. **P10.3** — Generalizar `/smoke-production` e restringir o trigger a associações confiáveis.
6. **LEANDRO / P10.4** — Normalizar o `minimum_stock` de `0.046 UN` para `1 UN`.
7. **P10.4** — Impor precisão de estoque mínimo também no banco.
8. **HUMAN_GATE / LEANDRO** — Tornar `main` a default branch e criar ruleset `Protect main`.
9. **MESTRE** — Após o HUMAN_GATE, disparar smoke final via Issue #21 antes do encerramento.
10. **Carmem/Emily/LÉO** — Gate final permanece pendente até smoke final PASS e check `verify` do PR de closeout.
