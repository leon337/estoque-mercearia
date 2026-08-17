import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

test('M3 possui migration e wrapper de domínio para movimentação', async () => {
  for (const relativePath of [
    'supabase/migrations/0003_inventory_core.sql',
    'src/modules/inventory/register-stock-movement.ts',
  ]) {
    await access(path.join(root, relativePath), constants.R_OK);
  }
});

test('migration cria saldo único e histórico rastreável com idempotência', async () => {
  const sql = await read('supabase/migrations/0003_inventory_core.sql');

  assert.match(sql, /create type public\.stock_movement_type as enum\s*\(\s*'INITIAL'\s*,\s*'ENTRY'\s*,\s*'EXIT'\s*,\s*'ADJUSTMENT'\s*\)/i);
  assert.match(sql, /create table public\.inventory/i);
  assert.match(sql, /product_id uuid primary key references public\.products\(id\)/i);
  assert.match(sql, /quantity numeric[^,]*check\s*\(quantity\s*>=\s*0\)/i);
  assert.match(sql, /create table public\.stock_movements/i);
  assert.match(sql, /operation_id uuid not null unique/i);
  assert.match(sql, /previous_quantity numeric not null/i);
  assert.match(sql, /quantity_delta numeric not null/i);
  assert.match(sql, /resulting_quantity numeric not null/i);
  assert.match(sql, /performed_by uuid not null references public\.profiles\(id\)/i);
});

test('RPC deriva ator da sessão, restringe papéis e não aceita performed_by', async () => {
  const sql = await read('supabase/migrations/0003_inventory_core.sql');

  assert.match(sql, /create or replace function public\.register_stock_movement/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /set search_path\s*=\s*''/i);
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /from public\.profiles/i);
  assert.match(sql, /INITIAL[\s\S]*ADJUSTMENT[\s\S]*ADMIN/i);
  assert.doesNotMatch(sql, /p_performed_by/i);
  assert.match(sql, /revoke all on function public\.register_stock_movement/i);
  assert.match(sql, /grant execute on function public\.register_stock_movement[^;]+to authenticated/i);
});

test('RPC bloqueia saldo, calcula movimentos e impede estoque negativo', async () => {
  const sql = await read('supabase/migrations/0003_inventory_core.sql');

  assert.match(sql, /from public\.inventory[\s\S]*for update/i);
  assert.match(sql, /when 'INITIAL'/i);
  assert.match(sql, /when 'ENTRY'/i);
  assert.match(sql, /when 'EXIT'/i);
  assert.match(sql, /when 'ADJUSTMENT'/i);
  assert.match(sql, /STOCK_INSUFFICIENT/i);
  assert.match(sql, /INITIAL_ALREADY_REGISTERED/i);
  assert.match(sql, /REASON_REQUIRED/i);
});

test('RPC trata replay idempotente e conflito de operation_id', async () => {
  const sql = await read('supabase/migrations/0003_inventory_core.sql');

  assert.match(sql, /operation_id\s*=\s*p_operation_id/i);
  assert.match(sql, /IDEMPOTENCY_CONFLICT/i);
  assert.match(sql, /replayed/i);
});

test('tabelas de estoque são RLS e não expõem escrita direta a authenticated', async () => {
  const sql = await read('supabase/migrations/0003_inventory_core.sql');

  assert.match(sql, /alter table public\.inventory enable row level security/i);
  assert.match(sql, /alter table public\.stock_movements enable row level security/i);
  assert.match(sql, /revoke (insert|all)[^;]*public\.inventory[^;]*authenticated/i);
  assert.match(sql, /revoke (insert|all)[^;]*public\.stock_movements[^;]*authenticated/i);
  assert.doesNotMatch(sql, /create policy[^;]+for (insert|update|delete)[^;]+on public\.(inventory|stock_movements)/i);
});

test('wrapper chama somente o RPC com intenção do usuário, sem ator ou saldo resultante', async () => {
  const source = await read('src/modules/inventory/register-stock-movement.ts');

  assert.match(source, /rpc\(["']register_stock_movement["']/);
  for (const param of ['p_product_id', 'p_type', 'p_quantity', 'p_operation_id', 'p_reason']) {
    assert.match(source, new RegExp(param));
  }
  assert.doesNotMatch(source, /performed_by/);
  assert.doesNotMatch(source, /resulting_quantity\s*:/);
});
