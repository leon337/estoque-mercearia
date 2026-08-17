import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

async function migration() {
  return readFile(path.join(root, 'supabase/migrations/0005_inventory_core_privileges.sql'), 'utf8');
}

test('service_role não possui caminho direto de escrita nem execução do RPC de estoque', async () => {
  const sql = await migration();

  assert.match(sql, /revoke\s+insert\s*,\s*update\s*,\s*delete\s*,\s*truncate\s+on\s+public\.inventory\s+from\s+service_role/i);
  assert.match(sql, /revoke\s+insert\s*,\s*update\s*,\s*delete\s*,\s*truncate\s+on\s+public\.stock_movements\s+from\s+service_role/i);
  assert.match(sql, /revoke\s+execute\s+on\s+function\s+public\.register_stock_movement[^;]+from\s+service_role/i);
  assert.doesNotMatch(sql, /grant[^;]+(insert|update|delete|truncate)[^;]+service_role/i);
});
