import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

async function migration() {
  return readFile(path.join(root, 'supabase/migrations/0004_inventory_core_maintenance.sql'), 'utf8');
}

test('manutenção de histórico só permite bypass ao owner postgres', async () => {
  const sql = await migration();

  assert.match(sql, /create or replace function private\.prevent_stock_movement_mutation/i);
  assert.match(sql, /current_user\s*=\s*'postgres'/i);
  assert.match(sql, /tg_op\s*=\s*'DELETE'/i);
  assert.match(sql, /return old/i);
  assert.match(sql, /return new/i);
  assert.match(sql, /STOCK_MOVEMENT_IMMUTABLE/i);
  assert.doesNotMatch(sql, /service_role[\s\S]*return (old|new)/i);
});
