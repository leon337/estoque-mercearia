# PHASE-16 — Decisões

1. **Lote é rastreabilidade, não saldo.** `inventory.quantity` permanece autoritativo.
2. **Sem FEFO nesta fase.** Nenhuma baixa automática ou alocação de venda por lote foi inventada.
3. **Integridade no banco.** Precisão, ator e soma de lotes ativos são protegidos por constraints/triggers.
4. **Histórico preservado.** Aplicação não recebe caminho de DELETE para `receipt_batches`.
5. **Validade é derivada.** `EXPIRED`, `EXPIRING`, `OK` e `NO_EXPIRY` são estados calculados.
6. **Finding visual é gate real.** O overflow estreito em `/batches/new` bloqueou closeout até recovery TDD e novo smoke.
7. **CAF para falha do conector.** A falha GraphQL de `mark ready` não foi tratada com repetição cega; PRs substitutas preservaram o mesmo SHA.
8. **Nenhum HUMAN_GATE.** A missão permaneceu dentro da autorização contínua registrada para PHASE-15→18 e não atingiu gatilho reservado.
9. **PHASE-17 não é inventada no closeout.** O próximo escopo deve nascer do próximo loop objetivo, a partir de evidência verificável.
