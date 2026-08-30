# PHASE-16 — Lotes e validade de recebimentos — Design

## Contexto
A PHASE-12 já registra recebimentos imutáveis e cria movimentos ENTRY no estoque. A PHASE-16 acrescenta rastreabilidade de lote sobre esses recebimentos sem criar um segundo saldo autoritativo e sem inventar FEFO.

## Decisão
Criar `public.receipt_batches` ligado a `purchase_receipt_items`. O lote descreve a origem física do que foi recebido; `public.inventory` continua sendo a única fonte autoritativa de saldo disponível.

## Dados
- `purchase_receipt_item_id` obrigatório;
- `lot_code` obrigatório;
- `expires_on` opcional, pois alguns produtos não possuem validade declarada;
- `quantity > 0` com a mesma precisão da unidade do produto;
- `active`, `created_by`, `created_at`, `updated_at`;
- unicidade por `purchase_receipt_item_id + lot_code`.

## Integridade
Trigger privado bloqueia alterações estruturais inválidas, deriva a unidade pelo encadeamento receipt item → order item → product e usa `private.quantity_matches_unit_precision`.

A soma das quantidades de lotes ativos do mesmo `purchase_receipt_item_id` nunca pode exceder `purchase_receipt_items.quantity`. A linha de receipt item é bloqueada durante a validação para serializar concorrência.

## Segurança
- RLS habilitado;
- usuário ativo: SELECT;
- ADMIN: INSERT e UPDATE das colunas operacionais;
- sem DELETE;
- `created_by` deriva de `auth.uid()` via trigger privado;
- funções privadas não recebem EXECUTE público.

## UX
- `/batches`: listagem e status de validade;
- `/batches/new`: registro ADMIN sobre item recebido existente;
- status: `EXPIRED`, `EXPIRING` (até 30 dias), `OK`, `NO_EXPIRY`;
- `/alerts` recebe uma seção derivada de validade, sem alterar a lógica de alerta de estoque.

## Fora de escopo
Saldo por lote, FEFO, baixa vinculada ao lote, serialização, recall e integrações regulatórias/fiscais externas.
