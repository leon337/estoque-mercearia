import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const requiredFiles = [
  'supabase/migrations/0002_products.sql',
  'src/app/products/page.tsx',
  'src/app/products/actions.ts',
  'src/app/products/new/page.tsx',
  'src/app/products/[id]/edit/page.tsx',
];

test('M2 possui migration, listagem, cadastro, edição e actions de produtos', async () => {
  for (const relativePath of requiredFiles) {
    await access(path.join(root, relativePath), constants.R_OK);
  }
});

test('migration de produtos preserva integridade e usa RLS sem DELETE', async () => {
  const sql = await readFile(path.join(root, 'supabase/migrations/0002_products.sql'), 'utf8');

  assert.match(sql, /create table public\.categories/i);
  assert.match(sql, /create table public\.products/i);
  assert.match(sql, /category_id uuid references public\.categories\(id\) on delete restrict/i);
  assert.match(sql, /minimum_stock[^,]*check\s*\(minimum_stock\s*>=\s*0\)/i);
  assert.match(sql, /create unique index[^;]+lower\s*\(btrim\(internal_code\)\)/i);
  assert.match(sql, /create unique index[^;]+barcode[^;]+where\s+barcode\s+is\s+not\s+null/i);
  assert.match(sql, /alter table public\.categories enable row level security/i);
  assert.match(sql, /alter table public\.products enable row level security/i);
  assert.match(sql, /create policy "categories_select_authenticated"/i);
  assert.match(sql, /create policy "categories_admin_insert"/i);
  assert.match(sql, /create policy "categories_admin_update"/i);
  assert.match(sql, /create policy "products_select_authenticated"/i);
  assert.match(sql, /create policy "products_admin_insert"/i);
  assert.match(sql, /create policy "products_admin_update"/i);
  assert.doesNotMatch(sql, /create policy[^;]+for delete/i);
});

test('actions exigem ADMIN, normalizam barcode vazio e validam estoque mínimo', async () => {
  const actions = await readFile(path.join(root, 'src/app/products/actions.ts'), 'utf8');

  assert.match(actions, /async function requireAdmin/i);
  assert.match(actions, /role\s*!==\s*["']ADMIN["']/);
  assert.match(actions, /barcodeRaw\s*\?\s*barcodeRaw\s*:\s*null/);
  assert.match(actions, /minimumStock\s*<\s*0/);
  assert.match(actions, /export async function createCategory/);
  assert.match(actions, /export async function createProduct/);
  assert.match(actions, /export async function updateProduct/);
  assert.match(actions, /export async function toggleProductActive/);
});

test('actions não permitem categoria inativa em produto nem inativação de categoria usada por produto ativo', async () => {
  const actions = await readFile(path.join(root, 'src/app/products/actions.ts'), 'utf8');

  assert.match(actions, /async function ensureActiveCategory/i);
  assert.match(actions, /\.from\(["']categories["']\)[\s\S]*\.eq\(["']active["'],\s*true\)/);
  assert.match(actions, /\.from\(["']products["']\)[\s\S]*\.eq\(["']category_id["'],\s*id\)[\s\S]*\.eq\(["']active["'],\s*true\)/);
  assert.match(actions, /category_in_use/);
});

test('listagem pesquisa por nome e código sem usar filtro OR bruto', async () => {
  const page = await readFile(path.join(root, 'src/app/products/page.tsx'), 'utf8');

  assert.match(page, /\.ilike\(["']name["']/);
  assert.match(page, /\.ilike\(["']internal_code["']/);
  assert.doesNotMatch(page, /\.or\(/);
  assert.match(page, /Novo produto/);
  assert.match(page, /Categorias/);
});

test('formulários expõem os campos aprovados do produto', async () => {
  const createPage = await readFile(path.join(root, 'src/app/products/new/page.tsx'), 'utf8');
  const editPage = await readFile(path.join(root, 'src/app/products/[id]/edit/page.tsx'), 'utf8');
  const combined = `${createPage}\n${editPage}`;

  for (const field of ['internal_code', 'barcode', 'name', 'category_id', 'unit', 'minimum_stock']) {
    assert.match(combined, new RegExp(`name=["']${field}["']`));
  }
});
