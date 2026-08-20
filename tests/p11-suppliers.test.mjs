import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const requiredFiles = [
  'supabase/migrations/0010_suppliers.sql',
  'src/app/suppliers/page.tsx',
  'src/app/suppliers/actions.ts',
  'src/app/suppliers/new/page.tsx',
  'src/app/suppliers/[id]/edit/page.tsx',
  'src/components/suppliers/SupplierFormFields.tsx',
];

test('P11 possui migration, actions e superfícies de fornecedores', async () => {
  for (const relativePath of requiredFiles) {
    await access(path.join(root, relativePath), constants.R_OK);
  }
});

test('migration cria fornecedores e vínculos com integridade e RLS', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0010_suppliers.sql'), 'utf8');

  assert.match(sql, /create table public\.suppliers/i);
  assert.match(sql, /create table public\.product_suppliers/i);
  assert.match(sql, /product_id uuid[^;]*references public\.products\(id\)[^;]*on delete restrict/i);
  assert.match(sql, /supplier_id uuid[^;]*references public\.suppliers\(id\)[^;]*on delete restrict/i);
  assert.match(sql, /unique[^;]*product_id[^;]*supplier_id/i);
  assert.match(sql, /create unique index[^;]+product_id[^;]+where[^;]+preferred[^;]+active/i);
  assert.match(sql, /alter table public\.suppliers enable row level security/i);
  assert.match(sql, /alter table public\.product_suppliers enable row level security/i);
  assert.match(sql, /revoke all on public\.suppliers from anon/i);
  assert.match(sql, /revoke all on public\.product_suppliers from anon/i);
  assert.match(sql, /revoke delete on public\.suppliers from authenticated/i);
  assert.match(sql, /revoke delete on public\.product_suppliers from authenticated/i);
  assert.match(sql, /suppliers_admin_insert[\s\S]*private\.is_admin/i);
  assert.match(sql, /suppliers_admin_update[\s\S]*private\.is_admin/i);
  assert.match(sql, /product_suppliers_admin_insert[\s\S]*private\.is_admin/i);
  assert.match(sql, /product_suppliers_admin_update[\s\S]*private\.is_admin/i);
  assert.doesNotMatch(sql, /create policy[^;]+for delete/i);
});

test('actions de fornecedores exigem ADMIN e expõem operações aprovadas', async () => {
  const actions = await readFile(path.join(root, 'src/app/suppliers/actions.ts'), 'utf8');

  assert.match(actions, /requireAdminUser/);
  assert.match(actions, /export async function createSupplier/);
  assert.match(actions, /export async function updateSupplier/);
  assert.match(actions, /export async function toggleSupplierActive/);
  assert.match(actions, /export async function upsertProductSupplier/);
  assert.match(actions, /export async function toggleProductSupplierActive/);
  assert.match(actions, /supplier_inactive/);
  assert.match(actions, /product_inactive/);
});

test('UI de fornecedores contém campos e gestão de vínculos', async () => {
  const list = await readFile(path.join(root, 'src/app/suppliers/page.tsx'), 'utf8');
  const create = await readFile(path.join(root, 'src/app/suppliers/new/page.tsx'), 'utf8');
  const edit = await readFile(path.join(root, 'src/app/suppliers/[id]/edit/page.tsx'), 'utf8');
  const fields = await readFile(path.join(root, 'src/components/suppliers/SupplierFormFields.tsx'), 'utf8');
  const combined = `${create}\n${edit}\n${fields}`;

  assert.match(list, /Fornecedores/);
  assert.match(list, /Novo fornecedor/);
  for (const field of ['name', 'tax_id', 'email', 'phone', 'notes']) {
    assert.match(combined, new RegExp(`name=["']${field}["']`));
  }
  assert.match(edit, /product_id/);
  assert.match(edit, /supplier_code/);
  assert.match(edit, /preferred/);
});

test('navegação inclui fornecedores e mobile suporta crescimento', async () => {
  const navigation = await readFile(path.join(root, 'src/components/shell/navigation.ts'), 'utf8');
  const mobile = await readFile(path.join(root, 'src/components/shell/MobileBottomNav.tsx'), 'utf8');

  assert.match(navigation, /["']\/suppliers["']/);
  assert.match(navigation, /Fornecedores/);
  assert.match(mobile, /overflow-x-auto/);
  assert.doesNotMatch(mobile, /grid-cols-5/);
});

test('Production Smoke inclui rotas de fornecedores', async () => {
  const smoke = await readFile(path.join(root, 'scripts/e2e/smoke-lib.mjs'), 'utf8');

  assert.match(smoke, /template:\s*["']\/suppliers["']/);
  assert.match(smoke, /template:\s*["']\/suppliers\/new["']/);
  assert.match(smoke, /template:\s*["']\/suppliers\/\[id\]\/edit["']/);
});
