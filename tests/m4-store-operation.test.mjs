import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("M4 exposes an operational inventory read page", async () => {
  const source = await read("src/app/inventory/page.tsx");
  assert.match(source, /from\("products"\)/);
  assert.match(source, /from\("inventory"\)/);
  assert.match(source, /product_id, quantity/);
  assert.match(source, /minimum_stock/);
  assert.match(source, /Estoque baixo|ZERADO|Baixo|Sem estoque/);
  assert.match(source, /\/movements\/new/);
});

test("M4 movement action only sends intent through the approved wrapper", async () => {
  const source = await read("src/app/movements/actions.ts");
  assert.match(source, /registerStockMovement/);
  assert.match(source, /operation_id|operationId/);
  assert.match(source, /ENTRY/);
  assert.match(source, /EXIT/);
  assert.match(source, /INITIAL/);
  assert.doesNotMatch(source, /performed_by\s*:/);
  assert.doesNotMatch(source, /resulting_quantity\s*:/);
  assert.doesNotMatch(source, /\.from\(["']inventory["']\)\.update/);
});

test("M4 client form previews balance, keeps an idempotency key and confirms mutation", async () => {
  const source = await read("src/app/movements/new/movement-form.tsx");
  assert.match(source, /crypto\.randomUUID/);
  assert.match(source, /operation_id/);
  assert.match(source, /Saldo atual/);
  assert.match(source, /Saldo após/);
  assert.match(source, /window\.confirm|confirm\(/);
  assert.match(source, /insufficient|insuficiente|currentQuantity/);
});

test("M4 page exposes INITIAL only from the authenticated profile role", async () => {
  const source = await read("src/app/movements/new/page.tsx");
  assert.match(source, /profiles/);
  assert.match(source, /role/);
  assert.match(source, /inventory\s*\(\s*quantity\s*\)/);
  assert.match(source, /isAdmin|ADMIN/);
});

test("home becomes an operational launcher", async () => {
  const source = await read("src/app/page.tsx");
  assert.match(source, /\/inventory/);
  assert.match(source, /\/movements\/new/);
  assert.match(source, /\/products/);
});