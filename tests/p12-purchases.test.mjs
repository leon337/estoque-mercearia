import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const requiredFiles = [
  'supabase/migrations/0011_purchases.sql',
  'src/app/purchases/page.tsx',
  'src/app/purchases/actions.ts',
  'src/app/purchases/new/page.tsx',
  'src/app/purchases/[id]/page.tsx',
];

test('P12 possui migration, actions e superfícies de compras', async () => {
  for (const relativePath of requiredFiles) {
    await access(path.join(root, relativePath), constants.R_OK);
  }
});

test('migration modela pedidos e recebimentos sem dimensão monetária', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0011_purchases.sql'), 'utf8');

  assert.match(sql, /create type public\.purchase_order_status/i);
  for (const state of ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']) {
    assert.match(sql, new RegExp(`'${state}'`));
  }
  assert.match(sql, /create table public\.purchase_orders/i);
  assert.match(sql, /create table public\.purchase_order_items/i);
  assert.match(sql, /create table public\.purchase_receipts/i);
  assert.match(sql, /create table public\.purchase_receipt_items/i);
  assert.match(sql, /operation_id uuid not null unique/i);
  assert.match(sql, /stock_movement_id uuid[^;]*references public\.stock_movements\(id\)/i);
  assert.doesNotMatch(sql, /unit_price|purchase_price|cost_price|total_amount|currency/i);
});

test('migration protege compras com RLS e escrita ADMIN sem DELETE de histórico', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0011_purchases.sql'), 'utf8');

  for (const table of ['purchase_orders', 'purchase_order_items', 'purchase_receipts', 'purchase_receipt_items']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`revoke all on public\\.${table} from anon`, 'i'));
  }
  assert.match(sql, /purchase_orders_admin_insert[\s\S]*private\.is_admin/i);
  assert.match(sql, /purchase_order_items_admin_insert[\s\S]*private\.is_admin/i);
  assert.doesNotMatch(sql, /create policy[^;]+for delete/i);
});

test('recebimento é transacional, idempotente e reutiliza o domínio autoritativo de estoque', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0011_purchases.sql'), 'utf8');

  assert.match(sql, /private\.receive_purchase_order/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /private\.register_stock_movement/i);
  assert.match(sql, /'ENTRY'::public\.stock_movement_type/i);
  assert.match(sql, /private\.quantity_matches_unit_precision/i);
  assert.match(sql, /RECEIPT_QUANTITY_EXCEEDS_ORDERED/i);
  assert.match(sql, /public\.receive_purchase_order/i);
  assert.match(sql, /security invoker/i);
  assert.match(sql, /revoke all on function public\.receive_purchase_order/i);
  assert.match(sql, /grant execute on function public\.receive_purchase_order[^;]+to authenticated/i);
});

test('actions de compras exigem ADMIN e expõem o lifecycle aprovado', async () => {
  const actions = await readFile(path.join(root, 'src/app/purchases/actions.ts'), 'utf8');

  assert.match(actions, /requireAdminUser/);
  for (const action of ['createPurchaseOrder', 'addPurchaseOrderItem', 'removePurchaseOrderItem', 'markPurchaseOrderOrdered', 'cancelPurchaseOrder', 'receivePurchaseOrder']) {
    assert.match(actions, new RegExp(`export async function ${action}`));
  }
  assert.match(actions, /receive_purchase_order/);
  assert.match(actions, /isQuantityTextValidForUnit/);
});

test('UI e navegação expõem compras sem preço ou custo', async () => {
  const navigation = await readFile(path.join(root, 'src/components/shell/navigation.ts'), 'utf8');
  const list = await readFile(path.join(root, 'src/app/purchases/page.tsx'), 'utf8');
  const create = await readFile(path.join(root, 'src/app/purchases/new/page.tsx'), 'utf8');
  const detail = await readFile(path.join(root, 'src/app/purchases/[id]/page.tsx'), 'utf8');
  const combined = `${list}\n${create}\n${detail}`;

  assert.match(navigation, /["']\/purchases["']/);
  assert.match(navigation, /Compras/);
  assert.match(create, /name=["']supplier_id["']/);
  assert.match(detail, /name=["']product_id["']/);
  assert.match(detail, /name=["']quantity["']/);
  assert.match(combined, /Pedido|Compras/);
  assert.doesNotMatch(combined, /Preço|Custo|R\$|unit_price|cost_price/i);
});

test('Production Smoke cobre rotas e lifecycle de compra/recebimento', async () => {
  const smoke = await readFile(path.join(root, 'scripts/e2e/smoke-lib.mjs'), 'utf8');
  const runner = await readFile(path.join(root, 'scripts/e2e/production-smoke.mjs'), 'utf8');

  assert.match(smoke, /template:\s*["']\/purchases["']/);
  assert.match(smoke, /template:\s*["']\/purchases\/new["']/);
  assert.match(smoke, /template:\s*["']\/purchases\/\[id\]["']/);
  assert.match(runner, /async function purchaseQaFlow/);
  assert.match(runner, /QA-PURCHASE-/);
  assert.match(runner, /purchaseQaFlow\(\)/);
});
