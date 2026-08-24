import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const paths = {
  inventory: "src/app/inventory/page.tsx",
  movementPage: "src/app/movements/new/page.tsx",
  movementForm: "src/app/movements/new/movement-form.tsx",
  history: "src/app/history/page.tsx",
  adminUsers: "src/app/admin/users/page.tsx",
  adjustmentPage: "src/app/admin/adjustment/page.tsx",
  adjustmentForm: "src/app/admin/adjustment/adjustment-form.tsx",
};

test("P8.3c inventory adopts AppShell and semantic inventory primitives", async () => {
  const source = await read(paths.inventory);
  for (const token of ["AppShell", "PageHeader", "DataCard", "StatusBadge"]) assert.match(source, new RegExp(token));
  assert.match(source, /<AppShell\s+role=\{profile\.role\}/);
  assert.match(source, /tone:\s*"critical"/);
  assert.match(source, /tone:\s*"warning"/);
  assert.match(source, /tone:\s*"success"/);
  assert.match(source, /font-data/);
  assert.match(source, /role="status"/);
  assert.match(source, /min-h-12/);
});

test("P8.3c inventory preserves qualified read/query and movement behavior", async () => {
  const source = await read(paths.inventory);
  assert.match(source, /from\("products"\)/);
  assert.match(source, /from\("inventory"\)/);
  assert.match(source, /product_id, quantity/);
  assert.match(source, /\.eq\("active",\s*true\)/);
  assert.match(source, /\.order\("name"\)/);
  assert.match(source, /\/movements\/new\?type=ENTRY&product=/);
  assert.match(source, /\/movements\/new\?type=EXIT&product=/);
  assert.match(source, /profile\.role\s*===\s*"ADMIN"/);
});

test("P8.4 movement page and form adopt Design System without changing transaction contract", async () => {
  const page = await read(paths.movementPage); const form = await read(paths.movementForm);
  for (const token of ["AppShell", "PageHeader", "DataCard"]) assert.match(page, new RegExp(token));
  assert.match(page, /<AppShell\s+role=\{profile\.role\}/);
  assert.match(form, /import\s+\{\s*Button\s*\}/); assert.match(form, /import\s+\{\s*DataCard\s*\}/); assert.match(form, /action=\{registerMovementAction\}/);
  for (const field of ["operation_id", "type", "product_id", "quantity"]) assert.match(form, new RegExp(`name=["']${field}["']`));
  assert.match(form, /crypto\.randomUUID/); assert.match(form, /window\.confirm/); assert.match(form, /INITIAL/); assert.match(form, /role="alert"/); assert.match(form, /aria-live="polite"/); assert.match(form, /font-data/);
});

test("P8.4 history adopts shell/primitives and remains read-only with approved filters", async () => {
  const source = await read(paths.history);
  for (const token of ["AppShell", "PageHeader", "DataCard", "StatusBadge"]) assert.match(source, new RegExp(token));
  assert.match(source, /<AppShell\s+role=\{profile\.role\}/);
  for (const field of ["product", "type", "actor", "from", "to"]) assert.match(source, new RegExp(`name=["']${field}["']`));
  assert.match(source, /\.limit\(200\)/); assert.match(source, /method="get"/); assert.doesNotMatch(source, /action=\{/); assert.match(source, /font-data/);
});

test("P8.5 admin users adopts Design System and preserves privileged profile action", async () => {
  const source = await read(paths.adminUsers);
  for (const token of ["AppShell", "PageHeader", "DataCard", "StatusBadge", "Button"]) assert.match(source, new RegExp(token));
  assert.match(source, /<AppShell\s+role=\{currentProfile\.role\}/); assert.match(source, /action=\{updateProfileAction\}/);
  for (const field of ["user_id", "role", "active"]) assert.match(source, new RegExp(`name=["']${field}["']`));
  assert.match(source, /currentProfile\.role\s*!==\s*"ADMIN"/); assert.match(source, /role="alert"/); assert.match(source, /role="status"/); assert.match(source, /font-data/);
});

test("P8.5 adjustment adopts transactional Design System without changing adjustment action", async () => {
  const page = await read(paths.adjustmentPage); const form = await read(paths.adjustmentForm);
  for (const token of ["AppShell", "PageHeader", "DataCard"]) assert.match(page, new RegExp(token));
  assert.match(page, /<AppShell\s+role=\{profile\.role\}/); assert.match(page, /role="alert"/); assert.match(page, /role="status"/);
  assert.match(form, /import\s+\{\s*Button\s*\}/); assert.match(form, /import\s+\{\s*DataCard\s*\}/); assert.match(form, /action=\{registerAdjustmentAction\}/);
  for (const field of ["operation_id", "product_id", "quantity", "reason"]) assert.match(form, new RegExp(`name=["']${field}["']`));
  assert.match(form, /crypto\.randomUUID/); assert.match(form, /window\.confirm/); assert.match(form, /font-data/);
});

test("P8.6 all authenticated operational/admin pages use AppShell while public auth stays public", async () => {
  const authenticated = ["src/app/page.tsx", "src/app/products/page.tsx", "src/app/products/new/page.tsx", "src/app/products/[id]/edit/page.tsx", ...Object.values(paths).filter((path) => !path.endsWith("-form.tsx") && !path.endsWith("movement-form.tsx") && !path.endsWith("adjustment-form.tsx"))];
  for (const path of authenticated) assert.match(await read(path), /AppShell/, `${path} must use AppShell`);
  for (const path of ["src/app/login/page.tsx", "src/app/register/page.tsx"]) assert.doesNotMatch(await read(path), /AppShell/, `${path} must remain outside authenticated shell`);
});

test("P8.6 migrated remaining routes do not use legacy black CTA styling", async () => {
  for (const path of Object.values(paths)) { const source = await read(path); assert.doesNotMatch(source, /bg-black/); assert.doesNotMatch(source, /text-neutral-600/); }
});
