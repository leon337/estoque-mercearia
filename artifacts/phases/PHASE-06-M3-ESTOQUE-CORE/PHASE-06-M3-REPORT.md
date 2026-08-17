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
- cleanup final: zero resíduos de fixtures, role temporária, extensão `dblink` e workflow temporário.

## Segurança / Advisor

- crítico: 0
- alto: 0
- WARN: 1 — `authenticated_security_definer_function_executable` em `register_stock_movement`.

O WARN é intencional: `authenticated` precisa executar o RPC privilegiado enquanto as tabelas permanecem sem DML direto. Mitigações: `search_path=''`, `auth.uid()` como ator, papel/perfil ativo, produto ativo, validações, locks e EXECUTE negado a anon/service_role.

## Auditoria e gate

- **Emily:** `APROVADO_COM_RESSALVA`, sem achado bloqueante.
- **LÉO:** `APROVAR_COM_RESSALVA` → `APROVADO_PARA_INTEGRACAO_COM_RESSALVA`.

Ressalvas obrigatórias:
1. resposta exata da segunda sessão concorrente não preservada pelo harness;
2. smoke HTTP concorrente inconclusivo antes do RPC;
3. WARN de `SECURITY DEFINER` permanece monitorado.

## Estado

Aprovado para integração com ressalva, condicionado a manifesto SHA-256 final, CI final verde e ausência de thread de revisão bloqueante.
