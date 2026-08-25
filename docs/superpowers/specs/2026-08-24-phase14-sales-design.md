# PHASE-14 — Vendas / PDV mínimo — Design

## Objetivo
Adicionar venda operacional mínima com baixa transacional de estoque, snapshot de preço e auditoria, sem introduzir caixa financeiro ou fiscal.

## Boundary funcional
- usuários ativos `ADMIN` e `OPERATOR` podem criar e operar vendas;
- venda nasce `DRAFT`, pode ser `COMPLETED` ou `CANCELLED`;
- item usa produto ativo, quantidade válida por unidade e snapshot autoritativo de `products.sale_price`;
- preço não é enviado como autoridade pelo cliente;
- conclusão é atômica: cada item gera exatamente um `EXIT` pelo domínio de estoque existente;
- estoque insuficiente reverte toda a venda;
- replay da mesma operação de conclusão não duplica movimentos;
- após `COMPLETED`/`CANCELLED`, estrutura é imutável;
- total é derivado de `quantity × unit_sale_price`.

## Modelo
### `sales`
- `id` uuid;
- `status` enum `DRAFT | COMPLETED | CANCELLED`;
- `notes` opcional;
- `created_by` da sessão;
- `completion_operation_id` uuid unique nullable;
- `completed_by` / `cancelled_by` nullable;
- timestamps.

### `sale_items`
- `id`, `sale_id`, `product_id`;
- `quantity`;
- `unit_sale_price numeric(14,2)` snapshot;
- `stock_operation_id uuid unique` gerado no banco;
- `stock_movement_id` unique nullable até conclusão;
- `active`, timestamps;
- unicidade de produto por venda.

## Arquitetura transacional
`private.complete_sale(p_sale_id, p_operation_id)` valida usuário ativo, bloqueia venda/itens, valida estado e itens, chama `private.register_stock_movement(..., 'EXIT', ...)` por item usando `stock_operation_id`, persiste o `stock_movement_id` e só então marca a venda `COMPLETED`. Toda falha reverte a transação.

Wrappers públicos `SECURITY INVOKER` expõem apenas `complete_sale` e `cancel_sale`. Inserção/remoção de item opera sob RLS e trigger privado que valida `DRAFT`, produto ativo, precisão e substitui `unit_sale_price` pelo preço atual do produto.

## UI
- `/sales`: histórico/listagem;
- `/sales/new`: cria rascunho;
- `/sales/[id]`: adiciona/remove itens, total derivado, concluir/cancelar;
- navegação mobile reduzida a destinos operacionais prioritários para preservar 320px.

## Segurança
- ator deriva de `auth.uid()`;
- nenhuma service role no runtime;
- histórico sem DELETE pela aplicação;
- snapshot monetário não é controlado pelo cliente;
- estoque segue sendo autoridade quantitativa separada.

## Fora de escopo
Pagamento, Pix/cartão, caixa, clientes/fiado, desconto, imposto, cupom/NFC-e/NF-e, devolução, promoções, comissão, multi-loja e integrações externas.
