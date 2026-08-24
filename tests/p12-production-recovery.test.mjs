import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

test('P12 item save does not use upsert that requires immutable-column UPDATE privileges', async () => {
  const actions = await readFile(path.join(root, 'src/app/purchases/actions.ts'), 'utf8');

  assert.doesNotMatch(
    actions,
    /from\(["']purchase_order_items["']\)[\s\S]{0,120}\.upsert\(/,
    'purchase_order_items must not use PostgREST upsert with restricted immutable-column UPDATE grants',
  );
  assert.match(actions, /from\(["']purchase_order_items["']\)\.insert\(\{/);
  for (const property of [
    /purchase_order_id:\s*orderId/,
    /product_id:\s*productId/,
    /ordered_quantity:\s*quantity/,
    /active:\s*true/,
  ]) {
    assert.match(actions, property);
  }
  assert.match(actions, /insertError\?\.code\s*===\s*["']23505["']/);
  assert.match(actions, /from\(["']purchase_order_items["']\)[\s\S]+\.update\(\{\s*ordered_quantity:\s*quantity,\s*active:\s*true\s*\}\)/s);
});

test('P12 mobile navigation still fits the 320px critical-review viewport after adding Compras', async () => {
  const mobile = await readFile(path.join(root, 'src/components/shell/MobileBottomNav.tsx'), 'utf8');
  const navigation = await readFile(path.join(root, 'src/components/shell/navigation.ts'), 'utf8');

  const nonAdminItems = [...navigation.matchAll(/\{ href: ["'][^"']+["'], label: ["'][^"']+["'] \}/g)].length;
  assert.equal(nonAdminItems, 7, 'PHASE-12 should expose seven non-admin destinations');
  assert.match(mobile, /min-w-\[44px\]/, 'seven items must use a 44px minimum target to fit inside 320px');
  assert.doesNotMatch(mobile, /min-w-\[52px\]/);
  assert.ok(nonAdminItems * 44 + 8 <= 320, 'mobile nav minimum widths plus horizontal padding must fit 320px');
});

test('P12 production smoke waits for a real purchase detail route instead of matching /purchases/new', async () => {
  const flow = await readFile(path.join(root, 'scripts/e2e/purchase-smoke-flow.mjs'), 'utf8');

  assert.match(flow, /function isPurchaseDetailPath\(pathname\)/);
  assert.match(flow, /pathname\.startsWith\(["']\/purchases\/["']\)/);
  assert.match(flow, /pathname !== ["']\/purchases\/new["']/);
  assert.match(flow, /page\.waitForURL\(\(url\) => isPurchaseDetailPath\(url\.pathname\)/);
  assert.match(flow, /purchasePath = new URL\(page\.url\(\)\)\.pathname/);
});

test('P12 production smoke retries the inventory balance read after a committed receipt', async () => {
  const flow = await readFile(path.join(root, 'scripts/e2e/purchase-smoke-flow.mjs'), 'utf8');

  assert.match(flow, /retryWithBackoff/);
  assert.match(flow, /async function waitForInventoryBalance\(/);
  assert.match(flow, /gotoWithRetry\(page, baseURL, ["']\/inventory["']\)/);
  assert.match(flow, /retryable\s*=\s*true/);
  assert.match(flow, /maxAttempts:\s*3/);
  assert.match(flow, /waitForInventoryBalance\(page, baseURL, productName, ["']2 UN["']\)/);
});
