import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

async function assertExists(path) {
  let exists = true;
  try {
    await access(new URL(`../${path}`, import.meta.url));
  } catch {
    exists = false;
  }
  assert.equal(exists, true, `${path} must exist`);
}

test("P10 minimum stock Server Action applies unit-aware precision", async () => {
  const source = await read("src/app/products/actions.ts");

  assert.match(source, /isQuantityTextValidForUnit/);
  assert.match(source, /minimumStockText/);
  assert.match(source, /isQuantityTextValidForUnit\(minimumStockText,\s*unit\)/);
});

test("P10 product form exposes unit-aware minimum stock step", async () => {
  const source = await read("src/components/products/ProductFormFields.tsx");

  assert.match(source, /quantityStepForUnit/);
  assert.match(source, /useState/);
  assert.match(source, /step=\{quantityStepForUnit\(unit\)\}/);
  assert.match(source, /onChange=\{/);
});

test("P10 database rejects minimum stock precision that disagrees with product unit", async () => {
  const migration = "supabase/migrations/0009_product_minimum_stock_precision.sql";
  await assertExists(migration);
  const source = await read(migration);

  assert.match(source, /products_minimum_stock_precision/);
  assert.match(source, /private\.quantity_matches_unit_precision\(new\.unit,\s*new\.minimum_stock\)/);
  assert.match(source, /INVALID_MINIMUM_STOCK_PRECISION/);
  assert.match(source, /before insert or update of unit, minimum_stock on public\.products/i);
});
