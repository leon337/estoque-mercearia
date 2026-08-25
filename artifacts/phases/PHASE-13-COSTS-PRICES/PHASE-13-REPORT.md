# PHASE-13 — Relatório de execução

## Resultado funcional
A PHASE-13 introduziu a dimensão monetária mínima para produtos e compras:
- custo atual/último custo recebido por produto;
- preço atual de venda por produto;
- custo unitário por item de pedido;
- totais somente derivados;
- recebimento atualiza o custo atual dentro da transação existente;
- nenhuma capacidade de pagamento, fiscal, imposto, desconto, frete, CMV ou média ponderada.

## TDD e CI
- RED inicial `5889a110f71e8117c67916a66f80067cc35870b2`: CI `32787370605` falhou pelos contratos P13.
- GREEN de implementação `6971ce00a68272ab10078522d03cb34909100043`: CI `32789675405`, job `97628628955`, PASS.
- RED E2E monetário `e701367aa65975709273a4b50e3c296a8f2c5baa`: CI `32789913645` falhou como esperado.
- GREEN funcional final `95f2847ebf49654b87654a17edbc49f084ac3895`: CI `32790007012`, job `97629520762`, PASS.
- PR #38 integrada em `main@9f2c5e5ba274b68fcf6c78aa0110acb0e62a32a1`.

## Banco hospedado
Migration `costs_prices`, versão `20260824233202`, aplicada no Supabase `exwtngpwqgkrkoszpgib`.
Validação live confirmou:
- `cost_price numeric(14,4)`;
- `sale_price numeric(14,2)`;
- `unit_cost numeric(14,4)`;
- triggers `purchase_order_items_unit_cost_guard` e `purchase_receipt_items_update_cost`;
- funções privadas sem EXECUTE para papéis de aplicação.

## Recovery do harness
O smoke `32790465653` encontrou falha no harness após o domínio completar o recebimento: uso inválido de `Locator.toHaveValue`.
A análise do artifact mostrou estoque e cleanup concluídos; portanto a causa foi isolada no teste E2E.

Recovery PR #43:
- correção para `Locator.inputValue()` + comparação explícita;
- atualização do contrato estático correspondente;
- HEAD `096e0bb1312a63bef4ea0af00a39fe0a6dc3856c`;
- CI `32799047601`, job `97656185941`, PASS;
- merge `main@8a7ed1942c7d67558ac9dc2c97e123f8fedb16b5`.

## Qualificação final
Production Smoke final:
- run `32799202870`;
- job `97656620884`;
- head `8a7ed1942c7d67558ac9dc2c97e123f8fedb16b5`;
- workflow conclusion `success`;
- desktop visual: PASS;
- mobile visual: PASS;
- functional smoke: PASS;
- responsive consistency: PASS_COM_RESSALVA;
- critical review: PASS_COM_RESSALVA;
- overall: PASS_COM_RESSALVA;
- artifact `9545965832`;
- digest `sha256:0bce5ee47bf51d93a922d0b845a1a267143964145d47e94658584459e349ec37`;
- 80 arquivos de evidência.

A única ressalva é `small_touch_target` no bottom nav de 320 px (~45×48 px). O item é visual, não funcional, e está explicitamente absorvido pela PHASE-14, que limita o menu móvel a cinco destinos.

## Resultado
Objetivo técnico e operacional atendido. PHASE-13 apta a `ENTREGUE` com ressalva não bloqueante transferida para PHASE-14.
