import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

test('P12 item save does not use upsert that requires immutable-column UPDATE privileges', async () => {
  const actions = await readFile(path.join(root, 'src/app/purchases/actions.ts'), 'utf8');
  assert.doesNotMatch(actions, /from\(["']purchase_order_items["']\)[\s\S]{0,120}\.upsert\(/);
  assert.match(actions, /from\(["']purchase_order_items["']\)\.insert\(\{/);
  for (const property of [/purchase_order_id:\s*orderId/, /product_id:\s*productId/, /ordered_quantity:\s*quantity/, /active:\s*true/]) assert.match(actions, property);
  assert.match(actions, /insertError\?\.code\s*===\s*["']23505["']/);
  assert.match(actions, /from\(["']purchase_order_items["']\)[\s\S]+\.update\(\{\s*ordered_quantity:\s*quantity,\s*active:\s*true\s*\}\)/s);
});

test('P12 mobile navigation still fits the 320px critical-review viewport after adding Compras', async () => {
  const mobile = await readFile(path.join(root, 'src/components/shell/MobileBottomNav.tsx'), 'utf8');
  const navigation = await readFile(path.join(root, 'src/components/shell/navigation.ts'), 'utf8');
  const nonAdminItems = [...navigation.matchAll(/\{ href: ["'][^"']+["'], label: ["'][^"']+["'] \}/g)].length;
  assert.equal(nonAdminItems, 7);
  assert.match(mobile, /min-w-\[44px\]/);
  assert.doesNotMatch(mobile, /min-w-\[52px\]/);
  assert.ok(nonAdminItems * 44 + 8 <= 320);
});

test('P12 production smoke waits for a real purchase detail route instead of matching /purchases/new', async () => {
  const flow = await readFile(path.join(root, 'scripts/e2e/purchase-smoke-flow.mjs'), 'utf8');
  assert.match(flow, /function isPurchaseDetailPath\(pathname\)/);
  assert.match(flow, /pathname\.startsWith\(["']\/purchases\/["']\)/);
  assert.match(flow, /pathname !== ["']\/purchases\/new["']/);
  assert.match(flow, /page\.waitForURL\(\(url\) => isPurchaseDetailPath\(url\.pathname\)/);
  assert.match(flow, /purchasePath = new URL\(page\.url\(\)\)\.pathname/);
});

test('P12 server-side Supabase reads bypass framework fetch caching after transactional mutations', async () => {
  const server = await readFile(path.join(root, 'src/lib/supabase/server.ts'), 'utf8');
  assert.match(server, /global:\s*\{/);
  assert.match(server, /cache:\s*["']no-store["']/);
});

test('P12 inventory reads authoritative balances directly instead of through an embedded product relation', async () => {
  const inventory = await readFile(path.join(root, 'src/app/inventory/page.tsx'), 'utf8');
  assert.doesNotMatch(inventory, /inventory\(quantity\)/);
  assert.match(inventory, /from\(["']inventory["']\)/);
  assert.match(inventory, /select\(["']product_id, quantity["']\)/);
  assert.match(inventory, /new Map/);
  assert.match(inventory, /inventoryByProduct\.get\(product\.id\)/);
});
