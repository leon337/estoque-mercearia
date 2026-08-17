import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("M5 history is read-only and exposes approved filters", async () => {
  const source = await read("src/app/history/page.tsx");
  assert.match(source, /from\("stock_movements"\)/);
  assert.match(source, /product/);
  assert.match(source, /type/);
  assert.match(source, /actor/);
  assert.match(source, /from/);
  assert.match(source, /to/);
  assert.match(source, /previous_quantity/);
  assert.match(source, /quantity_delta/);
  assert.match(source, /resulting_quantity/);
  assert.match(source, /performed_by/);
  assert.doesNotMatch(source, /\.insert\(|\.update\(|\.delete\(/);
});

test("M5 dashboard computes active zero and low stock metrics", async () => {
  const source = await read("src/app/page.tsx");
  assert.match(source, /inventory\s*\(\s*quantity\s*\)/);
  assert.match(source, /minimum_stock/);
  assert.match(source, /Produtos ativos/);
  assert.match(source, /Estoque zerado/);
  assert.match(source, /Estoque baixo/);
  assert.match(source, /\/history/);
  assert.match(source, /\.eq\("id", claimsData\.claims\.sub\)/);
});

test("M5 history formats actor product and movement trace without mutation actions", async () => {
  const source = await read("src/app/history/page.tsx");
  assert.match(source, /products/);
  assert.match(source, /profiles/);
  assert.match(source, /Motivo/);
  assert.match(source, /Saldo anterior/);
  assert.match(source, /Saldo resultante/);
  assert.doesNotMatch(source, /registerStockMovement|registerMovementAction/);
});