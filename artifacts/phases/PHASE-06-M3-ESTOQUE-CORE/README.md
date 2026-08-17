# PRF — PHASE-06 / M3 — Núcleo de Estoque

Pacote de rastreabilidade Classe B do MCF para o milestone M3.

## Artefatos

- `PHASE-06-M3-PLAN.md` — contrato, escopo e critérios de aceite.
- `MISSION-TRACE.md` — execução ESEV cronológica e passagens internas.
- `PHASE-06-M3-REPORT.md` — implementação e riscos residuais.
- `PHASE-06-M3-VALIDATION.txt` — resumo verificável.
- `PHASE-06-M3-VALIDATION-FULL.txt` — evidência detalhada de TDD, integração, concorrência e privilégios.
- `PHASE-06-M3-SMOKE.txt` — estado do smoke funcional/concorrente.
- `PHASE-06-M3-CHECKPOINT.yaml` — estado retomável da missão.
- `PHASE-06-M3-DECISIONS.md` — decisões de arquitetura/governança.
- `PHASE-06-M3-ARTIFACT-MANIFEST.sha256` — integridade do pacote.

## Regra de leitura

`PASS_WITH_RESERVATION` não equivale a PASS integral. As ressalvas do harness concorrente/HTTP e o WARN de `SECURITY DEFINER` devem permanecer visíveis no gate e no próximo checkpoint.
