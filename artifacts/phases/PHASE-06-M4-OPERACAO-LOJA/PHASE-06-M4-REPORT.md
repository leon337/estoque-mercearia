# PHASE-06 / M4 — REPORT

## Entrega
M4 implementa a operação diária sobre o núcleo M3 sem nova migration: consulta de saldo, ENTRY/EXIT para usuários ativos, INITIAL oferecido somente a ADMIN, preview e confirmação, navegação responsiva e mensagens estáveis de erro.

## Implementação
- `/inventory`: produtos ativos + saldo + estoque mínimo + status textual ZERADO/BAIXO/OK.
- `/movements/new`: seleção de produto/tipo/quantidade, saldo atual/projetado, confirmação e `operation_id` por intenção.
- `registerMovementAction`: autenticação, perfil ativo, validação de tipo/quantidade, ADMIN para INITIAL, chamada exclusiva ao wrapper M3 e mapeamento de erros.
- `/`: launcher operacional para estoque, movimentação e produtos.

## Evidência
- RED válido: CI `32016698099`.
- Falhas corretivas preservadas: lint `32016973641`, regressão M1 `32017089246`, typecheck `32017152044`.
- GREEN final: CI `32017253510` — install/lint/tests/typecheck/build PASS; 31/31 testes.
- Smoke Supabase hospedado: PASS; saldo 5→8→6, ator correto, INITIAL de OPERATOR bloqueado; cleanup zero.
- Security Advisor: 0 crítico/alto novo; 1 WARN esperado herdado do M3 para RPC SECURITY DEFINER autenticado.

## Escopo não antecipado
Nenhuma tela de histórico/dashboard, ajuste ou administração de usuários foi adicionada. Esses itens seguem para M5/M6.