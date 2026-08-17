# PHASE-06 / M3 — DECISIONS

## Decisões fechadas antes da auditoria

1. **M3 não inclui UI.** Entrada/saída/ajuste em tela pertencem ao M4.
2. **Banco é autoridade do saldo.** Navegador não envia saldo anterior/resultante nem ator.
3. **`register_stock_movement` é o único caminho operacional de escrita.**
4. **Idempotência usa `operation_id` UUID único.**
5. **Concorrência é serializada por `FOR UPDATE` em `inventory`.**
6. **`INITIAL` e `ADJUSTMENT` exigem ADMIN.**
7. **Ajuste recebe contagem física final e motivo obrigatório.**
8. **Histórico é imutável para a aplicação.** Apenas owner `postgres` pode executar manutenção controlada.
9. **Least privilege ampliado a `service_role`.** Sem DML/TRUNCATE nas tabelas e sem EXECUTE do RPC.
10. **WARN do Security Advisor é aceito para auditoria, não ignorado.** O RPC `SECURITY DEFINER` autenticado é deliberado e mitigado.
11. **Smoke HTTP concorrente não é PASS.** Falhou no Auth antes do RPC.
12. **Concorrência PostgreSQL comprovou não-oversell, com ressalva de captura.** Duas sessões produziram somente uma saída persistida e saldo 3; o texto exato da segunda resposta foi perdido por erro do harness.
13. **Execução 32010751883 não é RED válido.** O teste de manutenção tinha erro de sintaxe; o RED válido é 32011317459.

## Pendentes

- veredito independente de Emily;
- decisão de gate de LÉO;
- integração do PR #5 somente se gate permitir.
