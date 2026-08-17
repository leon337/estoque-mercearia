import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const requiredFiles = [
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'eslint.config.mjs',
  'postcss.config.mjs',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/globals.css',
  '.github/workflows/ci.yml',
  '.gitignore',
  '.env.example',
  'README.md',
];

test('M0 contém os arquivos mínimos da fundação', async () => {
  for (const relativePath of requiredFiles) {
    await access(path.join(root, relativePath), constants.R_OK);
  }
});

test('package.json expõe scripts essenciais do M0', async () => {
  const packageJson = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8'),
  );

  assert.equal(packageJson.private, true);
  for (const script of ['dev', 'build', 'start', 'lint', 'test', 'typecheck']) {
    assert.equal(typeof packageJson.scripts?.[script], 'string', `script ausente: ${script}`);
  }
});
