# PHASE-13 — Custos e preços operacionais — Design

## Objetivo
Adicionar a dimensão monetária mínima necessária para compras e preparação do PDV, preservando estoque como domínio quantitativo autoritativo e sem introduzir contabilidade/financeiro.

## Boundary funcional
- produto possui `cost_price` (custo atual/último custo recebido) e `sale_price` (preço de venda atual);
- item de pedido possui `unit_cost`, editável somente em `DRAFT`;
- totais de item e pedido são derivados, nunca autoridade persistida;
- recebimento confirmado atualiza `cost_price` do produto para o `unit_cost` daquele item;
- ADMIN mantém custos e preços; leitura segue o boundary de usuário ativo existente;
- quantidade, saldo e idempotência continuam no domínio de estoque sem depender de valores monetários.

## Precisão monetária
- `sale_price`: `numeric(14,2)`, não negativo;
- `cost_price`: `numeric(14,4)`, não negativo;
- `unit_cost`: `numeric(14,4)`, não negativo.

## Arquitetura
A migration `0012_costs_prices.sql` adiciona as colunas e constraints. Um trigger privado em `purchase_receipt_items` atualiza o custo atual do produto dentro da mesma transação do recebimento, evitando duplicar ou reescrever o RPC de estoque. Uma validação dedicada impede alteração de `unit_cost` depois de `DRAFT`.

## UI
- formulários de produto: custo atual e preço de venda;
- listagem/edição de produtos: exibição monetária em BRL;
- detalhe de compra: custo unitário do item e total derivado;
- nenhuma superfície financeira adicional.

## Segurança
- escrita monetária exige ADMIN;
- `unit_cost` segue os grants/policies de item de compra;
- trigger privado não é executável diretamente por papéis de aplicação;
- sem service role no runtime.

## Fora de escopo
Média ponderada, CMV contábil, margem realizada, impostos, frete, descontos, contas a pagar, pagamentos, fiscal/NF-e e vendas/PDV (PHASE-14).
