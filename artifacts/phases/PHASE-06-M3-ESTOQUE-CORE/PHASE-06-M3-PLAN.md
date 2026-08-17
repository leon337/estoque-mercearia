# PHASE-06 / M3 — Núcleo de Estoque — PLAN

## Contrato

```yaml
mission_id: ESTOQUE-MERCEARIA-001
phase_id: PHASE-06-M3-ESTOQUE-CORE
title: Núcleo de Estoque
objective: Implementar o núcleo transacional de estoque do MVP com saldo atual, inventário inicial, entrada, saída e ajuste rastreáveis.
expected_outcome: Toda alteração de saldo ocorre por uma operação atômica, idempotente, autorizada e auditável, sem estoque negativo.
risk_class: B
current_state: PLANEJADO
cycle: 1
decision_authority: Leo
permission_profile: SCOPED_WRITE
branch: feature/m3-inventory-core
repository: leon337/estoque-mercearia
```

## Escopo

- `public.inventory` como saldo atual por produto;
- `public.stock_movements` como histórico imutável;
- tipos `INITIAL`, `ENTRY`, `EXIT`, `ADJUSTMENT`;
- `operation_id` único para idempotência;
- função transacional `public.register_stock_movement`;
- bloqueio de linha antes de calcular novo saldo;
- bloqueio de estoque negativo;
- ator derivado da sessão autenticada, nunca enviado pelo navegador;
- `INITIAL` e `ADJUSTMENT` somente para ADMIN;
- `ENTRY` e `EXIT` para ADMIN e OPERATOR ativos;
- ajuste informado como contagem física final, com delta derivado pelo banco;
- motivo obrigatório para ajuste;
- wrapper de domínio TypeScript para chamada do RPC;
- testes de contrato, integração no Supabase real, concorrência e idempotência;
- PRF Classe B completo.

## Fora de escopo

- telas operacionais de entrada/saída/ajuste;
- dashboard e alertas de estoque baixo;
- histórico visual;
- usuários/permissões além das regras necessárias ao núcleo;
- compras, fornecedores, POS/fiscal, previsão e automações.

Esses itens permanecem para milestones posteriores, especialmente M4 (operação da loja) e M5 (histórico/dashboard).

## Critérios de aceite

1. cada produto possui no máximo um saldo em `inventory`;
2. toda movimentação registra `previous_quantity`, `quantity_delta`, `resulting_quantity`, `performed_by` e `created_at`;
3. `operation_id` é único e replay do mesmo payload não duplica movimento;
4. reutilizar `operation_id` com payload incompatível é rejeitado;
5. `INITIAL` só pode ser registrado uma vez por produto e aceita contagem >= 0;
6. `ENTRY(q)` soma `q`, com `q > 0`;
7. `EXIT(q)` subtrai `q`, com `q > 0`, e nunca permite resultado negativo;
8. `ADJUSTMENT(counted_quantity)` define o saldo para a contagem física >= 0 e deriva o delta; motivo é obrigatório;
9. `INITIAL` e `ADJUSTMENT` exigem ADMIN ativo;
10. `ENTRY` e `EXIT` exigem usuário autenticado e ativo;
11. produto inexistente ou inativo não aceita movimentação;
12. saldo é bloqueado com `FOR UPDATE` antes do cálculo, serializando concorrência por produto;
13. `stock_movements` não pode ser alterado ou apagado pela aplicação;
14. clientes autenticados não podem inserir/atualizar/apagar diretamente `inventory` ou `stock_movements`;
15. `performed_by` é obtido de `auth.uid()` e não existe parâmetro de ator no RPC/wrapper;
16. cenário principal: INITIAL 20 + ENTRY 10 - EXIT 4 = 26, com três movimentos rastreáveis;
17. concorrência sobre saldo 10 com saídas 7 e 6 nunca produz saldo negativo;
18. CI normal permanece verde;
19. migration, RLS, constraints, atomicidade, idempotência e concorrência são validadas em banco real ou ambiente equivalente verificável;
20. Security Advisor sem achado crítico/alto introduzido pelo M3.

## Decisões técnicas

- Banco é a autoridade do saldo; o cliente envia intenção, não saldo resultante.
- O RPC é uma função Postgres transacional chamada por `supabase.rpc`.
- A função usa `SECURITY DEFINER`, `search_path` vazio, autorização explícita e `EXECUTE` apenas para `authenticated`.
- O saldo de cada produto é serializado com lock de linha em `inventory`.
- `operation_id` é a chave de idempotência.
- `stock_movements` é append-only para o caminho da aplicação.
- A UI operacional não será antecipada neste milestone.

## Agentes selecionados

- **MESTRE** — contrato, sequência e checkpoint;
- **Miriam** — retomada a partir do M2 e fonte de verdade;
- **Rafael** — implementação técnica e integração do núcleo;
- **Manoel** — schema, função transacional, locks, constraints e concorrência;
- **Renato** — RED→GREEN, integração, concorrência, idempotência e smoke;
- **Ricardo** — autorização, privilégios, RLS e revisão do `SECURITY DEFINER`;
- **Vinícius** — code review do diff final;
- **Augusto** — mission trace obrigatório Classe B;
- **Carmem** — consistência do PRF;
- **Gabriel** — branch, PR, CI e integração;
- **Emily** — auditoria independente;
- **LÉO** — gate operacional.

Helena não é convocada para entrega de UI porque as telas operacionais pertencem ao M4.

## Fluxo

`PLAN → INTERNAL PLAN APPROVAL → RED → GREEN → DB INTEGRATION → CONCURRENCY/IDEMPOTENCY → SECURITY REVIEW → CODE REVIEW → PRF → AUDIT → LEO GATE → MERGE/CHECKPOINT`

## Autorizações e proibições

Autorizado `SCOPED_WRITE` somente em `feature/m3-inventory-core`, migration no projeto Supabase já vinculado e testes controlados com fixtures removíveis.

Proibido: escrita direta em `main`, deploy público, service-role no navegador, atualização direta de saldo pela aplicação, alteração/remoção silenciosa de histórico e merge com CI vermelha ou sem gate.
