import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

test('P14 possui migration, actions e superfícies de vendas', async () => {
  for (const relativePath of [
    'supabase/migrations/0013_sales.sql',
    'src/app/sales/page.tsx',
    'src/app/sales/actions.ts',
    'src/app/sales/new/page.tsx',
    'src/app/sales/[id]/page.tsx',
  ]) await access(path.join(root, relativePath), constants.R_OK);
});

test('P14 migration modela venda auditável sem total financeiro persistido', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0013_sales.sql'), 'utf8');
  assert.match(sql, /create type public\.sale_status[\s\S]*DRAFT[\s\S]*COMPLETED[\s\S]*CANCELLED/i);
  assert.match(sql, /create table public\.sales/i);
  assert.match(sql, /create table public\.sale_items/i);
  assert.match(sql, /completion_operation_id uuid[^,]*unique/i);
  assert.match(sql, /unit_sale_price numeric\(14,\s*2\)[^,]*check\s*\(unit_sale_price\s*>=\s*0\)/i);
  assert.match(sql, /stock_operation_id uuid[^,]*unique/i);
  assert.match(sql, /stock_movement_id uuid[^,]*unique[^,]*references public\.stock_movements\(id\)/i);
  assert.doesNotMatch(sql, /\b(total|subtotal|grand_total)\b\s+numeric/i);
});

test('P14 banco deriva preço do produto e congela estrutura fora de DRAFT', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0013_sales.sql'), 'utf8');
  assert.match(sql, /select p\.unit,\s*p\.active,\s*p\.sale_price/i);
  assert.match(sql, /new\.unit_sale_price\s*:=\s*v_sale_price/i);
  assert.match(sql, /private\.quantity_matches_unit_precision/i);
  assert.match(sql, /SALE_NOT_DRAFT/i);
  assert.match(sql, /before insert or update on public\.sale_items/i);
});

test('P14 reativação de item recaptura o preço atual por migration forward-only', async () => {
  const recoveryPath = path.join(root, 'supabase/migrations/0014_sales_item_price_reactivation.sql');
  await access(recoveryPath, constants.R_OK);
  const recovery = await readFile(recoveryPath, 'utf8');
  assert.match(recovery, /tg_op\s*=\s*'INSERT'[\s\S]*old\.active\s*=\s*false[\s\S]*new\.active\s*=\s*true[\s\S]*new\.unit_sale_price\s*:=\s*v_sale_price/i);
  assert.match(recovery, /create or replace function private\.validate_sale_item\(\)/i);
  assert.doesNotMatch(recovery, /grant\s+update\s*\([^)]*unit_sale_price/i);
});

test('P14 conclusão é transacional, idempotente e baixa estoque via domínio autoritativo', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0013_sales.sql'), 'utf8');
  assert.match(sql, /private\.complete_sale/i);
  assert.match(sql, /for update/i);
  assert.match(sql, /completion_operation_id/i);
  assert.match(sql, /IDEMPOTENCY_CONFLICT/i);
  assert.match(sql, /private\.register_stock_movement/i);
  assert.match(sql, /'EXIT'::public\.stock_movement_type/i);
  assert.match(sql, /stock_movement_id\s*=\s*v_movement_id/i);
  assert.match(sql, /public\.complete_sale/i);
  assert.match(sql, /security invoker/i);
});

test('P14 RLS permite operação a usuário ativo sem DELETE de histórico', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0013_sales.sql'), 'utf8');
  for (const table of ['sales', 'sale_items']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`private\\.is_active_user`, 'i'));
  }
  assert.doesNotMatch(sql, /create policy[^;]+for delete/i);
  assert.match(sql, /revoke all on public\.sales from anon/i);
  assert.match(sql, /revoke all on public\.sale_items from anon/i);
});

test('P14 actions enviam quantidade e intenção, nunca preço autoritativo', async () => {
  const actions = await readFile(path.join(root, 'src/app/sales/actions.ts'), 'utf8');
  for (const action of ['createSale', 'addSaleItem', 'removeSaleItem', 'completeSale', 'cancelSale']) assert.match(actions, new RegExp(`export async function ${action}`));
  assert.match(actions, /requireActiveProfile/);
  assert.match(actions, /isQuantityTextValidForUnit/);
  assert.match(actions, /complete_sale/);
  assert.match(actions, /cancel_sale/);
  assert.doesNotMatch(actions, /unit_sale_price\s*:/);
});

test('P14 UI e navegação expõem vendas e total derivado', async () => {
  const [navigation, list, create, detail] = await Promise.all([
    readFile(path.join(root, 'src/components/shell/navigation.ts'), 'utf8'),
    readFile(path.join(root, 'src/app/sales/page.tsx'), 'utf8'),
    readFile(path.join(root, 'src/app/sales/new/page.tsx'), 'utf8'),
    readFile(path.join(root, 'src/app/sales/[id]/page.tsx'), 'utf8'),
  ]);
  assert.match(navigation, /["']\/sales["']/);
  assert.match(navigation, /Vendas/);
  assert.match(create, /createSale/);
  assert.match(detail, /name=["']product_id["']/);
  assert.match(detail, /name=["']quantity["']/);
  assert.match(detail, /formatBRL/);
  assert.match(detail, /quantity[\s\S]*unit_sale_price|unit_sale_price[\s\S]*quantity/);
  assert.match(`${list}\n${detail}`, /Venda|Vendas/);
});

test('P14 bottom nav mantém no máximo cinco destinos operacionais em mobile', async () => {
  const mobile = await readFile(path.join(root, 'src/components/shell/MobileBottomNav.tsx'), 'utf8');
  assert.match(mobile, /MOBILE_NAV_ROUTES/);
  assert.match(mobile, /slice\(0,\s*5\)|length\s*<=\s*5|new Set\(/);
  assert.doesNotMatch(mobile, /getNavigation\(role\)\.filter\(\(item\) => !item\.adminOnly\);/);
});

test('P14 Production Smoke cobre venda, baixa e saldo final', async () => {
  const [runner, flow] = await Promise.all([
    readFile(path.join(root, 'scripts/e2e/production-smoke.mjs'), 'utf8'),
    readFile(path.join(root, 'scripts/e2e/sales-smoke-flow.mjs'), 'utf8'),
  ]);
  assert.match(runner, /sales-smoke-runner\.mjs/);
  assert.match(flow, /QA-SALE-/);
  assert.match(flow, /\/sales\/new/);
  assert.match(flow, /Concluir venda/);
  assert.match(flow, /Saldo atual/);
  assert.match(flow, /2 UN|expected isolated balance/i);
});
