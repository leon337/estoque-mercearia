import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

test('função SECURITY DEFINER de autorização fica em schema privado', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0001_auth_profiles.sql'), 'utf8');
  assert.match(sql, /create schema if not exists private/i);
  assert.match(sql, /create or replace function private\.is_admin\(\)/i);
  assert.match(sql, /select private\.is_admin\(\)/i);
  assert.doesNotMatch(sql, /function public\.is_admin\(\)/i);
});
