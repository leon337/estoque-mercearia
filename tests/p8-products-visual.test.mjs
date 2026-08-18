import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

test('P8.3b products list adopts AppShell and Design System primitives', async () => {
  const page = await read('src/app/products/page.tsx');

  assert.match(page, /AppShell/);
  assert.match(page, /PageHeader/);
  assert.match(page, /DataCard/);
  assert.match(page, /StatusBadge/);
  assert.match(page, /Button/);
  assert.match(page, /<AppShell\s+role=\{profile\.role\}/);
  assert.match(page, /<PageHeader[\s\S]*title=["']Produtos["']/);
  assert.match(page, /font-data/);
});

test('P8.3b products list preserves search status role and category behavior', async () => {
  const page = await read('src/app/products/page.tsx');

  assert.match(page, /\.ilike\(["']name["']/);
  assert.match(page, /\.ilike\(["']internal_code["']/);
  assert.doesNotMatch(page, /\.or\(/);
  assert.match(page, /profile\.role\s*===\s*["']ADMIN["']/);
  assert.match(page, /name=["']q["']/);
  assert.match(page, /name=["']status["']/);
  assert.match(page, /action=\{createCategory\}/);
  assert.match(page, /action=\{toggleCategoryActive\}/);
  assert.match(page, /action=\{toggleProductActive\}/);
  assert.match(page, /flash\.kind === ["']error["'][\s\S]*role=\{flash\.kind === ["']error["'] \? ["']alert["'] : ["']status["']\}/);
});

test('P8.3b create and edit pages share a presentation-only ProductFormFields component', async () => {
  const componentPath = 'src/components/products/ProductFormFields.tsx';
  await access(path.join(root, componentPath), constants.R_OK);
  const [fields, createPage, editPage] = await Promise.all([
    read(componentPath),
    read('src/app/products/new/page.tsx'),
    read('src/app/products/[id]/edit/page.tsx'),
  ]);

  assert.doesNotMatch(fields, /supabase|createClient|use server/i);
  for (const field of ['internal_code', 'barcode', 'name', 'category_id', 'unit', 'minimum_stock']) {
    assert.match(fields, new RegExp(`name=["']${field}["']`));
  }
  assert.match(fields, /min-h-12/);
  assert.match(createPage, /ProductFormFields/);
  assert.match(editPage, /ProductFormFields/);
});

test('P8.3b product forms use AppShell PageHeader DataCard Button and preserve server actions', async () => {
  const [createPage, editPage] = await Promise.all([
    read('src/app/products/new/page.tsx'),
    read('src/app/products/[id]/edit/page.tsx'),
  ]);

  for (const page of [createPage, editPage]) {
    assert.match(page, /AppShell/);
    assert.match(page, /PageHeader/);
    assert.match(page, /DataCard/);
    assert.match(page, /Button/);
    assert.match(page, /role=\{profile\.role\}/);
  }
  assert.match(createPage, /action=\{createProduct\}/);
  assert.match(createPage, /role=["']alert["']/);
  assert.match(editPage, /action=\{updateProduct\}/);
  assert.match(editPage, /action=\{toggleProductActive\}/);
  assert.match(editPage, /name=["']id["'][\s\S]*value=\{product\.id\}/);
  assert.match(editPage, /StatusBadge/);
});

test('P8.3b keeps product business rules outside presentation components', async () => {
  const actions = await read('src/app/products/actions.ts');

  assert.match(actions, /async function requireAdmin/);
  assert.match(actions, /role\s*!==\s*["']ADMIN["']/);
  assert.match(actions, /barcodeRaw\s*\?\s*barcodeRaw\s*:\s*null/);
  assert.match(actions, /minimumStock\s*<\s*0/);
  assert.match(actions, /ensureActiveCategory/);
  assert.match(actions, /category_in_use/);
  assert.match(actions, /revalidatePath\(["']\/products["']\)/);
});
