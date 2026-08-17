import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const requiredFiles = [
  'src/lib/supabase/client.ts',
  'src/lib/supabase/server.ts',
  'src/lib/supabase/proxy.ts',
  'src/proxy.ts',
  'src/app/login/page.tsx',
  'src/app/login/actions.ts',
  'supabase/migrations/0001_auth_profiles.sql',
];

test('M1 contém infraestrutura SSR, login e migration base', async () => {
  for (const relativePath of requiredFiles) {
    await access(path.join(root, relativePath), constants.R_OK);
  }
});

test('package.json inclui os pacotes Supabase SSR atuais', async () => {
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(packageJson.dependencies?.['@supabase/ssr'], '0.12.4');
  assert.equal(packageJson.dependencies?.['@supabase/supabase-js'], '2.111.0');
});

test('migration cria perfis, roles e RLS sem permitir autoelevação de operador', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0001_auth_profiles.sql'), 'utf8');
  assert.match(sql, /create type public\.app_role as enum \('ADMIN', 'OPERATOR'\)/i);
  assert.match(sql, /create table public\.profiles/i);
  assert.match(sql, /references auth\.users\(id\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /create policy "profiles_select_own"/i);
  assert.match(sql, /create policy "profiles_admin_select_all"/i);
  assert.doesNotMatch(sql, /new\.raw_user_meta_data\s*->>\s*'role'/i);
  assert.match(sql, /'OPERATOR'::public\.app_role/i);
});

test('env example documenta somente URL e publishable key públicas', async () => {
  const env = await readFile(path.join(root, '.env.example'), 'utf8');
  assert.match(env, /NEXT_PUBLIC_SUPABASE_URL=/);
  assert.match(env, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=/);
  assert.doesNotMatch(env, /SERVICE_ROLE/i);
});
