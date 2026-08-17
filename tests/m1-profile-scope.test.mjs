import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

test('login consulta somente o perfil do usuário autenticado', async () => {
  const source = await readFile(path.join(root, 'src/app/login/actions.ts'), 'utf8');
  assert.match(source, /const \{ data: signInData, error \}/);
  assert.match(source, /\.eq\("id", signInData\.user\.id\)/);
});

test('dashboard consulta somente o perfil identificado pelos claims', async () => {
  const source = await readFile(path.join(root, 'src/app/page.tsx'), 'utf8');
  assert.match(source, /\.eq\("id", claimsData\.claims\.sub\)/);
});
