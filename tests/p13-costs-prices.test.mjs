import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

test('P13 possui migration e superfícies monetárias mínimas', async () => {
  for (const relativePath of [
    'supabase/migrations/0012_costs_prices.sql',
    'src/components/products/ProductFormFields.tsx',
    'src/app/products/actions.ts',
    'src/app/purchases/actions.ts',
    'src/app/purchases/[id]/page.tsx',
  ]) {
    await access(path.join(root, relativePath), constants.R_OK);
  }
});

test('P13 migration adiciona custo/preço com precisão, grants e último custo recebido', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0012_costs_prices.sql'), 'utf8');

  assert.match(sql, /add column cost_price numeric\(14,\s*4\)/i);
  assert.match(sql, /add column sale_price numeric\(14,\s*2\)/i);
  assert.match(sql, /purchase_order_items[\s\S]*add column unit_cost numeric\(14,\s*4\)/i);
  assert.match(sql, /cost_price\s*>=\s*0/i);
  assert.match(sql, /sale_price\s*>=\s*0/i);
  assert.match(sql, /unit_cost\s*>=\s*0/i);
  assert.match(sql, /grant update \([^)]*cost_price[^)]*sale_price[^)]*\) on public\.products to authenticated/i);
  assert.match(sql, /grant update \([^)]*unit_cost[^)]*\) on public\.purchase_order_items to authenticated/i);
  assert.match(sql, /PURCHASE_ORDER_NOT_DRAFT/);
  assert.match(sql, /create trigger[^;]+purchase_receipt_items[^;]+after insert/i);
  assert.match(sql, /update public\.products[\s\S]*set cost_price\s*=\s*v_unit_cost/i);
});

test('P13 ações e formulário de produto tratam custo e preço como ADMIN', async () => {
  const [actions, fields] = await Promise.all([
    readFile(path.join(root, 'src/app/products/actions.ts'), 'utf8'),
    readFile(path.join(root, 'src/components/products/ProductFormFields.tsx'), 'utf8'),
  ]);

  assert.match(actions, /requireAdminUser/);
  assert.match(actions, /cost_price/);
  assert.match(actions, /sale_price/);
  assert.match(actions, /parseMoney/);
  assert.match(fields, /name="cost_price"/);
  assert.match(fields, /name="sale_price"/);
  assert.match(fields, /step="0\.0001"/);
  assert.match(fields, /step="0\.01"/);
});

test('P13 compra captura unit_cost e exibe total derivado sem persistir total financeiro', async () => {
  const [actions, detail, migration] = await Promise.all([
    readFile(path.join(root, 'src/app/purchases/actions.ts'), 'utf8'),
    readFile(path.join(root, 'src/app/purchases/[id]/page.tsx'), 'utf8'),
    readFile(path.join(root, 'supabase/migrations/0012_costs_prices.sql'), 'utf8'),
  ]);

  assert.match(actions, /unit_cost/);
  assert.match(actions, /parseMoney/);
  assert.match(detail, /name="unit_cost"/);
  assert.match(detail, /formatBRL/);
  assert.match(detail, /ordered_quantity[\s\S]*unit_cost|unit_cost[\s\S]*ordered_quantity/);
  assert.doesNotMatch(migration, /\b(total|subtotal|grand_total)\b\s+numeric/i);
});

test('P13 permanece separado do domínio quantitativo de estoque', async () => {
  const stockWrapper = await readFile(path.join(root, 'src/modules/inventory/register-stock-movement.ts'), 'utf8');
  assert.doesNotMatch(stockWrapper, /cost_price|sale_price|unit_cost|price|cost/i);
});

test('P13 Production Smoke prova preço, custo unitário e atualização de último custo recebido', async () => {
  const flow = await readFile(path.join(root, 'scripts/e2e/purchase-smoke-flow.mjs'), 'utf8');

  assert.match(flow, /input\[name=["']cost_price["']\][^\n]*fill\(["']2\.5000["']\)/);
  assert.match(flow, /input\[name=["']sale_price["']\][^\n]*fill\(["']4\.99["']\)/);
  assert.match(flow, /input\[name=["']unit_cost["']\][^\n]*fill\(["']3\.4567["']\)/);
  assert.match(flow, /input\[name=["']cost_price["']\][^\n]*toHaveValue\(["']3\.4567["']\)/);
  assert.match(flow, /input\[name=["']sale_price["']\][^\n]*toHaveValue\(["']4\.99["']\)/);
  assert.match(flow, /last received cost|último custo recebido|last-cost/i);
});
