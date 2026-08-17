import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("M6 migration makes new users inactive and locks operational reads", async () => {
  const sql = await read("supabase/migrations/0006_user_admin_hardening.sql");
  assert.match(sql, /active\)\s*values[\s\S]*false/i);
  assert.match(sql, /categories_select_active_user/);
  assert.match(sql, /products_select_active_user/);
  assert.match(sql, /private\.is_active_user/);
  assert.match(sql, /admin_update_profile/);
  assert.match(sql, /LAST_ACTIVE_ADMIN/);
  assert.match(sql, /revoke insert, update, delete, truncate on public\.profiles from authenticated/i);
  assert.doesNotMatch(sql, /service_role.*grant execute.*admin_update_profile/i);
});

test("M6 registration is public but ends signed out pending approval", async () => {
  const action = await read("src/app/register/actions.ts");
  const page = await read("src/app/register/page.tsx");
  assert.match(action, /auth\.signUp/);
  assert.match(action, /data:\s*\{\s*name/);
  assert.match(action, /auth\.signOut/);
  assert.match(action, /registered=pending/);
  assert.match(page, /Aguardar libera|aprovação|pendente/i);
});

test("M6 admin users uses privileged RPC, never direct profile update", async () => {
  const action = await read("src/app/admin/users/actions.ts");
  const page = await read("src/app/admin/users/page.tsx");
  assert.match(action, /admin_update_profile/);
  assert.doesNotMatch(action, /from\(["']profiles["']\)\.update/);
  assert.match(page, /ADMIN/);
  assert.match(page, /OPERATOR/);
  assert.match(page, /Ativo|Inativo/);
});

test("M6 adjustment is ADMIN-only and requires reason through M3 wrapper", async () => {
  const action = await read("src/app/admin/adjustment/actions.ts");
  const page = await read("src/app/admin/adjustment/page.tsx");
  const form = await read("src/app/admin/adjustment/adjustment-form.tsx");
  assert.match(action, /registerStockMovement/);
  assert.match(action, /ADJUSTMENT/);
  assert.match(action, /reason/);
  assert.match(action, /profile\.role !== "ADMIN"/);
  assert.doesNotMatch(action, /performed_by\s*:/);
  assert.match(page, /inventory\s*\(\s*quantity\s*\)/);
  assert.match(form, /Saldo atual/);
  assert.match(form, /Diferença/);
  assert.match(form, /Motivo/);
  assert.match(form, /window\.confirm/);
});

test("M6 login exposes safe access request and home exposes admin only by role", async () => {
  const loginPage = await read("src/app/login/page.tsx");
  const home = await read("src/app/page.tsx");
  assert.match(loginPage, /\/register/);
  assert.match(home, /\/admin\/users/);
  assert.match(home, /\/admin\/adjustment/);
  assert.match(home, /profile\.role === "ADMIN"/);
});