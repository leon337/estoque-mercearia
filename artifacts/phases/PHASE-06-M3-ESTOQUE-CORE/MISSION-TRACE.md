# MISSION TRACE — PHASE-06 / M3 — Núcleo de Estoque

## ESEV cronológico

### 1. MESTRE — contrato e seleção
**Input:** checkpoint M2, arquitetura aprovada e autorização humana para iniciar.  
**Ação:** classificou M3 como Classe B / `SCOPED_WRITE`, delimitou núcleo transacional e excluiu UI.  
**Evidência:** `PHASE-06-M3-PLAN.md`, branch `feature/m3-inventory-core`, PR #5 draft.  
**Resultado:** plano aprovado internamente.  
**Decisão:** avançar para RED.  
**Passagem interna:** MESTRE → Renato: criar teste que falha pela ausência do núcleo.

### 2. Renato — RED inicial
**Input:** critérios 1–20 do plano.  
**Ação:** criou `tests/m3-inventory-core.test.mjs` antes da implementação.  
**Evidência:** CI `32009651368`: `npm ci` PASS, lint PASS, testes M3 FAIL por ausência de migration/wrapper; typecheck/build não executados.  
**Resultado:** RED válido.  
**Decisão:** liberar implementação mínima.  
**Passagem interna:** Renato → Manoel/Rafael: implementar schema/RPC/wrapper suficientes para GREEN.

### 3. Manoel + Rafael — núcleo transacional
**Input:** RED inicial.  
**Ação:** implementaram `0003_inventory_core.sql` e wrapper TypeScript.  
**Evidência:** CI `32009794344`: npm ci, lint, testes, typecheck e build PASS.  
**Resultado:** GREEN de contrato.  
**Decisão:** validar em banco hospedado.  
**Passagem interna:** Rafael → Renato: executar integração funcional real.

### 4. Renato — integração funcional hospedada
**Input:** migration `inventory_core` aplicada ao Supabase.  
**Ação:** executou fixture transacional descartável.  
**Evidência:** INITIAL 20; replay idempotente; conflito de operation_id; ENTRY +10; EXIT -4; rejeição de saldo insuficiente; ajuste ADMIN; motivo obrigatório; bloqueios por usuário/produto inativo; ator correto; histórico imutável. Rollback retornou 0 fixtures.  
**Resultado:** cenário 20 + 10 - 4 = 26 e regras centrais PASS.  
**Decisão:** avançar à concorrência e manutenção.

### 5. Renato — tentativas de smoke HTTP concorrente
**Input:** necessidade de duas requisições reais em paralelo.  
**Ação:** criou workflow temporário com Auth hospedado.  
**Evidência:** tentativas falharam em `signInWithPassword` com `LOGIN_FAILED: {}` antes de qualquer leitura de saldo/RPC; nenhuma tentativa foi contabilizada como PASS.  
**Resultado:** harness HTTP inconclusivo, sem evidência de falha do núcleo.  
**Decisão:** buscar prova concorrente no PostgreSQL hospedado.  
**Passagem interna:** Renato → Manoel: abrir sessões independentes no banco.

### 6. Manoel + Renato — concorrência PostgreSQL
**Input:** saldo 10 e duas saídas concorrentes 7 e 6.  
**Ação:** usaram duas sessões independentes via `dblink` temporário e role sem DML direto.  
**Evidência:** ambas as consultas assíncronas foram disparadas; apenas uma movimentação EXIT foi persistida, `previous_quantity=10`, `quantity_delta=-7`, `resulting_quantity=3`; nenhuma segunda movimentação/oversell persistiu.  
**Resultado:** serialização por produto observada; saldo permaneceu não negativo. O helper comparou boolean textual `false` em vez da representação PostgreSQL `f`, fazendo a asserção do harness falhar e perder o texto exato da segunda resposta.  
**Decisão:** registrar prova de não-oversell como válida e captura exata da segunda resposta como ressalva; não declarar smoke concorrente integral como PASS.

### 7. Renato — manutenção: ciclo TDD inválido detectado
**Input:** necessidade de remover fixtures sem relaxar imutabilidade da aplicação.  
**Ação:** primeiro teste de manutenção foi criado com erro de sintaxe.  
**Evidência:** CI `32010751883` falhou no lint/parser antes de testar comportamento.  
**Resultado:** essa execução NÃO é RED TDD válido.  
**Decisão:** corrigir a trilha, retirar a migration e repetir RED corretamente.

### 8. Renato — manutenção: RED válido
**Input:** teste corrigido, migration `0004` ausente.  
**Ação:** executou CI.  
**Evidência:** CI `32011317459`: npm ci PASS, lint PASS, testes FAIL por `0004_inventory_core_maintenance.sql` ausente; typecheck/build interrompidos.  
**Resultado:** RED válido.  
**Passagem interna:** Renato → Rafael: implementar exceção somente para owner `postgres`.

### 9. Rafael + Manoel — manutenção controlada
**Input:** RED válido.  
**Ação:** `0004` permite UPDATE/DELETE do histórico somente quando `current_user='postgres'`; aplicação continua recebendo `STOCK_MOVEMENT_IMMUTABLE`.  
**Evidência:** migration hospedada `20260817083117`; CI `32011367037` totalmente PASS; cleanup de todos os fixtures, role e extensão temporária confirmou zero resíduos.  
**Resultado:** manutenção administrativa sem abrir bypass à aplicação.

### 10. Ricardo — hardening de service_role
**Input:** revisão de privilégios efetivos.  
**Ação:** detectou DML padrão de `service_role` em `inventory`/`stock_movements` e execução do RPC.  
**Evidência:** consultas `has_table_privilege`/`has_function_privilege` no banco hospedado.  
**Resultado:** achado de least privilege antes do gate.  
**Decisão:** voltar a RED→GREEN.

### 11. Renato → Rafael — RED/GREEN de least privilege
**Input:** achado de Ricardo.  
**Ação RED:** criou `tests/m3-inventory-privileges.test.mjs`; CI `32011620798` falhou nos testes com `0005` ausente, após install/lint PASS.  
**Ação GREEN:** criou `0005_inventory_core_privileges.sql`, revogando DML/TRUNCATE e EXECUTE do RPC de `service_role`.  
**Evidência:** banco efetivo: authenticated SELECT=true/write=false/RPC=true; anon RPC=false; service_role write=false/RPC=false. CI `32011673779` totalmente PASS.  
**Resultado:** caminho operacional único de escrita fechado.

### 12. Ricardo + Vinícius — revisão
**Input:** diff final e estado hospedado.  
**Ação:** revisaram `SECURITY DEFINER`, RLS, privilégios, wrapper, locks, imutabilidade e escopo.  
**Evidência:** Security Advisor: 1 WARN esperado `authenticated_security_definer_function_executable`, 0 crítico/alto; nenhum caminho alternativo de DML permaneceu para authenticated/service_role.  
**Resultado:** sem bloqueio técnico; WARN intencional documentado.  
**Passagem interna:** Vinícius/Ricardo → Carmem: consolidar PRF; depois Emily audita.
