import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("P10 movement form applies unit-aware quantity precision and pt-BR formatting", async () => {
  const source = await read("src/app/movements/new/movement-form.tsx");

  assert.match(source, /quantityScaleForUnit|quantityStepForUnit/);
  assert.match(source, /isQuantityTextValidForUnit|isQuantityAllowedForUnit/);
  assert.match(source, /formatQuantityPtBr|formatQuantity/);
  assert.doesNotMatch(source, /step=["']any["']/);
});

test("P10 movement Server Action validates quantity against the product unit before RPC", async () => {
  const source = await read("src/app/movements/actions.ts");

  assert.match(source, /isQuantityTextValidForUnit|isQuantityAllowedForUnit/);
  assert.match(source, /select\(["'][^"']*unit[^"']*["']\)/);
  assert.match(source, /INVALID_QUANTITY_PRECISION|quantity_precision|validation/);
});

test("P10 database migration enforces quantity precision at the authoritative boundary", async () => {
  const files = await readdir(new URL("../supabase/migrations/", import.meta.url));
  const migration = files.find((name) => /^0008_.*quantity.*\.sql$/.test(name));

  assert.ok(migration, "expected a 0008 quantity precision migration");

  const source = await read(`supabase/migrations/${migration}`);
  assert.match(source, /UN/);
  assert.match(source, /CX/);
  assert.match(source, /PCT/);
  assert.match(source, /round\([^,]+,\s*3\)|scale/i);
  assert.match(source, /INVALID_QUANTITY_PRECISION/);
  assert.match(source, /create trigger/i);
  assert.match(source, /inventory/i);
  assert.match(source, /stock_movements/i);
});
