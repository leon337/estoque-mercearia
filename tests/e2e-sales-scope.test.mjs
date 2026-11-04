import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = async (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

test("sales QA assertions use the exact product card's authoritative balance", async () => {
  const flow = await source("scripts/e2e/sales-smoke-flow.mjs");
  assert.match(flow, /ancestor::section\[1\]\/\/dt\[normalize-space\(\)='Saldo atual'\]\/following-sibling::dd\[1\]/);
  assert.match(flow, /expect\(initialBalance\)\.toHaveText\("5 UN"/);
  assert.match(flow, /expect\(finalBalance\)\.toHaveText\("2 UN"/);
  assert.doesNotMatch(flow, /ancestor::div\[\.\/\/dt/);
});

test("critical review does not navigate unresolved dynamic templates", async () => {
  const review = await source("scripts/e2e/critical-review.mjs");
  assert.match(review, /route\.concretePath \|\|/);
  assert.match(review, /dynamic_route_missing/);
});

test("production QA smoke is serialized to prevent concurrent mutation", async () => {
  const workflow = await source(".github/workflows/production-smoke.yml");
  assert.match(workflow, /group: production-smoke-\$\{\{ github\.repository \}\}/);
  assert.match(workflow, /cancel-in-progress: false/);
});
