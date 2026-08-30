import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(path, "utf8");

test("P16 migration models receipt batch traceability without replacing inventory", async () => {
  const sql = await read("supabase/migrations/0017_receipt_batches.sql");
  assert.match(sql, /create table public\.receipt_batches/i);
  assert.match(sql, /purchase_receipt_item_id uuid not null references public\.purchase_receipt_items\(id\)/i);
  assert.match(sql, /lot_code text not null/i);
  assert.match(sql, /expires_on date null/i);
  assert.match(sql, /quantity numeric not null check \(quantity > 0\)/i);
  assert.match(sql, /private\.quantity_matches_unit_precision/i);
  assert.match(sql, /BATCH_QUANTITY_EXCEEDS_RECEIPT/i);
  assert.match(sql, /for update/i);
  assert.doesNotMatch(sql, /insert into public\.inventory|update public\.inventory/i);
});

test("P16 receipt batches use RLS, ADMIN writes and no DELETE path", async () => {
  const sql = await read("supabase/migrations/0017_receipt_batches.sql");
  assert.match(sql, /alter table public\.receipt_batches enable row level security/i);
  assert.match(sql, /private\.is_active_user/i);
  assert.match(sql, /private\.is_admin/i);
  assert.match(sql, /grant select on public\.receipt_batches to authenticated/i);
  assert.match(sql, /grant insert \([^)]*purchase_receipt_item_id[^)]*lot_code[^)]*expires_on[^)]*quantity[^)]*active[^)]*\) on public\.receipt_batches to authenticated/i);
  assert.match(sql, /grant update \([^)]*lot_code[^)]*expires_on[^)]*quantity[^)]*active[^)]*\) on public\.receipt_batches to authenticated/i);
  assert.doesNotMatch(sql, /grant delete on public\.receipt_batches/i);
});

test("P16 exposes ADMIN batch registration and active-user batch listing", async () => {
  const [actions, listPage, newPage, helper] = await Promise.all([
    read("src/app/batches/actions.ts"),
    read("src/app/batches/page.tsx"),
    read("src/app/batches/new/page.tsx"),
    read("src/lib/batches.ts"),
  ]);
  assert.match(actions, /requireAdminUser/);
  assert.match(actions, /\.from\("receipt_batches"\)\.insert/);
  assert.match(actions, /isQuantityTextValidForUnit/);
  assert.match(listPage, /title="Lotes e validade"/);
  assert.match(listPage, /\.from\("receipt_batches"\)/);
  assert.match(newPage, /title="Registrar lote"/);
  assert.match(newPage, /purchase_receipt_items/);
  assert.match(helper, /EXPIRED/);
  assert.match(helper, /EXPIRING/);
  assert.match(helper, /NO_EXPIRY/);
});

test("P16 feeds expiring and expired batches into the operational alerts center", async () => {
  const alerts = await read("src/app/alerts/page.tsx");
  assert.match(alerts, /\.from\("receipt_batches"\)/);
  assert.match(alerts, /batchExpiryStatus/);
  assert.match(alerts, /Validade de lotes/);
  assert.match(alerts, /EXPIRED/);
  assert.match(alerts, /EXPIRING/);
});

test("P16 integrates batches into desktop navigation and production smoke without growing mobile nav", async () => {
  const [navigation, mobile, orchestrator] = await Promise.all([
    read("src/components/shell/navigation.ts"),
    read("src/components/shell/MobileBottomNav.tsx"),
    read("scripts/e2e/production-smoke.mjs"),
  ]);
  assert.match(navigation, /"\/batches"/);
  assert.match(navigation, /label:\s*"Lotes"/);
  assert.match(mobile, /slice\(0,\s*5\)/);
  assert.doesNotMatch(mobile.match(/MOBILE_NAV_ROUTES:[\s\S]*?\];/)?.[0] ?? "", /"\/batches"/);
  assert.match(orchestrator, /batches-smoke-runner\.mjs/);
});
