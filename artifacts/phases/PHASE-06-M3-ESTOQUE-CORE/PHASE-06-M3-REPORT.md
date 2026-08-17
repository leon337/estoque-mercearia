# PHASE-06 / M3 — REPORT

## Resultado implementado

O M3 entrega o núcleo transacional de estoque sem antecipar telas do M4.

### Banco
- `public.inventory`: um saldo por produto, `quantity >= 0`.
- `public.stock_movements`: histórico append-only com `operation_id` único, saldo anterior, delta, saldo resultante, motivo, ator e timestamp.
- `public.stock_movement_type`: `INITIAL`, `ENTRY`, `EXIT`, `ADJUSTMENT`.
- trigger de criação automática do saldo para novos produtos.
- `public.register_stock_movement(...)` como único caminho operacional de escrita.
- lock `FOR UPDATE` no saldo do produto.
- replay idempotente e conflito de `operation_id`.
- bloqueio de estoque negativo.
- INITIAL/ADJUSTMENT somente ADMIN; ENTRY/EXIT para usuário ativo.
- ajuste representa contagem física final e deriva delta.
- ator obtido por `auth.uid()`.

### Segurança
- RLS habilitada em saldo e movimentos.
- `authenticated`: SELECT direto permitido; DML direto negado; EXECUTE do RPC permitido.
- `anon`: sem DML e sem EXECUTE do RPC.
- `service_role`: DML/TRUNCATE direto revogado e EXECUTE do RPC revogado.
- RPC: `SECURITY DEFINER`, `search_path=''`, autorização explícita e ator da sessão.
- histórico bloqueia UPDATE/DELETE para a aplicação; manutenção controlada só pelo owner `postgres`.

### Aplicação
- wrapper `src/modules/inventory/register-stock-movement.ts` envia somente intenção: produto, tipo, quantidade/contagem, operation_id e motivo.
- não recebe `performed_by`, saldo anterior ou saldo resultante do navegador.

## Migrations hospedadas

- `20260817082020 / inventory_core`
- `20260817083117 / inventory_core_maintenance`
- `inventory_core_privileges` aplicada após o hardening de privilégios.

## Validação

- cenário principal 20 + 10 - 4 = 26: PASS.
- replay idempotente: PASS.
- conflito de operation_id: PASS.
- saldo insuficiente: PASS.
- ajuste/roles/motivo: PASS.
- produto/usuário inativo: PASS.
- ator e imutabilidade: PASS.
- ausência de DML direto para authenticated/service_role: PASS.
- concorrência real: duas sessões sobre saldo 10 resultaram em somente uma saída persistida, 10→3, sem oversell.
- captura textual exata do erro da segunda sessão: inconclusiva por erro do helper de teste (`false` vs `f`).
- smoke HTTP concorrente via GitHub Actions: inconclusivo no Auth antes do RPC.

## Risco residual

1. O Security Advisor mantém WARN esperado por permitir que `authenticated` execute um RPC `SECURITY DEFINER`. Esse comportamento é deliberado e é o mecanismo de encapsulamento da escrita; a função aplica validação de identidade/papel, `search_path` vazio e tabelas sem DML direto.
2. A resposta exata da segunda sessão do teste concorrente não foi preservada. A propriedade crítica observada foi mantida: uma única saída foi persistida e o saldo não ficou negativo.
3. UI de entrada/saída/ajuste continua fora de escopo e pertence ao M4.

## Estado

Implementação e validação técnica concluídas. Aguardando auditoria independente de Emily e gate de LÉO.
