import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

test('P14 completion recovery qualifies sale_items.id to avoid PL/pgSQL output-parameter ambiguity', async () => {
  const migrationPath = path.join(root, 'supabase/migrations/0016_complete_sale_qualified_item_id.sql');
  await access(migrationPath, constants.R_OK);
  const sql = await readFile(migrationPath, 'utf8');

  assert.match(sql, /create or replace function private\.complete_sale\s*\(/i);
  assert.match(sql, /update public\.sale_items[\s\S]*where\s+(?:public\.)?sale_items\.id\s*=\s*v_item\.id/i);
  assert.doesNotMatch(sql, /where\s+id\s*=\s*v_item\.id/i);
  assert.match(sql, /private\.register_stock_movement/i);
  assert.match(sql, /'EXIT'::public\.stock_movement_type/i);
  assert.match(sql, /IDEMPOTENCY_CONFLICT/i);
});
