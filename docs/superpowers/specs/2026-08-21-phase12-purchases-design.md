# PHASE-12 — Pedidos de compra e recebimento — Design

## Objetivo
Adicionar um fluxo de compras sem dimensão monetária, ligando fornecedor, pedido e recebimento ao estoque autoritativo existente.

## Boundary funcional
- ADMIN cria e edita pedidos em `DRAFT`.
- Um pedido pertence a um fornecedor ativo.
- Itens aceitam somente produtos ativos com vínculo ativo ao fornecedor.
- Ao sair de `DRAFT`, a estrutura dos itens é congelada.
- `ORDERED` aceita recebimentos parciais; o estado deriva para `PARTIALLY_RECEIVED` ou `RECEIVED`.
- Cancelamento é permitido somente antes de qualquer recebimento.
- Não existem preço, custo, desconto, frete, imposto, pagamento ou fiscal nesta fase.

## Modelo de dados
- `purchase_orders`: fornecedor, status, observações, ator e timestamps.
- `purchase_order_items`: pedido, produto, quantidade pedida e recebida acumulada.
- `purchase_receipts`: pedido, `operation_id` idempotente, ator e timestamp.
- `purchase_receipt_items`: item recebido, quantidade e `stock_movement_id` correspondente.

## Invariantes
1. `received_quantity <= ordered_quantity`.
2. quantidade respeita a precisão da unidade do produto.
3. item de pedido só pode ser alterado enquanto o pedido está `DRAFT`.
4. recebimento não pode operar em `DRAFT`, `RECEIVED` ou `CANCELLED`.
5. toda quantidade recebida gera exatamente um `ENTRY` no domínio de estoque.
6. repetição do mesmo `operation_id` de recebimento não duplica saldo.
7. falha em qualquer item reverte todo o recebimento e todos os movimentos da operação.
8. ator deriva da sessão; mutações exigem ADMIN.
9. histórico de recebimentos não é deletado pela aplicação.

## Arquitetura transacional
O recebimento é implementado em função privada `SECURITY DEFINER`. Ela valida autorização e pedido, bloqueia as linhas envolvidas, valida quantidades e vínculos, chama `private.register_stock_movement` para cada item e só então persiste/atualiza o estado do pedido. Um wrapper público `SECURITY INVOKER` expõe somente a intenção aprovada ao cliente autenticado.

## UI
- `/purchases`: listagem e status.
- `/purchases/new`: criação do pedido por fornecedor.
- `/purchases/[id]`: itens, transição para enviado, cancelamento e recebimento.
- navegação mobile-first preservando o shell atual.

## Segurança
Leitura: usuário autenticado e ativo. Escrita: ADMIN. Sem `DELETE` para tabelas de histórico. Nenhuma service role no runtime da aplicação.

## Fora de escopo
Custos/preços (PHASE-13), contas a pagar, fiscal/NF-e, devolução a fornecedor, vendas/PDV (PHASE-14), integrações externas.
