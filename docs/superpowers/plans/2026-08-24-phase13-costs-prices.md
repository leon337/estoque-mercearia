# PHASE-13 — Custos e preços operacionais — Plano de implementação

Issue: #37

## Sequência
1. RED: contratos para migration monetária, formulário/ações de produto, item de compra e atualização de custo no recebimento.
2. Banco: `0012_costs_prices.sql` com colunas, precisão, grants mínimos, proteção de `unit_cost` fora de DRAFT e trigger de último custo recebido.
3. Aplicação: parse/validação ADMIN de custo/preço; campos e formatação BRL; `unit_cost` no item de compra e totais derivados.
4. Supabase: aplicar migration e validar constraints/trigger com transação protegida.
5. GREEN: lint + testes + typecheck + build.
6. Integração sob `verify`, deploy e Production Smoke pós-merge.
7. PRF Classe B e fechamento da Issue #37.

## Critérios de aceite
- valores negativos são rejeitados no banco e Server Actions;
- precisão monetária não é silenciosamente arredondada pela aplicação;
- `unit_cost` não muda após o pedido deixar DRAFT;
- recebimento atualiza `products.cost_price` dentro da transação;
- totais exibidos são derivados de quantidade × custo/preço;
- domínio de estoque continua recebendo apenas quantidade/intenção;
- nenhum fluxo financeiro/fiscal é criado.
